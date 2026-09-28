import { ChatDashboard } from "@/app/dashboard/chat-dashboard";
import { getConversationSnapshot } from "@/features/chat/services/chat-service";
import { CallNotifications } from "@/features/call/components/call-notifications";

export default function DashboardPage() {
  const snapshot = getConversationSnapshot();

  return (
    <>
      <CallNotifications />
      <ChatDashboard snapshot={snapshot} />
    </>
  );
}
