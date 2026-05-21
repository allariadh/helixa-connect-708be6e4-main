import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Plus, ShieldCheck, Stamp, WifiOff, User, Lock, Briefcase, AlertOctagon, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/contexts/SessionContext";
import { denyMessage } from "@/lib/permissions";
import { toast } from "sonner";

type Priority = "Low" | "Medium" | "High";
type Context = "government" | "factory" | "corporate";
type LifecycleStatus = "CREATED" | "ASSIGNED" | "IN_PROGRESS" | "SYNCED" | "COMPLETED" | "ESCALATED";

interface Task {
  id: string;
  name: string;
  officer: string;
  deadline: string;
  priority: Priority;
  completed: boolean;
  context: Context;
  status?: LifecycleStatus;
  type?: "CRISIS" | "COMPLIANCE" | "COMMUNICATION" | "SAFETY_TECHNICAL";
  tags?: string[];
}

const initialTasks: Task[] = [
  { id: "1", name: "Crisis briefing — Sonatrach refinery", officer: "Cpt. Belkacem", deadline: new Date(Date.now() + 1000 * 60 * 60 * 6).toISOString(), priority: "High", completed: false, context: "factory", status: "IN_PROGRESS", type: "CRISIS", tags: ["FIELD_WORKFLOW"] },
  { id: "2", name: "Quarterly compliance report", officer: "Lt. Hamidi", deadline: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(), priority: "Medium", completed: false, context: "government", status: "ASSIGNED", type: "COMPLIANCE", tags: ["OFFICIAL_STAMP"] },
  { id: "3", name: "Press release — infrastructure rollout", officer: "Off. Saadi", deadline: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(), priority: "High", completed: true, context: "government", status: "COMPLETED", type: "COMMUNICATION" },
  { id: "4", name: "Plant safety bulletin v3", officer: "Eng. Bouzid", deadline: new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString(), priority: "Low", completed: true, context: "factory", status: "SYNCED", type: "SAFETY_TECHNICAL" },
];

const personalSeed: Task[] = [
  { id: "p1", name: "Review Q2 PR brief", officer: "You", deadline: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), priority: "Medium", completed: false, context: "corporate", status: "IN_PROGRESS" },
  { id: "p2", name: "Draft internal memo", officer: "You", deadline: new Date(Date.now() + 1000 * 60 * 60 * 5).toISOString(), priority: "High", completed: false, context: "corporate", status: "ASSIGNED" },
];

const formatCountdown = (iso: string) => {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "Overdue";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h >= 24 ? `${Math.floor(h / 24)}d ${h % 24}h` : `${h}h ${m}m`;
};

const priorityClass = (p: Priority) =>
  p === "High"
    ? "bg-tactical-signal/15 text-tactical-signal border-tactical-signal/40"
    : p === "Medium"
    ? "bg-tactical-steel/15 text-tactical-steel border-tactical-steel/40"
    : "bg-muted text-muted-foreground border-tactical-border";

const OFFLINE_QUEUE_KEY = "helixa-offline-events";

