import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, Plus, CheckCheck, Lock, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatDetailView } from "./ChatDetailView";
import { useSession } from "@/contexts/SessionContext";
import { denyMessage } from "@/lib/permissions";
import { toast } from "sonner";
import { prRequestsStore, PRRequest } from "@/lib/prRequestsStore";
import { onboardingStore, OnboardingConversation, sharedPostsStore, SharedPostMessage } from "@/lib/messagesStore";
import { playIncomingNotification } from "@/lib/notificationStore";

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  avatarUrl?: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  isOnline: boolean;
  department: string;
  sharedPost?: SharedPostMessage;
}

const conversations: Conversation[] = [
  {
    id: "1",
    name: "Yasmine Benali",
    avatar: "YB",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    lastMessage: "Excellent travail sur le communiqué de presse, le client a adoré.",
    timestamp: "2m",
    unread: 2,
    isOnline: true,
    department: "Marketing",
  },
  {
    id: "2",
    name: "Cellule de Crise",
    avatar: "CC",
    avatarUrl: "",
    lastMessage: "Karim : il faut préparer une déclaration pour demain matin.",
    timestamp: "15m",
    unread: 5,
    isOnline: false,
    department: "Group",
  },
  {
    id: "3",
    name: "Amina Hadj-Ali",
    avatar: "AH",
    avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    lastMessage: "Peux-tu valider le planning de l'événement ?",
    timestamp: "1h",
    unread: 0,
    isOnline: true,
    department: "Opérations",
  },
  {
    id: "4",
    name: "Mehdi Saidani",
    avatar: "MS",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    lastMessage: "Le rapport d'analyse de sentiment est prêt.",
    timestamp: "3h",
    unread: 0,
    isOnline: false,
    department: "Analytics",
  },
  {
    id: "5",
    name: "Direction Générale",
    avatar: "DG",
    avatarUrl: "",
    lastMessage: "Nadia : briefing T2 demain à 9h.",
    timestamp: "Hier",
    unread: 0,
    isOnline: false,
    department: "Channel",
  },
];

