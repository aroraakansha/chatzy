"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Settings } from "lucide-react";
import { useAuthStore } from "@/features/auth/store/auth-store";

export function NavigationSidebar() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  return (
    <aside className="hidden w-[250px] shrink-0 flex-col justify-end border-r border-white/80 bg-[#f8fafc] py-6 px-4 shadow-[12px_0_30px_rgb(28_45_38/0.06)] lg:flex">

      <div className="space-y-3">
        <Link
          href="/settings"
          title="Settings"
          className="flex items-center gap-3 rounded-2xl border border-[#dfe6e0] bg-white px-3 py-3 text-sm text-[#3d4b44] transition hover:bg-[#f1f7f3] hover:text-[#0b5f4b]"
        >
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#f7fbf8] text-[#0b5f4b]">
            <Settings size={18} />
          </span>
          <span>Settings</span>
        </Link>
        <button
          type="button"
          title="Logout"
          aria-label="Logout"
          onClick={() => {
            logout();
            router.push("/login");
          }}
          className="flex w-full items-center gap-3 rounded-2xl border border-[#dfe6e0] bg-white px-3 py-3 text-sm text-[#3d4b44] transition hover:bg-[#fdf2f2] hover:text-[#b42318]"
        >
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#fff3f3] text-[#b42318]">
            <LogOut size={18} />
          </span>
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
