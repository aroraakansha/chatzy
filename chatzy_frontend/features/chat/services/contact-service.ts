import axios from "axios";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api").replace(/\/$/, "");

export type Contact = {
  id: string;
  contactName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  matchedUserId: string | null;
  matchedUserDisplayName: string | null;
  isFavorite: boolean;
  isBlocked: boolean;
  createdAt: string;
};

export type ContactSyncStatus = {
  hasGoogleCredentials: boolean;
};

export type AddContactInput = {
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
};

function buildContactsUrl(baseUrl: string) {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");

  if (normalizedBaseUrl.endsWith("/api")) {
    return `${normalizedBaseUrl}/contacts`;
  }

  return `${normalizedBaseUrl}/api/contacts`;
}

function normalizeContacts(payload: unknown): Contact[] {
  const asArray = Array.isArray(payload)
    ? payload
    : payload && typeof payload === "object"
      ? (payload as { content?: unknown; contacts?: unknown; data?: unknown })
      : null;

  const list = Array.isArray(asArray)
    ? asArray
    : Array.isArray((asArray as any)?.content)
      ? (asArray as any).content
      : Array.isArray((asArray as any)?.contacts)
        ? (asArray as any).contacts
        : Array.isArray((asArray as any)?.data)
          ? (asArray as any).data
          : [];

  return (list as Array<Record<string, unknown>>).map((contact) => ({
    id: (contact.id as string | undefined) ?? "",
    contactName: (contact.contactName as string | undefined) ?? (contact.name as string | undefined) ?? "Unknown contact",
    contactEmail: (contact.contactEmail as string | null | undefined) ?? (contact.email as string | null | undefined) ?? null,
    contactPhone: (contact.contactPhone as string | null | undefined) ?? (contact.phone as string | null | undefined) ?? null,
    matchedUserId: (contact.matchedUserId as string | null | undefined) ?? (contact.userId as string | null | undefined) ?? null,
    matchedUserDisplayName: (contact.matchedUserDisplayName as string | null | undefined) ?? (contact.displayName as string | null | undefined) ?? null,
    isFavorite: Boolean(contact.isFavorite),
    isBlocked: Boolean(contact.isBlocked),
    createdAt: (contact.createdAt as string | undefined) ?? new Date().toISOString(),
  }));
}

function normalizeContact(payload: unknown): Contact {
  return normalizeContacts([payload])[0] ?? {
    id: "",
    contactName: "Unknown contact",
    contactEmail: null,
    contactPhone: null,
    matchedUserId: null,
    matchedUserDisplayName: null,
    isFavorite: false,
    isBlocked: false,
    createdAt: new Date().toISOString(),
  };
}

export const contactService = {
  async getContacts(token: string): Promise<Contact[]> {
    const url = buildContactsUrl(API_BASE_URL);
    // eslint-disable-next-line no-console
    console.log("contactService.getContacts — calling URL:", url, { tokenLength: token?.length });

    const response = await axios.get<unknown>(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // eslint-disable-next-line no-console
    console.log("contactService.getContacts — raw response:", response.data);

    const contacts = normalizeContacts(response.data);

    const debugRaw = process.env.NEXT_PUBLIC_DEBUG_RAW_CONTACTS === "1";
    if (debugRaw) {
      return contacts;
    }

    return contacts.filter((contact) => !contact.isBlocked);
  },

  async searchContacts(token: string, query: string): Promise<Contact[]> {
    const response = await axios.get<unknown>(`${buildContactsUrl(API_BASE_URL)}/search`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { query },
    });

    return normalizeContacts(response.data).filter((contact) => !contact.isBlocked);
  },

  async getSyncStatus(token: string): Promise<ContactSyncStatus> {
    const response = await axios.get<ContactSyncStatus>(`${buildContactsUrl(API_BASE_URL)}/sync-status`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return { hasGoogleCredentials: Boolean(response.data.hasGoogleCredentials) };
  },

  async syncGoogleContacts(token: string): Promise<string> {
    const response = await axios.post<string>(`${buildContactsUrl(API_BASE_URL)}/sync`, undefined, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  },

  async addContact(token: string, input: AddContactInput): Promise<Contact> {
    const response = await axios.post<unknown>(buildContactsUrl(API_BASE_URL), {
      contactName: input.contactName.trim(),
      contactEmail: input.contactEmail?.trim() || null,
      contactPhone: input.contactPhone?.trim() || null,
    }, { headers: { Authorization: `Bearer ${token}` } });

    return normalizeContact(response.data);
  },
};
