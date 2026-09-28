"use client";

import { AppShell } from "@/features/workspace/components/app-shell";
import { CallScreen } from "@/features/call/components/call-screen";

export default function VoiceCallingPage() {
  return <AppShell><CallScreen type="AUDIO" /></AppShell>;
}
