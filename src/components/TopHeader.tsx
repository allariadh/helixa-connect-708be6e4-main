import { useEffect, useState } from "react";
import { Bell, Search, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBranding } from "@/contexts/BrandingContext";
import { cn } from "@/lib/utils";
import { notificationStore, HelixaNotification } from "@/lib/notificationStore";

interface TopHeaderProps {
  unreadNotifications?: number;
}

const THEME_KEY = "helixa-theme";

export const TopHeader = ({ unreadNotifications = 0 }: TopHeaderProps) => {
  const { companyName } = useBranding();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<HelixaNotification[]>(notificationStore.list());
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(THEME_KEY) === "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    const syncNotifications = () => setNotifications(notificationStore.list());
    const syncTheme = () => setIsDark(localStorage.getItem(THEME_KEY) === "dark");
    window.addEventListener("helixa-notifications-changed", syncNotifications);
    window.addEventListener("helixa-theme-changed", syncTheme);
    return () => {
      window.removeEventListener("helixa-notifications-changed", syncNotifications);
      window.removeEventListener("helixa-theme-changed", syncTheme);
    };
  }, []);

  const unread = notifications.filter((n) => !n.read).length || unreadNotifications;

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="min-w-0">
          <span className="text-lg font-bold gradient-text truncate">{companyName}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme toggle pill */}
          <button
            type="button"
            onClick={() => setIsDark((d) => !d)}
            aria-label="Toggle theme"
            className={cn(
              "relative w-[46px] h-[26px] rounded-full transition-colors duration-300 border border-border/60",
              isDark ? "bg-foreground/80" : "bg-muted"
            )}
          >
            <span
              className={cn(
                "absolute top-[2px] left-[2px] w-[20px] h-[20px] rounded-full bg-background shadow flex items-center justify-center transition-transform duration-300",
                isDark && "translate-x-[20px]"
              )}
            >
              {isDark ? (
                <Moon className="w-[10px] h-[10px] text-foreground" />
              ) : (
                <Sun className="w-[10px] h-[10px] text-foreground" />
              )}
            </span>
          </button>

          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Search className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground relative"
            onClick={() => {
              setShowNotifications((v) => !v);
              notificationStore.markAllRead();
            }}
          >
            <Bell className="w-5 h-5" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-accent text-accent-foreground text-xs rounded-full flex items-center justify-center">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-semibold text-sm ml-1">
            JD
          </div>
        </div>
      </div>
      {showNotifications && (
        <div className="absolute right-4 top-[58px] w-[min(360px,calc(100vw-2rem))] glass-card p-3 z-50 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <p className="text-body font-semibold text-foreground">Notifications</p>
            <button className="text-caption text-primary" onClick={() => notificationStore.markAllRead()}>Mark read</button>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
            {notifications.map((n) => (
              <div key={n.id} className="bg-muted/60 rounded-xl p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-body font-medium text-foreground">{n.title}</p>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-primary mt-1.5" />}
                </div>
                <p className="text-caption text-muted-foreground mt-1">{n.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
