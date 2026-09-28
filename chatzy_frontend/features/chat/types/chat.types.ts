export type ConversationKind = "direct" | "group" | "community";

export type Presence = "online" | "typing" | "recording" | "away" | "offline";

export type MessageStatus = "sent" | "delivered" | "read";

export type BackendMessageType = "TEXT" | "IMAGE" | "VIDEO" | "AUDIO" | "FILE";

export type BackendMessageStatus = "SENT" | "DELIVERED" | "READ";

/** The message shape exchanged with the Spring Boot REST and STOMP APIs. */
export type MessageDto = {
  id?: string;
  chatId: string;
  senderId: string;
  recipientId: string;
  content: string;
  type: BackendMessageType;
  clientTempId?: string;
  attachmentUrl?: string;
  mediaUrl?: string;
  mediaThumbnailUrl?: string;
  mediaMimeType?: string;
  mediaSizeBytes?: number;
  mediaDurationSecs?: number;
  status?: BackendMessageStatus;
  sentAt?: string;
  createdAt?: string;
  editedAt?: string;
  isEdited?: boolean;
  isDeleted?: boolean;
  replyToMessageId?: string;
};

export type Message = {
  id: string;
  clientTempId?: string;
  conversationId: string;
  body: string;
  sentAt: string;
  sentAtDate?: string;
  direction: "incoming" | "outgoing";
  status?: MessageStatus;
  reactions?: string[];
  attachment?: {
    name: string;
    type: "document" | "image" | "audio" | "video";
    size: string;
    url?: string;
  };
};

export type Conversation = {
  id: string;
  /** Real backend chat UUID. The mock dashboard intentionally leaves this unset. */
  chatId?: string;
  /** The other user UUID required by MesssageDto. */
  recipientId?: string;
  kind: ConversationKind;
  name: string;
  avatarTone: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  presence: Presence;
  online: boolean;
  lastSeen: string;
  messages: Message[];
};

export type ConversationSnapshot = {
  conversations: Conversation[];
  selectedConversationId: string;
};
