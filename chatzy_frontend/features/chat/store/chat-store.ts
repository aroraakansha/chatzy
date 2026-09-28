"use client";

import { create } from "zustand";
import type { ConversationSnapshot } from "@/features/chat/types/chat.types";

type ChatStore = {
  selectedConversationId: string;
  searchQuery: string;
  filterUnread: boolean;
  initialize: (snapshot: ConversationSnapshot) => void;
  selectConversation: (conversationId: string) => void;
  setSearchQuery: (query: string) => void;
  toggleUnreadFilter: () => void;
};

export const useChatStore = create<ChatStore>((set) => ({
  selectedConversationId: "",
  searchQuery: "",
  filterUnread: false,
  initialize: (snapshot) =>
    set((state) => ({
      selectedConversationId:
        state.selectedConversationId || snapshot.selectedConversationId,
    })),
  selectConversation: (selectedConversationId) => set({ selectedConversationId }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  toggleUnreadFilter: () => set((state) => ({ filterUnread: !state.filterUnread })),
}));
