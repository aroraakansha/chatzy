"use client";

import { Mic, MicOff, Phone, PhoneOff, Video, VideoOff } from "lucide-react";
import { isAxiosError } from "axios";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { CallRealtimeService, type CallSignal } from "@/features/call/services/call-realtime-service";
import { callService, type CallResponse, type CallType } from "@/features/call/services/call-service";
import { startRingtone } from "@/features/call/services/ringtone";
import { Avatar } from "@/shared/ui/avatar";

export function CallScreen({ type }: { type: CallType }) {
  const session = useAuthStore((state) => state.session);
  const router = useRouter();
  const params = useSearchParams();
  const peerId = params.get("peerId");
  const callIdFromUrl = params.get("callId");
  const incoming = params.get("mode") === "answer";
  const name = params.get("name") || "Chatzy contact";
  const peerOnline = params.get("online") === "true";
  const [call, setCall] = useState<CallResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(type === "VIDEO");
  const [connected, setConnected] = useState(false);
  const [signalingReady, setSignalingReady] = useState(false);
  const localVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const remoteAudio = useRef<HTMLAudioElement>(null);
  const media = useRef<MediaStream | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const realtime = useRef<CallRealtimeService | null>(null);
  const activeCall = useRef<CallResponse | null>(null);
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);
  const offerSent = useRef(false);
  const mediaPermissionDenied = useRef(false);

  useEffect(() => { activeCall.current = call; }, [call]);

  useEffect(() => {
    if (!session?.token) return;
    const service = new CallRealtimeService();
    realtime.current = service;
    void service.connect(session.token, {
      onCall: (nextCall) => {
        setCall(nextCall);
        if (nextCall.status === "CONNECTED" && nextCall.callerId === session.user.id) void createAndSendOffer(nextCall.callId);
        if (nextCall.status === "ENDED" || nextCall.status === "REJECTED" || nextCall.status === "FAILED") {
          closePeerConnection();
          router.replace("/dashboard");
        }
      },
      onSignal: (signal) => void handleSignal(signal),
      onError: setError,
    }).then(() => setSignalingReady(true)).catch(() => undefined);
    return () => { void service.disconnect(); };
  // The connection deliberately lives for the lifetime of this call screen.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.token, session?.user.id]);

  useEffect(() => () => closePeerConnection(), []);

  useEffect(() => {
    const isCallerRinging = call?.status === "RINGING" && call.callerId === session?.user.id;
    if (!isCallerRinging) return;
    return startRingtone("outgoing");
  }, [call?.callerId, call?.status, session?.user.id]);

  async function prepareMediaAndPeerConnection() {
    if (!session?.token) throw new Error("Please sign in again before calling.");
    if (!window.isSecureContext) {
      throw new Error(
        "Audio and video calls require HTTPS on this device. Open the app through a trusted HTTPS address, or use localhost with USB port forwarding for local testing.",
      );
    }
    if (!media.current) {
      if (mediaPermissionDenied.current) {
        throw new Error("Microphone and camera access is blocked. Enable the permission in your browser settings, then reload Chatzy.");
      }

      try {
        // This is reached only through the Start/Answer button. One request asks
        // for every device this call needs, so the browser shows a single prompt.
        media.current = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: type === "VIDEO",
        });
      } catch (cause) {
        if (cause instanceof DOMException && (cause.name === "NotAllowedError" || cause.name === "SecurityError")) {
          mediaPermissionDenied.current = true;
          throw new Error("Microphone/camera permission was not granted. Enable it in your browser settings, then reload Chatzy.");
        }
        throw cause;
      }
      if (localVideo.current) localVideo.current.srcObject = media.current;
    }
    if (peerConnection.current) return peerConnection.current;
    const iceServers = await callService.getIceServers(session.token);
    const pc = new RTCPeerConnection({ iceServers });
    peerConnection.current = pc;
    media.current.getTracks().forEach((track) => pc.addTrack(track, media.current!));
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      if (!remoteStream) return;
      if (remoteVideo.current) remoteVideo.current.srcObject = remoteStream;
      if (remoteAudio.current) remoteAudio.current.srcObject = remoteStream;
    };
    pc.onicecandidate = (event) => {
      const callId = activeCall.current?.callId;
      if (event.candidate && callId && session?.token) void callService.sendIceCandidate(session.token, callId, event.candidate).catch(() => setError("Unable to exchange connection details."));
    };
    pc.onconnectionstatechange = () => {
      setConnected(pc.connectionState === "connected");
      if (pc.connectionState === "failed") setError("The call connection failed. Please try again.");
    };
    return pc;
  }

  async function createAndSendOffer(callId: string) {
    if (offerSent.current || incoming || !session?.token) return;
    offerSent.current = true;
    try {
      const pc = await prepareMediaAndPeerConnection();
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      if (!offer.sdp) throw new Error("Could not create the call offer.");
      await callService.sendOffer(session.token, callId, offer.sdp);
    } catch (cause) {
      offerSent.current = false;
      setError(cause instanceof Error ? cause.message : "Unable to start the call connection.");
    }
  }

  async function handleSignal(signal: CallSignal) {
    const pc = peerConnection.current;
    const currentCallId = activeCall.current?.callId ?? callIdFromUrl;
    if (!currentCallId || signal.callId !== currentCallId || !session?.token) return;
    try {
      if (signal.type === "offer" && signal.sdp) {
        const receiverPc = await prepareMediaAndPeerConnection();
        await receiverPc.setRemoteDescription({ type: "offer", sdp: signal.sdp });
        await flushPendingCandidates(receiverPc);
        const answer = await receiverPc.createAnswer();
        await receiverPc.setLocalDescription(answer);
        if (!answer.sdp) throw new Error("Could not create the call answer.");
        await callService.sendAnswer(session.token, currentCallId, answer.sdp);
      } else if (signal.type === "answer" && signal.sdp && pc) {
        await pc.setRemoteDescription({ type: "answer", sdp: signal.sdp });
        await flushPendingCandidates(pc);
      } else if (signal.type === "ice-candidate" && signal.candidate) {
        const candidate = { candidate: signal.candidate, sdpMid: signal.sdpMid ?? null, sdpMLineIndex: signal.sdpMLineIndex ?? null };
        if (pc?.remoteDescription) await pc.addIceCandidate(candidate);
        else pendingCandidates.current.push(candidate);
      }
    } catch {
      setError("Unable to negotiate the call connection.");
    }
  }

  async function flushPendingCandidates(pc: RTCPeerConnection) {
    const candidates = pendingCandidates.current.splice(0);
    await Promise.all(candidates.map((candidate) => pc.addIceCandidate(candidate)));
  }

  async function start() {
    if (!session?.token || !peerId || !signalingReady) { setError("Connecting to call signaling. Please try again in a moment."); return; }
    setBusy(true); setError(null);
    try {
      await prepareMediaAndPeerConnection();
      setCall(await callService.initiate(session.token, peerId, type, params.get("chatId")));
    } catch (cause) {
      setError(toCallErrorMessage(cause, "start"));
      closePeerConnection();
    } finally { setBusy(false); }
  }

  async function answer() {
    if (!session?.token || !callIdFromUrl || !signalingReady) { setError("Connecting to call signaling. Please try again in a moment."); return; }
    setBusy(true); setError(null);
    try {
      await prepareMediaAndPeerConnection();
      setCall(await callService.answer(session.token, callIdFromUrl));
    } catch (cause) {
      setError(toCallErrorMessage(cause, "answer"));
      closePeerConnection();
    } finally { setBusy(false); }
  }

  function closePeerConnection() {
    peerConnection.current?.close(); peerConnection.current = null;
    media.current?.getTracks().forEach((track) => track.stop()); media.current = null;
    if (localVideo.current) localVideo.current.srcObject = null;
    if (remoteVideo.current) remoteVideo.current.srcObject = null;
    if (remoteAudio.current) remoteAudio.current.srcObject = null;
    setConnected(false);
  }

  async function end() {
    const callId = activeCall.current?.callId ?? callIdFromUrl;
    if (session?.token && callId) { try { await callService.end(session.token, callId); } catch { /* local cleanup still applies */ } }
    closePeerConnection(); router.replace("/dashboard");
  }

  const dialing = Boolean(call) && !connected;
  const callStatus = connected ? "Connected" : dialing ? (peerOnline ? "Ringing…" : "Calling…") : incoming ? "Incoming call" : signalingReady ? "Ready to call" : "Connecting…";
  const canStart = incoming ? Boolean(callIdFromUrl && signalingReady) : Boolean(peerId && signalingReady);

  return <div className="chatzy-wallpaper grid min-h-[calc(100dvh-7rem)] place-items-center p-5"><section className="w-full max-w-xl overflow-hidden rounded-[32px] border border-white/10 bg-[#151a29]/90 p-7 text-center text-white shadow-2xl backdrop-blur-xl">{type === "VIDEO" && <div className="relative mb-6 overflow-hidden rounded-2xl bg-slate-950"><video ref={remoteVideo} autoPlay playsInline className="aspect-video w-full object-cover" /><video ref={localVideo} autoPlay muted playsInline className="absolute bottom-3 right-3 aspect-video w-28 rounded-xl border border-white/20 bg-slate-800 object-cover" /></div>}<audio ref={remoteAudio} autoPlay /><div className={dialing ? "call-pulse mx-auto w-fit rounded-full" : "mx-auto w-fit"}><Avatar name={name} tone="from-violet-600 to-cyan-500" size="lg" online={connected || dialing} className="scale-150" /></div><p className="mt-9 text-xs font-bold uppercase tracking-[.2em] text-cyan-300">{type === "VIDEO" ? "Video" : "Voice"} call</p><h1 className="mt-2 text-2xl font-semibold">{name}</h1><p className="mt-2 text-sm text-slate-400">{callStatus}</p>{error && <p className="mt-4 rounded-xl bg-rose-500/15 px-3 py-2 text-sm text-rose-200">{error}</p>}<div className="mt-8 flex flex-wrap justify-center gap-3">{!call ? <button disabled={!canStart || busy} onClick={() => void (incoming ? answer() : start())} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 font-bold text-white disabled:opacity-50"><Phone size={18} />{busy ? "Connecting…" : incoming ? "Answer call" : `Start ${type === "VIDEO" ? "video" : "voice"} call`}</button> : <><button onClick={() => { setMuted(!muted); media.current?.getAudioTracks().forEach((track) => { track.enabled = muted; }); }} className="call-control" aria-label={muted ? "Unmute" : "Mute"}>{muted ? <MicOff size={19} /> : <Mic size={19} />}</button>{type === "VIDEO" && <button onClick={() => { setCameraOn(!cameraOn); media.current?.getVideoTracks().forEach((track) => { track.enabled = cameraOn; }); }} className="call-control" aria-label={cameraOn ? "Turn camera off" : "Turn camera on"}>{cameraOn ? <Video size={19} /> : <VideoOff size={19} />}</button>}<button onClick={() => void end()} className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-500 text-white" aria-label="End call"><PhoneOff size={19} /></button></>}</div></section></div>;
}

function toCallErrorMessage(cause: unknown, action: "start" | "answer") {
  if (isAxiosError(cause)) {
    const serverMessage = typeof cause.response?.data?.message === "string" ? cause.response.data.message : null;
    if (serverMessage) return serverMessage;
    if (cause.response?.status === 401) return "Your sign-in has expired. Please sign in again before calling.";
    if (cause.response?.status) return `The call server could not ${action} this call. Please try again.`;
    return "Chatzy could not reach the call server. Check that the backend is running, then try again.";
  }
  if (cause instanceof Error) return cause.message;
  return action === "start" ? "Chatzy could not start the call. Please try again." : "Chatzy could not answer the call. Please try again.";
}
