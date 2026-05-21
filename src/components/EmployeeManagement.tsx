import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, User, Mail, Phone, FileText, Camera, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { onboardingStore } from "@/lib/messagesStore";

interface Employee {
  id: string;
  fullName: string;
  role: string;
  phone: string;
  email: string;
  skills: string[];
  profilePicture?: string | null;
  cvName?: string | null;
  temporaryPassword: string;
  accountStatus: "PENDING_ACTIVATION" | "ACTIVE" | "INACTIVE";
}

interface EmployeeManagementProps {
  onBack: () => void;
  onEmployeeOnboarded?: () => void;
}

const genTempPassword = () =>
  Math.random().toString(36).slice(2, 6).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6);

const seed: Employee[] = [
  {
    id: "e1",
    fullName: "Yacine Bensalem",
    role: "PR Manager",
    phone: "+213 555 12 34 56",
    email: "yacine@helixa.dz",
    skills: ["Crisis comms", "Media relations"],
    temporaryPassword: "TMP-x3k9",
    accountStatus: "ACTIVE",
  },
];

export const EmployeeManagement = ({ onBack, onEmployeeOnboarded }: EmployeeManagementProps) => {
  const [employees, setEmployees] = useState<Employee[]>(seed);
  const [showForm, setShowForm] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [form, setForm] = useState<Employee>({
    id: "",
    fullName: "",
    role: "",
    phone: "",
    email: "",
    skills: [],
    profilePicture: null,
    cvName: null,
    temporaryPassword: genTempPassword(),
    accountStatus: "PENDING_ACTIVATION",
  });
  const [copied, setCopied] = useState(false);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setForm((p) => ({ ...p, profilePicture: reader.result as string }));
    reader.readAsDataURL(f);
  };

  const handleCv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setForm((p) => ({ ...p, cvName: f.name }));
  };

  const addSkill = () => {
    const s = skillInput.trim();
    if (!s) return;
    setForm((p) => ({ ...p, skills: [...p.skills, s] }));
    setSkillInput("");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.role) {
      toast.error("Full name, role and email are required");
      return;
    }
    setEmployees((prev) => [...prev, { ...form, id: `e${Date.now()}` }]);
    onboardingStore.create(form.fullName);
    toast.success(`Employee created. Onboarding chat opened · Temp password: ${form.temporaryPassword}`);
    onEmployeeOnboarded?.();
    setForm({
      id: "",
      fullName: "",
      role: "",
      phone: "",
      email: "",
      skills: [],
      profilePicture: null,
      cvName: null,
      temporaryPassword: genTempPassword(),
      accountStatus: "PENDING_ACTIVATION",
    });
    setShowForm(false);
  };

  const copyTemp = async () => {
    try {
      await navigator.clipboard.writeText(form.temporaryPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="flex-1 flex flex-col bg-background pb-24">
      <div className="p-4 border-b border-border/50 flex items-center gap-3">
        <Button variant="glass" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-h2 text-foreground">Manage Team</h1>
          <p className="text-caption text-muted-foreground">CEO-only · Create employee accounts</p>
        </div>
        <Button variant="cyan" size="icon" onClick={() => setShowForm((v) => !v)}>
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {showForm && (
          <form onSubmit={submit} className="glass-card p-4 space-y-3">
            <div className="flex justify-center">
              <label className="w-20 h-20 rounded-full bg-muted border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer overflow-hidden">
                {form.profilePicture ? (
                  <img src={form.profilePicture} alt="" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Camera className="w-6 h-6 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">Photo</span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              </label>
            </div>

            <input
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="Full Name *"
              className="w-full bg-muted px-4 py-2.5 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <input
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              placeholder="Role / Job Title *"
              className="w-full bg-muted px-4 py-2.5 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Email *"
              className="w-full bg-muted px-4 py-2.5 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Phone Number"
              className="w-full bg-muted px-4 py-2.5 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />

            <label className="block">
              <span className="text-caption text-muted-foreground">CV (PDF)</span>
              <div className="mt-1 flex items-center gap-2 bg-muted px-3 py-2.5 rounded-xl">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="flex-1 text-caption text-foreground truncate">
                  {form.cvName || "No file selected"}
                </span>
                <input type="file" accept="application/pdf" className="hidden" onChange={handleCv} id="cv-upload" />
                <Button type="button" variant="glass" size="sm" onClick={() => document.getElementById("cv-upload")?.click()}>
                  Upload
                </Button>
              </div>
            </label>

            <div>
              <span className="text-caption text-muted-foreground">Skills</span>
              <div className="flex gap-2 mt-1">
                <input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                  placeholder="Add a skill"
                  className="flex-1 bg-muted px-4 py-2.5 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <Button type="button" variant="glass" onClick={addSkill}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.skills.map((s) => (
                  <span key={s} className="text-xs px-2 py-1 bg-primary/15 text-primary rounded-full">{s}</span>
                ))}
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
              <p className="text-caption text-muted-foreground">Temporary password (single-use)</p>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 text-body font-mono text-foreground">{form.temporaryPassword}</code>
                <Button type="button" variant="glass" size="icon" onClick={copyTemp}>
                  {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <Button type="submit" variant="hero" className="w-full">Create Employee Account</Button>
          </form>
        )}

        <h3 className="text-h3 text-foreground">Team Members ({employees.length})</h3>
        <div className="space-y-3">
          {employees.map((emp) => (
            <div key={emp.id} className="glass-card p-4 flex gap-3 items-start">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {emp.profilePicture ? (
                  <img src={emp.profilePicture} alt={emp.fullName} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body font-medium text-foreground">{emp.fullName}</p>
                <p className="text-caption text-primary">{emp.role}</p>
                <div className="flex items-center gap-3 mt-1 text-caption text-muted-foreground">
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{emp.email}</span>
                  {emp.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{emp.phone}</span>}
                </div>
                {emp.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {emp.skills.map((s) => (
                      <span key={s} className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded-full">{s}</span>
                    ))}
                  </div>
                )}
              </div>
              <span
                className={
                  "text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider " +
                  (emp.accountStatus === "ACTIVE"
                    ? "bg-green-500/20 text-green-500"
                    : emp.accountStatus === "PENDING_ACTIVATION"
                    ? "bg-yellow-500/20 text-yellow-500"
                    : "bg-muted text-muted-foreground")
                }
              >
                {emp.accountStatus.replace("_", " ")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
