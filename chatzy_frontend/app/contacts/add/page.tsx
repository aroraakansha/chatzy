"use client";

import { Mail, Phone, Plus, UserRound } from "lucide-react";
import { useState } from "react";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { AppShell } from "@/features/workspace/components/app-shell";
import { contactService } from "@/features/chat/services/contact-service";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { Button } from "@/shared/ui/button";
import { FormField } from "@/shared/ui/form-field";

function apiErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const data = error.response?.data;
    if (data && typeof data === "object" && "message" in data && typeof data.message === "string") {
      return data.message;
    }
  }
  return "We couldn't save this contact. Please try again.";
}

export default function AddContactPage() {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function saveContact() {
    if (!session?.token) {
      setError("Please sign in before adding a contact.");
      return;
    }
    if (!contactName.trim()) {
      setError("Enter a contact name.");
      return;
    }
    if (!contactEmail.trim() && !contactPhone.trim()) {
      setError("Enter an email address or phone number.");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await contactService.addContact(session.token, { contactName, contactEmail, contactPhone });
      router.push("/contacts");
    } catch (cause) {
      setError(apiErrorMessage(cause));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell>
      <main className="mx-auto flex min-h-[calc(100dvh-7rem)] w-full max-w-xl items-center px-5 py-10">
        <form onSubmit={(event) => { event.preventDefault(); void saveContact(); }} className="w-full rounded-3xl border border-[#bde8dc] bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#008069]">People</p>
          <h1 className="mt-2 text-2xl font-semibold text-[#17211c]">Add contact</h1>
          <p className="mt-2 text-sm text-[#66756f]">Enter your friend&apos;s details to find them on Chatzy.</p>
          <div className="mt-7 space-y-4">
            <FormField label="Name" value={contactName} onChange={(event) => setContactName(event.target.value)} placeholder="John Doe" icon={<UserRound size={17} />} required />
            <FormField label="Email" type="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} placeholder="john@example.com" icon={<Mail size={17} />} />
            <FormField label="Phone" type="tel" value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} placeholder="+1234567890" icon={<Phone size={17} />} />
          </div>
          {error ? <p className="mt-4 rounded-xl bg-[#fee4e2] px-4 py-3 text-sm font-medium text-[#b42318]">{error}</p> : null}
          <Button type="submit" className="mt-7 w-full" icon={<Plus size={17} />} disabled={isSaving}>
            {isSaving ? "Saving…" : "Save contact"}
          </Button>
        </form>
      </main>
    </AppShell>
  );
}
