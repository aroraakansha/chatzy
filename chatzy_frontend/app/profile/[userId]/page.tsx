"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Search } from "lucide-react";
import { AppShell } from "@/features/workspace/components/app-shell";
import { contactService, type Contact } from "@/features/chat/services/contact-service";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { ProfileDetails } from "@/features/profile/components/profile-details";

type UserProfilePageProps = {
  params: Promise<{ userId: string }>;
};

export default function UserProfilePage({ params }: UserProfilePageProps) {
  const { userId } = use(params);
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const [contact, setContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!session?.token) {
      router.replace("/login");
      return;
    }

    let active = true;
    contactService.getContacts(session.token)
      .then((contacts) => {
        if (!active) return;
        const found = contacts.find(
          (item) => item.matchedUserId === userId || item.id === userId,
        );
        setContact(found ?? null);
      })
      .catch(() => {
        if (active) setContact(null);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [router, session?.token, userId]);

  const profileName = useMemo(
    () => contact?.matchedUserDisplayName || contact?.contactName || userId,
    [contact, userId],
  );

  const username = useMemo(
    () => `@${profileName.replace(/\s+/g, "")}`,
    [profileName],
  );

  if (!session?.token) {
    return null;
  }

  return (
    <AppShell>
      <div className="mx-auto min-h-dvh w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
        <ProfileDetails
          name={profileName}
          username={username}
          email={contact?.contactEmail ?? "Not available"}
          phone={contact?.contactPhone ?? "Not available"}
          status={contact ? "Available" : "Unknown contact"}
          description={isLoading ? "Loading participant info..." : "Details for the person you are chatting with."}
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
