"use client";

import { Phone, PhoneOff, Video } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { CallRealtimeService } from "@/features/call/services/call-realtime-service";
import { callService, type CallResponse } from "@/features/call/services/call-service";
import { startRingtone } from "@/features/call/services/ringtone";

export function CallNotifications() {
  const session = useAuthStore((state) => state.session);
  const router = useRouter();
  const service = useRef<CallRealtimeService | null>(null);
  const [incoming, setIncoming] = useState<CallResponse | null>(null);

  useEffect(() => {
    if (!session?.token) return;
    const realtime = new CallRealtimeService();
    service.current = realtime;
    void realtime.connect(session.token, {
      onCall: (call) => setIncoming((current) => {
        if (call.status === "RINGING" && call.receiverId === session.user.id) return call;
        if (current?.callId === call.callId && call.status !== "RINGING") return null;
        return current;
      }),
      onSignal: () => undefined,
    }).catch(() => undefined);
    return () => { void realtime.disconnect(); };
  }, [session?.token, session?.user.id]);

  useEffect(() => {
    if (!incoming) return;
    return startRingtone("incoming");
  }, [incoming]);

  if (!incoming || !session?.token) return null;
  const video = incoming.type === "VIDEO";
  return <div className="fixed right-4 top-4 z-[80] w-[min(360px,calc(100vw-2rem))] rounded-3xl border border-violet-400/30 bg-[#151a29]/95 p-5 text-white shadow-2xl backdrop-blur-xl"><div className="flex gap-3"><span className="call-pulse grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500">{video ? <Video size={20} /> : <Phone size={20} />}</span><div><p className="font-semibold">Incoming {video ? "video" : "voice"} call</p><p className="mt-1 text-sm text-slate-400">Ringing on Chatzy…</p></div></div><div className="mt-4 flex gap-2"><button onClick={() => { setIncoming(null); router.push(`/calls/${video ? "video" : "voice"}?callId=${incoming.callId}&mode=answer&peerId=${incoming.callerId}`); }} className="flex-1 rounded-2xl bg-cyan-500 px-4 py-2.5 text-sm font-bold text-slate-950">Answer</button><button onClick={() => { void callService.reject(session.token, incoming.callId); setIncoming(null); }} className="grid h-10 w-10 place-items-center rounded-2xl bg-rose-500/20 text-rose-300" aria-label="Reject call"><PhoneOff size={18} /></button></div></div>;
}
