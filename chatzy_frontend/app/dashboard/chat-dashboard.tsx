"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Conversation, ConversationSnapshot, Message, MessageDto } from "@/features/chat/types/chat.types";
import { useChatStore } from "@/features/chat/store/chat-store";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { authService } from "@/features/auth/services/auth-service";
import { ActiveConversation } from "@/features/chat/components/active-conversation";
import { ChatListSidebar } from "@/features/chat/components/chat-list-sidebar";
import { ChatRealtimeService } from "@/features/chat/services/chat-realtime-service";
import { messageService } from "@/features/chat/services/message-service";
import { chatService, type ChatDto } from "@/features/chat/services/chat-service";
import { contactService, type Contact } from "@/features/chat/services/contact-service";
import { AppShell } from "@/features/workspace/components/app-shell";

type ChatDashboardProps = {
  snapshot: ConversationSnapshot;
};

export function ChatDashboard({ snapshot }: ChatDashboardProps) {
  const session = useAuthStore((state) => state.session);
  const setSession = useAuthStore((state) => state.setSession);
  const token = session?.token;
  const selectedConversationId = useChatStore((state) => state.selectedConversationId);
  const searchQuery = useChatStore((state) => state.searchQuery);
  const filterUnread = useChatStore((state) => state.filterUnread);
  const initialize = useChatStore((state) => state.initialize);
  const [chatSnapshot, setChatSnapshot] = useState(snapshot);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const senderId = session?.user.id ?? "";
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isLoadingChats, setIsLoadingChats] = useState(Boolean(token));
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [messagePagination, setMessagePagination] = useState<Record<string, { nextPage: number; hasMore: boolean; isLoading: boolean }>>({});
  const realtimeService = useRef<ChatRealtimeService | null>(null);

  useEffect(() => {
    initialize(snapshot);
  }, [initialize, snapshot]);

  useEffect(() => {
    if (!token || session?.user.id) {
      return;
    }

    void authService.getCurrentUser(token)
      .then((user) => setSession({ token, user }))
      .catch(() => setConnectionError("Unable to identify the signed-in user. Please sign out and sign in again."));
  }, [session?.user.id, setSession, token]);

  useEffect(() => {
    if (!token) {
      // eslint-disable-next-line no-console
      console.log("ChatDashboard: token not available yet, skipping contacts fetch", { token });
      return;
    }

    let isMounted = true;
    const url = `${(process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api").replace(/\/$/, "")}/contacts`;
    // eslint-disable-next-line no-console
    console.log("ChatDashboard: fetching contacts with token", { tokenLength: token?.length, url });

    void contactService.getContacts(token)
      .then((data) => {
        const contactArray = Array.isArray(data) ? data : (data as any)?.data || [];
        // eslint-disable-next-line no-console
        console.log("ChatDashboard: contacts received", { contactArray });
        if (isMounted) {
          setContacts(contactArray);
        }
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error("Failed to load contacts:", err);
        if (isMounted) {
          setConnectionError("Unable to load contacts. Check the backend and your JWT.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    void chatService.getUserChats(token)
      .then((chats) => {
        const conversations = chats.map((chat) => toConversation(chat, contacts));
        setChatSnapshot((current) => ({ ...current, conversations }));
        if (conversations[0]) {
          useChatStore.getState().selectConversation(conversations[0].id);
        }
      })
      .catch(() => setConnectionError("Unable to load your conversations. Check that GET /api/chats is running."))
      .finally(() => setIsLoadingChats(false));
  }, [contacts, token]);

  // Some existing chat rows were created before recipientId was returned by
  // GET /api/chats. The contacts API already gives us that user's UUID, so
  // complete those rows as soon as contacts load.
  useEffect(() => {
    if (contacts.length === 0) {
      return;
    }

    setChatSnapshot((current) => ({
      ...current,
      conversations: current.conversations.map((conversation) => {
        const matchedContacts = contacts.filter((item) => item.matchedUserId);
        const contact = contacts.find((item) => item.matchedUserId === conversation.recipientId)
          ?? contacts.find((item) =>
            item.matchedUserId && (
              item.matchedUserDisplayName === conversation.name ||
              item.contactName === conversation.name
            ),
          )
          ?? (!conversation.recipientId && matchedContacts.length === 1 ? matchedContacts[0] : undefined);

        return contact?.matchedUserId
          ? {
              ...conversation,
              recipientId: conversation.recipientId ?? contact.matchedUserId,
              name: conversation.name || contact.matchedUserDisplayName || contact.contactName || "Unknown contact",
            }
          : conversation;
      }),
    }));
  }, [contacts]);

  const applyIncomingMessage = useCallback((dto: MessageDto, updateConversationMeta = true) => {
    setChatSnapshot((current) => ({
      ...current,
      conversations: current.conversations.map((conversation) => {
        if (conversation.chatId !== dto.chatId && conversation.id !== dto.chatId) {
          return conversation;
        }

        const message = toUiMessage(dto, senderId);
        const matchingIndex = conversation.messages.findIndex(
          (item) => item.id === message.id || (Boolean(dto.clientTempId) && item.clientTempId === dto.clientTempId),
        );
        const messages =
          matchingIndex >= 0
            ? conversation.messages.map((item, index) => (index === matchingIndex ? message : item))
            : [...conversation.messages, message];

        const uniqueMessages = Array.from(new Map(messages.map((item) => [item.id, item])).values());

        return {
          ...conversation,
          messages: uniqueMessages.sort((left, right) => {
            const leftTime = left.sentAtDate ? new Date(left.sentAtDate).getTime() : 0;
            const rightTime = right.sentAtDate ? new Date(right.sentAtDate).getTime() : 0;
            return leftTime - rightTime;
          }),
          lastMessage: dto.content || conversation.lastMessage,
          timestamp: message.sentAt || conversation.timestamp,
          unreadCount: dto.senderId === senderId ? conversation.unreadCount : conversation.unreadCount + 1,
        };
      }),
    }));
  }, [senderId]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const service = new ChatRealtimeService();
    realtimeService.current = service;
    void service.connect(token, {
      onMessage: applyIncomingMessage,
      onError: setConnectionError,
    });

    return () => {
      void service.disconnect();
    };
  }, [applyIncomingMessage, token]);

  const conversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const contactMap = new Map<string, Contact>();

    contacts.forEach((contact) => {
      if (contact.matchedUserId) {
        contactMap.set(contact.matchedUserId, contact);
      }
      contactMap.set(contact.id, contact);
    });

    return chatSnapshot.conversations
      .map((conversation) => {
        if (conversation.name) {
          return conversation;
        }

        const recipientId = conversation.recipientId ?? "";
        const matchingContact = contactMap.get(recipientId);
        const fallbackName = matchingContact
          ? matchingContact.matchedUserDisplayName || matchingContact.contactName || "Unknown contact"
          : recipientId
            ? `Chat with ${recipientId.slice(0, 8)}`
            : "New chat";

        return {
          ...conversation,
          name: fallbackName,
        };
      })
      .filter((conversation) => {
        const matchesQuery =
          !query ||
          conversation.name.toLowerCase().includes(query) ||
          conversation.lastMessage.toLowerCase().includes(query);
        const matchesUnread = !filterUnread || conversation.unreadCount > 0;

        return matchesQuery && matchesUnread;
      });
  }, [chatSnapshot.conversations, contacts, filterUnread, searchQuery]);

  const activeConversation =
    chatSnapshot.conversations.find(
      (conversation) => conversation.id === selectedConversationId,
    ) ?? chatSnapshot.conversations[0];

  const loadMessagePage = useCallback(async (conversation: Conversation, page: number) => {
    if (!conversation.chatId || !token) return;
    const chatId = conversation.chatId;
    setMessagePagination((current) => ({
      ...current,
      [chatId]: { nextPage: current[chatId]?.nextPage ?? page, hasMore: current[chatId]?.hasMore ?? true, isLoading: true },
    }));
    try {
      const result = await messageService.getChatMessagesPage(chatId, token, page, 100);
      result.messages.forEach((message) => applyIncomingMessage(message, false));
      setMessagePagination((current) => ({ ...current, [chatId]: { nextPage: result.nextPage, hasMore: result.hasMore, isLoading: false } }));
    } catch {
      setMessagePagination((current) => ({ ...current, [chatId]: { ...(current[chatId] ?? { nextPage: page, hasMore: true }), isLoading: false } }));
      setConnectionError("Unable to load the conversation history.");
    }
  }, [applyIncomingMessage, token]);

  const loadOlderMessages = useCallback((conversation: Conversation) => {
    if (!conversation.chatId) return;
    const state = messagePagination[conversation.chatId];
    if (!state || state.isLoading || !state.hasMore) return;
    void loadMessagePage(conversation, state.nextPage);
  }, [loadMessagePage, messagePagination]);

  useEffect(() => {
    if (!activeConversation?.chatId || !token) {
      return;
    }
    void loadMessagePage(activeConversation, 0);
  }, [activeConversation?.chatId, loadMessagePage, token]);

  const sendMessage = useCallback((conversation: Conversation, content: string, clientTempId: string) => {
    if (!token || !senderId || !conversation.chatId || !conversation.recipientId) {
      const missing = [
        !token && "login token",
        !senderId && "your user ID",
        !conversation.chatId && "chat ID",
        !conversation.recipientId && "friend's user ID",
      ].filter(Boolean).join(", ");
      throw new Error(`Cannot send yet: missing ${missing}.`);
    }

    const payload: MessageDto = {
      chatId: conversation.chatId,
      senderId,
      recipientId: conversation.recipientId,
      content,
      type: "TEXT",
      clientTempId,
    };

    const optimisticMessage = toUiMessage(payload, senderId);
    setChatSnapshot((current) => ({
      ...current,
      conversations: current.conversations.map((item) =>
        item.id === conversation.id
          ? { ...item, messages: [...item.messages, optimisticMessage], lastMessage: content, timestamp: "now" }
          : item,
      ),
    }));

    const sentOverSocket = realtimeService.current?.send(payload) ?? false;
    if (!sentOverSocket) {
      void messageService.sendMessage(payload, token)
        .then(applyIncomingMessage)
        .catch(() => {
          setChatSnapshot((current) => ({
            ...current,
            conversations: current.conversations.map((item) =>
              item.id === conversation.id
                ? { ...item, messages: item.messages.filter((message) => message.clientTempId !== clientTempId) }
                : item,
            ),
          }));
          setConnectionError("Unable to send the message. Please try again.");
        });
    }
  }, [applyIncomingMessage, senderId, token]);

  const sendAttachment = useCallback(async (
    conversation: Conversation,
    file: File,
    content: string,
    clientTempId: string,
  ) => {
    if (!token || !senderId || !conversation.chatId || !conversation.recipientId) {
      throw new Error("Attachments need an active conversation.");
    }

    try {
      const message = await messageService.sendMediaMessage(token, {
        chatId: conversation.chatId,
        senderId,
        recipientId: conversation.recipientId,
        file,
        content: content || file.name,
        clientTempId,
      });
      applyIncomingMessage(message);
    } catch (error) {
      throw new Error(error instanceof Error ? "File upload failed. Please try again." : "File upload failed. Please try again.");
    }
  }, [applyIncomingMessage, senderId, token]);

  const addRealConversation = useCallback((chat: { chatId: string; recipientId: string; name: string }) => {
    const conversation: Conversation = {
      id: chat.chatId,
      chatId: chat.chatId,
      recipientId: chat.recipientId,
      kind: "direct",
      name: chat.name,
      avatarTone: "from-emerald-500 to-teal-700",
      lastMessage: "No messages yet",
      timestamp: "now",
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
      presence: "offline",
      online: false,
      lastSeen: "",
      messages: [],
    };
    setChatSnapshot((current) => ({
      ...current,
      conversations: current.conversations.some((item) => item.chatId === chat.chatId)
        ? current.conversations
        : [...current.conversations, conversation],
      selectedConversationId: chat.chatId,
    }));
    useChatStore.getState().selectConversation(chat.chatId);
  }, []);

  const startChatWithContact = useCallback((contact: Contact) => {
    if (!token || !senderId || !contact.matchedUserId) {
      setConnectionError("Enter your user UUID before selecting a contact.");
      return;
    }

    const existingChat = chatSnapshot.conversations.find(
      (conversation) => conversation.recipientId === contact.matchedUserId,
    );
    if (existingChat) {
      useChatStore.getState().selectConversation(existingChat.id);
      return;
    }

    void chatService.findOrCreatePrivateChat(contact.matchedUserId, token)
      .then((chat) => addRealConversation({
        chatId: chat.chatId,
        recipientId: chat.recipientId ?? contact.matchedUserId ?? "",
        name: chat.chatName || contact.matchedUserDisplayName || contact.contactName,
      }))
      .catch(() => setConnectionError("Unable to create the private chat. Check the user UUIDs and backend server."));
  }, [addRealConversation, chatSnapshot.conversations, senderId, token]);

  return (
    <AppShell>
      <main className="flex h-dvh min-h-[640px] w-full overflow-hidden text-[#17211c]">
        <div className="flex-1 min-w-0">
          <div className="px-6 py-3" />
          <div className="flex h-[calc(100vh-136px)] min-h-0">
            <ChatListSidebar
              conversations={conversations}
              totalCount={chatSnapshot.conversations.length}
              isMobileChatOpen={isMobileChatOpen}
              onConversationSelect={() => setIsMobileChatOpen(true)}
            />
            {activeConversation ? (
              <ActiveConversation
                conversation={activeConversation}
                isMobileChatOpen={isMobileChatOpen}
                onBack={() => setIsMobileChatOpen(false)}
                onSend={sendMessage}
                onSendAttachment={sendAttachment}
                onLoadOlderMessages={loadOlderMessages}
                hasOlderMessages={activeConversation.chatId ? (messagePagination[activeConversation.chatId]?.hasMore ?? false) : false}
                isLoadingOlderMessages={activeConversation.chatId ? (messagePagination[activeConversation.chatId]?.isLoading ?? true) : false}
                connectionError={connectionError}
              />
            ) : (
              <EmptyChatState
                error={connectionError}
                isLoading={isLoadingChats}
                contactCount={contacts.length}
                hasAuth={Boolean(token)}
              />
            )}
          </div>
        </div>
      </main>
    </AppShell>
  );
}

