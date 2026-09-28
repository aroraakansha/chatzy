"use client";

import { MessageCircle, Plus, UsersRound } from "lucide-react";
import { AppShell } from "@/features/workspace/components/app-shell";
import { ModulePage } from "@/features/workspace/components/module-page";
import { groups } from "@/features/workspace/data/workspace-data";
import { Avatar } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";

export default function GroupsPage() {
  return (
    <AppShell>
      <ModulePage
        eyebrow="Communities"
        title="Groups"
        description="Coordinate teams, communities, and high-signal group conversations."
        actions={<Button icon={<Plus size={18} />}>New group</Button>}
      >
        {(query) => {
          const filtered = groups.filter((group) => group.name.toLowerCase().includes(query.toLowerCase()));

          return filtered.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {filtered.map((group) => (
                <article key={group.id} className="rounded-3xl border border-[#edf0ed] bg-white/80 p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <Avatar name={group.name} tone={group.avatarTone} size="lg" />
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-lg font-semibold">{group.name}</h2>
                      <p className="text-sm text-[#66756f]">{group.members} members</p>
                    </div>
                    {group.unread ? <span className="rounded-full bg-[#00a884] px-2 py-1 text-xs font-bold text-white">{group.unread}</span> : null}
                  </div>
                  <p className="mt-4 text-sm leading-6 text-[#66756f]">{group.description}</p>
                  <Button className="mt-4" size="sm" icon={<MessageCircle size={15} />}>Open group</Button>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="No groups found" description="Create a group or search another workspace." icon={<UsersRound size={22} />} />
          );
        }}
      </ModulePage>
    </AppShell>
  );
}
