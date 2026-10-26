"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Client, type IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import {
  ArrowDown, ArrowLeft, ArrowUpRight, AudioLines, Bell, Check, CheckCheck, ChevronDown, CircleHelp,
  File as FileIcon, Heart, Image, Info, LogOut, MessageCircle, Mic, MoreHorizontal, Paperclip, Phone, PhoneIncoming, PhoneOutgoing, Pin,
  Plus, Search, Send, Settings2, Smile, Sparkles, Sun, Moon, UserPlus, Users, Video, X,
} from "lucide-react";
import { api, getSession } from "./api";
import type { Call, Chat, Contact, Message, Session, User } from "./types";

export type Area = "messages" | "contacts" | "groups" | "calls" | "assistant" | "profile";
const emojiSet = ["😀", "😂", "🥹", "😍", "🤔", "😭", "😎", "🥳", "💛", "❤️", "🩷", "💜", "✨", "🔥", "🙌", "👏", "🙏", "💯"];
const emojiCatalog: Record<string, string[]> = {
  Faces: ["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","😉","😊","😇","🥰","😍","🤩","😘","😗","☺️","😚","😙","🥲","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🫢","🫣","🤫","🤔","🫡","🤐","🤨","😐","😑","😶","🫥","😶‍🌫️","😏","😒","🙄","😬","😮‍💨","🤥","🫨","🙂‍↔️","🙂‍↕️","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🤧","🥵","🥶","🥴","😵","😵‍💫","🤯","🤠","🥳","🥸","😎","🤓","🧐","😕","🫤","😟","🙁","☹️","😮","😯","😲","😳","🥺","🥹","😦","😧","😨","😰","😥","😢","😭","😱","😖","😣","😞","😓","😩","😫","🥱","😤","😡","😠","🤬","😈","👿","💀","☠️","💩","🤡","👻","👽","🤖"],
  Hands: ["👋","🤚","🖐️","✋","🖖","🫱","🫲","🫳","🫴","👌","🤌","🤏","✌️","🤞","🫰","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝️","🫵","👍","👎","✊","👊","🤛","🤜","👏","🙌","🫶","👐","🤲","🤝","🙏","✍️","💅","🤳","💪","🦾","🦿","🦵","🦶","👂","🦻","👃","🧠","🫀","🫁","🦷","🦴","👀","👁️","👅","👄"],
  Hearts: ["❤️","🩷","🧡","💛","💚","💙","🩵","💜","🤎","🖤","🩶","🤍","💔","❤️‍🔥","❤️‍🩹","❣️","💕","💞","💓","💗","💖","💘","💝","💟","♥️","💌","💋","💍","💐","🌹","🌷","🌸","🪷","🌻","🌼","🌺","🪻","🫶","✨","⭐","🌟","💫","⚡","☀️","🌈","☁️","❄️","☔","🔥","🎉","🎊","🎈","🎁","🪄","🪩"],
  Nature: ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🙈","🙉","🙊","🐔","🐧","🐦","🦆","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🦋","🐌","🐞","🐢","🐍","🦎","🐙","🦑","🦀","🐠","🐬","🐳","🦈","🐊","🐘","🦒","🦘","🦥","🐿️","🦔","🌵","🌲","🌳","🌴","🌱","🍀","🍁","🍂","🍄","🌾","🌊","🌙","🌍"],
  Food: ["🍏","🍎","🍐","🍊","🍋","🍌","🍉","🍇","🍓","🫐","🍈","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🍆","🥑","🥦","🥬","🥒","🌶️","🌽","🥕","🧄","🧅","🥔","🍠","🥐","🥯","🍞","🥖","🧀","🥚","🍳","🥞","🧇","🥓","🍔","🍟","🍕","🌭","🥪","🌮","🌯","🥗","🍝","🍜","🍣","🍱","🥟","🍦","🍩","🍪","🎂","🍰","🧁","🍫","🍿","☕","🧋","🥤","🍵","🍷","🍸","🍹","🍺","🥂","🧃"],
  Activities: ["⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🎱","🏓","🏸","🥅","⛳","🏹","🎣","🤿","🥊","🥋","🎽","🛹","🛼","⛸️","🎿","⛷️","🏂","🏋️","🤸","🤺","🏇","🧘","🏄","🏊","🚴","🧗","🎮","🕹️","🎲","🧩","🎯","🎳","🎤","🎧","🎼","🎹","🥁","🎷","🎸","🎻","🎬","🎨","🧵","🪡","🏆","🥇","🥈","🥉","🎟️","🎭","🎪"],
  Travel: ["🚗","🚕","🚙","🚌","🚎","🏎️","🚓","🚑","🚒","🚐","🚚","🚲","🛴","🛵","🏍️","🚂","🚆","🚇","🚊","✈️","🛫","🛬","🚀","🛸","🚁","⛵","🚤","🛳️","⚓","🚦","🗺️","🗽","🗼","🏰","🏯","🏟️","🎡","🎢","🎠","🏖️","🏝️","🏕️","⛰️","🌋","🏜️","🏠","🏡","🏢","🌃","🌉","🌌","🛣️","🧳","🌏","🌎","🌍"],
  Objects: ["⌚","📱","💻","⌨️","🖥️","🖨️","🖱️","🕹️","💡","🔦","🕯️","🪔","📷","📸","📹","🎥","📞","☎️","📺","📻","🎙️","⏰","⌛","📡","🔋","🪫","💸","💵","💳","🪙","💎","⚖️","🧰","🔧","🔨","⚒️","🛠️","🔩","⚙️","🧲","🪜","🧹","🧺","🧻","🧼","🪥","🔑","🗝️","🔒","🔓","📦","✉️","📩","📚","📖","📝","✏️","🖊️","📌","📍","📎","✂️","🗃️","🗑️","🔍","🔎","💊","🩹","🩺","🧸","🪅","🪆","🎀","🪞","🛍️","🧴","🪮","🧿","🪬","🧧","🎁","📿","🏮","🪭"],
};
const socketPath = process.env.NEXT_PUBLIC_CHAT_SOCKET_URL || "/ws-chat";