function EmptyChatState({
  error,
  isLoading,
  contactCount,
  hasAuth,
}: {
  error: string | null;
  isLoading: boolean;
  contactCount: number;
  hasAuth: boolean;
}) {
  const title = error ? "Could not load conversations" : isLoading ? "Loading conversations…" : "No conversations found";
  const detail = error
    ? error
    : isLoading
      ? "Fetching your existing chats from the server."
      : hasAuth
        ? "GET /api/chats returned no chat records for this account."
        : "You are not logged in. Please sign in to load your chats and contacts.";

  return (
    <section className="chatzy-wallpaper hidden min-w-0 flex-1 items-center justify-center p-6 md:flex">
      <div className="max-w-lg rounded-3xl border border-white/80 bg-white/90 p-7 text-center shadow-xl backdrop-blur">
        <h2 className="text-lg font-semibold text-[#17211c]">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-[#66756f]">{detail}</p>
        {!isLoading && !error && contactCount === 0 ? (
          <p className="mt-4 rounded-xl bg-[#fff7df] px-3 py-2 text-xs text-[#6b5f42]">
            {hasAuth ? "Your contacts API also returned no matched Chatzy users." : "Open /login and sign in first to trigger the contact fetch."}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function toConversation(chat: ChatDto, contacts: Contact[] = []): Conversation {
  const nameFromApi = chat.recipientName ?? chat.chatName ?? "";
  const matchedContacts = contacts.filter((contact) => contact.matchedUserId);
  const matchingContact = contacts.find((contact) => contact.matchedUserId === chat.recipientId)
    ?? (!chat.recipientId
      ? contacts.find((contact) =>
        contact.matchedUserId && (
          contact.matchedUserDisplayName === nameFromApi || contact.contactName === nameFromApi
        ),
      ) ?? (matchedContacts.length === 1 ? matchedContacts[0] : undefined)
      : undefined);
  const name = nameFromApi || matchingContact?.matchedUserDisplayName || matchingContact?.contactName || "";

  return {
    id: chat.chatId,
    chatId: chat.chatId,
    recipientId: chat.recipientId ?? matchingContact?.matchedUserId ?? undefined,
    kind: chat.type === "GROUP" ? "group" : "direct",
    // Private chats do not have a shared chatName; the API supplies the
    // other member's display name as recipientName.
    name,
    avatarTone: "from-emerald-500 to-teal-700",
    lastMessage: "No messages yet",
    timestamp: "",
    unreadCount: 0,
    isPinned: false,
    isMuted: false,
    presence: "offline",
    online: false,
    lastSeen: "",
    messages: [],
  };
}

function toUiMessage(message: MessageDto, currentUserId?: string): Message {
  const originalUrl = message.mediaUrl || message.attachmentUrl;
  let proxyUrl = originalUrl;
  
  // Convert S3 URL to backend proxy URL
  if (originalUrl) {
    const fileName = originalUrl.substring(originalUrl.lastIndexOf("/") + 1);
    proxyUrl = `${(process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api").replace(/\/$/, "")}/messages/media/${fileName}`;
  }

  return {
    id: message.id ?? `local-${message.clientTempId ?? crypto.randomUUID()}`,
    clientTempId: message.clientTempId,
    conversationId: message.chatId,
    direction: message.senderId === currentUserId ? "outgoing" : "incoming",
    body: message.content,
    sentAt: message.sentAt ? new Date(message.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "now",
    sentAtDate: message.sentAt ?? message.createdAt,
    status: message.status?.toLowerCase() as Message["status"],
    attachment: originalUrl
      ? {
          name: message.type === "AUDIO"
            ? `Voice message${message.mediaDurationSecs ? ` · ${message.mediaDurationSecs}s` : ""}`
            : message.content || "Attachment",
          type: message.type === "IMAGE" ? "image" : message.type === "VIDEO" ? "video" : message.type === "AUDIO" ? "audio" : "document",
          size: message.mediaSizeBytes ? formatFileSize(message.mediaSizeBytes) : message.type === "AUDIO" ? "Audio" : "Attachment",
          url: proxyUrl,
        }
      : undefined,
  };
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
