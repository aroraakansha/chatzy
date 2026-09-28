"use client";

import { CheckCircle2, CloudDownload, Mail, MessageCircle, RefreshCw, ShieldCheck, UsersRound } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { AppShell } from "@/features/workspace/components/app-shell";
import { ModulePage } from "@/features/workspace/components/module-page";
import { contactService, type Contact } from "@/features/chat/services/contact-service";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { Avatar } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";

// OAuth endpoints are outside Spring Boot's /api prefix. Keep them proxied
// through the same HTTPS frontend origin as the rest of the application.
const API_ORIGIN = "/backend";

function apiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    const data = error.response?.data;
    if (data && typeof data === "object" && "message" in data && typeof data.message === "string") {
      return data.message;
    }
  }
  return fallback;
}

export default function ContactsPage() {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [hasGoogleAccess, setHasGoogleAccess] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Contact[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const searchRequestId = useRef(0);

  const loadContacts = useCallback(async () => {
    if (!session?.token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    const [statusResult, contactsResult] = await Promise.allSettled([
      contactService.getSyncStatus(session.token),
      contactService.getContacts(session.token),
    ]);

    if (statusResult.status === "fulfilled") {
      setHasGoogleAccess(statusResult.value.hasGoogleCredentials);
    } else {
      setError(apiErrorMessage(statusResult.reason, "We couldn't check Google Contacts access. Please try again."));
    }

    if (contactsResult.status === "fulfilled") {
      setContacts(contactsResult.value);
    } else {
      setError((current) => current ?? apiErrorMessage(contactsResult.reason, "We couldn't load your contacts. Check that the contacts service is running and try again."));
    }

    setIsLoading(false);
  }, [session?.token]);

  useEffect(() => {
    void loadContacts();
  }, [loadContacts]);

  function allowContactSync() {
    window.location.assign(`${API_ORIGIN}/oauth2/authorization/google`);
  }

  async function syncContacts() {
    if (!session?.token) return;

    setIsSyncing(true);
    setError(null);
    setNotice(null);
    try {
      const message = await contactService.syncGoogleContacts(session.token);
      await loadContacts();
      setNotice(message || "Your Google contacts are up to date.");
    } catch (error) {
      setError(apiErrorMessage(error, "Contact sync failed. Please reconnect Google and try again."));
    } finally {
      setIsSyncing(false);
    }
  }

  function inviteContact(contact: Contact) {
    const inviteText = `Join me on Chatzy so we can chat: ${window.location.origin}`;

    if (contact.contactEmail) {
      window.location.assign(`mailto:${encodeURIComponent(contact.contactEmail)}?subject=${encodeURIComponent("Join me on Chatzy")}&body=${encodeURIComponent(inviteText)}`);
      return;
    }

    if (contact.contactPhone) {
      window.location.assign(`sms:${encodeURIComponent(contact.contactPhone)}?body=${encodeURIComponent(inviteText)}`);
      return;
    }

    setError(`Add an email address or phone number for ${contact.contactName} before sending an invite.`);
  }

  const searchContacts = useCallback((query: string) => {
    const term = query.trim();
    const requestId = ++searchRequestId.current;

    if (!term) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }
    if (!session?.token) return;

    setIsSearching(true);
    void contactService.searchContacts(session.token, term)
      .then((results) => {
        if (requestId === searchRequestId.current) setSearchResults(results);
      })
      .catch((cause) => {
        if (requestId === searchRequestId.current) {
          setSearchResults([]);
          setError(apiErrorMessage(cause, "We couldn't search contacts. Please try again."));
        }
      })
      .finally(() => {
        if (requestId === searchRequestId.current) setIsSearching(false);
      });
  }, [session?.token]);

  return (
    <AppShell>
      <ModulePage
        eyebrow="People"
        title="Contacts"
        description="Bring in people you already know and see which contacts are on Chatzy."
        actions={
          hasGoogleAccess ? <Button icon={<RefreshCw size={18} />} onClick={() => void syncContacts()} disabled={isSyncing || isLoading}>{isSyncing ? "Syncing contacts…" : "Sync contacts"}</Button> : null
        }
        onSearchQueryChange={searchContacts}
      >
        {(query) => {
          const filtered = query.trim() ? (searchResults ?? []) : contacts;

          return (
            <div className="space-y-6">
              {hasGoogleAccess === false ? (
                <section className="overflow-hidden rounded-3xl border border-[#bde8dc] bg-[#e7f7f1] p-5 sm:p-6">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex gap-4">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#008069] shadow-sm">
                        <UsersRound size={21} />
                      </div>
                      <div>
                        <p className="font-semibold text-[#17211c]">Find your people on Chatzy</p>
                        <p className="mt-1 max-w-xl text-sm leading-6 text-[#54615c]">
                          Allow Google Contacts access to securely import your contacts and match people already using Chatzy.
                        </p>
                      </div>
                    </div>
                    <Button icon={<CloudDownload size={18} />} onClick={allowContactSync}>
                      Allow contact sync
                    </Button>
                  </div>
                  <p className="mt-5 flex items-center gap-2 text-xs font-medium text-[#66756f]">
                    <ShieldCheck size={15} className="text-[#008069]" />
                    We use this permission only to import contacts you choose to sync.
                  </p>
                </section>
              ) : null}

              {hasGoogleAccess === true ? (
                <section className="flex items-center gap-3 rounded-2xl border border-[#bde8dc] bg-[#f4fcf9] px-4 py-3 text-sm text-[#356154]">
                  <CheckCircle2 size={19} className="shrink-0 text-[#008069]" />
                  Google Contacts is connected. Sync anytime to find newly joined Chatzy contacts.
                </section>
              ) : null}

              {notice ? <p className="rounded-2xl bg-[#e7f7f1] px-4 py-3 text-sm font-medium text-[#008069]">{notice}</p> : null}
              {error ? <p className="rounded-2xl bg-[#fee4e2] px-4 py-3 text-sm font-medium text-[#b42318]">{error}</p> : null}

              {isLoading || isSearching ? (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {[0, 1, 2].map((item) => <div key={item} className="h-40 animate-pulse rounded-3xl bg-[#f2f5f2]" />)}
                </div>
              ) : filtered.length ? (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {filtered.map((contact) => {
                    const name = contact.matchedUserDisplayName ?? contact.contactName;
                    return (
                      <article key={contact.id} className="rounded-3xl border border-[#edf0ed] bg-white/80 p-4 shadow-sm">
                        <div className="flex items-start gap-3">
                          <Avatar name={name} tone="from-emerald-500 to-teal-700" online />
                          <div className="min-w-0 flex-1">
                            <h2 className="truncate font-semibold text-[#17211c]">{name}</h2>
                            <p className="mt-1 text-sm leading-5 text-[#66756f]">{contact.contactEmail ?? contact.contactPhone ?? "On Chatzy"}</p>
                            <p className="mt-2 text-xs font-medium text-[#008069]">{contact.matchedUserId ? "On Chatzy" : "Not on Chatzy yet"}</p>
                          </div>
                        </div>
                        {contact.matchedUserId ? <div className="mt-4">
                          <Button size="sm" icon={<MessageCircle size={15} />} onClick={() => router.push("/dashboard")}>
                            Message
                          </Button>
                        </div> : <div className="mt-4">
                          <Button size="sm" variant="secondary" icon={<Mail size={15} />} onClick={() => inviteContact(contact)}>
                            Invite to Chatzy
                          </Button>
                        </div>}
                      </article>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  title="No contacts saved yet"
                  description="Add a contact manually or connect Google Contacts to find your friends on Chatzy."
                  icon={<UsersRound size={22} />}
                />
              )}
            </div>
          );
        }}
      </ModulePage>
    </AppShell>
  );
}
