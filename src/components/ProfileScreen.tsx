import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Settings,
  Edit,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  FileText,
  Shield,
  Bell,
  Palette,
  LogOut,
  ChevronRight,
  Languages,
  Check,
  Users as UsersIcon,
  Camera,
  Trash2,
  Star,
  Plus,
  Facebook,
  Instagram,
  Linkedin,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/contexts/SessionContext";
import { toast } from "sonner";
import { archiveStore, ArchivedFileItem } from "@/lib/archiveStore";

type UserProfile = {
  photo: string | null;
  name: string;
  title: string;
  department: string;
  email: string;
  phone: string;
  location: string;
  joinedAt: string;
};

interface ProfileScreenProps {
  onOpenTeam?: () => void;
  onOpenJobs?: () => void;
  onLogout?: () => void;
}

interface AchievementItem {
  id: string;
  label: string;
  description: string;
  awardedBy?: string;
  stars?: number;
}

interface Competitor {
  id: string;
  name: string;
  facebook: string;
  instagram: string;
  linkedin: string;
}

const languages = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "fr", label: "French", nativeLabel: "Français" },
  { code: "ar", label: "Arabic", nativeLabel: "العربية" },
];

const settingsItems = [
  { icon: Bell, label: "Notifications", description: "Manage your alerts" },
  { icon: Shield, label: "Privacy & Security", description: "Account protection" },
  { icon: Palette, label: "Appearance", description: "Theme and display" },
];

const STORAGE_KEY = "helixa-profile";
const COMPETITORS_KEY = "helixa-competitors";
const THEME_KEY = "helixa-theme";

const createDefaultProfile = (userId: string | null): UserProfile => ({
  photo: null,
  name: userId && userId.includes("@") ? userId.split("@")[0] : "Yacine Amrani",
  title: "Senior PR Strategist",
  department: "Communications Department",
  email: userId && userId.includes("@") ? userId : "user@helixa.dz",
  phone: "+213 555 00 00 00",
  location: "Algiers, Algeria",
  joinedAt: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
});

const normalizeProfile = (value: unknown, userId: string | null): UserProfile => {
  const fallback = createDefaultProfile(userId);
  if (!value || typeof value !== "object") return fallback;
  const source = value as Partial<UserProfile>;
  return {
    photo: typeof source.photo === "string" ? source.photo : null,
    name: typeof source.name === "string" && source.name.trim() ? source.name : fallback.name,
    title: typeof source.title === "string" && source.title.trim() ? source.title : fallback.title,
    department: typeof source.department === "string" && source.department.trim() ? source.department : fallback.department,
    email: typeof source.email === "string" && source.email.trim() ? source.email : fallback.email,
    phone: typeof source.phone === "string" && source.phone.trim() ? source.phone : fallback.phone,
    location: typeof source.location === "string" && source.location.trim() ? source.location : fallback.location,
    joinedAt: typeof source.joinedAt === "string" && source.joinedAt.trim() ? source.joinedAt : fallback.joinedAt,
  };
};