export function ChatWorkspace({ initialArea = "messages" }: { initialArea?: Area }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [olderByChat, setOlderByChat] = useState<Record<string, { page: number; more: boolean; busy: boolean }>>({});
  const [selected, setSelected] = useState("");
  const [area, setArea] = useState<Area>(initialArea);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [emojiCategory, setEmojiCategory] = useState("Faces");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [unread, setUnread] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<"all" | "unread" | "groups">("all");
  const [dialog, setDialog] = useState<"contact" | "group" | null>(null);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mobileChat, setMobileChat] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [callHistory, setCallHistory] = useState<Call[]>([]);
  const [callNotice, setCallNotice] = useState("");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [recording, setRecording] = useState(false);
  const [recordStarted, setRecordStarted] = useState(0);
  const [recordTick, setRecordTick] = useState(0);
  const [onlineEmails, setOnlineEmails] = useState<string[]>([]);
  const [reactions, setReactions] = useState<Record<string, string[]>>({});
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [syncingContacts, setSyncingContacts] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<Client | null>(null);
  const selectedRef = useRef("");
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const activeCallRef = useRef<Call | null>(null);
  const pendingSignalRef = useRef<{ type: string; sdp?: string; candidate?: string; sdpMid?: string; sdpMLineIndex?: number } | null>(null);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const recordingRef = useRef(false);
  const startingRecordingRef = useRef(false);
  const voiceUploadRef = useRef(false);
  const sendingMessageRef = useRef(false);

  const selectedChat = chats.find((chat) => chat.chatId === selected) || null;
  const currentMessages = messages[selected] || [];
  const otherPerson = selectedChat?.type === "PRIVATE" ? contacts.find((person) => person.matchedUserId === selectedChat.recipientId) : null;
  const activeName = selectedChat ? selectedChat.type === "GROUP" ? selectedChat.chatName || "The group chat" : otherPerson?.matchedUserDisplayName || selectedChat.recipientName || "Your person" : "Your little corner";
  const visibleChats = useMemo(() => chats.filter((chat) => {
    const person = contacts.find((item) => item.matchedUserId === chat.recipientId);
    const title = chat.type === "GROUP" ? chat.chatName || "Group chat" : person?.matchedUserDisplayName || chat.recipientName || "Chat";
    const text = (messages[chat.chatId] || []).at(-1)?.content || "";
    const matches = `${title} ${text}`.toLowerCase().includes(query.toLowerCase());
    return matches && (filter === "all" || filter === "unread" && Boolean(unread[chat.chatId]) || filter === "groups" && chat.type === "GROUP");
  }), [chats, contacts, filter, messages, query, unread]);

  useEffect(() => { activeCallRef.current = activeCall; }, [activeCall]);
  useEffect(() => { selectedRef.current = selected; }, [selected]);

  const fetchMessages = useCallback(async (token: string, chatId: string) => {
    try {
      const page = await api.messages(token, chatId, 0, 40);
      setMessages((all) => ({ ...all, [chatId]: [...(page.content || [])].reverse() }));
      setOlderByChat((all) => ({ ...all, [chatId]: { page: 1, more: !page.last, busy: false } }));
      setUnread((all) => ({ ...all, [chatId]: 0 }));
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
      const incoming = (page.content || []).filter((message) => message.senderId !== session?.user.id && message.status !== "READ" && message.id);
      incoming.forEach((message) => { void api.markRead(token, message.id!).catch(() => undefined); });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load messages."); }
  }, [session?.user.id]);

  async function loadOlderMessages() {
    if (!session || !selected) return;
    const cursor = olderByChat[selected]; if (!cursor?.more || cursor.busy) return;
    const scroller = scrollRef.current; const previousHeight = scroller?.scrollHeight || 0;
    setOlderByChat((all) => ({ ...all, [selected]: { ...cursor, busy: true } }));
    try {
      const page = await api.messages(session.token, selected, cursor.page, 40);
      setMessages((all) => ({ ...all, [selected]: [...[...(page.content || [])].reverse(), ...(all[selected] || [])] }));
      setOlderByChat((all) => ({ ...all, [selected]: { page: cursor.page + 1, more: !page.last, busy: false } }));
      requestAnimationFrame(() => { if (scroller) scroller.scrollTop += scroller.scrollHeight - previousHeight; });
    } catch (cause) { setOlderByChat((all) => ({ ...all, [selected]: { ...cursor, busy: false } })); setError(cause instanceof Error ? cause.message : "Could not load earlier messages."); }
  }

  async function setupCallPeer(call: Call, caller: boolean) {
    if (!session) return;
    try {
      peerRef.current?.close();
      const rawServers = await api.iceServers(session.token);
      const peer = new RTCPeerConnection({ iceServers: Array.isArray(rawServers) ? rawServers as RTCIceServer[] : [] });
      peerRef.current = peer;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: call.type === "VIDEO" });
      setLocalStream(stream); stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      peer.ontrack = (event) => setRemoteStream(event.streams[0] || new MediaStream([event.track]));
      peer.onicecandidate = (event) => { if (event.candidate) void api.sendIce(session.token, call.callId, event.candidate).catch(() => undefined); };
      peer.onconnectionstatechange = () => { if (peer.connectionState === "connected") setCallNotice("You’re connected"); if (peer.connectionState === "failed") setCallNotice("Connection lost. Try again."); };
      if (caller) {
        const offer = await peer.createOffer(); await peer.setLocalDescription(offer);
        await api.sendOffer(session.token, call.callId, offer.sdp || "");
      } else if (pendingSignalRef.current?.type === "offer" && pendingSignalRef.current.sdp) {
        const offer = pendingSignalRef.current; pendingSignalRef.current = null;
        await peer.setRemoteDescription({ type: "offer", sdp: offer.sdp });
        const answer = await peer.createAnswer(); await peer.setLocalDescription(answer);
        await api.sendAnswer(session.token, call.callId, answer.sdp || "");
      }
      for (const candidate of pendingIceRef.current) await peer.addIceCandidate(candidate);
      pendingIceRef.current = [];
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not connect the call. Check your camera and microphone permissions.");
    }
  }

  async function receiveWebRtcSignal(signal: { callId: string; type: string; sdp?: string; candidate?: string; sdpMid?: string; sdpMLineIndex?: number }) {
    if (!activeCallRef.current || signal.callId !== activeCallRef.current.callId) { pendingSignalRef.current = signal; return; }
    const peer = peerRef.current;
    if (!peer) { pendingSignalRef.current = signal; return; }
    try {
      if (signal.type === "offer" && signal.sdp) {
        await peer.setRemoteDescription({ type: "offer", sdp: signal.sdp });
        const answer = await peer.createAnswer(); await peer.setLocalDescription(answer);
        if (session) await api.sendAnswer(session.token, signal.callId, answer.sdp || "");
      } else if (signal.type === "answer" && signal.sdp) await peer.setRemoteDescription({ type: "answer", sdp: signal.sdp });
      else if (signal.type === "ice-candidate" && signal.candidate) await peer.addIceCandidate({ candidate: signal.candidate, sdpMid: signal.sdpMid, sdpMLineIndex: signal.sdpMLineIndex });
    } catch { setCallNotice("We couldn’t connect that call. Try again."); }
  }

  async function finishCall() {
    if (activeCall && session) {
      const ended = await api.endCall(session.token, activeCall.callId).catch(() => null);
      if (ended) setCallHistory((history) => [ended, ...history.filter((entry) => entry.callId !== ended.callId)]);
    }
    peerRef.current?.close(); peerRef.current = null;
    localStream?.getTracks().forEach((track) => track.stop());
    setLocalStream(null); setRemoteStream(null); setActiveCall(null); setCallNotice("");
  }

  useEffect(() => {
    const savedTheme = localStorage.getItem("chatzy.theme");
    const initialTheme = savedTheme === "light" ? "light" : "dark";
    setTheme(initialTheme); document.documentElement.dataset.theme = initialTheme;
    const saved = getSession();
    if (!saved?.token) { window.location.replace("/login"); return; }
    setSession(saved); setUser(saved.user); setLoading(true);
    // Start backend hydration in parallel so an unavailable API cannot blank the app.
    void Promise.allSettled([api.chats(saved.token), api.contacts(saved.token)]).then((results) => {
      const [chatResult, contactResult] = results;
      if (chatResult.status === "fulfilled") { setChats(chatResult.value); setSelected((current) => current || chatResult.value[0]?.chatId || ""); }
      else setError(chatResult.reason instanceof Error ? chatResult.reason.message : "Could not load chats.");
      if (contactResult.status === "fulfilled") setContacts(contactResult.value);
      setLoading(false);
    });
    void api.me(saved.token).then(setUser).catch((cause) => {
      const status = (cause as { status?: number }).status;
      if (status === 401 || status === 403) { localStorage.removeItem("chatzy.session"); window.location.replace("/login"); }
    });
  }, []);

  useEffect(() => {
    if (!session?.token) return;
    let alive = true;
    const client = new Client({
      webSocketFactory: () => new SockJS(socketPath),
      connectHeaders: { Authorization: `Bearer ${session.token}` }, reconnectDelay: 5000,
      onConnect: () => {
        if (!alive) return;
        setConnected(true);
        client.subscribe("/user/queue/messages", (frame: IMessage) => {
          try { const message = JSON.parse(frame.body) as Message; setMessages((all) => ({ ...all, [message.chatId]: upsertMessage(all[message.chatId] || [], message) })); if (message.chatId !== selectedRef.current && message.senderId !== user?.id) setUnread((all) => ({ ...all, [message.chatId]: (all[message.chatId] || 0) + 1 })); }
          catch { /* Ignore malformed socket payloads. */ }
        });
        client.subscribe("/topic/presence", (frame) => {
          try { const item = JSON.parse(frame.body) as { userEmail: string; status: string }; setOnlineEmails((all) => item.status === "ONLINE" ? [...new Set([...all, item.userEmail])] : all.filter((email) => email !== item.userEmail)); } catch {}
        });
        client.subscribe("/user/queue/read-receipts", (frame) => {
          try { const payload = JSON.parse(frame.body) as { messageId: string }; setMessages((all) => Object.fromEntries(Object.entries(all).map(([id, rows]) => [id, rows.map((message) => message.id === payload.messageId ? { ...message, status: "READ" as const } : message)]))); } catch {}
        });
        client.subscribe("/user/queue/calls", (frame) => {
          try { const payload = JSON.parse(frame.body) as Call; setCallHistory((history) => [payload, ...history.filter((entry) => entry.callId !== payload.callId)]); if (["ENDED", "REJECTED", "FAILED"].includes(payload.status)) { setActiveCall((current) => current?.callId === payload.callId ? null : current); return; } setActiveCall(payload); setCallNotice(payload.callerId === user?.id ? "Calling your person…" : "Your person is calling"); if (payload.callerId === user?.id && payload.status === "RINGING") void setupCallPeer(payload, true); } catch {}
        });
        client.subscribe("/user/queue/webrtc", (frame) => { try { void receiveWebRtcSignal(JSON.parse(frame.body) as { callId: string; type: string; sdp?: string; candidate?: string; sdpMid?: string; sdpMLineIndex?: number }); } catch {} });
        client.publish({ destination: "/app/presence", body: JSON.stringify({ status: "ONLINE" }) });
      },
      onDisconnect: () => setConnected(false), onWebSocketError: () => setConnected(false),
    });
    clientRef.current = client; void client.activate();
    return () => { alive = false; if (client.connected) client.publish({ destination: "/app/presence", body: JSON.stringify({ status: "OFFLINE" }) }); void client.deactivate(); clientRef.current = null; };
  }, [session?.token]);

  useEffect(() => {
    if (!session?.token) return;
    void api.callHistory(session.token).then(setCallHistory).catch(() => setCallHistory([]));
  }, [session?.token]);

  useEffect(() => {
    const client = clientRef.current;
    if (!client?.connected || !selected) return;
    const subscription = client.subscribe(`/topic/typing/${selected}`, (frame) => {
      try { const data = JSON.parse(frame.body) as { userEmail: string; isTyping: boolean }; if (data.userEmail !== user?.email) setTyping(data.isTyping); } catch {}
    });
    return () => subscription.unsubscribe();
  }, [selected, connected, user?.email]);

  useEffect(() => {
    if (!recording) return;
    const timer = window.setInterval(() => setRecordTick(Math.floor((Date.now() - recordStarted) / 1000)), 250);
    return () => window.clearInterval(timer);
  }, [recordStarted, recording]);

  useEffect(() => { if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream; if (localVideoRef.current) localVideoRef.current.srcObject = localStream; }, [localStream, remoteStream]);

  useEffect(() => { if (session?.token && selected && !messages[selected]) void fetchMessages(session.token, selected); }, [fetchMessages, messages, selected, session?.token]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [currentMessages.at(-1)?.id, currentMessages.at(-1)?.clientTempId, selected]);

  async function sendMessage() {
    const text = draft.trim(); if (!text || !session || !selectedChat || !user || sendingMessageRef.current) return;
    sendingMessageRef.current = true;
    setDraft("");
    setEmojiOpen(false);
    const optimistic: Message = { chatId: selected, senderId: user.id, recipientId: selectedChat.recipientId || user.id, content: text, type: "TEXT", status: "SENT", sentAt: new Date().toISOString(), clientTempId: crypto.randomUUID() };
    setMessages((all) => ({ ...all, [selected]: [...(all[selected] || []), optimistic] }));
    try { const saved = await api.send(session.token, optimistic); setMessages((all) => ({ ...all, [selected]: upsertMessage((all[selected] || []).filter((message) => message.clientTempId !== optimistic.clientTempId), saved) })); }
    catch (cause) { setDraft(text); setError(cause instanceof Error ? cause.message : "Could not send your message."); }
    finally { sendingMessageRef.current = false; }
  }

  async function uploadFile(file?: File) {
    if (!file || !session || !selectedChat || !user) return;
    try { const message = await api.upload(session.token, { chatId: selected, senderId: user.id, recipientId: selectedChat.recipientId || user.id, file }); setMessages((all) => ({ ...all, [selected]: [...(all[selected] || []), message] })); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Upload failed."); }
  }

  async function toggleVoiceNote() {
    const currentRecorder = mediaRef.current;
    if (recordingRef.current) {
      if (currentRecorder?.state === "recording") currentRecorder.stop();
      recordingRef.current = false; setRecording(false); return;
    }
    if (startingRecordingRef.current || voiceUploadRef.current) return;
    if (!session || !selectedChat || !user) return;
    startingRecordingRef.current = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const supportedTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
      const mimeType = supportedTypes.find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks: Blob[] = [];
      const startedAt = Date.now();
      mediaRef.current = recorder;
      startingRecordingRef.current = false;
      recordingRef.current = true;
      recorder.ondataavailable = (event) => { if (event.data.size > 0) chunks.push(event.data); };
      recorder.onstop = async () => {
        if (mediaRef.current === recorder) mediaRef.current = null;
        recordingRef.current = false;
        setRecording(false);
        stream.getTracks().forEach((track) => track.stop());
        const contentType = recorder.mimeType || chunks.find((chunk) => chunk.type)?.type || "audio/webm";
        const blob = new Blob(chunks, { type: contentType });
        if (!blob.size) { setError("No audio was captured. Check your microphone and try again."); return; }
        const extension = contentType.includes("mp4") ? "m4a" : contentType.includes("ogg") ? "ogg" : "webm";
        const voiceFile = new globalThis.File([blob], `voice-${Date.now()}.${extension}`, { type: contentType });
        const durationSeconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
        voiceUploadRef.current = true;
        try {
          const message = await api.voice(session.token, { chatId: selected, senderId: user.id, recipientId: selectedChat.recipientId || user.id, file: voiceFile, durationSeconds });
          setMessages((all) => ({ ...all, [selected]: upsertMessage(all[selected] || [], message) }));
        } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not send your voice note."); }
        finally { voiceUploadRef.current = false; }
      };
      recorder.onerror = () => { stream.getTracks().forEach((track) => track.stop()); recordingRef.current = false; startingRecordingRef.current = false; setRecording(false); setError("The microphone recording stopped unexpectedly. Please try again."); };
      recorder.start(250);
      setRecordStarted(startedAt); setRecordTick(0); setRecording(true);
    } catch { startingRecordingRef.current = false; setRecording(false); setError("Allow microphone access to record a voice note."); }
  }

  async function submitContact(event: React.FormEvent) {
    event.preventDefault(); if (!session) return;
    try { const person = await api.addContact(session.token, { contactName, contactEmail }); setContacts((all) => [person, ...all]); setDialog(null); setContactEmail(""); setContactName(""); setArea("contacts"); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not add contact."); }
  }
  async function startChat(person: Contact) {
    if (!session || !person.matchedUserId) { setDialog("contact"); return; }
    try { const chat = await api.privateChat(session.token, person.matchedUserId); setChats((all) => all.some((item) => item.chatId === chat.chatId) ? all : [chat, ...all]); setSelected(chat.chatId); setArea("messages"); setMobileChat(true); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not open this conversation."); }
  }
  async function makeGroup(event: React.FormEvent) {
    event.preventDefault(); if (!session) return;
    try { const chat = await api.createGroup(session.token, { name: groupName, memberIds: selectedMembers }); setChats((all) => [chat, ...all]); setSelected(chat.chatId); setArea("messages"); setDialog(null); setGroupName(""); setSelectedMembers([]); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create group."); }
  }
  async function doCall(type: "AUDIO" | "VIDEO") {
    if (!session || !selectedChat?.recipientId) { setCallNotice("Calls are available in direct conversations."); return; }
    try { const call = await api.initiateCall(session.token, { receiverId: selectedChat.recipientId, type, chatId: selected }); setCallHistory((history) => [call, ...history.filter((entry) => entry.callId !== call.callId)]); setActiveCall(call); setCallNotice("Calling your person…"); await setupCallPeer(call, true); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not start the call."); }
  }
  async function openCallConversation(call: Call) {
    if (!session || !user) return;
    const personId = call.callerId === user.id ? call.receiverId : call.callerId;
    const existing = chats.find((chat) => chat.chatId === call.chatId) || chats.find((chat) => chat.type === "PRIVATE" && chat.recipientId === personId);
    try {
      const chat = existing || await api.privateChat(session.token, personId);
      setChats((all) => all.some((item) => item.chatId === chat.chatId) ? all : [chat, ...all]);
      setSelected(chat.chatId); setArea("messages"); setMobileChat(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not open this conversation."); }
  }
  async function answerIncomingCall() {
    if (!activeCall || !session) return;
    try { const call = await api.answerCall(session.token, activeCall.callId); setActiveCall(call); setCallNotice("Connecting you both…"); await setupCallPeer(call, false); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not answer the call."); }
  }
  async function declineIncomingCall() {
    if (activeCall && session) await api.rejectCall(session.token, activeCall.callId).catch(() => undefined);
    setActiveCall(null); setCallNotice("");
  }
  async function searchPeople(value: string) {
    setQuery(value);
    if (area !== "contacts" || !session || value.trim().length < 2) { setSearchResults([]); setSearchOpen(false); return; }
    try { const result = await api.searchContacts(session.token, value); setSearchResults(result); setSearchOpen(true); } catch { setSearchOpen(false); }
  }
  async function askAssistant(event: React.FormEvent) {
    event.preventDefault(); if (!session || !aiQuestion.trim()) return;
    try { const result = await api.ask(session.token, aiQuestion); setAiAnswer(result.answer || "I couldn't find an answer just yet."); }
    catch (cause) { setAiAnswer(cause instanceof Error ? cause.message : "Assistant is unavailable right now."); }
  }
  async function polishDraft() {
    if (!session || !draft.trim()) return;
    try { const result = await api.enhance(session.token, draft); setDraft(result.enhancedText || draft); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not polish that message."); }
  }
  async function syncContacts() {
    if (!session) return; setSyncingContacts(true);
    try { await api.syncContacts(session.token); setContacts(await api.contacts(session.token)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not sync your contacts."); }
    finally { setSyncingContacts(false); }
  }
  function logout() { localStorage.removeItem("chatzy.session"); window.location.replace("/login"); }
  function toggleTheme() { const next = theme === "light" ? "dark" : "light"; setTheme(next); document.documentElement.dataset.theme = next; localStorage.setItem("chatzy.theme", next); }
  async function toggleReaction(message: Message, emoji: string) {
    if (!session || !message.id) { setReactions((all) => ({ ...all, [message.clientTempId || "local"]: [...(all[message.clientTempId || "local"] || []), emoji] })); return; }
    try { await api.addReaction(session.token, message.id, emoji); setReactions((all) => ({ ...all, [message.id!]: [...(all[message.id!] || []), emoji] })); } catch {}
  }

  if (!session) return <main className="loading-screen"><span className="logo-orbit">c</span><span>Finding your people…</span></main>;

  return <main className="app-shell">
    <aside className="nav-rail">
      <button className="brand-symbol rail-brand" aria-label="Chatzy"><MessageCircle size={19} fill="currentColor" /></button>
      <div className="rail-nav">
        <NavButton active={area === "messages"} label="Messages" onClick={() => { setArea("messages"); setMobileChat(false); }}><MessageCircle size={19} /></NavButton>
        <NavButton active={area === "contacts"} label="People" onClick={() => setArea("contacts")}><Users size={19} /></NavButton>
        <NavButton active={area === "groups"} label="Groups" onClick={() => setArea("groups")}><Heart size={19} /></NavButton>
        <NavButton active={area === "calls"} label="Calls" onClick={() => setArea("calls")}><Phone size={19} /></NavButton>
        <NavButton active={area === "assistant"} label="Little helper" onClick={() => setArea("assistant")}><Sparkles size={19} /></NavButton>
        <NavButton active={area === "profile"} label="Your profile" onClick={() => setArea("profile")}><Settings2 size={19} /></NavButton>
      </div>
      <div className="rail-bottom"><NavButton label={`Switch to ${theme === "light" ? "dark" : "light"} mode`} onClick={toggleTheme}>{theme === "light" ? <Moon size={18} /> : <Sun size={18} />}</NavButton><button className="rail-user" onClick={logout} title="Sign out"><Avatar name={user?.name || "You"} /></button></div>
    </aside>

    <aside className={`inbox ${mobileChat ? "inbox-hidden-mobile" : ""}`}>
      <header className="inbox-top"><div><div className="wordmark"><span className="mini-logo"><MessageCircle size={13} fill="currentColor" /></span>chatzy<span className="brand-dot">.</span></div><h1>{areaTitle(area)}</h1><p>{areaSubtitle(area)}</p></div><button className="icon-button new-action" aria-label="New chat" onClick={() => area === "groups" ? setDialog("group") : setDialog("contact")}><Plus size={18} /></button></header>
      <label className="search-input"><Search size={16} /><input value={query} onChange={(event) => void searchPeople(event.target.value)} placeholder={area === "contacts" ? "Find someone new" : "Search your people"} /><kbd>⌘ K</kbd></label>
      {area === "messages" && <div className="filter-tabs"><button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>All chats</button><button className={filter === "unread" ? "active" : ""} onClick={() => setFilter("unread")}>Unread</button><button className={filter === "groups" ? "active" : ""} onClick={() => setFilter("groups")}>Groups</button></div>}
      {area === "messages" && <div className="sidebar-section-label"><span>YOUR CONVERSATIONS</span><button onClick={() => setDialog("contact")} aria-label="Start a conversation"><Plus size={15} /></button></div>}
      <div className="sidebar-list">
        {area === "messages" && (loading ? <div className="skeleton-list"><i /><i /><i /></div> : visibleChats.map((chat) => {
          const person = contacts.find((item) => item.matchedUserId === chat.recipientId);
          const title = chat.type === "GROUP" ? chat.chatName || "Group conversation" : person?.matchedUserDisplayName || chat.recipientName || "Chat";
          const last = messages[chat.chatId]?.at(-1);
          return <button key={chat.chatId} className={`chat-row ${selected === chat.chatId ? "selected" : ""}`} onClick={() => { setSelected(chat.chatId); setMobileChat(true); }}><Avatar name={title} image={chat.type === "GROUP" ? chat.avatarUrl : chat.recipientAvatar} online={Boolean(person?.contactEmail && onlineEmails.includes(person.contactEmail))} /><span className="chat-row-copy"><span className="chat-row-heading"><b>{title}</b><time>{last?.sentAt ? shortTime(last.sentAt) : ""}</time></span><span className="chat-row-preview">{last?.content || "Say hi and make their day"}</span></span>{unread[chat.chatId] ? <span className="unread-count">{unread[chat.chatId]}</span> : null}</button>;
        }))}
        {area === "contacts" && <>{searchOpen && searchResults.length > 0 && <div className="sidebar-section-label"><span>DISCOVER PEOPLE</span></div>}{(searchOpen ? searchResults : contacts).map((person) => <button className="person-row" key={person.id} onClick={() => void startChat(person)}><Avatar name={person.matchedUserDisplayName || person.contactName || person.contactEmail || "Friend"} /><span><b>{person.matchedUserDisplayName || person.contactName || "New friend"}</b><small>{person.contactEmail || "In your circle"}</small></span><ArrowUpRight size={15} /></button>)}{!contacts.length && !searchOpen && <EmptyList title="Your circle starts here" detail="Add a friend by their email to start a conversation." action="Add someone" onClick={() => setDialog("contact")} />}</>}
        {area === "groups" && chats.filter((chat) => chat.type === "GROUP").map((chat) => <button key={chat.chatId} className="person-row" onClick={() => { setSelected(chat.chatId); setArea("messages"); setMobileChat(true); }}><Avatar name={chat.chatName || "Group"} /><span><b>{chat.chatName || "Your group"}</b><small>Group conversation</small></span><ArrowUpRight size={15} /></button>)}
        {area === "calls" && <>{callHistory.length ? <><div className="sidebar-section-label"><span>RECENT CALLS</span></div>{callHistory.map((call) => {
          const personId = call.callerId === user?.id ? call.receiverId : call.callerId;
          const person = contacts.find((contact) => contact.matchedUserId === personId);
          const chat = chats.find((item) => item.chatId === call.chatId);
          const name = person?.matchedUserDisplayName || chat?.recipientName || "Chatzy person";
          const outgoing = call.callerId === user?.id;
          const missed = ["REJECTED", "FAILED"].includes(call.status);
          return <button key={call.callId} className="call-history-row" onClick={() => void openCallConversation(call)}><Avatar name={name} online={Boolean(person?.contactEmail && onlineEmails.includes(person.contactEmail))} /><span className="call-history-copy"><b>{name}</b><small className={missed ? "call-missed" : ""}>{outgoing ? <PhoneOutgoing size={12} /> : <PhoneIncoming size={12} />}{missed ? call.status === "REJECTED" && !outgoing ? "Declined" : "Missed" : outgoing ? "Outgoing" : "Incoming"} · {call.type === "VIDEO" ? "Video" : "Voice"}</small></span><time>{call.endedAt || call.startedAt ? shortTime(call.endedAt || call.startedAt!) : "Recent"}</time></button>;
        })}</> : <div className="sidebar-note"><span className="note-icon"><Phone size={18} /></span><b>No calls yet</b><p>Your call history will show up here. Start a call from someone’s chat.</p></div>}</>}
        {(area === "assistant" || area === "profile") && <div className="sidebar-note"><span className="note-icon lilac"><Sparkles size={18} /></span><b>{area === "profile" ? "Make yourself at home" : "A little help, anytime"}</b><p>{area === "profile" ? "A little more you, in all the right places." : "Ask about your docs or make a draft sound more like you."}</p></div>}
      </div>
      <footer className="sidebar-footer"><span className={`connection-dot ${connected ? "online" : ""}`} />{connected ? "All caught up" : "Connecting to your circle"}<button onClick={toggleTheme} aria-label="Change appearance">{theme === "light" ? <Moon size={15} /> : <Sun size={15} />}</button><button onClick={logout} aria-label="Sign out"><LogOut size={15} /></button></footer>
    </aside>

    <section className={`main-panel ${mobileChat ? "mobile-active" : ""}`}>
      {area === "messages" && <>
        <header className="conversation-header"><button className="mobile-back icon-button" aria-label="Back to chats" onClick={() => setMobileChat(false)}><ArrowLeft size={18} /></button><button className="conversation-person" onClick={() => setInfoOpen(!infoOpen)}><Avatar name={activeName} image={selectedChat?.avatarUrl} /><span><b>{activeName}</b><small>{selectedChat?.type === "GROUP" ? "A group full of good people" : "A little hello goes a long way"}</small></span><ChevronDown size={15} /></button><div className="header-actions"><button className="icon-button" aria-label="Search messages" onClick={() => setSearchOpen(true)}><Search size={18} /></button><button className="icon-button" aria-label="Voice call" onClick={() => void doCall("AUDIO")}><Phone size={18} /></button><button className="icon-button" aria-label="Video call" onClick={() => void doCall("VIDEO")}><Video size={18} /></button><button className={`icon-button ${infoOpen ? "selected-icon" : ""}`} aria-label="Conversation details" onClick={() => setInfoOpen(!infoOpen)}><Info size={18} /></button><button className="icon-button" aria-label="More options" onClick={() => selectedChat && currentMessages.at(-1)?.id && session && void api.pin(session.token, selected, currentMessages.at(-1)!.id!).then(() => setError("Pinned message saved")).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Could not pin that message."))}><MoreHorizontal size={18} /></button></div></header>
        {searchOpen && <MessageSearch token={session.token} chatId={selected} onClose={() => setSearchOpen(false)} />}
        {selectedChat?.pinnedMessageId && <div className="pin-banner"><Pin size={15} /><span><b>A little something to remember</b><small>There’s a pinned message in this chat</small></span></div>}
        <div className="message-area" ref={scrollRef}>
          {selectedChat ? currentMessages.length ? <div className="message-stack">{olderByChat[selected]?.more && <button className="load-older" disabled={olderByChat[selected]?.busy} onClick={() => void loadOlderMessages()}>{olderByChat[selected]?.busy ? "Finding earlier moments…" : "Load earlier messages"}</button>}<div className="date-divider"><span>THE GOOD STUFF</span></div>{currentMessages.map((message, index) => <MessageBubble key={message.id || message.clientTempId || index} message={message} own={message.senderId === user?.id} onReact={(emoji) => void toggleReaction(message, emoji)} reactions={reactions[message.id || message.clientTempId || ""] || []} />)}{typing && <div className="typing"><i /><i /><i /><span>Someone is finding the words…</span></div>}</div> : <div className="welcome-chat"><div className="welcome-sticker"><span>✳</span><i>☺</i></div><span className="eyebrow">A FRESH LITTLE START</span><h2>Say something lovely.</h2><p>Every great conversation starts somewhere. Make this one count.</p><div className="starter-chips"><button onClick={() => setDraft("Hey! How have you been? ✨")}>“How have you been?”</button><button onClick={() => setDraft("Sending a little hello 💛")}>“Just saying hi”</button></div></div> : <WelcomeCard title="A lovely conversation is waiting." detail="Pick a conversation from the left, or start a fresh one with someone you like." />}
        </div>
        {selectedChat && <div className="composer-wrap">{emojiOpen && <div className="emoji-picker" role="dialog" aria-label="Choose an emoji"><div className="emoji-picker-heading"><b>Choose an emoji</b><button type="button" onClick={() => setEmojiOpen(false)} aria-label="Close emoji picker"><X size={15} /></button></div><div className="emoji-categories">{Object.keys(emojiCatalog).map((category) => <button type="button" key={category} className={emojiCategory === category ? "active" : ""} onClick={() => setEmojiCategory(category)}>{category}</button>)}</div><div className="emoji-grid">{emojiCatalog[emojiCategory].map((emoji, index) => <button type="button" key={`${emoji}-${index}`} aria-label={`Insert ${emoji}`} onClick={() => setDraft((value) => `${value}${value && !value.endsWith(" ") ? " " : ""}${emoji}`)}>{emoji}</button>)}</div></div>}<div className={`composer ${recording ? "recording" : ""}`}><button className="composer-icon" aria-label="Attach file" onClick={() => fileRef.current?.click()}><Paperclip size={18} /></button><input ref={fileRef} type="file" hidden onChange={(event) => { void uploadFile(event.target.files?.[0]); event.currentTarget.value = ""; }} /><textarea value={draft} rows={1} onChange={(event) => { setDraft(event.target.value); const client = clientRef.current; if (client?.connected && selected) client.publish({ destination: "/app/typing", body: JSON.stringify({ chatId: selected, isTyping: Boolean(event.target.value.trim()) }) }); }} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} placeholder={recording ? `Recording voice note · ${recordTick}s` : "Write something good…"} /><button type="button" className={`composer-icon emoji-button ${emojiOpen ? "selected-icon" : ""}`} aria-label="Open emoji picker" aria-expanded={emojiOpen} onClick={() => setEmojiOpen((open) => !open)}><Smile size={18} /></button>{draft.trim() && <button className="composer-icon polish-action" aria-label="Polish message with AI" title="Polish this message" onClick={() => void polishDraft()}><Sparkles size={16} /></button>}{draft.trim() ? <button className="send-button" aria-label="Send message" onClick={() => void sendMessage()}><Send size={17} /></button> : <button className={`composer-icon mic-action ${recording ? "record-active" : ""}`} aria-label={recording ? "Stop recording" : "Record voice note"} onClick={() => void toggleVoiceNote()}><Mic size={17} /></button>}</div><div className="composer-caption"><span><Sparkles size={12} /> Be kind. Be you.</span><span>{recording ? "Tap the microphone to finish your voice note" : "↵ to send · shift + ↵ for a new line"}</span></div></div>}
      </>}
        {area === "contacts" && <UtilityPanel kicker="YOUR PEOPLE" title="The best things are shared." detail="Keep your favorite people close. Search by name or email, then say hello." icon={<Users size={21} />} action="Add a person" onAction={() => setDialog("contact")}><button className="sync-contacts" onClick={() => void syncContacts()}><Users size={14} />{syncingContacts ? "Finding your Google contacts…" : "Sync Google contacts"}</button><div className="contact-cards">{contacts.map((person) => <button className="contact-card" key={person.id} onClick={() => void startChat(person)}><Avatar name={person.matchedUserDisplayName || person.contactName || "Friend"} online={Boolean(person.contactEmail && onlineEmails.includes(person.contactEmail))} /><span><b>{person.matchedUserDisplayName || person.contactName || "Friend"}</b><small>{person.contactEmail || person.contactPhone || "Someone in your circle"}</small></span><MessageCircle size={17} /></button>)}</div></UtilityPanel>}
      {area === "groups" && <UtilityPanel kicker="BETTER TOGETHER" title="Your people, all in one place." detail="Make a little room for your favorite group chats." icon={<Heart size={21} />} action="Create a group" onAction={() => setDialog("group")}><div className="group-splash"><div className="bubble-face face-a">J</div><div className="bubble-face face-b">A</div><div className="bubble-face face-c">M</div><div className="group-splash-center"><Users size={28} /></div><span className="group-spark">✦</span></div></UtilityPanel>}
      {area === "calls" && <UtilityPanel kicker="YOUR CALL HISTORY" title="Every little catch-up, in one place." detail="Your recent voice and video calls live in the list on the left. Choose someone there to open your conversation." icon={<Phone size={21} />} action="Go to messages" onAction={() => { setArea("messages"); setMobileChat(false); }}><div className="call-feature"><span className="call-feature-icon"><Video size={24} /></span><div><b>Call from their chat</b><small>Open a conversation and use the phone or video button whenever you’re ready to talk.</small></div><span className="call-wave">〰</span></div></UtilityPanel>}
        {area === "assistant" && <section className="assistant-page"><div className="assistant-top"><span className="assistant-symbol"><Sparkles size={21} /></span><span className="eyebrow">YOUR POCKET-SIZED SIDEKICK</span><h2>A little help, when you need it.</h2><p>Ask something about your shared docs, or let me help find the right words.</p></div><form className="assistant-form" onSubmit={(event) => void askAssistant(event)}><textarea value={aiQuestion} onChange={(event) => setAiQuestion(event.target.value)} placeholder="Ask me anything about your docs…" /><button className="button button-primary"><Sparkles size={15} /> Ask Chatzy</button></form>{aiAnswer && <div className="assistant-answer"><span className="eyebrow">HERE’S WHAT I FOUND</span><p>{aiAnswer}</p></div>}</section>}
      {area === "profile" && <ProfileCard user={user} token={session.token} onUser={setUser} onLogout={logout} />}
    </section>

    {infoOpen && selectedChat && <aside className="details-panel"><div className="details-heading"><b>A little about this chat</b><button className="icon-button" onClick={() => setInfoOpen(false)}><X size={17} /></button></div><div className="details-person"><Avatar name={activeName} image={selectedChat.avatarUrl} /><h3>{activeName}</h3><p>{selectedChat.type === "GROUP" ? "Your people, all together." : "A person worth keeping close."}</p></div><div className="detail-section"><span>THE GOOD STUFF</span><button><Image size={16} /> Shared photos <small>Coming together</small></button><button><FileIcon size={16} /> Links & files <small>Just a little later</small></button></div><div className="details-footer"><button onClick={() => selectedChat && currentMessages.at(-1)?.id && session && void api.pin(session.token, selected, currentMessages.at(-1)!.id!)}><Pin size={15} /> Pin latest message</button></div></aside>}

    {dialog && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialog(null); }}><form className="modal-card" onSubmit={dialog === "contact" ? submitContact : makeGroup}><button type="button" className="modal-close" onClick={() => setDialog(null)} aria-label="Close"><X size={18} /></button><span className="modal-glyph">{dialog === "contact" ? <UserPlus size={21} /> : <Users size={21} />}</span><span className="eyebrow">{dialog === "contact" ? "MAKE A NEW CONNECTION" : "BRING YOUR PEOPLE TOGETHER"}</span><h2>{dialog === "contact" ? "Add someone lovely." : "Start your little group."}</h2><p>{dialog === "contact" ? "Find a friend with the email they use on Chatzy." : "Give your group a name and invite a few good people."}</p>{dialog === "contact" ? <><label className="field"><span>Their name</span><input className="plain-input" value={contactName} onChange={(event) => setContactName(event.target.value)} placeholder="A name to remember" /></label><label className="field"><span>Email address</span><input className="plain-input" type="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} placeholder="friend@example.com" required /></label></> : <><label className="field"><span>Group name</span><input className="plain-input" value={groupName} onChange={(event) => setGroupName(event.target.value)} placeholder="The Sunday people" required /></label><div className="modal-member-list">{contacts.filter((contact) => contact.matchedUserId).map((contact) => <label key={contact.id}><input type="checkbox" checked={selectedMembers.includes(contact.matchedUserId!)} onChange={(event) => setSelectedMembers((all) => event.target.checked ? [...all, contact.matchedUserId!] : all.filter((id) => id !== contact.matchedUserId))} />{contact.matchedUserDisplayName || contact.contactName}</label>)}</div></>}<button className="button button-primary modal-submit">{dialog === "contact" ? "Add to my circle" : "Create group"}<ArrowUpRight size={16} /></button></form></div>}
    {error && <div className="toast-error" role="alert"><span>{error}</span><button onClick={() => setError("")} aria-label="Dismiss"><X size={15} /></button></div>}
    {activeCall && <div className="call-overlay"><section className={`call-card ${activeCall.type === "VIDEO" ? "call-video" : ""}`}><header><span className="wordmark"><span className="mini-logo"><MessageCircle size={12} fill="currentColor" /></span>chatzy</span><span className="call-status"><i />{activeCall.status === "CONNECTED" ? "CONNECTED" : activeCall.receiverId === user?.id ? "INCOMING CALL" : "CALLING"}</span><button className="icon-button" onClick={() => void finishCall()} aria-label="Close call"><X size={17} /></button></header><div className="call-stage"><video ref={remoteVideoRef} autoPlay playsInline className={activeCall.type === "AUDIO" ? "audio-hidden" : ""} /><div className="call-stage-person"><Avatar name={activeName} /><b>{activeName}</b><small>{callNotice || (activeCall.status === "CONNECTED" ? "You’re together now" : "Waiting for your person…")}</small></div>{activeCall.type === "VIDEO" && localStream && <div className="local-preview"><video ref={localVideoRef} autoPlay muted playsInline /></div>}</div><footer>{activeCall.receiverId === user?.id && activeCall.status === "RINGING" ? <><button className="call-control decline" onClick={() => void declineIncomingCall()}><Phone size={17} /><small>Decline</small></button><button className="call-control accept" onClick={() => void answerIncomingCall()}><Phone size={17} /><small>Answer</small></button></> : <><button className={`call-control ${!micOn ? "disabled" : ""}`} onClick={() => { const next = !micOn; setMicOn(next); localStream?.getAudioTracks().forEach((track) => { track.enabled = next; }); }}><Mic size={17} /><small>{micOn ? "Mute" : "Unmute"}</small></button>{activeCall.type === "VIDEO" && <button className={`call-control ${!cameraOn ? "disabled" : ""}`} onClick={() => { const next = !cameraOn; setCameraOn(next); localStream?.getVideoTracks().forEach((track) => { track.enabled = next; }); }}><Video size={17} /><small>Camera</small></button>}<button className="call-control decline" onClick={() => void finishCall()}><Phone size={17} /><small>End call</small></button></>}</footer></section></div>}
  </main>;
}

function areaTitle(area: Area) { return ({ messages: "Messages", contacts: "People", groups: "Your groups", calls: "Calls", assistant: "Little helper", profile: "Your profile" })[area]; }
function areaSubtitle(area: Area) { return ({ messages: "A little closer, every day.", contacts: "Keep your people close.", groups: "Good people, all together.", calls: "Make it a moment.", assistant: "Here for the little things.", profile: "Make yourself at home." })[area]; }
function upsertMessage(messages: Message[], incoming: Message) {
  const index = messages.findIndex((message) => Boolean(incoming.id && message.id === incoming.id) || Boolean(incoming.clientTempId && message.clientTempId === incoming.clientTempId));
  if (index < 0) return [...messages, incoming];
  const next = [...messages]; next[index] = { ...next[index], ...incoming };
  return next.filter((message, row) => row === index || !(incoming.id && message.id === incoming.id) && !(incoming.clientTempId && message.clientTempId === incoming.clientTempId));
}
function shortTime(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date); }
function Avatar({ name, image, online = false }: { name: string; image?: string; online?: boolean }) { const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(); return <span className="avatar"><span className={`avatar-art color-${Math.abs(name.length * 13) % 5}`}>{image ? <img src={image} alt="" /> : initials || "C"}</span>{online && <i className="presence-indicator" />}</span>; }
function NavButton({ active, label, onClick, children }: { active?: boolean; label: string; onClick: () => void; children: React.ReactNode }) { return <button className={`nav-button ${active ? "active" : ""}`} aria-label={label} title={label} onClick={onClick}>{children}</button>; }
function EmptyList({ title, detail, action, onClick }: { title: string; detail: string; action: string; onClick: () => void }) { return <div className="empty-list"><span className="empty-bubble"><MessageCircle size={19} /></span><b>{title}</b><p>{detail}</p><button onClick={onClick}>{action}</button></div>; }
function WelcomeCard({ title, detail }: { title: string; detail: string }) { return <div className="welcome-chat"><div className="welcome-sticker"><span>✳</span><i>☺</i></div><span className="eyebrow">MAKE YOURSELF AT HOME</span><h2>{title}</h2><p>{detail}</p><div className="welcome-caption"><Sparkles size={14} /> Made for the little moments</div></div>; }
function UtilityPanel({ kicker, title, detail, icon, action, onAction, children }: { kicker: string; title: string; detail: string; icon: React.ReactNode; action: string; onAction: () => void; children: React.ReactNode }) { return <section className="utility-page"><div className="utility-hero"><span className="utility-icon">{icon}</span><span className="eyebrow">{kicker}</span><h2>{title}</h2><p>{detail}</p><button className="button button-primary" onClick={onAction}>{action}<ArrowUpRight size={16} /></button></div>{children}</section>; }
function MessageBubble({ message, own, onReact, reactions }: { message: Message; own: boolean; onReact: (emoji: string) => void; reactions: string[] }) {
  const imageUrl = message.mediaUrl || message.attachmentUrl;
  const mime = message.mediaMimeType || "";
  return <article className={`message-row ${own ? "own" : ""}`}><div className="message-avatar">{!own && <Avatar name="Friend" />}</div><div className="message-main"><div className="message-bubble">{imageUrl && mime.startsWith("image/") && <a className="message-media" href={imageUrl} target="_blank" rel="noreferrer"><img src={imageUrl} alt="Shared image" /></a>}{imageUrl && mime.startsWith("video/") && <video className="message-video" controls src={imageUrl} />}{imageUrl && mime.startsWith("audio/") && <audio controls src={imageUrl} />}{message.isDeleted ? <p className="deleted-copy">This message was removed.</p> : message.content && <p>{message.content}</p>}{imageUrl && !mime.startsWith("image/") && !mime.startsWith("video/") && !mime.startsWith("audio/") && <a className="file-preview" href={imageUrl} target="_blank" rel="noreferrer"><FileIcon size={17} />Shared file <ArrowUpRight size={13} /></a>}<footer><time>{message.sentAt ? shortTime(message.sentAt) : "now"}</time>{own && (message.status === "READ" ? <CheckCheck size={13} className="read-check" /> : <Check size={13} />)}</footer></div>{reactions.length > 0 && <div className="reaction-chips">{reactions.map((reaction, index) => <span key={`${reaction}-${index}`}>{reaction}</span>)}</div>}<div className="reaction-tray">{emojiSet.slice(0, 4).map((emoji) => <button key={emoji} aria-label={`React ${emoji}`} onClick={() => onReact(emoji)}>{emoji}</button>)}</div></div></article>;
}
function ProfileCard({ user, token, onUser, onLogout }: { user: User | null; token: string; onUser: (user: User) => void; onLogout: () => void }) {
  const input = useRef<HTMLInputElement>(null); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState("");
  async function upload(event: React.ChangeEvent<HTMLInputElement>) { const file = event.target.files?.[0]; if (!file || !user) return; setBusy(true); setNotice(""); try { const result = await api.avatar(token, user.id, file); onUser({ ...user, avatarUrl: result.avatarUrl }); setNotice("Your profile picture is all set."); } catch (cause) { setNotice(cause instanceof Error ? cause.message : "Could not update your picture."); } finally { setBusy(false); event.target.value = ""; } }
  return <section className="profile-page"><div className="profile-cover"><span className="profile-sun">✳</span><span className="profile-ring" /></div><div className="profile-summary"><Avatar name={user?.name || "You"} image={user?.avatarUrl} /><span className="eyebrow">A LITTLE MORE YOU</span><h2>{user?.name || "Your profile"}</h2><p>{user?.email}</p>{user?.phone && <small>{user.phone}</small>}</div><div className="profile-actions"><div><b>Your Chatzy account</b><small>These details make it easier for your people to find you.</small></div><button className="button button-primary" onClick={() => input.current?.click()}>{busy ? "Updating…" : "Change photo"}<ArrowUpRight size={15} /></button><input ref={input} type="file" accept="image/*" hidden onChange={(event) => void upload(event)} /></div>{notice && <p className="profile-notice">{notice}</p>}<button className="profile-logout" onClick={onLogout}><LogOut size={16} /> Sign out of Chatzy</button></section>;
}
function MessageSearch({ token, chatId, onClose }: { token: string; chatId: string; onClose: () => void }) { const [query, setQuery] = useState(""); const [results, setResults] = useState<Message[]>([]); async function search(event: React.FormEvent) { event.preventDefault(); try { const page = await api.searchMessages(token, chatId, query); setResults(page.content || []); } catch {} } return <div className="message-search"><form onSubmit={(event) => void search(event)}><Search size={15} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a little something…" /><button>Search</button></form><button className="icon-button" onClick={onClose}><X size={16} /></button>{results.length > 0 && <div className="search-result-list">{results.map((item) => <p key={item.id}>{item.content}</p>)}</div>}</div>; }
