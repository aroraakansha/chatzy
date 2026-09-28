"use client";

import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { PageCard } from "@/shared/ui/page-card";

type ModulePageProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: (query: string) => ReactNode;
  actions?: ReactNode;
  onSearchQueryChange?: (query: string) => void;
};

export function ModulePage({ eyebrow, title, description, children, actions, onSearchQueryChange }: ModulePageProps) {
  const [query, setQuery] = useState("");
  const renderedChildren = useMemo(() => children(query), [children, query]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 rounded-[32px] border border-white/70 bg-white/76 p-5 shadow-[0_24px_70px_rgb(28_45_38/0.08)] backdrop-blur-xl md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#008069]">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#17211c] md:text-4xl">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#66756f]">{description}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="flex h-11 min-w-0 items-center gap-3 rounded-2xl border border-[#d8ddd7] bg-white/90 px-4 text-[#66756f] shadow-sm focus-within:border-[#00a884]/40 focus-within:ring-4 focus-within:ring-[#00a884]/10 sm:w-72">
            <Search size={17} />
            <input
              value={query}
              onChange={(event) => {
                const value = event.target.value;
                setQuery(value);
                onSearchQueryChange?.(value);
              }}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              placeholder="Search"
            />
          </label>
          {actions}
        </div>
      </header>
      <PageCard className="min-h-[520px]">{renderedChildren}</PageCard>
    </div>
  );
}
