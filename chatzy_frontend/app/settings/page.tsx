"use client";

import { useState } from "react";
import {
  Bell,
  BookOpen,
  Check,
  HelpCircle,
  Heart,
  Image,
  Key,
  Lock,
  MessageCircle,
  Search,
  Settings2,
  Star,
  Sun,
} from "lucide-react";
import { AppShell } from "@/features/workspace/components/app-shell";
import { Avatar } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";

const settingsItems = [
  { id: "profile", label: "Profile", icon: Image },
  { id: "favorites", label: "Favorites", icon: Heart },
  { id: "starred", label: "Starred", icon: Star },
  { id: "history", label: "Chat history", icon: BookOpen },
  { id: "account", label: "Account", icon: Key },
  { id: "privacy", label: "Privacy", icon: Lock },
  { id: "chats", label: "Chats", icon: MessageCircle },
  { id: "appearance", label: "Appearance", icon: Settings2 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "storage", label: "Storage and data", icon: Check },
  { id: "help", label: "Help and feedback", icon: HelpCircle },
] as const;

type SettingsItemId = (typeof settingsItems)[number]["id"];

const sectionContent: Record<SettingsItemId, { title: string; description: string }> = {
  profile: {
    title: "Profile",
    description: "Edit your display name, about status, and profile photo.",
  },
  favorites: {
    title: "Favorites",
    description: "See your favorite chats and pinned contacts in one place.",
  },
  starred: {
    title: "Starred",
    description: "Review starred messages and saved items from your conversations.",
  },
  history: {
    title: "Chat history",
    description: "Manage your chat backups, history, and archived threads.",
  },
  account: {
    title: "Account",
    description: "Change your account settings, phone number, and security.",
  },
  privacy: {
    title: "Privacy",
    description: "Control last seen, blocked contacts, and read receipts.",
  },
  chats: {
    title: "Chats",
    description: "Adjust chat settings, wallpaper, and message previews.",
  },
  appearance: {
    title: "Appearance",
    description: "Customize theme, background, and visual preferences.",
  },
  notifications: {
    title: "Notifications",
    description: "Control sounds, vibration, and notification alerts.",
  },
  storage: {
    title: "Storage and data",
    description: "Manage download settings and app storage usage.",
  },
  help: {
    title: "Help and feedback",
    description: "Find help, report issues, and send feedback.",
  },
};

export default function SettingsPage() {
  const [activeItem, setActiveItem] = useState<SettingsItemId>("profile");
  const [search, setSearch] = useState("");

  const filteredItems = settingsItems.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <AppShell>
      <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-[2rem] border border-[#e5e7eb] bg-white p-5 shadow-sm">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#6b7280]">Settings</p>
                <h1 className="mt-2 text-2xl font-semibold text-[#111827]">Customize Chatzy</h1>
              </div>
              <div className="rounded-3xl bg-[#f3f4f6] px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#374151]">
                Beta</div>
            </div>
            <label className="block rounded-3xl border border-[#e5e7eb] bg-[#f8fafc] px-4 py-3 text-sm text-[#4b5563] shadow-sm">
              <div className="flex items-center gap-3 text-[#6b7280]">
                <Search size={16} />
                <span className="font-medium">Search settings</span>
              </div>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search"
                className="mt-3 w-full bg-transparent text-sm text-[#111827] outline-none placeholder:text-[#9ca3af]"
              />
            </label>

            <div className="mt-6 space-y-2">
              {filteredItems.map((item) => {
                const Icon = item.icon;
                const active = item.id === activeItem;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveItem(item.id)}
                    className={`flex w-full items-center gap-3 rounded-3xl border px-4 py-3 text-left transition ${
                      active
                        ? "border-[#00a884] bg-[#0f1720] text-white shadow-[0_10px_30px_rgb(0_168_132_/_15%)]"
                        : "border-transparent bg-white/5 text-[#cbd5e1] hover:border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-[#00a884]">
                      <Icon size={18} />
                    </span>
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="rounded-[2rem] border border-[#e5e7eb] bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6b7280]">{sectionContent[activeItem].title}</p>
                <h2 className="mt-2 text-3xl font-semibold text-[#111827]">{sectionContent[activeItem].description}</h2>
              </div>
              <Button variant="secondary" onClick={() => setActiveItem("profile")}>Done</Button>
            </div>

            {activeItem === "profile" ? (
              <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
                <div className="rounded-[2rem] border border-[#e5e7eb] bg-[#f8fafc] p-6 text-center text-[#111827] shadow-sm">
                  <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-white shadow-sm">
                    <Avatar name="Akansha Arora" size="lg" online className="rounded-full" />
                  </div>
                  <Button variant="secondary">Edit photo</Button>
                </div>

                <div className="space-y-5">
                  <SettingRow label="About" value="Busy" />
                  <SettingRow label="Name" value="Akansha Arora" />
                  <SettingRow label="Reserved username" value="@AkanshaArora28" />
                  <SettingRow label="Phone" value="+91 70114 40074" />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="rounded-[2rem] border border-white/10 bg-[#0f1720] p-6 text-white shadow-xl">
                  <p className="text-lg font-semibold">{sectionContent[activeItem].title}</p>
                  <p className="mt-3 text-sm leading-6 text-[#cbd5e1]">
                    Here you can manage the settings for {sectionContent[activeItem].title.toLowerCase()}.
                  </p>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <ActionCard title="Customize now" description="Open the selected settings section and make changes." />
                  <ActionCard title="Learn more" description="Explore help resources for this settings area." />
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <button type="button" className="flex w-full items-center justify-between rounded-3xl border border-[#e5e7eb] bg-[#f8fafc] px-5 py-4 text-left text-[#111827] transition hover:border-[#d1d5db] hover:bg-white">
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="mt-1 text-sm text-[#a8b0c3]">{value}</p>
      </div>
      <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white/10 text-[#94a3b8]">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </span>
    </button>
  );
}

function ActionCard({ title, description }: { title: string; description: string }) {
  return (
    <article className="rounded-[2rem] border border-[#e5e7eb] bg-[#f8fafc] p-6 text-[#111827] shadow-sm transition hover:bg-white">
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-[#4b5563]">{description}</p>
    </article>
  );
}
