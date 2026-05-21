import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Image as ImageIcon,
  MapPin,
  Mic,
  Send,
  Smile,
  File as FileIcon,
  Camera,
  Pin,
  PinOff,
  Reply,
  X,
  ShieldCheck,
  Search as SearchIcon,
  ScreenShare,
  Link as LinkIcon,
  PhoneOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { archiveStore } from "@/lib/archiveStore";
import { sharedPostsStore } from "@/lib/messagesStore";

interface Message {
  id: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
  type: "text" | "image" | "file" | "location" | "voice";
  status?: "sent" | "delivered" | "read";
  url?: string;
  fileName?: string;
  duration?: number;
  pinned?: boolean;
  replyTo?: { id: string; content: string };
}

interface ChatDetailViewProps {
  conversation: {
    id: string;
    name: string;
    avatar: string;
    avatarUrl?: string;
    lastMessage?: string;
    isOnline: boolean;
    department: string;
  };
  onBack: () => void;
}

const seedMessages: Message[] = [
  { id: "1", content: "Hey! How's the press release coming along?", timestamp: "10:30 AM", isOwn: false, type: "text" },
  { id: "2", content: "Almost done! Just need to finalize the quotes section.", timestamp: "10:32 AM", isOwn: true, type: "text", status: "read" },
  { id: "3", content: "Perfect! The client is really excited about this one.", timestamp: "10:33 AM", isOwn: false, type: "text" },
];

const fmtNow = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

let callingAudio: HTMLAudioElement | null = null;

const startCallingSound = () => {
  callingAudio = new Audio('/sounds/calling-tone.mp3');
  callingAudio.loop = true;
  callingAudio.volume = 0.4;
  callingAudio.play().catch(() => console.log("Ringtone active"));
};

const stopCallingSound = () => {
  if (callingAudio) {
    callingAudio.pause();
    callingAudio.currentTime = 0;
  }
};

