"use client";

import { ArrowDownLeft, ArrowUpRight, Phone, Video } from "lucide-react";
import { AppShell } from "@/features/workspace/components/app-shell";
import { callHistory } from "@/features/workspace/data/workspace-data";
import { Avatar } from "@/shared/ui/avatar";

export default function CallsPage() {
  return (
    <AppShell>
      <main className="mx-auto min-h-dvh w-full max-w-3xl bg-white pb-24 text-[#17211c] shadow-sm dark:bg-[#101421] dark:text-white">
        <header className="border-b border-[#e8ece9] px-5 py-5 dark:border-white/10"><h1 className="text-xl font-semibold">Calls</h1></header>
        <p className="bg-[#f4f6f5] px-5 py-3 text-sm font-semibold text-[#008069] dark:bg-white/[0.04]">Recent</p>
        <div>{callHistory.map((call) => {
          const CallIcon = call.type === "Video" ? Video : Phone;
          const missed = call.status === "Missed" || call.status === "Declined";
          return <article key={call.id} className="flex items-center gap-4 border-b border-[#eef1ef] px-5 py-4 dark:border-white/[0.06]"><Avatar name={call.name} tone={call.avatarTone} size="lg" /><div className="min-w-0 flex-1"><h2 className="truncate font-semibold">{call.name}</h2><p className={missed ? "mt-1 flex items-center gap-1 text-sm text-[#d94c45]" : "mt-1 flex items-center gap-1 text-sm text-[#66756f]"}>{call.direction === "outgoing" ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />} {call.status === "Completed" ? `${call.direction === "outgoing" ? "Outgoing" : "Incoming"} · ${call.time}` : `${call.status} · ${call.time}`}</p></div><button type="button" title={`Call ${call.name}`} aria-label={`Call ${call.name}`} className="grid h-11 w-11 place-items-center rounded-full text-[#008069] transition hover:bg-[#e7f7f1]"><CallIcon size={22} /></button></article>;
        })}</div>
      </main>
    </AppShell>
  );
}