export const OperationsScreen = () => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [personal, setPersonal] = useState<Task[]>(personalSeed);
  const [offline, setOffline] = useState(typeof navigator !== "undefined" && !navigator.onLine);
  const [queueSize, setQueueSize] = useState<number>(0);
  const [tab, setTab] = useState<"enterprise" | "personal">("enterprise");
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({ name: "", officer: "", deadlineHours: 24, priority: "Medium" as Priority });
  const { can } = useSession();
  const createCheck = can("operations.create");

  // Offline-first sync — flush queue on reconnect (server timestamp wins is server-side concern)
  useEffect(() => {
    const readQueue = () => {
      try {
        const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch { return []; }
    };
    setQueueSize(readQueue().length);
    const onOnline = () => {
      setOffline(false);
      const q = readQueue();
      if (q.length) {
        toast.success(`${q.length} change${q.length > 1 ? "s" : ""} synced`);
        localStorage.setItem(OFFLINE_QUEUE_KEY, "[]");
        setQueueSize(0);
      }
    };
    const onOffline = () => setOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const enqueueOffline = (event: object) => {
    if (!offline) return;
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      arr.push({ ...event, ts: Date.now() });
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(arr));
      setQueueSize(arr.length);
    } catch {}
  };

  const toggle = (id: string, list: "enterprise" | "personal") => {
    const update = (prev: Task[]) =>
      prev.map(t => (t.id === id ? { ...t, completed: !t.completed, status: !t.completed ? "COMPLETED" : "IN_PROGRESS" as LifecycleStatus } : t));
    if (list === "enterprise") setTasks(update); else setPersonal(update);
    enqueueOffline({ type: "TASK_TOGGLE", id });
  };

  const handleNew = () => {
    if (tab === "enterprise" && !createCheck.allowed) {
      toast.error(denyMessage(createCheck.reason!));
      return;
    }
    setShowForm((v) => !v);
  };

  const submitNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) {
      toast.error("Task name required");
      return;
    }
    const newTask: Task = {
      id: `t-${Date.now()}`,
      name: draft.name.trim(),
      officer: draft.officer.trim() || (tab === "personal" ? "You" : "Unassigned"),
      deadline: new Date(Date.now() + draft.deadlineHours * 3600 * 1000).toISOString(),
      priority: draft.priority,
      completed: false,
      context: tab === "personal" ? "corporate" : "corporate",
      status: tab === "personal" ? "ASSIGNED" : "CREATED",
    };
    if (tab === "enterprise") setTasks((p) => [newTask, ...p]); else setPersonal((p) => [newTask, ...p]);
    enqueueOffline({ type: "TASK_CREATE", task: newTask });
    toast.success(tab === "enterprise" ? "Operation created" : "Task added");
    setDraft({ name: "", officer: "", deadlineHours: 24, priority: "Medium" });
    setShowForm(false);
  };

  const deleteTask = (id: string, list: "enterprise" | "personal") => {
    if (list === "enterprise" && !createCheck.allowed) {
      toast.error(denyMessage(createCheck.reason!));
      return;
    }
    if (list === "enterprise") setTasks((p) => p.filter((t) => t.id !== id));
    else setPersonal((p) => p.filter((t) => t.id !== id));
    enqueueOffline({ type: "TASK_DELETE", id });
    toast.success("Task deleted");
  };

  const clearBoard = () => {
    if (tab === "enterprise" && !createCheck.allowed) {
      toast.error(denyMessage(createCheck.reason!));
      return;
    }
    if (tab === "enterprise") setTasks([]); else setPersonal([]);
    enqueueOffline({ type: "BOARD_CLEAR", board: tab });
    toast.success(tab === "enterprise" ? "Enterprise board cleared" : "Personal board cleared");
  };

  const visible = tab === "enterprise" ? tasks : personal;

  return (
    <div className="flex-1 px-4 py-4 space-y-4 max-w-2xl mx-auto w-full">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-tactical-text">Operations</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Field workflow · Offline-first</p>
        </div>
        <Button
          size="sm"
          onClick={() => setOffline(!offline)}
          className={cn(
            "gap-1 border",
            offline ? "bg-tactical-signal/15 text-tactical-signal border-tactical-signal/40" : "bg-tactical-steel/15 text-tactical-steel border-tactical-steel/40"
          )}
        >
          <WifiOff className="w-3.5 h-3.5" /> {offline ? `Offline · ${queueSize} queued` : "Synced"}
        </Button>
      </header>

      {/* Tabs (additive) */}
      <div className="flex gap-2 p-1 bg-muted rounded-xl">
        {(["enterprise", "personal"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5",
              tab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            )}
          >
            {t === "enterprise" ? <Briefcase className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
            {t === "enterprise" ? "Enterprise Board" : "My Tasks"}
          </button>
        ))}
      </div>

      <Button
        onClick={handleNew}
        className="w-full gap-2 bg-tactical-steel text-white hover:bg-tactical-steel/90 h-11 rounded-xl disabled:opacity-60"
        disabled={!createCheck.allowed && tab === "enterprise"}
        title={createCheck.allowed ? "" : denyMessage(createCheck.reason!)}
      >
        {createCheck.allowed ? <Plus className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
        {tab === "enterprise" ? "New Operation" : "New Personal Task"}
      </Button>

      {visible.length > 0 && (
        <Button variant="glass" onClick={clearBoard} className="w-full gap-2 border-destructive/30 text-destructive hover:bg-destructive/10">
          <Trash2 className="w-4 h-4" /> Delete {tab === "enterprise" ? "Board" : "My Tasks"}
        </Button>
      )}

      {showForm && (
        <form onSubmit={submitNew} className="glass-card p-4 space-y-3 border border-tactical-border rounded-2xl">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {tab === "enterprise" ? "New operation" : "New personal task"}
          </p>
          <input
            autoFocus
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="Task name *"
            className="w-full bg-muted px-4 py-2.5 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          {tab === "enterprise" && (
            <input
              value={draft.officer}
              onChange={(e) => setDraft({ ...draft, officer: e.target.value })}
              placeholder="Assign to (officer)"
              className="w-full bg-muted px-4 py-2.5 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          )}
          <div className="grid grid-cols-2 gap-2">
            <select
              value={draft.priority}
              onChange={(e) => setDraft({ ...draft, priority: e.target.value as Priority })}
              className="bg-muted px-3 py-2.5 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="Low">Low priority</option>
              <option value="Medium">Medium priority</option>
              <option value="High">High priority</option>
            </select>
            <select
              value={draft.deadlineHours}
              onChange={(e) => setDraft({ ...draft, deadlineHours: Number(e.target.value) })}
              className="bg-muted px-3 py-2.5 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value={2}>Due in 2h</option>
              <option value={6}>Due in 6h</option>
              <option value={24}>Due in 1d</option>
              <option value={72}>Due in 3d</option>
              <option value={168}>Due in 1 week</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" className="flex-1 bg-tactical-steel text-white hover:bg-tactical-steel/90">
              Create
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {visible.map(t => (
          <Card
            key={t.id}
            className="p-4 bg-tactical-charcoal border border-tactical-border rounded-2xl space-y-3"
          >
            <div className="flex items-start gap-3">
              <button
                onClick={() => toggle(t.id, tab)}
                className={cn(
                  "mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                  t.completed ? "bg-tactical-steel border-tactical-steel" : "border-tactical-border"
                )}
              >
                {t.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={cn("font-semibold text-tactical-text", t.completed && "line-through opacity-60")}>{t.name}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                  <User className="w-3 h-3" /> {t.officer}
                  {t.status && (
                    <Badge variant="outline" className="text-[9px] uppercase tracking-wider border-tactical-border text-muted-foreground">
                      {t.status === "ESCALATED" && <AlertOctagon className="w-2.5 h-2.5 mr-0.5" />}
                      {t.status}
                    </Badge>
                  )}
                </div>
              </div>
              <Badge variant="outline" className={cn("text-[10px]", priorityClass(t.priority))}>
                {t.priority}
              </Badge>
              <Button variant="ghost" size="icon" onClick={() => deleteTask(t.id, tab)} className="h-8 w-8 text-destructive hover:bg-destructive/10" aria-label="Delete task">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-tactical-border">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span className={cn(formatCountdown(t.deadline) === "Overdue" && "text-tactical-signal font-semibold")}>
                  {formatCountdown(t.deadline)}
                </span>
              </div>
              {t.completed && (t.context === "government" || t.context === "factory") && (
                <div className="flex items-center gap-1.5 text-xs text-tactical-steel font-semibold">
                  {t.context === "government" ? <Stamp className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                  {t.context === "government" ? "Official Stamp" : "Verified Signature"}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
