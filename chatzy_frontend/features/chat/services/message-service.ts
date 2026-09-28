import axios from "axios";
import type { MessageDto } from "@/features/chat/types/chat.types";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api").replace(/\/$/, "");

type SpringPage<T> = {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
};

export type MessagePage = {
  messages: MessageDto[];
  hasMore: boolean;
  nextPage: number;
};

export type MessageSearchInput = {
  query: string;
  page?: number;
  size?: number;
  sort?: string;
};

function authorizedConfig(token: string) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

export const messageService = {
  async getChatMessages(chatId: string, token: string, page = 0, size = 50) {
    return (await this.getChatMessagesPage(chatId, token, page, size)).messages;
  },

  async getChatMessagesPage(chatId: string, token: string, page = 0, size = 50): Promise<MessagePage> {
    const response = await axios.get<SpringPage<MessageDto>>(
      `${API_BASE_URL}/messages/${chatId}`,
      { ...authorizedConfig(token), params: { page, size, sort: "sentAt,desc" } },
    );

    // The API returns newest first; the chat UI renders oldest first.
    return {
      messages: [...response.data.content].reverse(),
      hasMore: response.data.number + 1 < response.data.totalPages,
      nextPage: response.data.number + 1,
    };
  },

  async sendMessage(message: MessageDto, token: string) {
    const response = await axios.post<MessageDto>(
      `${API_BASE_URL}/messages/send`,
      message,
      authorizedConfig(token),
    );
    return response.data;
  },

  async sendVoiceMessage(token: string, input: { chatId: string; senderId: string; recipientId: string; audioFile: Blob; durationSeconds: number }) {
    const formData = new FormData();
    formData.append("chatId", input.chatId); formData.append("senderId", input.senderId); formData.append("recipientId", input.recipientId);
    formData.append("audioFile", input.audioFile, "voice-message.webm"); formData.append("durationSeconds", String(input.durationSeconds));
    return (await axios.post<MessageDto>(`${API_BASE_URL}/messages/voice`, formData, { headers: { Authorization: `Bearer ${token}` } })).data;
  },

  async sendMediaMessage(token: string, input: {
    chatId: string;
    senderId: string;
    recipientId: string;
    file: File;
    content: string;
    clientTempId: string;
  }) {
    const formData = new FormData();
    formData.append("chatId", input.chatId);
    formData.append("senderId", input.senderId);
    formData.append("recipientId", input.recipientId);
    formData.append("file", input.file);
    formData.append("content", input.content);
    formData.append("clientTempId", input.clientTempId);

    return (await axios.post<MessageDto>(`${API_BASE_URL}/messages/media`, formData, {
      headers: { Authorization: `Bearer ${token}` },
    })).data;
  },

  async searchMessages(token: string, chatIds: string[], input: MessageSearchInput): Promise<MessagePage> {
    const response = await axios.get<SpringPage<MessageDto>>(`${API_BASE_URL}/messages/search`, {
      ...authorizedConfig(token),
      params: {
        chatIds,
        query: input.query,
        page: input.page ?? 0,
        size: input.size ?? 50,
        sort: input.sort ?? "sentAt,desc",
      },
      paramsSerializer: { indexes: null },
    });

    return toMessagePage(response.data);
  },

  async searchChatMessages(chatId: string, token: string, input: MessageSearchInput): Promise<MessagePage> {
    const response = await axios.get<SpringPage<MessageDto>>(`${API_BASE_URL}/messages/${chatId}/search`, {
      ...authorizedConfig(token),
      params: {
        query: input.query,
        page: input.page ?? 0,
        size: input.size ?? 50,
        sort: input.sort ?? "sentAt,desc",
      },
    });

    return toMessagePage(response.data);
  },
};

function toMessagePage(page: SpringPage<MessageDto>): MessagePage {
  return {
    messages: page.content,
    hasMore: page.number + 1 < page.totalPages,
    nextPage: page.number + 1,
  };
}
