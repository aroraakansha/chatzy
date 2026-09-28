"use client";

import { AppShell } from "@/features/workspace/components/app-shell";
import { CallScreen } from "@/features/call/components/call-screen";

export default function VideoCallingPage() {
  return <AppShell><CallScreen type="VIDEO" /></AppShell>;
}
