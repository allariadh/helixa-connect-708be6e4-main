// Shared jobs + applications store (localStorage-backed, additive).
import { archiveStore } from "@/lib/archiveStore";
import { notificationStore } from "@/lib/notificationStore";
export interface JobOffer {
  id: string;
  title: string;
  description: string;
  requirements: string;
  status: "Active" | "Inactive";
  createdAt: string;
  type?: string;
  location?: string;
}

export interface JobApplication {
  id: string;
  jobOfferId: string;
  jobTitle: string;
  applicantName: string;
  applicantPhone: string;
  applicantEmail?: string;
  cvName: string | null;
  cvUrl?: string | null;
  cvSize?: string | null;
  message: string;
  date: string;
}

const JOBS_KEY = "helixa-job-offers";
const APPS_KEY = "helixa-job-applications";

const read = <T>(key: string, fallback: T): T => {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; } catch { return fallback; }
};
const write = (key: string, value: unknown) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
};

export const jobsStore = {
  list: (): JobOffer[] => read<JobOffer[]>(JOBS_KEY, []),
  active: (): JobOffer[] => read<JobOffer[]>(JOBS_KEY, []).filter(j => j.status === "Active"),
  add: (job: Omit<JobOffer, "id" | "createdAt">): JobOffer => {
    const created: JobOffer = { ...job, id: `job-${Date.now()}`, createdAt: new Date().toISOString() };
    const list = [...jobsStore.list(), created];
    write(JOBS_KEY, list);
    window.dispatchEvent(new Event("helixa-jobs-changed"));
    return created;
  },
  update: (id: string, patch: Partial<JobOffer>) => {
    const list = jobsStore.list().map(j => j.id === id ? { ...j, ...patch } : j);
    write(JOBS_KEY, list);
    window.dispatchEvent(new Event("helixa-jobs-changed"));
  },
  remove: (id: string) => {
    write(JOBS_KEY, jobsStore.list().filter(j => j.id !== id));
    window.dispatchEvent(new Event("helixa-jobs-changed"));
  },
};

export const applicationsStore = {
  list: (): JobApplication[] => read<JobApplication[]>(APPS_KEY, []),
  add: (app: Omit<JobApplication, "id" | "date">): JobApplication => {
    const created: JobApplication = { ...app, id: `app-${Date.now()}`, date: new Date().toISOString() };
    const list = [...applicationsStore.list(), created];
    write(APPS_KEY, list);
    if (created.cvName) {
      archiveStore.add({ name: created.cvName, source: "Recruitment", size: created.cvSize || undefined, url: created.cvUrl || undefined });
    }
    notificationStore.add({ title: "New CV received", body: `${created.applicantName} applied for ${created.jobTitle}.`, type: "application" });
    window.dispatchEvent(new Event("helixa-apps-changed"));
    return created;
  },
  remove: (id: string) => {
    write(APPS_KEY, applicationsStore.list().filter(a => a.id !== id));
    window.dispatchEvent(new Event("helixa-apps-changed"));
  },
};
