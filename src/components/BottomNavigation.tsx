import { Home, MessageCircle, Hexagon, Search, User, Phone, Target } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = "home" | "messages" | "ai" | "search" | "profile" | "contact" | "operations";

interface BottomNavigationProps {
  activeTab: NavItem;
  onTabChange: (tab: NavItem) => void;
  unreadMessages?: number;
}

const navItems: { id: NavItem; icon: typeof Home; label: string }[] = [
  { id: "home", icon: Home, label: "Home" },
  { id: "operations", icon: Target, label: "Ops" },
  { id: "messages", icon: MessageCircle, label: "Chat" },
  { id: "ai", icon: Hexagon, label: "AI" },
  { id: "search", icon: Search, label: "Search" },
  { id: "contact", icon: Phone, label: "PR" },
  { id: "profile", icon: User, label: "Profile" },
];

export const BottomNavigation = ({
  activeTab,
  onTabChange,
  unreadMessages = 0,
}: BottomNavigationProps) => {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-tactical-border"
      style={{
        backgroundColor: "hsl(var(--tactical-charcoal) / 0.7)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <div className="flex items-center gap-1 px-2 py-2 max-w-2xl mx-auto overflow-x-auto hide-scrollbar">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const isAI = item.id === "ai";

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 p-1.5 rounded-xl transition-all duration-300 shrink-0 min-w-[48px]",
                isActive && !isAI && "text-primary",
                !isActive && "text-muted-foreground",
                isAI && "relative -mt-6"
              )}
            >
              {isAI ? (
                <div
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300",
                    isActive
                      ? "bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/40"
                      : "bg-muted border border-border"
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-6 h-6 transition-all",
                      isActive ? "text-primary-foreground" : "text-muted-foreground"
                    )}
                  />
                </div>
              ) : (
                <div className="relative">
                  <item.icon
                    className={cn(
                      "w-5 h-5 transition-all duration-300",
                      isActive && "glow-cyan"
                    )}
                  />
                  {item.id === "messages" && unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-tactical-signal text-white text-xs rounded-full flex items-center justify-center">
                      {unreadMessages > 9 ? "9+" : unreadMessages}
                    </span>
                  )}
                </div>
              )}

              <span
                className={cn(
                  "text-[10px] transition-all duration-300",
                  isActive ? "text-primary font-medium" : "text-muted-foreground",
                  isAI && "mt-1"
                )}
              >
                {item.label}
              </span>

              {isActive && !isAI && (
                <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
