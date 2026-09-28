import { useState } from "react";
import type { ReactNode } from "react";
import { ArrowRight, Info, Image, Lock, Star } from "lucide-react";
import { Avatar } from "@/shared/ui/avatar";

type ProfileDetailsProps = {
  name: string;
  username: string;
  imageUrl?: string;
  email: string;
  phone: string;
  status: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  actionIcon?: ReactNode;
  secondaryActionHref?: string;
  secondaryActionLabel?: string;
  secondaryActionIcon?: ReactNode;
};

type ProfileTab = {
  id: string;
  label: string;
  icon: ReactNode;
};

export function ProfileDetails({
  name,
  username,
  imageUrl,
  email,
  phone,
  status,
  description,
  actionHref = "/dashboard",
  actionLabel = "Message",
  actionIcon,
  secondaryActionHref = "/dashboard",
  secondaryActionLabel = "Search",
  secondaryActionIcon,
}: ProfileDetailsProps) {
  const tabs: ProfileTab[] = [
    { id: "info", label: "Info", icon: <Info size={16} /> },
    { id: "media", label: "Media, links and docs", icon: <Image size={16} /> },
    { id: "starred", label: "Starred", icon: <Star size={16} /> },
    { id: "encryption", label: "Encryption", icon: <Lock size={16} /> },
  ];
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  return (
    <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
      <aside className="rounded-[2rem] bg-[var(--surface-strong)] p-4 text-[var(--foreground)] shadow-xl ring-1 ring-[var(--surface-border)]">
        <div className="mb-4 border-b border-[var(--surface-border)] pb-4">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#94a3b8]">Contact</p>
        </div>
        <div className="space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex w-full items-center gap-3 rounded-3xl px-4 py-3 text-left transition ${
                activeTab === tab.id
                  ? "bg-[var(--surface)] text-[var(--foreground)]"
                  : "text-[var(--foreground)] hover:bg-[var(--surface)]"
              }`}
            >
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--surface)] text-[#93c5fd]">
                {tab.icon}
              </span>
              <div>
                <p className="font-semibold text-sm">{tab.label}</p>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <div className="space-y-5">
        <section className="rounded-[2rem] bg-[var(--surface-strong)] p-6 shadow-xl ring-1 ring-[var(--surface-border)] text-[var(--foreground)]">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="rounded-full border border-[var(--surface-border)] bg-[var(--surface)] p-3">
              <Avatar name={name} imageUrl={imageUrl} size="lg" className="rounded-full" online />
            </div>
            <div>
              <p className="text-2xl font-semibold">{name}</p>
              <p className="mt-1 text-sm text-[#94a3b8]">{username}</p>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <a href={actionHref} className="inline-flex items-center justify-center gap-2 rounded-3xl border border-[var(--surface-border)] bg-[var(--surface)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-strong)]">
              {actionIcon}
              {actionLabel}
            </a>
            <a href={secondaryActionHref} className="inline-flex items-center justify-center gap-2 rounded-3xl border border-[var(--surface-border)] bg-[var(--surface)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-strong)]">
              {secondaryActionIcon}
              {secondaryActionLabel}
            </a>
          </div>

          <div className="mt-8 rounded-[1.75rem] bg-[var(--surface)] p-5 shadow-inner shadow-black/5">
            <div className="rounded-3xl bg-[var(--surface-strong)] p-4">
              <p className="text-sm uppercase tracking-[0.18em] text-[#94a3b8]">Phone</p>
              <p className="mt-3 rounded-3xl bg-[var(--surface)] px-4 py-4 text-sm font-semibold text-[var(--foreground)] shadow-sm ring-1 ring-[var(--surface-border)]">
                {phone}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <OptionRow label="Chat theme" value="Default" />
            <OptionRow label="Save to Downloads" value="Default" hasArrow={false} />
          </div>
        </section>

        <section className="rounded-[2rem] bg-[var(--surface-strong)] p-6 shadow-xl ring-1 ring-[var(--surface-border)] text-[var(--foreground)]">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#94a3b8]">{activeTab === "info" ? "Info" : activeTab === "media" ? "Media, links and docs" : activeTab === "starred" ? "Starred" : "Encryption"}</p>
            <span className="rounded-full bg-[var(--surface)] px-3 py-1 text-xs uppercase tracking-[0.16em] text-[#cbd5e1]">{status}</span>
          </div>
          <div className="rounded-[1.75rem] bg-[var(--surface)] px-5 py-6 text-sm leading-6 text-[#cbd5e1] shadow-inner shadow-black/5">
            {activeTab === "info" && <p>{description}</p>}
            {activeTab === "media" && <p>No media, links or docs are available for this conversation yet.</p>}
            {activeTab === "starred" && <p>You haven’t starred any messages or items yet.</p>}
            {activeTab === "encryption" && <p>Messages are end-to-end encrypted. Your chat is secure.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}

function OptionRow({
  label,
  value,
  hasArrow = true,
}: {
  label: string;
  value: string;
  hasArrow?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-[#1f2937]/80 px-4 py-4 shadow-sm">
      <div>
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="mt-1 text-xs text-[#94a3b8]">{value}</p>
      </div>
      {hasArrow ? (
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 text-[#93c5fd]">
          <ArrowRight size={16} />
        </span>
      ) : null}
    </div>
  );
}
