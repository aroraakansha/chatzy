"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  BookOpenText,
  LogOut,
  MessageCircle,
  Phone,
  Radio,
  Settings,
  UserRound,
  UserPlus,
  UsersRound,
  Video,
} from "lucide-react";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { authService, getTokenExpiry, isTokenExpired } from "@/features/auth/services/auth-service";
import { Avatar } from "@/shared/ui/avatar";
import { cn } from "@/shared/lib/cn";
import { ThemeToggle } from "@/features/workspace/components/theme-provider";
import { CallNotifications } from "@/features/call/components/call-notifications";

const items = [
  { href: "/dashboard", label: "Chats", icon: MessageCircle },
  { href: "/calls", label: "Calls", icon: Phone },
  { href: "/calls/video", label: "Video", icon: Video },
  { href: "/contacts/add", label: "Add contact", icon: UserPlus },
  { href: "/groups", label: "Groups", icon: UsersRound },
  { href: "/status", label: "Status", icon: Radio },
  { href: "/rag", label: "Sourcebase AI", icon: BookOpenText },
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const logout = useAuthStore((state) => state.logout);
  const token = session?.token;
  const tokenExpired = Boolean(token && isTokenExpired(token));

  useEffect(() => {
    if (!token) return;

    const expireSession = () => {
      logout();
      authService.logout();
      router.replace("/login");
    };

    if (isTokenExpired(token)) {
      expireSession();
      return;
    }

    const expiresAt = getTokenExpiry(token);
    if (expiresAt === null) {
      expireSession();
      return;
    }

    const timeout = window.setTimeout(expireSession, Math.max(0, expiresAt - Date.now()));
    return () => window.clearTimeout(timeout);
  }, [logout, router, token]);

  if (tokenExpired) {
    return <main className="ambient-shell grid min-h-dvh place-items-center text-sm text-slate-500">Redirecting to login…</main>;
  }

  return (
    <main className="ambient-shell flex min-h-dvh text-slate-800 dark:text-slate-100">
      <CallNotifications />
      <aside className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-center justify-around border-t border-slate-200/70 bg-white/80 px-2 shadow-[0_-16px_42px_rgb(15_23_42/0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-[#0f131f]/85 lg:static lg:h-dvh lg:w-[92px] lg:flex-col lg:justify-between lg:border-r lg:border-t-0 lg:py-5">
        <div className="hidden lg:block">
          <Link href="/profile" title="My profile">
            <Avatar
              name={session?.user?.name || session?.user?.email || "Akansha Arora"}
              online
              tone="from-[#01a884] to-[#087b64]"
              imageUrl={session?.user?.imageUrl}
            />
          </Link>
        </div>
        <nav className="flex w-full items-center justify-around lg:flex-col lg:gap-2">
          {items.slice(0, 7).map((item) => (
            <ShellLink key={item.href} item={item} active={pathname === item.href} />
          ))}
          <button
            type="button"
            title="Logout"
            aria-label="Logout"
            onClick={() => {
              logout();
              authService.logout();
              router.replace("/login");
            }}
            className="grid h-11 w-11 place-items-center rounded-2xl text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-400 lg:hidden"
          >
            <LogOut size={20} />
          </button>
        </nav>
        <div className="hidden flex-col gap-2 lg:flex">
          <ThemeToggle />
          {items.slice(8).map((item) => (
            <ShellLink key={item.href} item={item} active={pathname === item.href} />
          ))}
          <button
            type="button"
            title="Logout"
            aria-label="Logout"
            onClick={() => {
              logout();
              authService.logout();
              router.push("/login");
            }}
            className="grid h-11 w-11 place-items-center rounded-2xl text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-400"
          >
            <LogOut size={20} />
          </button>
        </div>
      </aside>
      <section className="min-w-0 flex-1 pb-16 lg:pb-0">{children}</section>
    </main>
  );
}

function ShellLink({
  item,
  active,
}: {
  item: { href: string; label: string; icon: React.ElementType };
  active: boolean;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      title={item.label}
      aria-label={item.label}
      className={cn(
        "grid h-11 w-11 place-items-center rounded-2xl text-slate-500 transition hover:-translate-y-0.5 hover:bg-white/10 hover:text-cyan-400",
        active && "bg-gradient-to-br from-violet-600 to-cyan-500 text-white shadow-[0_8px_24px_rgb(124_58_237/0.35)]",
      )}
    >
      <Icon size={20} />
    </Link>
  );
}
