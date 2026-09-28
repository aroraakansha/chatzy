"use client";

import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { useSyncExternalStore } from "react";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>{children}</NextThemesProvider>;
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // Keep the server and initial browser render identical; next-themes then
  // provides the persisted preference after hydration.
  const hydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const dark = hydrated ? resolvedTheme === "dark" : true;
  return (
    <button type="button" onClick={() => setTheme(dark ? "light" : "dark")} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} title={dark ? "Light mode" : "Dark mode"} className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] text-slate-300 transition hover:border-violet-400/50 hover:bg-white/10 hover:text-white">
      <motion.span initial={false} animate={{ rotate: dark ? 0 : 180 }} transition={{ duration: 0.25 }}>{dark ? <Sun size={18} /> : <Moon size={18} />}</motion.span>
    </button>
  );
}