export const MessagesScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "unread" | "direct" | "groups">("all");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const { can, actor } = useSession();
  const initiateCheck = can("messages.initiate");
  const isAdmin = actor.role === "ROLE_CEO" || actor.role === "ROLE_MANAGER";

  // PR Service Requests (External) — only visible to admin/PR roles
  const [prRequests, setPrRequests] = useState<PRRequest[]>(prRequestsStore.list());
  useEffect(() => {
    const sync = () => {
      setPrRequests(prRequestsStore.list());
      if (localStorage.getItem("helixa-notifications-enabled") !== "false") playIncomingNotification();
    };
    window.addEventListener("helixa-pr-requests-changed", sync);
    return () => window.removeEventListener("helixa-pr-requests-changed", sync);
  }, []);

  // Onboarding conversations (auto-created when CEO adds employees)
  const [onboardingConvs, setOnboardingConvs] = useState<OnboardingConversation[]>(onboardingStore.list());
  const [sharedPosts, setSharedPosts] = useState<SharedPostMessage[]>(sharedPostsStore.list());
  useEffect(() => {
    const sync = () => setOnboardingConvs(onboardingStore.list());
    window.addEventListener("helixa-onboarding-created", sync);
    return () => window.removeEventListener("helixa-onboarding-created", sync);
  }, []);

  useEffect(() => {
    const sync = () => setSharedPosts(sharedPostsStore.list());
    window.addEventListener("helixa-shared-post-created", sync);
    return () => window.removeEventListener("helixa-shared-post-created", sync);
  }, []);

  // Auto-open pending onboarding chat on mount
  useEffect(() => {
    const pendingId = onboardingStore.consumePending();
    if (!pendingId) return;
    const conv = onboardingStore.list().find((c) => c.id === pendingId);
    if (!conv) return;
    setSelectedConversation({
      id: conv.id,
      name: `Onboarding — ${conv.employeeName}`,
      avatar: conv.employeeName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase(),
      lastMessage: conv.welcomeFr,
      timestamp: "now",
      unread: 0,
      isOnline: true,
      department: "Group",
    });
  }, []);

  const allConversations = useMemo<Conversation[]>(() => {
    const onbConvs: Conversation[] = onboardingConvs.map((c) => ({
      id: c.id,
      name: `Onboarding — ${c.employeeName}`,
      avatar: c.employeeName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase(),
      lastMessage: `${c.welcomeFr}\n${c.welcomeAr}`,
      timestamp: "now",
      unread: 1,
      isOnline: true,
      department: "Group",
    }));

    // Merge shared posts into matching seed conversations by name (case-insensitive).
    // Anything not matching a seed (e.g. "My Profile") becomes its own row.
    const baseSeed = conversations.map((c) => ({ ...c }));
    const unmatchedShared: SharedPostMessage[] = [];
    for (const sp of sharedPosts) {
      const match = baseSeed.find((c) => c.name.toLowerCase() === sp.recipientName.toLowerCase());
      if (match) {
        match.lastMessage = `↪ Shared from ${sp.authorName}: ${sp.content.split("\n")[0]}`;
        match.timestamp = "now";
        if (!sp.read) match.unread = (match.unread || 0) + 1;
        (match as Conversation).sharedPost = sp;
      } else {
        unmatchedShared.push(sp);
      }
    }
    const extraSharedConvs: Conversation[] = unmatchedShared.map((item) => ({
      id: item.id,
      name: item.recipientName === "My Profile" ? "Saved to My Profile" : item.recipientName,
      avatar: item.authorAvatar || item.authorName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "SP",
      avatarUrl: item.authorPhoto || undefined,
      lastMessage: `↪ Shared from ${item.authorName}: ${item.content.split("\n")[0]}`,
      timestamp: "now",
      unread: item.read ? 0 : 1,
      isOnline: false,
      department: item.recipientName === "My Profile" ? "Saved" : "Direct",
      sharedPost: item,
    }));

    if (!isAdmin) return [...extraSharedConvs, ...onbConvs, ...baseSeed];
    const last = prRequests[0];
    const prConv: Conversation = {
      id: "pr-external",
      name: "PR Service Requests (External)",
      avatar: "PR",
      lastMessage: last ? `${last.company}: ${last.subject || last.message}` : "No requests yet",
      timestamp: last ? "now" : "",
      unread: prRequests.length,
      isOnline: false,
      department: "Channel",
    };
    return [...extraSharedConvs, ...onbConvs, prConv, ...baseSeed];
  }, [isAdmin, prRequests, onboardingConvs, sharedPosts]);

  const filteredConversations = allConversations.filter((conv) => {
    if (activeFilter === "unread" && conv.unread === 0) return false;
    if (activeFilter === "direct" && conv.department === "Group") return false;
    if (activeFilter === "groups" && conv.department !== "Group" && conv.department !== "Channel") return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      // global search: name + last message content
      if (!conv.name.toLowerCase().includes(q) && !conv.lastMessage.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // Show chat detail view when a conversation is selected
  if (selectedConversation) {
    return (
      <ChatDetailView
        conversation={selectedConversation}
        onBack={() => setSelectedConversation(null)}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col pb-24">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-h2 text-foreground">Messages</h1>
          <Button
            variant="cyan"
            size="icon"
            onClick={() => {
              if (!initiateCheck.allowed) {
                toast.error(denyMessage(initiateCheck.reason!));
                return;
              }
            }}
            title={initiateCheck.allowed ? "New conversation" : denyMessage(initiateCheck.reason!)}
          >
            {initiateCheck.allowed ? <Plus className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages, people or content"
            className="w-full bg-muted pl-10 pr-4 py-2.5 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 mt-4 overflow-x-auto hide-scrollbar">
          {[
            { id: "all", label: "All" },
            { id: "unread", label: "Unread", count: 7 },
            { id: "direct", label: "Direct" },
            { id: "groups", label: "Groups" },
          ].map((filter) => (
            <Button
              key={filter.id}
              variant={activeFilter === filter.id ? "cyan" : "glass"}
              size="sm"
              onClick={() => setActiveFilter(filter.id as typeof activeFilter)}
            >
              {filter.label}
              {filter.count && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-accent text-accent-foreground text-xs rounded-full">
                  {filter.count}
                </span>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredConversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => {
              if (conv.sharedPost) sharedPostsStore.markRead(conv.sharedPost.id);
              setSelectedConversation(conv);
            }}
            className="w-full p-4 flex gap-3 hover:bg-muted/50 transition-colors border-b border-border/30 active:bg-muted/70"
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {conv.avatarUrl ? (
                <img
                  src={conv.avatarUrl}
                  alt={conv.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm",
                    conv.unread > 0
                      ? "bg-gradient-to-br from-primary to-accent text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}
                >
                  {conv.avatar}
                </div>
              )}
              {conv.isOnline && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center justify-between mb-1">
                <span
                  className={cn(
                    "font-medium truncate",
                    conv.unread > 0 ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {conv.name}
                </span>
                <span className="text-caption text-muted-foreground flex-shrink-0 ml-2">
                  {conv.timestamp}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-caption text-muted-foreground truncate pr-2">
                  {conv.lastMessage}
                </p>
                {conv.unread > 0 ? (
                  <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                    {conv.unread}
                  </span>
                ) : (
                  <CheckCheck className="w-4 h-4 text-primary flex-shrink-0" />
                )}
              </div>
              <span
                className={cn(
                  "inline-block mt-1 text-xs px-2 py-0.5 rounded-full",
                  conv.department === "Group" || conv.department === "Channel"
                    ? "bg-accent/20 text-accent"
                    : "bg-primary/20 text-primary"
                )}
              >
                {conv.department}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
