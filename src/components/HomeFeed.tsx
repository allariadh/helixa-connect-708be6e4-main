import { useRef, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Image,
  Paperclip,
  MapPin,
  File as FileIcon,
  ThumbsUp,
  MessageCircle,
  Share2,
  Send,
  Eye,
  Lock,
  X,
  Smile,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/contexts/SessionContext";
import { denyMessage } from "@/lib/permissions";
import { toast } from "sonner";
import { categoryLabels, type FeedCategory } from "@/data/algerianFeed";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { sharedPostsStore } from "@/lib/messagesStore";

type FeedAttachment = {
  type: "image" | "file" | "location";
  name: string;
  url?: string;
  preview?: string;
};

interface Post {
  id: string;
  author: {
    name: string;
    title: string;
    department: string;
    avatar: string;
  };
  content: string;
  type: "announcement" | "update" | "event" | "achievement";
  timestamp: string;
  reactions: {
    likes: number;
    celebrates: number;
    supports: number;
    insights: number;
  };
  comments: number;
  hasImage?: boolean;
  attachments?: FeedAttachment[];
  views?: number;
  visibilityTier?: "COMPANY_WIDE" | "ROLE_RESTRICTED" | "DEPT_ONLY";
  allowComments?: boolean;
  allowShare?: boolean;
}

const initialsFromName = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "HA";

const getCurrentWriter = (userId: string | null) => {
  try {
    const raw = localStorage.getItem("helixa-profile");
    if (raw) {
      const profile = JSON.parse(raw) as { name?: string; title?: string; department?: string; photo?: string | null };
      if (profile.name?.trim()) {
        return {
          name: profile.name.trim(),
          title: profile.title || "Helixa Workspace",
          department: profile.department || "Communication",
          avatar: initialsFromName(profile.name),
          photo: profile.photo || null,
        };
      }
    }
  } catch {}
  const fallbackName = userId?.includes("@")
    ? userId.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Yacine Amrani";
  return {
    name: fallbackName,
    title: "Senior PR Strategist",
    department: "Communication",
    avatar: initialsFromName(fallbackName),
    photo: null as string | null,
  };
};

const typeColors: Record<string, string> = {
  announcement: "bg-primary/20 text-primary",
  update: "bg-muted text-muted-foreground",
  event: "bg-accent/20 text-accent",
  achievement: "bg-yellow-500/20 text-yellow-500",
};

const samplePosts: Post[] = [
  {
    id: "1",
    author: {
      name: "Yasmine Benali",
      title: "Directrice de la Communication",
      department: "Marketing",
      avatar: "YB",
    },
    content: "🎉 Fière d'annoncer que notre équipe de gestion de crise a traité 50 dossiers sensibles ce trimestre avec un taux de résolution positif de 98%. Bravo à toute l'équipe ! #GestionDeCrise #Helixa",
    type: "achievement",
    timestamp: "2h",
    reactions: { likes: 45, celebrates: 32, supports: 12, insights: 8 },
    comments: 15,
    views: 312,
    visibilityTier: "COMPANY_WIDE",
    allowComments: true,
    allowShare: true,
  },
  {
    id: "2",
    author: {
      name: "Karim Belkacem",
      title: "Responsable Stratégie",
      department: "Direction",
      avatar: "KB",
    },
    content: "Mise à jour importante : déploiement de nouvelles capacités d'analyse de sentiment la semaine prochaine. Une session de formation sera organisée pour les équipes concernées.",
    type: "announcement",
    timestamp: "4h",
    reactions: { likes: 67, celebrates: 15, supports: 23, insights: 41 },
    comments: 28,
    hasImage: true,
    views: 489,
    visibilityTier: "ROLE_RESTRICTED",
    allowComments: true,
    allowShare: true,
  },
  {
    id: "3",
    author: {
      name: "Amina Hadj-Ali",
      title: "Coordinatrice Événementiel",
      department: "Opérations",
      avatar: "AH",
    },
    content: "📅 Rappel : la réunion mensuelle de stratégie PR aura lieu demain à 14h. Pensez à transmettre vos mises à jour de département.",
    type: "event",
    timestamp: "5h",
    reactions: { likes: 23, celebrates: 5, supports: 8, insights: 3 },
    comments: 7,
    views: 134,
    visibilityTier: "DEPT_ONLY",
    allowComments: true,
    allowShare: true,
  },
];

export const HomeFeed = () => {
  const [postText, setPostText] = useState("");
  const [posts, setPosts] = useState<Post[]>(samplePosts);
  const [composerAttachments, setComposerAttachments] = useState<FeedAttachment[]>([]);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [commentsByPost, setCommentsByPost] = useState<Record<string, { author: string; text: string }[]>>({});
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});
  const [sharingPost, setSharingPost] = useState<Post | null>(null);
  const [shareTargets, setShareTargets] = useState<Record<string, boolean>>({});
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { can, actor } = useSession();
  const postCheck = can("feed.post");
  const writer = getCurrentWriter(actor.userId);

  const recipients = [
    { id: "yb", name: "Yasmine Benali" },
    { id: "kb", name: "Karim Belkacem" },
    { id: "ah", name: "Amina Hadj-Ali" },
    { id: "ms", name: "Mehdi Saidani" },
    { id: "nk", name: "Nadia Kheloufi" },
    { id: "self", name: "My Profile" },
  ];

  const makeComposerPost = (): Post => ({
    id: `post-${Date.now()}`,
    author: writer,
    content: postText.trim(),
    type: "update",
    timestamp: "now",
    reactions: { likes: 0, celebrates: 0, supports: 0, insights: 0 },
    comments: 0,
    attachments: composerAttachments,
    hasImage: composerAttachments.some((a) => a.type === "image"),
    views: 1,
    visibilityTier: "COMPANY_WIDE",
    allowComments: true,
    allowShare: true,
  });

  const handlePost = () => {
    if (!postCheck.allowed) {
      toast.error(denyMessage(postCheck.reason!));
      return;
    }
    if (!postText.trim() && !composerAttachments.length) return;
    const created = makeComposerPost();
    setPosts((prev) => [created, ...prev]);
    setPostText("");
    setComposerAttachments([]);
    toast.success("Post published");
  };

  const handleComposerFiles = (e: ChangeEvent<HTMLInputElement>, kind: "image" | "file") => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const next: FeedAttachment[] = files.map((file) => {
      const url = URL.createObjectURL(file);
      return { type: kind, name: file.name, url, preview: kind === "image" ? url : undefined };
    });
    setComposerAttachments((prev) => [...prev, ...next]);
    toast.success(kind === "image" ? "Photo added" : "File added");
    e.target.value = "";
  };

  const addComposerLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Location is unavailable on this device");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const url = `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`;
        setComposerAttachments((prev) => [...prev, { type: "location", name: "Current location", url }]);
        toast.success("Location added");
      },
      () => toast.error("Allow location access to attach your position"),
    );
  };

  const submitComment = (postId: string) => {
    const text = (commentDraft[postId] || "").trim();
    if (!text) return;
    setCommentsByPost((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), { author: writer.name, text }],
    }));
    setCommentDraft((prev) => ({ ...prev, [postId]: "" }));
    toast.success("Comment posted");
  };

  const confirmShare = () => {
    if (!sharingPost) return;
    const picked = Object.entries(shareTargets).filter(([, v]) => v).map(([id]) => id);
    if (!picked.length) {
      toast.error("Pick at least one recipient");
      return;
    }
    const pickedRecipients = picked
      .map((id) => recipients.find((r) => r.id === id))
      .filter((recipient): recipient is { id: string; name: string } => Boolean(recipient));
    sharedPostsStore.share(
      {
        authorName: sharingPost.author.name,
        authorPhoto: (sharingPost.author as { photo?: string | null }).photo || null,
        authorAvatar: sharingPost.author.avatar,
        content: [sharingPost.content, ...(sharingPost.attachments || []).map((a) => `[${a.type}] ${a.name}`)].filter(Boolean).join("\n"),
      },
      pickedRecipients,
    );
    const toSelf = picked.includes("self");
    const names = picked
      .filter((id) => id !== "self")
      .map((id) => recipients.find((r) => r.id === id)?.name)
      .filter(Boolean)
      .join(", ");
    if (toSelf && names) toast.success(`Shared to your profile and to ${names}`);
    else if (toSelf) toast.success("Shared to your profile");
    else toast.success(`Shared to ${names}`);
    if (pickedRecipients.some((r) => r.id !== "self")) {
      window.dispatchEvent(new CustomEvent("helixa-open-tab", { detail: "messages" }));
    }
    setSharingPost(null);
    setShareTargets({});
  };

  return (
    <div className="flex-1 overflow-y-auto pb-24 custom-scrollbar">
      {/* Create Post Section */}
      <div className="p-4 border-b border-border/50">
        <div className="glass-card p-4">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-semibold text-sm overflow-hidden">
              {writer.photo ? <img src={writer.photo} alt={writer.name} className="w-full h-full object-cover" /> : writer.avatar}
            </div>
            <div className="flex-1">
              <textarea
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder="What's the update you want to share with your team?"
                className="w-full bg-transparent resize-none text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[60px]"
              />
              {composerAttachments.length > 0 && (
                <div className="mt-3 grid gap-2">
                  {composerAttachments.map((item, index) => (
                    <div key={`${item.name}-${index}`} className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-caption text-foreground">
                      {item.type === "image" ? <Image className="w-4 h-4 text-primary" /> : item.type === "file" ? <FileIcon className="w-4 h-4 text-primary" /> : <MapPin className="w-4 h-4 text-primary" />}
                      <span className="min-w-0 flex-1 truncate">{item.name}</span>
                      <button onClick={() => setComposerAttachments((prev) => prev.filter((_, i) => i !== index))} className="text-muted-foreground hover:text-destructive" aria-label="Remove attachment">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleComposerFiles(e, "image")} />
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => handleComposerFiles(e, "file")} />
              <div className="mt-3 rounded-xl border border-border/40 bg-muted/20 p-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="text-primary h-9 w-9" onClick={() => imageInputRef.current?.click()} aria-label="Add photo">
                    <Image className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-muted-foreground h-9 w-9" onClick={() => fileInputRef.current?.click()} aria-label="Attach file">
                    <Paperclip className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-muted-foreground h-9 w-9" onClick={addComposerLocation} aria-label="Add location">
                    <MapPin className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-muted-foreground h-9 w-9" onClick={() => setPostText((prev) => `${prev}${prev ? " " : ""}🙂`)} aria-label="Add emoji">
                    <Smile className="w-5 h-5" />
                  </Button>
                  </div>
                <Button
                  variant="cyan"
                  size="sm"
                  disabled={(!postText.trim() && !composerAttachments.length) || !postCheck.allowed}
                  onClick={handlePost}
                  title={postCheck.allowed ? "" : denyMessage(postCheck.reason!)}
                >
                  {postCheck.allowed ? (
                    <Send className="w-4 h-4 mr-2" />
                  ) : (
                    <Lock className="w-4 h-4 mr-2" />
                  )}
                  Post
                </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-4 p-4">
        {posts.map((post) => (
          <article
            key={post.id}
            className="glass-card p-4 animate-fade-in"
          >
            {/* Post Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground font-semibold text-sm overflow-hidden">
                  {(post.author as { photo?: string | null }).photo ? (
                    <img src={(post.author as { photo?: string | null }).photo!} alt={post.author.name} className="w-full h-full object-cover" />
                  ) : post.author.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground">{post.author.name}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full", typeColors[post.type])}>
                      {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
                    </span>
                    {(post as unknown as { category?: FeedCategory }).category && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {categoryLabels[(post as unknown as { category: FeedCategory }).category].fr} · {categoryLabels[(post as unknown as { category: FeedCategory }).category].ar}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-caption text-muted-foreground">
                    <span>{post.author.title}</span>
                    <span>•</span>
                    <span className="text-primary">{post.author.department}</span>
                    <span>•</span>
                    <span>{post.timestamp}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Post Content */}
            <p className="text-body text-foreground mb-4 leading-relaxed">
              {post.content}
            </p>

            {/* Image placeholder */}
            {post.hasImage && (
              <div className="mb-4 rounded-xl bg-muted aspect-video flex items-center justify-center">
                <Image className="w-12 h-12 text-muted-foreground" />
              </div>
            )}

            {post.attachments && post.attachments.length > 0 && (
              <div className="mb-4 space-y-2">
                {post.attachments.map((item, index) => (
                  item.type === "image" && item.preview ? (
                    <img key={`${item.name}-${index}`} src={item.preview} alt={item.name} className="w-full rounded-xl object-cover max-h-72" />
                  ) : (
                    <a key={`${item.name}-${index}`} href={item.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm text-foreground hover:bg-muted/60">
                      {item.type === "file" ? <FileIcon className="w-4 h-4 text-primary" /> : <MapPin className="w-4 h-4 text-primary" />}
                      <span className="truncate">{item.name}</span>
                    </a>
                  )
                ))}
              </div>
            )}

            {/* Analytics row (additive) */}
            {typeof post.views === "number" && (
              <div className="flex items-center gap-2 text-caption text-muted-foreground mb-2">
                <Eye className="w-3.5 h-3.5" />
                <span>Seen by {post.views} users</span>
              </div>
            )}

            {/* Post actions */}
            <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl border border-border/40 bg-muted/25 p-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("text-muted-foreground hover:text-primary", likedPosts[post.id] && "text-primary")}
                  onClick={() => setLikedPosts((prev) => ({ ...prev, [post.id]: !prev[post.id] }))}
                >
                  <ThumbsUp className="w-4 h-4 mr-1" />
                  <span className="text-xs">Like {post.reactions.likes + (likedPosts[post.id] ? 1 : 0)}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => setExpandedPost((p) => (p === post.id ? null : post.id))}
                >
                  <MessageCircle className="w-4 h-4 mr-1" />
                  <span className="text-xs">Comment {post.comments + (commentsByPost[post.id]?.length || 0)}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => { setSharingPost(post); setShareTargets({}); }}
                >
                  <Share2 className="w-4 h-4 mr-1" />
                  <span className="text-xs">Share</span>
                </Button>
            </div>

            {/* Comment thread */}
            {expandedPost === post.id && (
              <div className="mt-3 pt-3 border-t border-border/30 space-y-2">
                {(commentsByPost[post.id] || []).map((c, i) => (
                  <div key={i} className="bg-muted/40 rounded-lg p-2 text-caption">
                    <span className="font-medium text-primary">{c.author}: </span>
                    <span className="text-foreground">{c.text}</span>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    value={commentDraft[post.id] || ""}
                    onChange={(e) => setCommentDraft((prev) => ({ ...prev, [post.id]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === "Enter") submitComment(post.id); }}
                    placeholder="Write a comment..."
                    className="flex-1 bg-muted px-3 py-2 rounded-lg text-caption text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <Button variant="cyan" size="sm" onClick={() => submitComment(post.id)}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </article>
        ))}
      </div>

      {/* Share Dialog */}
      <Dialog open={!!sharingPost} onOpenChange={(o) => !o && setSharingPost(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Share post</DialogTitle>
          </DialogHeader>
          <p className="text-caption text-muted-foreground">Pick recipients — share to messages or to your profile.</p>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {recipients.map((r) => (
              <label key={r.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!shareTargets[r.id]}
                  onChange={(e) => setShareTargets((prev) => ({ ...prev, [r.id]: e.target.checked }))}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-body text-foreground">{r.name}</span>
              </label>
            ))}
          </div>
          <Button variant="cyan" className="w-full" onClick={confirmShare}>
            <Send className="w-4 h-4 mr-2" />
            Share
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