export const ChatDetailView = ({ conversation, onBack }: ChatDetailViewProps) => {
  const [messages, setMessages] = useState<Message[]>(() => {
    const sharedForRecipient = sharedPostsStore
      .list()
      .filter((sp) => sp.recipientName.toLowerCase() === conversation.name.toLowerCase());
    const sharedAsMessages: Message[] = sharedForRecipient.map((sp) => ({
      id: sp.id,
      content: `↪ Shared from ${sp.authorName}:\n${sp.content}`,
      timestamp: fmtNow(),
      isOwn: true,
      type: "text" as const,
      status: "delivered" as const,
    }));
    if (conversation.id.startsWith("shared-") && conversation.lastMessage) {
      return [{ id: "shared-post", content: conversation.lastMessage, timestamp: fmtNow(), isOwn: true, type: "text", status: "delivered" }];
    }
    return [...seedMessages, ...sharedAsMessages];
  });
  const [draft, setDraft] = useState("");
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showArchive, setShowArchive] = useState(false);
  const [archiveTab, setArchiveTab] = useState<"media" | "files" | "links">("media");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordChunks = useRef<BlobPart[]>([]);
  const recordStart = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Active call state
  const [callMode, setCallMode] = useState<null | "audio" | "video" | "screen">(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const append = (m: Omit<Message, "id" | "timestamp" | "isOwn" | "status">) => {
    setMessages((prev) => [
      ...prev,
      { ...m, id: `m${Date.now()}`, timestamp: fmtNow(), isOwn: true, status: "sent", replyTo: replyTo ? { id: replyTo.id, content: replyTo.content } : undefined },
    ]);
    setReplyTo(null);
  };

  const handleSend = () => {
    if (!draft.trim()) return;
    append({ content: draft.trim(), type: "text" });
    setDraft("");
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    if (f.type.startsWith("image/")) {
      append({ content: "Photo", type: "image", url, fileName: f.name });
    } else {
      append({ content: f.name, type: "file", url, fileName: f.name });
      archiveStore.add({ name: f.name, source: "Chat", sizeBytes: f.size, url });
    }
    e.target.value = "";
  };

  const shareLocation = () => {
    if (!navigator.geolocation) return toast.error("Geolocation unavailable");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const url = `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`;
        append({ content: `Location shared`, type: "location", url });
        toast.success("Location shared");
      },
      () => toast.error("Could not get location")
    );
  };

  // Voice note hold-to-record
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      recorderRef.current = mr;
      recordChunks.current = [];
      recordStart.current = Date.now();
      mr.ondataavailable = (e) => recordChunks.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(recordChunks.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        const dur = Math.round((Date.now() - recordStart.current) / 1000);
        append({ content: "Voice note", type: "voice", url, duration: dur });
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      setRecording(true);
    } catch {
      toast.error("Microphone permission denied");
    }
  };
  const stopRecording = () => {
    if (recorderRef.current && recording) {
      recorderRef.current.stop();
      setRecording(false);
    }
  };

  // Pin / unpin
  const togglePin = (id: string) =>
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, pinned: !m.pinned } : m)));

  const playNotification = () => {
    // المسار يبدأ من المجلد العام مباشرة
    const audio = new Audio('/sounds/call-start.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => console.log("Audio feedback active"));
  };

  // Calls — getUserMedia for audio/video, getDisplayMedia for screen share
  const startCall = async (mode: "audio" | "video" | "screen") => {
    try {
      const stream =
        mode === "screen"
          ? await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
          : await navigator.mediaDevices.getUserMedia({ audio: true, video: mode === "video" });
      localStreamRef.current = stream;
      setCallMode(mode);
      toast.success(mode === "screen" ? "Screen sharing started" : "Secure connection started");
      setTimeout(() => {
        if (localVideoRef.current && (mode === "video" || mode === "screen")) {
          localVideoRef.current.srcObject = stream;
        }
      }, 50);
    } catch {
      toast.error(`${mode === "screen" ? "Screen share" : "Camera/mic"} access denied`);
    }
  };
  const endCall = () => {
    stopCallingSound();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setCallMode(null);
  };
  useEffect(() => () => endCall(), []);

  const pinned = messages.filter((m) => m.pinned);
  const visibleMessages = searchTerm
    ? messages.filter((m) => m.content.toLowerCase().includes(searchTerm.toLowerCase()))
    : messages;

  const archive = {
    media: messages.filter((m) => m.type === "image"),
    files: messages.filter((m) => m.type === "file"),
    links: messages.filter((m) => /https?:\/\//.test(m.content) || m.type === "location"),
  };

  const attachOptions = [
    { icon: Camera, label: "Camera", onClick: () => cameraInputRef.current?.click() },
    { icon: ImageIcon, label: "Gallery", onClick: () => imageInputRef.current?.click() },
    { icon: FileIcon, label: "Document", onClick: () => fileInputRef.current?.click() },
    { icon: MapPin, label: "Location", onClick: shareLocation },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border/50 bg-card/80 backdrop-blur-xl">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>

        <div className="relative flex-shrink-0">
          {conversation.avatarUrl ? (
            <img src={conversation.avatarUrl} alt={conversation.name} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center font-semibold text-sm text-primary-foreground">
              {conversation.avatar}
            </div>
          )}
          {conversation.isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />}
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-foreground truncate">{conversation.name}</h2>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-green-600" /> End-to-end encrypted
          </p>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setShowSearch((v) => !v)}><SearchIcon className="w-5 h-5" /></Button>
          <Button variant="ghost" size="icon" className="text-primary" onClick={() => startCall("audio")}><Phone className="w-5 h-5" /></Button>
          <Button variant="ghost" size="icon" className="text-primary" onClick={() => startCall("video")}><Video className="w-5 h-5" /></Button>
          <Button variant="ghost" size="icon" onClick={() => setShowArchive(true)}><MoreVertical className="w-5 h-5" /></Button>
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="px-4 py-2 border-b border-border/50">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search in conversation"
              className="w-full bg-muted pl-9 pr-9 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="absolute right-2 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Pinned bar */}
      {pinned.length > 0 && (
        <div className="px-4 py-2 border-b border-border/50 bg-muted/50 flex items-center gap-2">
          <Pin className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs text-foreground truncate">{pinned[pinned.length - 1].content}</span>
          <span className="ml-auto text-[10px] text-muted-foreground">{pinned.length} pinned</span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {visibleMessages.map((msg) => (
          <div key={msg.id} className={cn("flex group", msg.isOwn ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[75%] rounded-2xl px-4 py-2.5 relative",
                msg.isOwn
                  ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-br-md"
                  : "bg-muted text-foreground rounded-bl-md"
              )}
            >
              {msg.replyTo && (
                <div className="text-[11px] opacity-80 border-l-2 pl-2 mb-1 truncate" style={{ borderColor: "currentColor" }}>
                  ↩ {msg.replyTo.content}
                </div>
              )}
              {msg.type === "text" && <p className="text-sm">{msg.content}</p>}
              {msg.type === "image" && (
                <img src={msg.url} alt={msg.fileName} className="rounded-lg max-h-56" />
              )}
              {msg.type === "file" && (
                <a href={msg.url} download={msg.fileName} className="flex items-center gap-2 text-sm underline">
                  <FileIcon className="w-4 h-4" /> {msg.fileName}
                </a>
              )}
              {msg.type === "location" && (
                <a href={msg.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm underline">
                  <MapPin className="w-4 h-4" /> Open shared location
                </a>
              )}
              {msg.type === "voice" && (
                <audio controls src={msg.url} className="max-w-[220px]" />
              )}
              <div className={cn("flex items-center justify-end gap-1 mt-1", msg.isOwn ? "text-primary-foreground/70" : "text-muted-foreground")}>
                <span className="text-[10px]">{msg.timestamp}{msg.duration ? ` · ${msg.duration}s` : ""}</span>
                {msg.isOwn && msg.status === "read" && <span className="text-[10px]">✓✓</span>}
              </div>

              {/* Hover actions */}
              <div className="absolute -top-3 right-2 opacity-0 group-hover:opacity-100 transition flex gap-1">
                <button onClick={() => setReplyTo(msg)} className="p-1 rounded bg-card border border-border" aria-label="Reply">
                  <Reply className="w-3 h-3" />
                </button>
                <button onClick={() => togglePin(msg.id)} className="p-1 rounded bg-card border border-border" aria-label="Pin">
                  {msg.pinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply preview */}
      {replyTo && (
        <div className="px-4 py-2 bg-muted/60 border-t border-border/50 flex items-center gap-2">
          <Reply className="w-4 h-4 text-primary" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Replying to</p>
            <p className="text-xs text-foreground truncate">{replyTo.content}</p>
          </div>
          <button onClick={() => setReplyTo(null)}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
      )}

      {/* Attachment Menu */}
      {showAttachMenu && (
        <div className="px-4 py-3 border-t border-border/50 bg-card/80 backdrop-blur-xl">
          <div className="flex justify-around">
            {attachOptions.map((option) => (
              <button
                key={option.label}
                className="flex flex-col items-center gap-2 p-3"
                onClick={() => { setShowAttachMenu(false); option.onClick(); }}
              >
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-primary">
                  <option.icon className="w-5 h-5" />
                </div>
                <span className="text-xs text-muted-foreground">{option.label}</span>
              </button>
            ))}
            <button
              className="flex flex-col items-center gap-2 p-3"
              onClick={() => { setShowAttachMenu(false); startCall("screen"); }}
            >
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-primary">
                <ScreenShare className="w-5 h-5" />
              </div>
              <span className="text-xs text-muted-foreground">Screen</span>
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 border-t border-border/50 bg-card/80 backdrop-blur-xl safe-area-bottom">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setShowAttachMenu(!showAttachMenu)} className={showAttachMenu ? "text-primary" : ""}>
            <Paperclip className="w-5 h-5" />
          </Button>

          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a message..."
              className="w-full bg-muted pl-4 pr-10 py-2.5 rounded-full text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
            />
            <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8">
              <Smile className="w-5 h-5 text-muted-foreground" />
            </Button>
          </div>

          {draft.trim() ? (
            <Button variant="cyan" size="icon" onClick={handleSend} className="rounded-full">
              <Send className="w-5 h-5" />
            </Button>
          ) : (
            <Button
              variant={recording ? "magenta" : "ghost"}
              size="icon"
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onMouseLeave={() => recording && stopRecording()}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              className={cn("rounded-full", recording && "animate-pulse")}
              aria-label="Hold to record voice note"
            >
              <Mic className="w-5 h-5" />
            </Button>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-1">Hold mic to record · Release to send</p>
      </div>

      {/* Hidden inputs */}
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFile} />
      <input ref={imageInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFile} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />

      {/* Archive Side Panel */}
      {showArchive && (
        <div className="absolute inset-0 z-30 bg-background/95 backdrop-blur-sm flex flex-col">
          <div className="p-4 border-b border-border/50 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setShowArchive(false)}><X className="w-5 h-5" /></Button>
            <h3 className="font-semibold text-foreground">Shared content</h3>
          </div>
          <div className="flex gap-2 p-3 border-b border-border/50">
            {(["media", "files", "links"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setArchiveTab(t)}
                className={cn("flex-1 py-2 rounded-lg text-xs font-medium capitalize", archiveTab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}
              >
                {t} ({archive[t].length})
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {archiveTab === "media" && (
              <div className="grid grid-cols-3 gap-2">
                {archive.media.map((m) => (
                  <a key={m.id} href={m.url} target="_blank" rel="noreferrer">
                    <img src={m.url} alt="" className="w-full aspect-square object-cover rounded-lg" />
                  </a>
                ))}
                {archive.media.length === 0 && <p className="col-span-3 text-caption text-muted-foreground">No media yet.</p>}
              </div>
            )}
            {archiveTab === "files" && (
              <div className="space-y-2">
                {archive.files.map((f) => (
                  <a key={f.id} href={f.url} download={f.fileName} className="glass-card p-3 flex items-center gap-2 text-sm">
                    <FileIcon className="w-4 h-4 text-primary" /> {f.fileName}
                  </a>
                ))}
                {archive.files.length === 0 && <p className="text-caption text-muted-foreground">No files yet.</p>}
              </div>
            )}
            {archiveTab === "links" && (
              <div className="space-y-2">
                {archive.links.map((l) => (
                  <a key={l.id} href={l.url || "#"} target="_blank" rel="noreferrer" className="glass-card p-3 flex items-center gap-2 text-sm break-all">
                    <LinkIcon className="w-4 h-4 text-primary" /> {l.url || l.content}
                  </a>
                ))}
                {archive.links.length === 0 && <p className="text-caption text-muted-foreground">No links shared.</p>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Active call overlay */}
      {callMode && (
        <div className="absolute inset-0 z-40 bg-black/90 flex flex-col items-center justify-center gap-6 text-white">
          <div className="text-center">
            <p className="text-xs uppercase tracking-widest opacity-70">{callMode === "screen" ? "Screen sharing" : `${callMode} call`}</p>
            <h2 className="text-xl font-semibold mt-1">{conversation.name}</h2>
          </div>
          {(callMode === "video" || callMode === "screen") && (
            <video ref={localVideoRef} autoPlay muted playsInline className="rounded-xl max-h-[60vh] max-w-[90vw] bg-black" />
          )}
          {callMode === "audio" && (
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-accent animate-pulse flex items-center justify-center text-3xl font-bold">
              {conversation.avatar}
            </div>
          )}
          <Button onClick={endCall} className="rounded-full h-14 w-14 p-0 bg-red-600 hover:bg-red-700">
            <PhoneOff className="w-6 h-6" />
          </Button>
        </div>
      )}
    </div>
  );
};
