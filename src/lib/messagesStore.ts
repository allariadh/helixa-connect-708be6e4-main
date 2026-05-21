// Lightweight shared store for onboarding-triggered conversations.
// Decoupled from MessagesScreen seed list — additive layer only.

export interface OnboardingConversation {
  id: string;
  employeeName: string;
  createdAt: number;
  welcomeFr: string;
  welcomeAr: string;
}

export interface SharedPostMessage {
  id: string;
  recipientId: string;
  recipientName: string;
  authorName: string;
  authorPhoto?: string | null;
  authorAvatar?: string;
  content: string;
  createdAt: number;
  read?: boolean;
}

const KEY = "helixa_onboarding_conversations";
const PENDING_KEY = "helixa_pending_onboarding_chat";
const SHARED_POSTS_KEY = "helixa_shared_post_messages";

const read = (): OnboardingConversation[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
};

export const onboardingStore = {
  list: read,
  create(employeeName: string): OnboardingConversation {
    const conv: OnboardingConversation = {
      id: `onb-${Date.now()}`,
      employeeName,
      createdAt: Date.now(),
      welcomeFr: `Bienvenue chez Helixa, ${employeeName} ! Voici votre fil d'onboarding. Toute l'équipe RH est disponible ici.`,
      welcomeAr: `مرحباً بك في هيلكسا يا ${employeeName}! هذا فضاء التهيئة الخاص بك. فريق الموارد البشرية متواجد هنا لمساعدتك.`,
    };
    const next = [conv, ...read()];
    localStorage.setItem(KEY, JSON.stringify(next));
    localStorage.setItem(PENDING_KEY, conv.id);
    window.dispatchEvent(new Event("helixa-onboarding-created"));
    return conv;
  },
  consumePending(): string | null {
    const id = localStorage.getItem(PENDING_KEY);
    if (id) localStorage.removeItem(PENDING_KEY);
    return id;
  },
  peekPending(): string | null {
    return localStorage.getItem(PENDING_KEY);
  },
};

const readSharedPosts = (): SharedPostMessage[] => {
  try {
    return JSON.parse(localStorage.getItem(SHARED_POSTS_KEY) || "[]");
  } catch {
    return [];
  }
};

export const sharedPostsStore = {
  list: readSharedPosts,
  share(post: { authorName: string; content: string; authorPhoto?: string | null; authorAvatar?: string }, recipients: { id: string; name: string }[]) {
    const now = Date.now();
    const created = recipients.map((recipient, index) => ({
      id: `shared-${now}-${recipient.id}-${index}`,
      recipientId: recipient.id,
      recipientName: recipient.name,
      authorName: post.authorName,
      authorPhoto: post.authorPhoto || null,
      authorAvatar: post.authorAvatar,
      content: post.content,
      createdAt: now,
      read: false,
    }));
    localStorage.setItem(SHARED_POSTS_KEY, JSON.stringify([...created, ...readSharedPosts()]));
    window.dispatchEvent(new Event("helixa-shared-post-created"));
    return created;
  },
  markRead(id: string) {
    const next = readSharedPosts().map((item) => item.id === id ? { ...item, read: true } : item);
    localStorage.setItem(SHARED_POSTS_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("helixa-shared-post-created"));
  },
  forRecipient(recipientName: string) {
    return readSharedPosts().filter((item) => item.recipientName === recipientName);
  },
};
