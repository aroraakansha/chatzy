"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Search } from "lucide-react";
import { AppShell } from "@/features/workspace/components/app-shell";
import { ProfileDetails } from "@/features/profile/components/profile-details";
import { useAuthStore } from "@/features/auth/store/auth-store";

export default function ProfilePage() {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);

  useEffect(() => {
    if (!session?.token) {
      router.replace("/login");
    }
  }, [router, session?.token]);

  const user = session?.user;
  const name = useMemo(
    () => user?.name || user?.email?.split("@")[0] || "Chatzy user",
    [user?.email, user?.name],
  );
  const username = useMemo(
    () => `@${(user?.name || user?.email || "chatzyuser").replace(/\s+/g, "").replace(/@.*$/, "")}`,
    [user?.email, user?.name],
  );

  if (!user) {
    return null;
  }

  return (
    <AppShell>
      <div className="mx-auto min-h-dvh w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
        <ProfileDetails
          name={name}
          username={username}
          imageUrl={user.imageUrl}
          email={user.email ?? "Not available"}
          phone={user.phone ?? "Not available"}
          status="Online"
          description="Your personal account profile information and shortcuts."
          actionHref="/dashboard"
          actionLabel="Message"
          actionIcon={<MessageSquare size={16} />}
          secondaryActionHref="/dashboard"
          secondaryActionLabel="Search"
          secondaryActionIcon={<Search size={16} />}
        />
      </div>
    </AppShell>
  );
}
