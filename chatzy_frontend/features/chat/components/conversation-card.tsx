"use client";

import { BellOff, Pin } from "lucide-react";
import type { Conversation } from "@/features/chat/types/chat.types";
import { useChatStore } from "@/features/chat/store/chat-store";
import { Avatar } from "@/shared/ui/avatar";
import { cn } from "@/shared/lib/cn";

type ConversationCardProps = {
  conversation: Conversation;
  onSelect?: () => void;
};

export function ConversationCard({ conversation, onSelect }: ConversationCardProps) {
  const selectedConversationId = useChatStore((state) => state.selectedConversationId);
  const selectConversation = useChatStore((state) => state.selectConversation);
  const active = selectedConversationId === conversation.id;
  const statusText =
    conversation.presence === "typing"
      ? "typing..."
      : conversation.presence === "recording"
        ? "recording audio..."
        : conversation.lastMessage;
  const kindLabel =
    conversation.kind === "community"
      ? "Community"
      : conversation.kind === "group"
        ? "Group"
        : conversation.online
          ? "Online"
          : "Direct";

  return (
    <button
      type="button"
      onClick={() => {
        selectConversation(conversation.id);
        onSelect?.();
      }}
      className={cn(
        "group grid w-full grid-cols-[auto_1fr] gap-3 px-4 py-3 text-left transition hover:bg-violet-500/10",
        active && "bg-gradient-to-r from-violet-500/20 to-cyan-500/10 shadow-[inset_3px_0_0_#8b5cf6]",
      )}
    >
      <Avatar
        name={conversation.name}
        tone={conversation.avatarTone}
        online={conversation.online}
        size="lg"
      />
      <span className="min-w-0 border-b border-slate-200/70 pb-3 pt-0.5 dark:border-white/[0.06]">
        <span className="flex min-w-0 items-start justify-between gap-3">
          <span className="min-w-0">
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate text-[15px] font-semibold text-slate-800 dark:text-slate-100">
                {conversation.name}
              </span>
              <span
                className={cn(
                  "hidden rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-400 xl:inline-flex",
                  conversation.online && "bg-cyan-400/10 text-cyan-400",
                  conversation.kind === "group" && "bg-violet-500/10 text-violet-400",
                  conversation.kind === "community" && "bg-fuchsia-500/10 text-fuchsia-400",
                )}
              >
                {kindLabel}
              </span>
            </span>
            <span
              className={cn(
                "mt-1 block truncate text-sm leading-5 text-slate-500 dark:text-slate-400",
                conversation.presence === "typing" && "font-medium text-cyan-500",
                conversation.presence === "recording" && "font-medium text-cyan-500",
              )}
            >
              {statusText}
            </span>
          </span>
          <span className="flex shrink-0 flex-col items-end gap-1">
            <span
              className={cn(
                "text-xs text-slate-500",
                conversation.unreadCount > 0 && "font-semibold text-cyan-400",
              )}
            >
              {conversation.timestamp}
            </span>
            <span className="flex h-5 items-center gap-1 transition group-hover:translate-x-0.5">
              {conversation.isPinned ? <Pin size={13} className="text-slate-500" /> : null}
              {conversation.isMuted ? <BellOff size={13} className="text-slate-500" /> : null}
              {conversation.unreadCount > 0 ? (
                <span className="grid min-w-5 place-items-center rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 px-1.5 text-[11px] font-bold text-white shadow-[0_0_14px_rgb(34_211_238/0.35)]">
                  {conversation.unreadCount}
                </span>
              ) : null}
            </span>
          </span>
        </span>
      </span>
    </button>
  );
}
