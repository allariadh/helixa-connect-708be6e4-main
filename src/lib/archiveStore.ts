export type ArchiveSource = "PNMS AI" | "Document AI" | "Chat" | "Recruitment" | "In-app share";

export interface ArchivedFileItem {
  id: string;
  name: string;
  source: ArchiveSource;
  size: string;
  date: string;
  url?: string;
}

const KEY = "helixa-file-archive";

const seed: ArchivedFileItem[] = [
  { id: "seed-1", name: "PNMS_Reputation_Report.pdf", source: "PNMS AI", size: "1.2 MB", date: "2d ago" },
  { id: "seed-2", name: "Executive_Communication_Brief.docx", source: "Document AI", size: "340 KB", date: "5d ago" },
  { id: "seed-3", name: "Internal_Media_Archive.zip", source: "In-app share", size: "8.7 MB", date: "1w ago" },
];

const read = (): ArchivedFileItem[] => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : seed;
  } catch {
    return seed;
  }
};

const write = (items: ArchivedFileItem[]) => {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
};

const formatSize = (bytes?: number) => {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const archiveStore = {
  list: read,
  add: (item: { name: string; source: ArchiveSource; sizeBytes?: number; size?: string; url?: string }) => {
    const created: ArchivedFileItem = {
      id: `archive-${Date.now()}`,
      name: item.name,
      source: item.source,
      size: item.size || formatSize(item.sizeBytes),
      date: "now",
      url: item.url,
    };
    write([created, ...read()]);
    window.dispatchEvent(new Event("helixa-archive-changed"));
    return created;
  },
};