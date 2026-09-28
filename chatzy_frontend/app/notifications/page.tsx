"use client";

import { CheckCheck } from "lucide-react";
import { AppShell } from "@/features/workspace/components/app-shell";
import { ModulePage } from "@/features/workspace/components/module-page";
import { notifications } from "@/features/workspace/data/workspace-data";
import { Button } from "@/shared/ui/button";

export default function NotificationsPage() {
  return (
    <AppShell>
      <ModulePage
        eyebrow="Inbox"
        title="Notifications"
        description="Review mentions, missed calls, security events, and shared media updates."
        actions={<Button icon={<CheckCheck size={18} />}>Mark all read</Button>}
      >
        {(query) => (
          <div className="space-y-3">
            {notifications
              .filter((item) => item.title.toLowerCase().includes(query.toLowerCase()))
              .map((item) => {
                const Icon = item.icon;
                return (
                  <article key={item.id} className="flex items-start gap-4 rounded-3xl border border-[#edf0ed] bg-white/80 p-4 shadow-sm">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#e7f7f1] text-[#008069]">
                      <Icon size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-semibold">{item.title}</h2>
                      <p className="mt-1 text-sm leading-6 text-[#66756f]">{item.body}</p>
                    </div>
                    <span className="text-xs font-semibold text-[#008069]">{item.time}</span>
                  </article>
                );
              })}
          </div>
        )}
      </ModulePage>
    </AppShell>
  );
}
