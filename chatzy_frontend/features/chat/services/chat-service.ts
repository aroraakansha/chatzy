import axios from "axios";
import type { ConversationSnapshot } from "@/features/chat/types/chat.types";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api").replace(/\/$/, "");

export type ChatDto = {
  chatId: string;
  recipientId: string | null;
  recipientName?: string | null;
  recipientAvatar?: string | null;
  chatName?: string | null;
  avatarUrl?: string;
  type: "PRIVATE" | "GROUP";
};

export const chatService = {
  async getUserChats(token: string) {
    const response = await axios.get<ChatDto[]>(`${API_BASE_URL}/chats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async createPrivateChat(currentUserId: string, recipientId: string, token: string) {
    const response = await axios.post<ChatDto>(
      `${API_BASE_URL}/chats/private`,
      { currentUserId, recipientId },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data;
  },

  async findOrCreatePrivateChat(recipientId: string, token: string) {
    const response = await axios.get<ChatDto>(
      `${API_BASE_URL}/chats/private/${encodeURIComponent(recipientId)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data;
  },
};

// Conversations are now loaded from the real API setup flow, never mock data.
export function getConversationSnapshot() {
  return { conversations: [], selectedConversationId: "" } satisfies ConversationSnapshot;
}
