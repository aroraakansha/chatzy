"use client";

import { Filter, Search, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import type { Conversation } from "@/features/chat/types/chat.types";
import { ConversationCard } from "@/features/chat/components/conversation-card";
import { useChatStore } from "@/features/chat/store/chat-store";
import { cn } from "@/shared/lib/cn";

type ChatListSidebarProps = {
  conversations: Conversation[];
  totalCount: number;
  isMobileChatOpen: boolean;
  onConversationSelect: () => void;
};

export function ChatListSidebar({ conversations, totalCount, isMobileChatOpen, onConversationSelect }: ChatListSidebarProps) {
  const searchQuery = useChatStore((state) => state.searchQuery);
  const filterUnread = useChatStore((state) => state.filterUnread);
  const setSearchQuery = useChatStore((state) => state.setSearchQuery);
  const toggleUnreadFilter = useChatStore((state) => state.toggleUnreadFilter);

  return (
    <section className={cn(
      "glass-surface w-full min-w-0 max-w-[440px] shrink-0 flex-col border-r border-slate-200/70 shadow-[16px_0_40px_rgb(15_23_42/0.08)] dark:border-white/[0.08] md:flex md:w-[400px] xl:w-[430px]",
      isMobileChatOpen ? "hidden" : "flex",
    )}>
      <header className="border-b border-slate-200/70 px-5 pb-4 pt-5 dark:border-white/[0.08]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-cyan-500"><Sparkles size={13} /> Chatzy</p>
            <h1 className="mt-0.5 text-[28px] font-semibold leading-tight text-slate-800 dark:text-white">
              Messages
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              title="Filter unread"
              aria-label="Filter unread"
              onClick={toggleUnreadFilter}
              className={cn(
                "grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white/70 text-slate-500 transition hover:-translate-y-0.5 hover:border-violet-400 hover:text-violet-500 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-400",
                filterUnread && "border-violet-400 bg-violet-500/15 text-violet-400 shadow-[0_0_18px_rgb(139_92_246/0.18)]",
              )}
            >
              <Filter size={18} />
            </button>
          </div>
        </div>

        <label className="mt-5 flex h-12 items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-100/70 px-4 text-slate-500 transition focus-within:border-violet-400/60 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-500/10 dark:border-white/[0.08] dark:bg-black/20 dark:text-slate-400 dark:focus-within:bg-white/[0.06]">
          <Search size={18} />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-500 dark:text-slate-100"
            placeholder="Search or start a new chat"
            type="search"
          />
        </label>

        <div className="mt-4 flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          <span className="rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 px-3 py-1 text-white shadow-sm">
            All
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-white/[0.06]">
            {conversations.length} visible
          </span>
          <span className="ml-auto">{totalCount} total</span>
        </div>

      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {conversations.map((conversation) => <motion.div layout key={conversation.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}><ConversationCard conversation={conversation} onSelect={onConversationSelect} /></motion.div>)}
      </div>
    </section>
  );
}
