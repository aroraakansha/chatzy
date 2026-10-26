import type { Call, Chat, Contact, Message, Page, Session, User } from "./types";

const API = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
const BACKEND = "/backend";

async function request<T>(path: string, token?: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  let response: Response;
  try {
    response = await fetch(`${API}${path}`, { ...init, headers, cache: "no-store", signal: init.signal ?? AbortSignal.timeout(12000) });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") throw new Error("The server took too long to respond. Please try again.");
    throw new Error("Could not reach Chatzy. Check that the backend is running.");
  }
  if (!response.ok) {
    const raw = await response.text().catch(() => "");
    let message = raw;
    try { const data = JSON.parse(raw); message = data.message || data.error || raw; } catch {}
    const error = new Error(message || `Request failed (${response.status})`) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  if (!text) return undefined as T;
  try { return JSON.parse(text) as T; } catch { return text as T; }
}

const post = (body: unknown): RequestInit => ({ method: "POST", body: JSON.stringify(body) });
export const api = {
  login: (email: string, password: string) => request<Session>("/auth/login", undefined, post({ email, password })),
  register: (email: string, password: string, displayName: string) => request<string>("/auth/register", undefined, post({ email, password, displayName })),
  startSignup: (data: { email: string; phone: string; password: string; fullName: string }) => request<string>("/auth/sign-up/email", undefined, post(data)),
  verifyOtp: (data: { email: string; phone: string; code: string }) => request<Session>("/auth/verify-otp", undefined, post(data)),
  forgotPassword: (email: string) => request<string>("/auth/forgot-password", undefined, post({ email })),
  resetPassword: (token: string, newPassword: string) => request<string>("/auth/reset-password", undefined, post({ token, newPassword })),
  me: (token: string) => request<User>("/auth/me", token),
  chats: (token: string) => request<Chat[]>("/chats", token),
  privateChat: (token: string, id: string) => request<Chat>(`/chats/private/${encodeURIComponent(id)}`, token),
  createGroup: (token: string, data: { name: string; description?: string; memberIds: string[] }) => request<Chat>("/chats/groups", token, post(data)),
  pin: (token: string, chatId: string, messageId: string) => request<Chat>(`/chats/${chatId}/pins`, token, post({ messageId })),
  unpin: (token: string, chatId: string) => request<Chat>(`/chats/${chatId}/pins`, token, { method: "DELETE" }),
  messages: (token: string, chatId: string, page = 0, size = 40) => request<Page<Message>>(`/messages/${chatId}?page=${page}&size=${size}&sort=sentAt,desc`, token),
  searchMessages: (token: string, chatId: string, query: string) => request<Page<Message>>(`/messages/${chatId}/search?query=${encodeURIComponent(query)}&page=0&size=30`, token),
  send: (token: string, message: Message) => request<Message>("/messages/send", token, post(message)),
  upload: (token: string, data: { chatId: string; senderId: string; recipientId: string; file: File; content?: string }) => {
    const body = new FormData(); body.set("chatId", data.chatId); body.set("senderId", data.senderId); body.set("recipientId", data.recipientId); body.set("file", data.file); if (data.content) body.set("content", data.content);
    return request<Message>("/messages/media", token, { method: "POST", body });
  },
  voice: (token: string, data: { chatId: string; senderId: string; recipientId: string; file: File; durationSeconds: number }) => {
    const body = new FormData(); body.set("chatId", data.chatId); body.set("senderId", data.senderId); body.set("recipientId", data.recipientId); body.set("audioFile", data.file); body.set("durationSeconds", String(data.durationSeconds));
    return request<Message>("/messages/voice", token, { method: "POST", body });
  },
  contacts: (token: string) => request<Contact[]>("/contacts", token),
  searchContacts: (token: string, query: string) => request<Contact[]>(`/contacts/search?query=${encodeURIComponent(query)}`, token),
  addContact: (token: string, data: { contactName?: string; contactEmail?: string; contactPhone?: string }) => request<Contact>("/contacts", token, post(data)),
  contactSyncStatus: (token: string) => request<{ hasGoogleCredentials: boolean }>("/contacts/sync-status", token),
  syncContacts: (token: string) => request<string>("/contacts/sync", token, post({})),
  addReaction: (token: string, id: string, emoji: string) => request<unknown>(`/messages/${id}/reactions`, token, post({ emoji })),
  markRead: (token: string, id: string) => request<Message>(`/messages/${id}/read`, token, { method: "PATCH" }),
  initiateCall: (token: string, data: { receiverId: string; type: "AUDIO" | "VIDEO"; chatId: string }) => request<Call>("/calls/initiate", token, post(data)),
  callHistory: (token: string) => request<Call[]>("/calls/history", token),
  answerCall: (token: string, id: string) => request<Call>(`/calls/${id}/answer`, token, post({})),
  rejectCall: (token: string, id: string) => request<Call>(`/calls/${id}/reject`, token, post({})),
  endCall: (token: string, id: string) => request<Call>(`/calls/${id}/end`, token, post({})),
  iceServers: (token: string) => request<unknown>("/calls/ice-servers", token),
  sendOffer: (token: string, id: string, sdpOffer: string) => request<void>(`/calls/${id}/sdp-offer`, token, post({ callId: id, sdpOffer })),
  sendAnswer: (token: string, id: string, sdpAnswer: string) => request<void>(`/calls/${id}/sdp-answer`, token, post({ callId: id, sdpAnswer })),
  sendIce: (token: string, id: string, candidate: RTCIceCandidate) => request<void>(`/calls/${id}/ice-candidate`, token, post({ callId: id, candidate: candidate.candidate, sdpMid: candidate.sdpMid, sdpMLineIndex: candidate.sdpMLineIndex })),
  profile: (token: string) => request<User>(`${BACKEND}/user/auth`, token),
  avatar: (token: string, id: string, file: File) => { const body = new FormData(); body.set("file", file); return request<{ avatarUrl: string }>(`${BACKEND}/user/${id}/avatar`, token, { method: "PUT", body }); },
  ask: (token: string, question: string) => request<{ answer?: string; sources?: unknown[] }>(`${BACKEND}/v1/questions`, token, post({ question })),
  enhance: (token: string, text: string) => request<{ enhancedText: string }>(`${BACKEND}/v1/text/enhance`, token, post({ text })),
};

export function saveSession(session: Session) {
  localStorage.setItem("chatzy.session", JSON.stringify(session));
}
export function getSession(): Session | null {
  try { const value = localStorage.getItem("chatzy.session"); return value ? JSON.parse(value) as Session : null; } catch { return null; }
}
