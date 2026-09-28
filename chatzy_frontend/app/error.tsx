"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/shared/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="ambient-shell grid min-h-dvh place-items-center p-6">
      <section className="max-w-md rounded-3xl border border-white/70 bg-white/85 p-6 text-center shadow-xl backdrop-blur">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b42318]">
          Something went wrong
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-[#17211c]">Chatzy could not load this view.</h1>
        <p className="mt-2 text-sm leading-6 text-[#66756f]">
          {error.message || "Please retry the action."}
        </p>
        <Button className="mt-5" onClick={reset} icon={<RotateCcw size={17} />}>
          Try again
        </Button>
      </section>
    </main>
  );
}
