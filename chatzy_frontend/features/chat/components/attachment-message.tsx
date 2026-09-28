import { Download, FileText, Image as ImageIcon, Video, Mic } from "lucide-react";

type Attachment = {
  name: string;
  type: "document" | "image" | "audio" | "video";
  size: string;
  url?: string;
};

export function AttachmentMessage({ attachment }: { attachment: Attachment }) {
  if (attachment.type === "audio" && attachment.url) {
    return (
      <div className="mt-2 flex items-center gap-3 rounded-xl bg-white/10 p-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-cyan-500/20 text-cyan-300">
          <Mic size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">{attachment.name}</p>
          <audio 
            controls 
            className="mt-1 h-8 w-full max-w-[200px]"
            preload="metadata"
          >
            <source src={attachment.url} type="audio/webm" />
            <source src={attachment.url} type="audio/mp3" />
            <source src={attachment.url} type="audio/wav" />
            Your browser does not support the audio element.
          </audio>
        </div>
      </div>
    );
  }

  if (attachment.type === "image" && attachment.url) {
    return (
      <div className="mt-2">
        <img 
          src={attachment.url} 
          alt={attachment.name} 
          className="max-h-64 w-auto rounded-xl cursor-pointer hover:opacity-90"
          onClick={() => window.open(attachment.url, '_blank')}
        />
      </div>
    );
  }

  if (attachment.type === "video" && attachment.url) {
    return (
      <div className="mt-2">
        <video 
          controls 
          className="max-h-64 w-auto rounded-xl"
          preload="metadata"
        >
          <source src={attachment.url} />
          Your browser does not support the video element.
        </video>
      </div>
    );
  }

  // Document type
  return (
    <div className="mt-2 flex items-center gap-3 rounded-xl bg-white/10 p-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-violet-500/20 text-violet-300">
        <FileText size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">{attachment.name}</p>
        <p className="text-[10px] text-slate-400">{attachment.size}</p>
      </div>
      {attachment.url && (
        <a 
          href={attachment.url} 
          download={attachment.name}
          className="rounded-lg p-2 text-slate-300 hover:bg-white/10"
          title="Download"
        >
          <Download size={16} />
        </a>
      )}
    </div>
  );
}
