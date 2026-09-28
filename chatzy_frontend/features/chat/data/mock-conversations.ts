import type { Conversation } from "@/features/chat/types/chat.types";

const tones = [
  "from-emerald-500 to-teal-700",
  "from-sky-500 to-cyan-700",
  "from-rose-500 to-pink-700",
  "from-amber-500 to-orange-700",
  "from-violet-500 to-indigo-700",
  "from-lime-500 to-green-700",
];

const names = [
  ["Aarav Mehta", "Can you review the voice-note transcript?", "online"],
  ["Priya Shah", "Typing the final copy now...", "typing"],
  ["Design Guild", "Maya pinned the new onboarding flow.", "online"],
  ["Kabir Sethi", "The invoice PDF is in the shared folder.", "away"],
  ["Product War Room", "Release candidate passed smoke tests.", "online"],
  ["Ananya Rao", "Let us move the call by 15 minutes.", "offline"],
  ["Rohan Kapoor", "Screen share worked smoothly today.", "recording"],
  ["Family", "Dinner plan is locked for Sunday.", "online"],
  ["Nisha Verma", "Loved the status update.", "online"],
  ["Backend Sync", "Spring Boot contract draft is ready.", "away"],
  ["Meera Iyer", "Sent the travel photos.", "offline"],
  ["DevOps Alerts", "Staging deploy completed.", "online"],
  ["Aditya Nair", "That reaction summary is perfect.", "typing"],
  ["Community Leads", "Town hall notes are uploaded.", "online"],
  ["Sara Khan", "Can we test push notifications?", "away"],
  ["Finance Ops", "Payment reminder template approved.", "offline"],
  ["Neel Joshi", "Joining after lunch.", "online"],
  ["Growth Team", "Campaign dashboard looks healthy.", "online"],
  ["Ishita Bose", "The call quality was much better.", "offline"],
  ["QA Squad", "Video call edge cases are listed.", "typing"],
  ["Arjun Malhotra", "Sharing the file now.", "online"],
  ["Founders", "Please keep this thread pinned.", "away"],
  ["Hiring Panel", "Interview feedback is consolidated.", "offline"],
  ["Tara D'Souza", "Search in conversation is a must.", "online"],
  ["Legal Review", "Updated DPA comments added.", "offline"],
  ["Customer Success", "Enterprise pilot starts tomorrow.", "online"],
  ["Mobile Team", "Presence heartbeat needs a retry policy.", "typing"],
  ["Sanjay Gupta", "Mute this group during the workshop.", "away"],
  ["Security Desk", "Device session list needs audit logs.", "online"],
  ["Workspace Admins", "Community migration plan is approved.", "offline"],
] as const;

export const mockConversations: Conversation[] = names.map(
  ([name, lastMessage, presence], index) => {
    const id = `conversation-${index + 1}`;
    const timestamp =
      index < 8 ? `${9 + index}:${index % 2 === 0 ? "08" : "42"}` : `${index - 7}d`;
    const unreadCount = index % 6 === 0 ? 8 : index % 5 === 0 ? 3 : index % 4 === 0 ? 1 : 0;
    const kind = name.includes("Team") || name.includes("Guild") || name.includes("Squad")
      ? "group"
      : name.includes("Community")
        ? "community"
        : "direct";

    return {
      id,
      // Add real-looking identifiers for local dev so the UI allows sending
      chatId: `chat-${index + 1}`,
      recipientId: `user-${index + 1}`,
      kind,
      name,
      avatarTone: tones[index % tones.length],
      lastMessage,
      timestamp,
      unreadCount,
      isPinned: index < 4,
      isMuted: index % 7 === 0,
      presence,
      online: presence === "online" || presence === "typing" || presence === "recording",
      lastSeen: presence === "offline" ? "last seen yesterday at 21:14" : "available now",
      messages: [
        {
          id: `${id}-m1`,
          conversationId: id,
          direction: "incoming",
          body: `Hey, quick update from ${name}. ${lastMessage}`,
          sentAt: "09:12",
          reactions: index % 3 === 0 ? ["ok"] : undefined,
        },
        {
          id: `${id}-m2`,
          conversationId: id,
          direction: "outgoing",
          body: "Got it. I am checking the thread and will keep the next action clear.",
          sentAt: "09:16",
          status: "read",
        },
        {
          id: `${id}-m3`,
          conversationId: id,
          direction: "incoming",
          body:
            index % 5 === 0
              ? "I attached the latest brief so the backend contract can match the UI states."
              : "Perfect. The important part is keeping the conversation history easy to scan.",
          sentAt: "09:27",
          attachment:
            index % 5 === 0
              ? { name: "chatzy-thread-context.pdf", type: "document", size: "1.8 MB" }
              : undefined,
        },
        {
          id: `${id}-m4`,
          conversationId: id,
          direction: "outgoing",
          body: "I will pin this and follow up after the current build is verified.",
          sentAt: "09:31",
          status: index % 2 === 0 ? "read" : "delivered",
        },
      ],
    };
  },
);
