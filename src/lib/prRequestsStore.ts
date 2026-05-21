// Frontend stand-in for /api/pr-requests endpoint.
// Each request is scoped to a tenantCompanyId (the Helixa-using PR provider).
// Only members of that company see the requests in their Messages inbox.
export interface PRRequest {
  id: string;
  tenantCompanyId: string; // the PR provider on Helixa receiving the request
  source: "website" | "app";
  company: string;         // the external company sending the request
  subject: string;
  message: string;
  prWebsite?: string;
  contactName?: string;
  contactPhone?: string;
  date: string;
}

const KEY = "helixa-pr-requests";

const read = (): PRRequest[] => {
  try { const r = localStorage.getItem(KEY); return r ? JSON.parse(r) : []; } catch { return []; }
};
const write = (v: PRRequest[]) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch {} };

const currentTenantId = (): string => {
  try {
    const raw = localStorage.getItem("helixa-current-tenant");
    return raw || "default-tenant";
  } catch { return "default-tenant"; }
};

export const prRequestsStore = {
  // List requests for the current tenant (PR provider) only
  list: (): PRRequest[] => read().filter((r) => r.tenantCompanyId === currentTenantId()),
  listAll: read,
  currentTenantId,
  setTenantId: (id: string) => { try { localStorage.setItem("helixa-current-tenant", id); } catch {} },
  // POST /api/pr-requests equivalent — caller can pass tenantCompanyId or default
  submit: (payload: Omit<PRRequest, "id" | "date" | "tenantCompanyId"> & { tenantCompanyId?: string }): PRRequest => {
    const created: PRRequest = {
      ...payload,
      tenantCompanyId: payload.tenantCompanyId || currentTenantId(),
      id: `pr-${Date.now()}`,
      date: new Date().toISOString(),
    };
    write([created, ...read()]);
    window.dispatchEvent(new Event("helixa-pr-requests-changed"));
    return created;
  },
};
