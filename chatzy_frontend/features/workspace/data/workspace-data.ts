import {
  Bell,
  Camera,
  CheckCircle2,
  Clock,
  FileText,
  Mic,
  MonitorUp,
  Phone,
  ShieldCheck,
  UsersRound,
  Video,
} from "lucide-react";
import { mockConversations } from "@/features/chat/data/mock-conversations";

export const contacts = mockConversations.slice(0, 18).map((conversation, index) => ({
  id: conversation.id,
  name: conversation.name,
  about:
    index % 3 === 0
      ? "Available for urgent Chatzy syncs"
      : index % 3 === 1
        ? "Building better conversations"
        : "Usually replies within minutes",
  online: conversation.online,
  avatarTone: conversation.avatarTone,
  phone: `+91 98${String(76000000 + index * 9411).slice(0, 8)}`,
}));

export const groups = mockConversations
  .filter((conversation) => conversation.kind !== "direct")
  .map((conversation, index) => ({
    id: conversation.id,
    name: conversation.name,
    members: 12 + index * 7,
    unread: conversation.unreadCount,
    description: conversation.lastMessage,
    avatarTone: conversation.avatarTone,
  }));

export const statuses = contacts.slice(0, 10).map((contact, index) => ({
  id: `status-${contact.id}`,
  name: contact.name,
  time: index < 3 ? `${index + 8}:4${index}` : `${index}h ago`,
  viewed: index > 4,
  avatarTone: contact.avatarTone,
}));

export const notifications = [
  { id: "n1", title: "New message reaction", body: "Priya reacted to your roadmap update.", time: "2m", icon: Bell },
  { id: "n2", title: "Missed voice call", body: "Rohan called from Product War Room.", time: "16m", icon: Phone },
  { id: "n3", title: "Security check", body: "A new browser session was verified.", time: "1h", icon: ShieldCheck },
  { id: "n4", title: "File shared", body: "Backend Sync uploaded API-contract-v2.pdf.", time: "3h", icon: FileText },
];

export const callHistory = [
  { id: "c1", name: "Priya Shah", type: "Voice", status: "Completed", direction: "outgoing", time: "Today, 09:42", icon: Phone, avatarTone: "from-violet-600 to-cyan-500" },
  { id: "c2", name: "Product War Room", type: "Video", status: "Missed", direction: "incoming", time: "Yesterday, 18:15", icon: Video, avatarTone: "from-amber-500 to-orange-600" },
  { id: "c3", name: "Rohan Kapoor", type: "Voice", status: "Completed", direction: "incoming", time: "Yesterday, 11:24", icon: Phone, avatarTone: "from-emerald-500 to-teal-700" },
  { id: "c4", name: "QA Squad", type: "Video", status: "Declined", direction: "outgoing", time: "Mon, 16:08", icon: Video, avatarTone: "from-fuchsia-500 to-violet-600" },
];

export const settingsSections = [
  { id: "privacy", title: "Privacy", description: "Last seen, profile photo, blocked contacts", icon: ShieldCheck },
  { id: "notifications", title: "Notifications", description: "Message tones, mentions, call alerts", icon: Bell },
  { id: "media", title: "Media and storage", description: "Auto-download, documents, cache", icon: Camera },
  { id: "devices", title: "Linked devices", description: "Desktop, browser, and tablet sessions", icon: MonitorUp },
];

export const profileStats = [
  { label: "Chats", value: "128", icon: CheckCircle2 },
  { label: "Groups", value: "14", icon: UsersRound },
  { label: "Avg reply", value: "4m", icon: Clock },
];