export const ProfileScreen = ({ onOpenTeam, onOpenJobs, onLogout }: ProfileScreenProps = {}) => {
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [settingsPanel, setSettingsPanel] = useState<null | "notifications" | "security" | "appearance">(null);
  const [notificationsOn, setNotificationsOn] = useState(() => localStorage.getItem("helixa-notifications-enabled") !== "false");
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [activeTab, setActiveTab] = useState<"files" | "achievements">("files");
  const { actor, signOut } = useSession();
  const isCeo = actor.role === "ROLE_CEO";

  // Dynamic personal info — pulled from session/account
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return normalizeProfile(JSON.parse(raw), actor.userId);
    } catch {}
    return createDefaultProfile(actor.userId);
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(profile)); } catch {}
  }, [profile]);

  const photoInput = useRef<HTMLInputElement | null>(null);
  const onPickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setProfile((p) => ({ ...p, photo: reader.result as string }));
    reader.readAsDataURL(f);
  };
  const removePhoto = () => setProfile((p) => ({ ...p, photo: null }));

  // Files archived from Deep AI Analysis + in-app shares
  const [files, setFiles] = useState<ArchivedFileItem[]>(archiveStore.list());
  useEffect(() => {
    const sync = () => setFiles(archiveStore.list());
    window.addEventListener("helixa-archive-changed", sync);
    return () => window.removeEventListener("helixa-archive-changed", sync);
  }, []);

  // Achievements driven by Operations + CEO-awarded stars
  const achievements: AchievementItem[] = [
    { id: "a1", label: "Operations Champion", description: "Completed 24 enterprise tasks on time" },
    { id: "a2", label: "Top Contributor", description: "CEO-awarded recognition", awardedBy: "CEO", stars: 5 },
    { id: "a3", label: "Crisis Responder", description: "Led 3 escalated operations to resolution" },
  ];

  // Competitor pages (CEO only)
  const [competitors, setCompetitors] = useState<Competitor[]>(() => {
    try {
      const raw = localStorage.getItem(COMPETITORS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });
  const [newComp, setNewComp] = useState<Competitor>({ id: "", name: "", facebook: "", instagram: "", linkedin: "" });
  const [showCompForm, setShowCompForm] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(COMPETITORS_KEY, JSON.stringify(competitors)); } catch {}
  }, [competitors]);

  const addCompetitor = () => {
    if (!newComp.name.trim()) return toast.error("Competitor name required");
    if (competitors.length >= 5) return toast.error("Maximum 5 competitors");
    setCompetitors((p) => [...p, { ...newComp, id: `c${Date.now()}` }]);
    setNewComp({ id: "", name: "", facebook: "", instagram: "", linkedin: "" });
    setShowCompForm(false);
    toast.success("Competitor added — PNMS AI will analyze");
  };

  const applyTheme = (mode: "light" | "dark") => {
    document.documentElement.classList.toggle("dark", mode === "dark");
    localStorage.setItem(THEME_KEY, mode);
    window.dispatchEvent(new Event("helixa-theme-changed"));
    toast.success(`${mode === "dark" ? "Dark" : "Light"} theme applied`);
  };

  const toggleNotifications = () => {
    const next = !notificationsOn;
    setNotificationsOn(next);
    localStorage.setItem("helixa-notifications-enabled", String(next));
    toast.success(next ? "Notifications enabled" : "Notifications muted");
  };

  return (
    <div className="flex-1 overflow-y-auto pb-24 custom-scrollbar">
      {/* Language Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card p-6 w-full max-w-sm animate-scale-in">
            <h3 className="text-h3 text-foreground mb-4 text-center">Select Language</h3>
            <div className="space-y-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => { setSelectedLanguage(lang.code); setShowLanguageModal(false); }}
                  className={cn(
                    "w-full p-4 rounded-xl flex items-center justify-between transition-colors",
                    selectedLanguage === lang.code ? "bg-primary/20 border border-primary" : "bg-muted hover:bg-muted/80"
                  )}
                >
                  <div className="text-left">
                    <p className="text-body font-medium text-foreground">{lang.label}</p>
                    <p className="text-caption text-muted-foreground">{lang.nativeLabel}</p>
                  </div>
                  {selectedLanguage === lang.code && <Check className="w-5 h-5 text-primary" />}
                </button>
              ))}
            </div>
            <Button variant="glass" className="w-full mt-4" onClick={() => setShowLanguageModal(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Header/Banner */}
      <div className="h-32 bg-gradient-to-br from-primary/30 to-accent/30 relative">
        <div className="absolute top-4 right-4 flex gap-2">
          <Button variant="glass" size="icon"><Settings className="w-5 h-5" /></Button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="px-4 -mt-16 relative z-10">
        <div className="glass-card p-6">
          <div className="flex flex-col items-center text-center">
            {/* Clickable Avatar */}
            <input ref={photoInput} type="file" accept="image/*" className="hidden" onChange={onPickPhoto} />
            <div className="relative -mt-16 mb-4">
              <button
                onClick={() => photoInput.current?.click()}
                className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent p-1 overflow-hidden block"
                aria-label="Change profile picture"
              >
                <div className="w-full h-full rounded-full bg-card flex items-center justify-center text-2xl font-bold text-foreground overflow-hidden">
                  {profile.photo ? (
                    <img src={profile.photo} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    profile.name.split(" ").map((s: string) => s[0]).join("").slice(0, 2).toUpperCase()
                  )}
                </div>
              </button>
              <button
                onClick={() => photoInput.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg"
                aria-label="Upload picture"
              >
                <Camera className="w-4 h-4 text-primary-foreground" />
              </button>
              {profile.photo && (
                <button
                  onClick={removePhoto}
                  className="absolute bottom-0 left-0 w-8 h-8 bg-destructive rounded-full flex items-center justify-center shadow-lg"
                  aria-label="Remove picture"
                >
                  <Trash2 className="w-4 h-4 text-destructive-foreground" />
                </button>
              )}
            </div>

            <input
              value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
              placeholder="Your full name"
              className="text-h2 text-foreground bg-transparent text-center focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-lg px-2 w-full"
            />
            <input
              value={profile.title}
              onChange={(e) => setProfile((p) => ({ ...p, title: e.target.value }))}
              placeholder="Your title"
              className="text-body text-muted-foreground bg-transparent text-center focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-lg px-2 w-full mb-2"
            />
            <input
              value={profile.department}
              onChange={(e) => setProfile((p) => ({ ...p, department: e.target.value }))}
              placeholder="Department"
              className="inline-flex items-center px-3 py-1 bg-primary/20 text-primary rounded-full text-caption mb-2 text-center focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>
      </div>

      {/* Contact Info — editable */}
      <div className="px-4 mt-4">
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-primary flex-shrink-0" />
            <input
              value={profile.email}
              onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
              className="flex-1 bg-transparent text-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-lg px-2"
            />
          </div>
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-primary flex-shrink-0" />
            <input
              value={profile.phone}
              onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
              className="flex-1 bg-transparent text-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-lg px-2"
            />
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
            <input
              value={profile.location}
              onChange={(e) => setProfile((p) => ({ ...p, location: e.target.value }))}
              className="flex-1 bg-transparent text-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-lg px-2"
            />
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <Calendar className="w-5 h-5 text-primary" />
            <span className="text-body">Joined {profile.joinedAt}</span>
          </div>
        </div>
      </div>




      {/* Tabs — Files + Achievements (Activity removed) */}
      <div className="px-4 mt-6">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-4">
          <Button variant={activeTab === "files" ? "cyan" : "glass"} size="sm" onClick={() => setActiveTab("files")}>
            <FileText className="w-4 h-4 mr-2" /> Files
          </Button>
          <Button variant={activeTab === "achievements" ? "cyan" : "glass"} size="sm" onClick={() => setActiveTab("achievements")}>
            <Award className="w-4 h-4 mr-2" /> Achievements
          </Button>
        </div>

        {/* Files Tab */}
        {activeTab === "files" && (
          <div className="space-y-3 mb-6">
            <p className="text-caption text-muted-foreground">
              Archives from Deep AI Analysis and in-app file shares.
            </p>
            {files.map((f) => (
              <div key={f.id} className="glass-card p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body font-medium text-foreground truncate">{f.name}</p>
                  <p className="text-caption text-muted-foreground">{f.source} · {f.size} · {f.date}</p>
                </div>
                {f.url ? (
                  <a href={f.url} download={f.name} className="h-9 w-9 rounded-lg glass-card flex items-center justify-center" aria-label="Open archived file">
                    <Eye className="w-4 h-4" />
                  </a>
                ) : (
                  <Button variant="glass" size="icon" onClick={() => toast.info("Archived report is available from its original workspace.")}><Eye className="w-4 h-4" /></Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === "achievements" && (
          <div className="space-y-3 mb-6">
            <p className="text-caption text-muted-foreground">
              Earned through Operations performance and CEO recognition.
            </p>
            {achievements.map((a) => (
              <div key={a.id} className="glass-card p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <Award className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-body font-medium text-foreground">{a.label}</p>
                  <p className="text-caption text-muted-foreground">{a.description}</p>
                </div>
                {a.stars && (
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: a.stars }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Competitor Pages — CEO only */}
        {isCeo && (
          <div className="glass-card p-4 mb-6 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-h3 text-foreground">Competitor Pages</h3>
                <p className="text-caption text-muted-foreground">Up to 5 — used by PNMS AI for comparative analysis.</p>
              </div>
              <Button variant="cyan" size="icon" onClick={() => setShowCompForm((v) => !v)} disabled={competitors.length >= 5}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {showCompForm && (
              <div className="space-y-2 pt-2 border-t border-border/30">
                <input
                  value={newComp.name}
                  onChange={(e) => setNewComp({ ...newComp, name: e.target.value })}
                  placeholder="Competitor name *"
                  className="w-full bg-muted px-3 py-2 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                />
                <div className="relative">
                  <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input value={newComp.facebook} onChange={(e) => setNewComp({ ...newComp, facebook: e.target.value })} placeholder="Facebook URL" className="w-full bg-muted pl-9 pr-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div className="relative">
                  <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input value={newComp.instagram} onChange={(e) => setNewComp({ ...newComp, instagram: e.target.value })} placeholder="Instagram URL" className="w-full bg-muted pl-9 pr-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div className="relative">
                  <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input value={newComp.linkedin} onChange={(e) => setNewComp({ ...newComp, linkedin: e.target.value })} placeholder="LinkedIn URL (optional)" className="w-full bg-muted pl-9 pr-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <Button onClick={addCompetitor} variant="hero" size="sm" className="w-full">Add Competitor</Button>
              </div>
            )}

            <div className="space-y-2">
              {competitors.length === 0 && <p className="text-caption text-muted-foreground">No competitors added yet.</p>}
              {competitors.map((c) => (
                <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/40">
                  <div className="flex-1 min-w-0">
                    <p className="text-body font-medium text-foreground truncate">{c.name}</p>
                    <div className="flex gap-2 text-muted-foreground">
                      {c.facebook && <Facebook className="w-3.5 h-3.5" />}
                      {c.instagram && <Instagram className="w-3.5 h-3.5" />}
                      {c.linkedin && <Linkedin className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setCompetitors((p) => p.filter((x) => x.id !== c.id))}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings */}
        <h3 className="text-h3 text-foreground mb-3">Settings</h3>
        <div className="glass-card overflow-hidden mb-6">
          <button
            onClick={() => setShowLanguageModal(true)}
            className="w-full p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors border-b border-border/30"
          >
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <Languages className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-body font-medium text-foreground">Language</p>
              <p className="text-caption text-muted-foreground">{languages.find(l => l.code === selectedLanguage)?.nativeLabel}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          {settingsItems.map((item, index) => (
            <button
              key={item.label}
              onClick={() => setSettingsPanel(item.label === "Notifications" ? "notifications" : item.label === "Appearance" ? "appearance" : "security")}
              className={cn(
                "w-full p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors",
                index !== settingsItems.length - 1 && "border-b border-border/30"
              )}
            >
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-body font-medium text-foreground">{item.label}</p>
                <p className="text-caption text-muted-foreground">{item.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          ))}
        </div>

        {settingsPanel && (
          <div className="glass-card p-4 mb-6 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <h4 className="text-body font-semibold text-foreground">
                {settingsPanel === "notifications" ? "Notification Settings" : settingsPanel === "appearance" ? "Appearance Settings" : "Privacy & Security"}
              </h4>
              <Button variant="ghost" size="sm" onClick={() => setSettingsPanel(null)}>Close</Button>
            </div>
            {settingsPanel === "notifications" && (
              <button onClick={toggleNotifications} className="w-full bg-muted/60 rounded-xl p-3 flex items-center justify-between text-left">
                <div>
                  <p className="text-body text-foreground">Message, CV, and call notifications</p>
                  <p className="text-caption text-muted-foreground">Incoming alerts only — no outgoing call sound.</p>
                </div>
                <span className={cn("px-3 py-1 rounded-full text-caption", notificationsOn ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>{notificationsOn ? "On" : "Off"}</span>
              </button>
            )}
            {settingsPanel === "appearance" && (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="glass" onClick={() => applyTheme("light")}>Light</Button>
                <Button variant="cyan" onClick={() => applyTheme("dark")}>Dark</Button>
              </div>
            )}
            {settingsPanel === "security" && (
              <div className="bg-muted/60 rounded-xl p-3">
                <p className="text-body text-foreground">Secure enterprise session</p>
                <p className="text-caption text-muted-foreground">Internal requests, PR services, CVs, and files remain scoped to your company workspace.</p>
              </div>
            )}
          </div>
        )}

        {/* CEO-only Manage Team entry */}
        {isCeo && (
          <button
            onClick={onOpenTeam}
            className="w-full glass-card p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors mb-4 text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
              <UsersIcon className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-body font-medium text-foreground">Manage Team</p>
              <p className="text-caption text-muted-foreground">Create and manage employee accounts</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        )}

        {/* CEO/Manager — Job Offers & Applications */}
        {(actor.role === "ROLE_CEO" || actor.role === "ROLE_MANAGER") && (
          <button
            onClick={onOpenJobs}
            className="w-full glass-card p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors mb-4 text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-body font-medium text-foreground">Job Offers & Applications</p>
              <p className="text-caption text-muted-foreground">Post jobs · review CVs in Recruitment Inbox</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        )}

        <Button variant="destructive" className="w-full mb-4" onClick={() => { signOut(); onLogout?.(); toast.success("Logged out"); }}>
          <LogOut className="w-5 h-5 mr-2" /> Log Out
        </Button>
      </div>
    </div>
  );
};
