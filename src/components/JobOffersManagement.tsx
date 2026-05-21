import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Briefcase, Inbox, FileText, Trash2, Power } from "lucide-react";
import { jobsStore, applicationsStore, JobOffer, JobApplication } from "@/lib/jobsStore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface JobOffersManagementProps { onBack: () => void; }

export const JobOffersManagement = ({ onBack }: JobOffersManagementProps) => {
  const [tab, setTab] = useState<"offers" | "inbox">("offers");
  const [offers, setOffers] = useState<JobOffer[]>(jobsStore.list());
  const [apps, setApps] = useState<JobApplication[]>(applicationsStore.list());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", requirements: "", type: "Full-time", location: "Algiers", status: "Active" as "Active" | "Inactive" });

  useEffect(() => {
    const sync = () => { setOffers(jobsStore.list()); setApps(applicationsStore.list()); };
    window.addEventListener("helixa-jobs-changed", sync);
    window.addEventListener("helixa-apps-changed", sync);
    return () => {
      window.removeEventListener("helixa-jobs-changed", sync);
      window.removeEventListener("helixa-apps-changed", sync);
    };
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Title required");
    jobsStore.add(form);
    toast.success("Job offer published on company profile");
    setForm({ title: "", description: "", requirements: "", type: "Full-time", location: "Algiers", status: "Active" });
    setShowForm(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-background pb-24">
      <div className="p-4 border-b border-border/50 flex items-center gap-3">
        <Button variant="glass" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
        <div className="flex-1">
          <h1 className="text-h2 text-foreground">Job Offers & Applications</h1>
          <p className="text-caption text-muted-foreground">CEO/Manager only</p>
        </div>
        {tab === "offers" && (
          <Button variant="cyan" size="icon" onClick={() => setShowForm(v => !v)}><Plus className="w-5 h-5" /></Button>
        )}
      </div>

      <div className="px-4 pt-4">
        <div className="flex gap-2 p-1 bg-muted rounded-xl">
          <button onClick={() => setTab("offers")} className={cn("flex-1 py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5", tab === "offers" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}>
            <Briefcase className="w-3.5 h-3.5" /> Job Offers ({offers.length})
          </button>
          <button onClick={() => setTab("inbox")} className={cn("flex-1 py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5", tab === "inbox" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}>
            <Inbox className="w-3.5 h-3.5" /> Recruitment Inbox ({apps.length})
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {tab === "offers" && showForm && (
          <form onSubmit={submit} className="glass-card p-4 space-y-3">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Job Title *" className="w-full bg-muted px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={3} className="w-full bg-muted px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
            <textarea value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} placeholder="Requirements" rows={3} className="w-full bg-muted px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
            <div className="grid grid-cols-2 gap-2">
              <input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="Type" className="bg-muted px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Location" className="bg-muted px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as "Active" | "Inactive" })} className="w-full bg-muted px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50">
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <Button type="submit" variant="hero" className="w-full">Publish Job Offer</Button>
          </form>
        )}

        {tab === "offers" && offers.length === 0 && !showForm && (
          <p className="text-caption text-muted-foreground text-center py-8">No job offers yet — tap + to create one.</p>
        )}

        {tab === "offers" && offers.map(o => (
          <div key={o.id} className="glass-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-body font-semibold text-foreground">{o.title}</p>
                <p className="text-caption text-muted-foreground">{o.type} · {o.location}</p>
              </div>
              <span className={cn("text-[10px] px-2 py-0.5 rounded-full uppercase", o.status === "Active" ? "bg-green-500/20 text-green-600" : "bg-muted text-muted-foreground")}>{o.status}</span>
            </div>
            {o.description && <p className="text-caption text-muted-foreground mt-2">{o.description}</p>}
            {o.requirements && <p className="text-caption text-muted-foreground mt-1"><strong>Requirements:</strong> {o.requirements}</p>}
            <div className="flex gap-2 mt-3">
              <Button variant="glass" size="sm" onClick={() => jobsStore.update(o.id, { status: o.status === "Active" ? "Inactive" : "Active" })}>
                <Power className="w-3.5 h-3.5 mr-1" /> {o.status === "Active" ? "Deactivate" : "Activate"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => jobsStore.remove(o.id)}>
                <Trash2 className="w-3.5 h-3.5 mr-1 text-destructive" /> Delete
              </Button>
            </div>
          </div>
        ))}

        {tab === "inbox" && apps.length === 0 && (
          <p className="text-caption text-muted-foreground text-center py-8">No applications received yet.</p>
        )}
        {tab === "inbox" && apps.map(a => (
          <div key={a.id} className="glass-card p-4 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-body font-semibold text-foreground">{a.applicantName}</p>
                <p className="text-caption text-primary">Applying for: {a.jobTitle}</p>
              </div>
              <span className="text-[10px] text-muted-foreground">{new Date(a.date).toLocaleDateString()}</span>
            </div>
            <p className="text-caption text-muted-foreground">{a.applicantPhone}{a.applicantEmail ? ` · ${a.applicantEmail}` : ""}</p>
            {a.message && <p className="text-caption text-foreground">{a.message}</p>}
            {a.cvName && (
              <a href={a.cvUrl || "#"} download={a.cvName} className="flex items-center gap-2 text-caption text-primary underline">
                <FileText className="w-4 h-4" /> {a.cvName}{a.cvSize ? ` · ${a.cvSize}` : ""}
              </a>
            )}
            <Button variant="ghost" size="sm" onClick={() => applicationsStore.remove(a.id)} className="text-destructive hover:bg-destructive/10">
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete application
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
