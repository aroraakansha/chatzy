"use client";

import Link from "next/link";
import { ArrowLeft, CheckCheck, Camera, FileText, Image as ImageIcon, Mic, Paperclip, Phone, Search, SendHorizontal, SmilePlus, Trash2, Video, X } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import type { Conversation, Message, MessageDto } from "@/features/chat/types/chat.types";
import { Avatar } from "@/shared/ui/avatar";
import { cn } from "@/shared/lib/cn";
import { messageService } from "@/features/chat/services/message-service";
import { useAuthStore } from "@/features/auth/store/auth-store";

type Props = {
  conversation: Conversation;
  isMobileChatOpen: boolean;
  onBack: () => void;
  onSend: (conversation: Conversation, content: string, clientTempId: string) => void;
  onSendAttachment: (conversation: Conversation, file: File, content: string, clientTempId: string) => Promise<void>;
  onLoadOlderMessages: (conversation: Conversation) => void;
  hasOlderMessages: boolean;
  isLoadingOlderMessages: boolean;
  connectionError: string | null;
};
type PendingAttachment = { file: File; previewUrl?: string };

export function ActiveConversation({ conversation, isMobileChatOpen, onBack, onSend, onSendAttachment, onLoadOlderMessages, hasOlderMessages, isLoadingOlderMessages, connectionError }: Props) {
  const session = useAuthStore((state) => state.session);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<PendingAttachment | null>(null);
  const [showAttach, setShowAttach] = useState(false);
  const [showExpressions, setShowExpressions] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isSendingVoice, setIsSendingVoice] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MessageDto[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const deviceInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const gifInput = useRef<HTMLInputElement>(null);
  const cameraVideo = useRef<HTMLVideoElement>(null);
  const cameraStream = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const recorderStream = useRef<MediaStream | null>(null);
  const recorderChunks = useRef<Blob[]>([]);
  const recorderStartedAt = useRef(0);
  const recordingTimer = useRef<number | null>(null);
  const shouldSendRecording = useRef(true);
  const messageList = useRef<HTMLDivElement>(null);
  const initiallyOpenedChat = useRef<string | null>(null);

  useEffect(() => () => {
    cameraStream.current?.getTracks().forEach((track) => track.stop());
    recorderStream.current?.getTracks().forEach((track) => track.stop());
    if (recordingTimer.current !== null) window.clearInterval(recordingTimer.current);
    if (pending?.previewUrl) URL.revokeObjectURL(pending.previewUrl);
  }, [pending]);

  useEffect(() => {
    if (initiallyOpenedChat.current === conversation.id || conversation.messages.length === 0) return;

    const frame = window.requestAnimationFrame(() => {
      const container = messageList.current;
      if (container) container.scrollTop = container.scrollHeight;
      initiallyOpenedChat.current = conversation.id;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [conversation.id, conversation.messages.length]);

  function clearPending() {
    if (pending?.previewUrl) URL.revokeObjectURL(pending.previewUrl);
    setPending(null);
  }

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      setError("Choose a file smaller than 25 MB.");
      return;
    }
    clearPending();
    setPending({ file, previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined });
    setShowAttach(false);
    setError(null);
  }

  async function openCamera() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      cameraStream.current = stream;
      setShowAttach(false);
      setShowCamera(true);
      window.setTimeout(() => { if (cameraVideo.current) cameraVideo.current.srcObject = stream; });
    } catch {
      setError("Camera access was blocked. Allow camera permission in your browser, then try again.");
    }
  }

  function closeCamera() {
    cameraStream.current?.getTracks().forEach((track) => track.stop());
    cameraStream.current = null;
    if (cameraVideo.current) cameraVideo.current.srcObject = null;
    setShowCamera(false);
  }

  function capturePhoto() {
    const video = cameraVideo.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) { setError("Could not capture the photo. Please try again."); return; }
      const file = new File([blob], `chatzy-photo-${Date.now()}.jpg`, { type: "image/jpeg" });
      clearPending();
      setPending({ file, previewUrl: URL.createObjectURL(file) });
      closeCamera();
    }, "image/jpeg", 0.92);
  }

  function sendText() {
    const body = draft.trim();
    if (!body) return;
    try { onSend(conversation, body, crypto.randomUUID()); setDraft(""); setError(null); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to send message."); }
  }

  async function sendAttachment() {
    if (!pending || isUploading) return;
    setIsUploading(true); setError(null);
    try {
      await onSendAttachment(conversation, pending.file, draft.trim(), crypto.randomUUID());
      clearPending(); setDraft("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to upload this file.");
    } finally { setIsUploading(false); }
  }

  async function toggleVoice() {
    if (isRecording) { recorder.current?.stop(); return; }
    if (!session?.token || !conversation.chatId || !conversation.recipientId) { setError("Voice messages need an active conversation."); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recorderStream.current = stream;
      const activeRecorder = new MediaRecorder(stream);
      recorder.current = activeRecorder; recorderChunks.current = []; recorderStartedAt.current = Date.now();
      shouldSendRecording.current = true;
      setRecordingSeconds(0);
      if (recordingTimer.current !== null) window.clearInterval(recordingTimer.current);
      recordingTimer.current = window.setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
      activeRecorder.ondataavailable = (event) => { if (event.data.size) recorderChunks.current.push(event.data); };
      activeRecorder.onstop = () => {
        const audioFile = new Blob(recorderChunks.current, { type: activeRecorder.mimeType || "audio/webm" });
        const durationSeconds = Math.max(1, Math.round((Date.now() - recorderStartedAt.current) / 1000));
        recorderStream.current?.getTracks().forEach((track) => track.stop());
        if (recordingTimer.current !== null) { window.clearInterval(recordingTimer.current); recordingTimer.current = null; }
        setIsRecording(false);
        const send = shouldSendRecording.current;
        shouldSendRecording.current = true;
        setRecordingSeconds(0);
        recorderChunks.current = recorderChunks.current ?? [];
        if (!send) {
          recorderChunks.current = [];
          return;
        }
        setIsSendingVoice(true);
        void messageService.sendVoiceMessage(session.token!, { chatId: conversation.chatId!, senderId: session.user.id, recipientId: conversation.recipientId!, audioFile, durationSeconds })
          .catch(() => setError("Voice message upload failed. Please try again."))
          .finally(() => setIsSendingVoice(false));
      };
      activeRecorder.start(); setIsRecording(true);
    } catch { setError("Microphone access is required to record a voice message."); }
  }

  function discardRecording() {
    // Prevent sending when stopping recorder
    shouldSendRecording.current = false;
    try { recorder.current?.stop(); } catch (e) { /* ignore */ }
    recorderChunks.current = [];
    recorderStream.current?.getTracks().forEach((t) => t.stop());
    recorderStream.current = null;
    if (recordingTimer.current !== null) { window.clearInterval(recordingTimer.current); recordingTimer.current = null; }
    setIsRecording(false);
    setRecordingSeconds(0);
  }

  async function searchInConversation() {
    const query = searchQuery.trim();
    if (!query || !session?.token || !conversation.chatId) return;
    setIsSearching(true); setSearchError(null); setHasSearched(true);
    try {
      const result = await messageService.searchChatMessages(conversation.chatId, session.token, { query, size: 50 });
      setSearchResults(result.messages);
    } catch {
      setSearchError("Could not search messages. Please try again.");
    } finally { setIsSearching(false); }
  }

  const status = conversation.online ? "online" : conversation.lastSeen;
  const sendCurrent = () => { if (pending) void sendAttachment(); else if (draft.trim()) sendText(); else void toggleVoice(); };
  return <section className={cn(
    "min-w-0 flex-1 flex-col md:static md:z-auto md:flex",
    isMobileChatOpen ? "fixed inset-0 z-40 flex h-dvh w-full" : "hidden",
  )}>
    <header className="glass-surface flex h-[76px] shrink-0 items-center justify-between border-b border-slate-200/70 px-5 shadow-sm dark:border-white/[0.08]">
      <div className="flex min-w-0 items-center gap-2">
        <button type="button" onClick={onBack} className="icon-action md:hidden" aria-label="Back to chats" title="Back to chats"><ArrowLeft size={22} /></button>
        <Link href={conversation.recipientId ? `/profile/${conversation.recipientId}` : "/profile"} className="flex min-w-0 items-center gap-3"><Avatar name={conversation.name} tone={conversation.avatarTone} online={conversation.online} size="lg" /><div className="min-w-0"><h2 className="truncate text-base font-semibold text-slate-800 dark:text-white">{conversation.name}</h2><p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{status}</p></div></Link>
      </div>
      <div className="flex items-center gap-1"><IconButton label="Search messages" onClick={() => { setShowSearch((value) => !value); setSearchError(null); setHasSearched(false); }}><Search size={20} /></IconButton><Link href={`/calls/voice?peerId=${conversation.recipientId ?? ""}&chatId=${conversation.chatId ?? ""}&name=${encodeURIComponent(conversation.name)}&online=${conversation.online}`} className="icon-action" title="Voice call"><Phone size={20} /></Link><Link href={`/calls/video?peerId=${conversation.recipientId ?? ""}&chatId=${conversation.chatId ?? ""}&name=${encodeURIComponent(conversation.name)}&online=${conversation.online}`} className="icon-action" title="Video call"><Video size={20} /></Link></div>
    </header>
    {showSearch && <form onSubmit={(event) => { event.preventDefault(); void searchInConversation(); }} className="glass-surface relative z-20 border-b border-slate-200/70 px-5 py-3 dark:border-white/[0.08]"><div className="mx-auto flex max-w-4xl gap-2"><input autoFocus value={searchQuery} onChange={(event) => { setSearchQuery(event.target.value); setHasSearched(false); }} placeholder="Search messages in this chat" className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-violet-400 dark:border-white/10 dark:bg-black/20 dark:text-white" /><button type="submit" disabled={isSearching || !searchQuery.trim()} className="rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white disabled:opacity-60">{isSearching ? "Searching…" : "Search"}</button><button type="button" onClick={() => setShowSearch(false)} className="rounded-xl px-3 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10">Close</button></div>{searchError ? <p className="mx-auto mt-2 max-w-4xl text-xs text-rose-400">{searchError}</p> : null}{searchResults.length ? <div className="mx-auto mt-3 max-h-44 max-w-4xl space-y-2 overflow-y-auto"><p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{searchResults.length} result{searchResults.length === 1 ? "" : "s"}</p>{searchResults.map((message) => <p key={message.id ?? message.clientTempId ?? `${message.senderId}-${message.sentAt}`} className="rounded-xl bg-slate-100/80 px-3 py-2 text-sm text-slate-700 dark:bg-white/[0.06] dark:text-slate-200"><span className="font-medium">{message.content || "Attachment"}</span>{message.sentAt ? <span className="ml-2 text-xs text-slate-500">{new Date(message.sentAt).toLocaleString()}</span> : null}</p>)}</div> : hasSearched && !isSearching && !searchError ? <p className="mx-auto mt-2 max-w-4xl text-xs text-slate-500">No matching messages found.</p> : null}</form>}
    <div ref={messageList} className="chatzy-wallpaper min-h-0 flex-1 overflow-y-auto px-5 py-6"><div className="mx-auto flex max-w-4xl flex-col gap-2">{connectionError || error ? <p className="mx-auto rounded-xl bg-rose-500/15 px-3 py-2 text-xs font-medium text-rose-300">{error ?? connectionError}</p> : null}{hasOlderMessages && <button type="button" onClick={() => onLoadOlderMessages(conversation)} disabled={isLoadingOlderMessages} className="mx-auto rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-white/10 disabled:opacity-60">{isLoadingOlderMessages ? "Loading messages…" : "Load older messages"}</button>}{conversation.messages.map((message, index) => <div key={message.id}>{isNewDay(message, conversation.messages[index - 1]) && <MessageDateDivider message={message} />}<MessageBubble message={message} /></div>)}</div></div>
    <footer className="glass-surface relative shrink-0 border-t border-slate-200/70 px-4 py-3 dark:border-white/[0.08]">
      {pending && <AttachmentPreview attachment={pending} onRemove={clearPending} />}
      <div className="flex items-end gap-2"><IconButton label="Emoji and GIF" onClick={() => setShowExpressions((value) => !value)}><SmilePlus size={22} /></IconButton><IconButton label="Attach photo or document" onClick={() => setShowAttach((value) => !value)}><Paperclip size={22} /></IconButton>
        <input ref={galleryInput} className="hidden" type="file" accept="image/*,video/*" onChange={chooseFile} />
        <input ref={gifInput} className="hidden" type="file" accept="image/gif" onChange={chooseFile} />
        <input ref={deviceInput} className="hidden" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.csv,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={chooseFile} />
        {showAttach && <div className="absolute bottom-20 left-16 z-30 grid w-60 gap-2 rounded-2xl border border-white/10 bg-[#151a29] p-3 text-sm font-semibold text-slate-100 shadow-2xl"><AttachmentAction icon={<Camera size={18} />} label="Camera — take a photo" onClick={() => void openCamera()} /><AttachmentAction icon={<ImageIcon size={18} />} label="Photos & videos from device" onClick={() => galleryInput.current?.click()} /><AttachmentAction icon={<FileText size={18} />} label="Document from device" onClick={() => deviceInput.current?.click()} /></div>}
        {showExpressions && <ExpressionPicker onEmoji={(emoji) => { setDraft((value) => `${value}${emoji}`); setShowExpressions(false); }} onGif={() => { setShowExpressions(false); gifInput.current?.click(); }} />}
        <textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendCurrent(); } }} className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm leading-5 text-slate-800 outline-none placeholder:text-slate-400 focus:border-violet-400/60 dark:border-white/10 dark:bg-black/20 dark:text-slate-100" placeholder={pending ? "Add a caption (optional)" : "Type a message"} rows={1} />
        {isRecording ? (
          <button type="button" title="Discard recording" onClick={discardRecording} className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white bg-rose-600 hover:bg-rose-700"><Trash2 size={18} /></button>
        ) : null}
        <button type="button" title={pending ? "Send attachment" : draft.trim() ? "Send" : "Voice message"} onClick={sendCurrent} disabled={isUploading} className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white disabled:opacity-60", pending || draft.trim() ? "bg-gradient-to-r from-violet-600 to-cyan-500" : isRecording ? "animate-pulse bg-rose-500" : "bg-slate-700")}>
          {pending || draft.trim() ? (
            <SendHorizontal size={20} />
          ) : (
            <div className="flex items-center gap-1">
              {isRecording ? (
                <span className="text-xs font-mono mr-2 rounded px-1 py-0.5 bg-white/10 text-slate-100">{Math.floor(recordingSeconds / 60)}:{String(recordingSeconds % 60).padStart(2, "0")}</span>
              ) : null}
              <Mic size={20} />
            </div>
          )}
        </button>
      </div>
    </footer>
    {showCamera && <CameraDialog videoRef={cameraVideo} onCapture={capturePhoto} onClose={closeCamera} />}
  </section>;
}

