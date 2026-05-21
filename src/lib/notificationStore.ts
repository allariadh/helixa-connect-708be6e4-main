export interface HelixaNotification {
  id: string;
  title: string;
  body: string;
  type: "message" | "call" | "application" | "system";
  read: boolean;
  date: string;
}

const KEY = "helixa-notifications";

const fallback: HelixaNotification[] = [
  { id: "n1", title: "New message", body: "Yasmine Benali sent you an update.", type: "message", read: false, date: "now" },
  { id: "n2", title: "Recruitment inbox", body: "Applications and CVs appear in Job Offers & Applications.", type: "application", read: false, date: "today" },
  { id: "n3", title: "Secure calls", body: "Voice, video, and screen share are ready.", type: "call", read: true, date: "today" },
];

const read = (): HelixaNotification[] => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const write = (items: HelixaNotification[]) => {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
};

export const notificationStore = {
  list: read,
  unreadCount: () => read().filter((n) => !n.read).length,
  add: (payload: Omit<HelixaNotification, "id" | "read" | "date">) => {
    const created: HelixaNotification = { ...payload, id: `notif-${Date.now()}`, read: false, date: "now" };
    write([created, ...read()]);
    window.dispatchEvent(new Event("helixa-notifications-changed"));
    return created;
  },
  markAllRead: () => {
    write(read().map((n) => ({ ...n, read: true })));
    window.dispatchEvent(new Event("helixa-notifications-changed"));
  },
};

export const playIncomingNotification = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.value = 0.05;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.14);
  } catch {}
};