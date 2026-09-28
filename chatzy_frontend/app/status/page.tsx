"use client";

import { Camera, CircleDashed, Plus } from "lucide-react";
import { AppShell } from "@/features/workspace/components/app-shell";
import { statuses } from "@/features/workspace/data/workspace-data";
import { Avatar } from "@/shared/ui/avatar";

export default function StatusPage() {
  return (
    <AppShell>
      <main className="mx-auto min-h-dvh w-full max-w-3xl bg-white pb-24 text-[#17211c] shadow-sm dark:bg-[#101421] dark:text-white">
        <header className="border-b border-[#e8ece9] px-5 py-5 dark:border-white/10"><h1 className="text-xl font-semibold">Status</h1></header>
        <button type="button" className="flex w-full items-center gap-4 border-b border-[#e8ece9] px-5 py-5 text-left transition hover:bg-[#f6faf8] dark:border-white/10 dark:hover:bg-white/[0.04]">
          <span className="relative grid h-14 w-14 place-items-center rounded-full bg-[#00a884] text-white shadow-sm"><CircleDashed size={29} /><Plus className="absolute bottom-2 right-2" size={14} /></span>
          <span><span className="block text-base font-semibold">My status</span><span className="mt-1 block text-sm text-[#66756f]">Tap to add status update</span></span>
        </button>
        <p className="bg-[#f4f6f5] px-5 py-3 text-sm font-semibold text-[#008069] dark:bg-white/[0.04]">Recent updates</p>
        <div>{statuses.map((status) => <button key={status.id} type="button" className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-[#f6faf8] dark:hover:bg-white/[0.04]"><span className={status.viewed ? "rounded-full p-0.5 ring-2 ring-[#cbd5d0]" : "rounded-full p-0.5 ring-2 ring-[#00a884]"}><Avatar name={status.name} tone={status.avatarTone} size="lg" /></span><span className="min-w-0"><span className="block truncate font-semibold">{status.name}</span><span className="mt-1 block text-sm text-[#66756f]">{status.time}</span></span></button>)}</div>
        <button type="button" aria-label="Add status" className="fixed bottom-8 right-7 grid h-14 w-14 place-items-center rounded-full bg-[#00a884] text-white shadow-lg transition hover:bg-[#008f72] lg:right-12"><Camera size={23} /></button>
      </main>
    </AppShell>
  );
}