function CameraDialog({ videoRef, onCapture, onClose }: { videoRef: React.RefObject<HTMLVideoElement | null>; onCapture: () => void; onClose: () => void }) { return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/90 p-5"><div className="w-full max-w-xl overflow-hidden rounded-3xl bg-[#151a29] p-4 shadow-2xl"><div className="flex items-center justify-between pb-3"><h2 className="font-semibold text-white">Take a photo</h2><button type="button" onClick={onClose} aria-label="Close camera" className="rounded-xl p-2 text-slate-300 hover:bg-white/10"><X size={20} /></button></div><video ref={videoRef} autoPlay playsInline className="aspect-video w-full rounded-2xl bg-black object-cover" /><button type="button" onClick={onCapture} className="mx-auto mt-4 flex h-12 items-center gap-2 rounded-2xl bg-cyan-400 px-5 font-bold text-slate-950"><Camera size={19} />Capture photo</button></div></div>; }
function AttachmentPreview({ attachment, onRemove }: { attachment: PendingAttachment; onRemove: () => void }) { return <div className="mb-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/15 p-2 text-sm text-slate-100"><div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-white/10">{attachment.previewUrl ? <img src={attachment.previewUrl} alt="Selected attachment" className="h-full w-full object-cover" /> : <FileText size={22} className="text-cyan-300" />}</div><div className="min-w-0 flex-1"><p className="truncate font-semibold">{attachment.file.name}</p><p className="text-xs text-slate-400">{formatFileSize(attachment.file.size)}</p></div><button type="button" onClick={onRemove} className="rounded-xl p-2 text-slate-300 hover:bg-white/10" aria-label="Remove attachment"><X size={18} /></button></div>; }
function AttachmentAction({ label, icon, onClick }: { label: string; icon: ReactNode; onClick: () => void }) { return <button type="button" onClick={onClick} className="flex items-center gap-3 rounded-xl bg-white/[0.06] px-3 py-3 text-left hover:bg-violet-500/20 hover:text-cyan-300">{icon}{label}</button>; }
function ExpressionPicker({ onEmoji, onGif }: { onEmoji: (emoji: string) => void; onGif: () => void }) { const [category, setCategory] = useState<keyof typeof EMOJI_GROUPS>("Smileys"); const [query, setQuery] = useState(""); const emojis = query.trim() ? Object.values(EMOJI_GROUPS).flat().filter(({ name }) => name.includes(query.toLowerCase())) : EMOJI_GROUPS[category]; return <div className="absolute bottom-20 left-4 z-30 w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-[#151a29] p-3 text-slate-100 shadow-2xl"><div className="mb-3 flex gap-2"><button type="button" className="rounded-xl bg-violet-500 px-3 py-2 text-xs font-bold">Emoji</button><button type="button" onClick={onGif} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold hover:bg-cyan-500/20">GIF from device</button></div><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search emoji" className="mb-3 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm outline-none placeholder:text-slate-500" />{!query && <div className="mb-3 flex gap-1 overflow-x-auto">{Object.keys(EMOJI_GROUPS).map((name) => <button key={name} type="button" onClick={() => setCategory(name as keyof typeof EMOJI_GROUPS)} className={cn("rounded-lg px-2 py-1 text-[11px] font-semibold", category === name ? "bg-cyan-500/20 text-cyan-200" : "text-slate-400 hover:bg-white/10")}>{name}</button>)}</div>}<div className="grid max-h-52 grid-cols-8 gap-1 overflow-y-auto">{emojis.map(({ emoji, name }) => <button key={`${emoji}-${name}`} type="button" title={name} onClick={() => onEmoji(emoji)} className="grid aspect-square place-items-center rounded-lg text-xl hover:bg-white/10">{emoji}</button>)}</div></div>; }
const EMOJI_GROUPS = { Smileys: [{ emoji: "😀", name: "grinning" }, { emoji: "😃", name: "smile" }, { emoji: "😄", name: "happy" }, { emoji: "😁", name: "beaming" }, { emoji: "😆", name: "laugh" }, { emoji: "🥹", name: "teary" }, { emoji: "😂", name: "joy" }, { emoji: "🤣", name: "rofl" }, { emoji: "😊", name: "blush" }, { emoji: "😇", name: "angel" }, { emoji: "🙂", name: "slight smile" }, { emoji: "🙃", name: "upside down" }, { emoji: "😉", name: "wink" }, { emoji: "😍", name: "heart eyes" }, { emoji: "🥰", name: "love" }, { emoji: "😘", name: "kiss" }, { emoji: "😎", name: "cool" }, { emoji: "🤩", name: "star struck" }, { emoji: "🥳", name: "party" }, { emoji: "😭", name: "cry" }, { emoji: "😡", name: "angry" }, { emoji: "🤔", name: "thinking" }, { emoji: "🤗", name: "hug" }, { emoji: "🤭", name: "giggle" }, { emoji: "😴", name: "sleep" }, { emoji: "🤯", name: "mind blown" }, { emoji: "🥺", name: "pleading" }, { emoji: "😱", name: "scream" }, { emoji: "🤩", name: "excited" }, { emoji: "🥲", name: "smile tear" }, { emoji: "🫶", name: "heart hands" }, { emoji: "🫡", name: "salute" }], Gestures: [{ emoji: "👍", name: "thumbs up" }, { emoji: "👎", name: "thumbs down" }, { emoji: "👏", name: "clap" }, { emoji: "🙌", name: "celebrate" }, { emoji: "🙏", name: "thanks" }, { emoji: "🤝", name: "handshake" }, { emoji: "💪", name: "strong" }, { emoji: "✌️", name: "peace" }, { emoji: "🤞", name: "fingers crossed" }, { emoji: "👋", name: "wave" }, { emoji: "❤️", name: "red heart" }, { emoji: "💕", name: "two hearts" }, { emoji: "💖", name: "sparkling heart" }, { emoji: "💯", name: "hundred" }, { emoji: "🔥", name: "fire" }, { emoji: "✨", name: "sparkles" }], Nature: [{ emoji: "🌹", name: "rose" }, { emoji: "🌸", name: "flower" }, { emoji: "🌈", name: "rainbow" }, { emoji: "🌞", name: "sun" }, { emoji: "🌙", name: "moon" }, { emoji: "⭐", name: "star" }, { emoji: "🐶", name: "dog" }, { emoji: "🐱", name: "cat" }, { emoji: "🦋", name: "butterfly" }, { emoji: "🐼", name: "panda" }, { emoji: "🍕", name: "pizza" }, { emoji: "🍰", name: "cake" }, { emoji: "☕", name: "coffee" }, { emoji: "🎉", name: "celebration" }, { emoji: "🎁", name: "gift" }, { emoji: "🎵", name: "music" }] } as const;
function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) { return <button type="button" title={label} aria-label={label} onClick={onClick} className="icon-action">{children}</button>; }
function MessageBubble({ message }: { message: Message }) { const outgoing = message.direction === "outgoing"; return <div className={cn("flex", outgoing ? "justify-end" : "justify-start")}><div className={cn("max-w-[72%] rounded-2xl px-3.5 py-2.5 text-sm shadow-lg", outgoing ? "rounded-tr-md bg-gradient-to-br from-violet-600 via-fuchsia-600 to-cyan-500 text-white" : "rounded-tl-md bg-[#1a2030]/85 text-slate-100")}><p className="whitespace-pre-wrap">{message.attachment?.name === message.body ? "" : message.body}</p>{message.attachment && <MessageAttachment attachment={message.attachment} />}<div className="mt-1 flex items-center justify-end gap-1 text-[11px] opacity-70"><span>{message.sentAt}</span>{outgoing && <CheckCheck size={14} />}</div></div></div>; }
function MessageDateDivider({ message }: { message: Message }) { return <div className="my-2 text-center"><span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[11px] font-semibold uppercase text-slate-400">{formatMessageDate(message.sentAtDate)}</span></div>; }
function isNewDay(message: Message, previous?: Message) { return dayKey(message.sentAtDate) !== dayKey(previous?.sentAtDate); }
function dayKey(value?: string) { return value ? new Date(value).toDateString() : "unknown"; }
function formatMessageDate(value?: string) { if (!value) return "Messages"; const date = new Date(value); const today = new Date(); if (date.toDateString() === today.toDateString()) return "Today"; const yesterday = new Date(); yesterday.setDate(today.getDate() - 1); if (date.toDateString() === yesterday.toDateString()) return "Yesterday"; return date.toLocaleDateString([], { day: "numeric", month: "short", year: date.getFullYear() === today.getFullYear() ? undefined : "numeric" }); }
function MessageAttachment({ attachment }: { attachment: NonNullable<Message["attachment"]> }) { 
  if (attachment.type === "image" && attachment.url) return <a href={attachment.url} target="_blank" rel="noreferrer" className="mt-2 block overflow-hidden rounded-xl"><img src={attachment.url} alt={attachment.name} className="max-h-80 w-full object-cover" /></a>; 
  if (attachment.type === "audio" && attachment.url) return <div className="mt-2 flex items-center gap-3 rounded-xl bg-black/15 p-3"><Mic size={18} className="text-cyan-300" /><div className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold">{attachment.name}</span><audio controls className="mt-1 h-8 w-full max-w-[200px]" preload="metadata"><source src={attachment.url} type="audio/webm" /><source src={attachment.url} type="audio/mp3" /><source src={attachment.url} type="audio/wav" />Your browser does not support the audio element.</audio></div></div>;
  return <a href={attachment.url} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-3 rounded-xl bg-black/15 p-2 hover:bg-black/25"><FileText size={18} className="text-cyan-300" /><span className="min-w-0"><span className="block truncate text-xs font-semibold">{attachment.name}</span><span className="text-[11px] opacity-70">{attachment.size}</span></span></a>; }
function formatFileSize(bytes: number) { if (bytes < 1024) return `${bytes} B`; if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`; return `${(bytes / (1024 * 1024)).toFixed(1)} MB`; }
