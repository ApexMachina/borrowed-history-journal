export type SourceKind = "deduction" | "experience" | "borrowed";

export type JournalEntry = {
  id: string;
  text: string;
  kind: SourceKind;
  createdAt: string;
};

export const KIND_META: Record<
  SourceKind,
  {
    label: string;
    shortLabel: string;
    description: string;
    colorClass: string;
    barClass: string;
  }
> = {
  deduction: {
    label: "Deduction",
    shortLabel: "Deduction",
    description: "Reached by reasoning from what you already hold.",
    colorClass: "text-deduction",
    barClass: "bg-deduction",
  },
  experience: {
    label: "Direct Experience / Intuition",
    shortLabel: "Experience",
    description: "Felt, observed, or known first-hand.",
    colorClass: "text-experience",
    barClass: "bg-experience",
  },
  borrowed: {
    label: "Borrowed History",
    shortLabel: "Borrowed",
    description: "Received from others — books, media, culture, AI, testimony.",
    colorClass: "text-borrowed",
    barClass: "bg-borrowed",
  },
};

export const KIND_ORDER: SourceKind[] = [
  "deduction",
  "experience",
  "borrowed",
];

const STORAGE_KEY = "borrowed-history-journal:v1";
const META_KEY = "borrowed-history-journal:meta:v1";
const IDB_NAME = "borrowed-history-journal";
const IDB_STORE = "state";
const IDB_VERSION = 1;

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function isSourceKind(value: unknown): value is SourceKind {
  return value === "deduction" || value === "experience" || value === "borrowed";
}

function isEntry(value: unknown): value is JournalEntry {
  if (!value || typeof value !== "object") return false;
  const e = value as Record<string, unknown>;
  return (
    typeof e.id === "string" &&
    typeof e.text === "string" &&
    isSourceKind(e.kind) &&
    typeof e.createdAt === "string"
  );
}

export type JournalMeta = {
  updatedAt: string | null;
  lastExportAt: string | null;
};

function defaultMeta(): JournalMeta {
  return { updatedAt: null, lastExportAt: null };
}

export function loadMeta(): JournalMeta {
  if (!isBrowser()) return defaultMeta();
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return defaultMeta();
    const parsed = JSON.parse(raw) as Partial<JournalMeta>;
    return {
      updatedAt:
        typeof parsed.updatedAt === "string" ? parsed.updatedAt : null,
      lastExportAt:
        typeof parsed.lastExportAt === "string" ? parsed.lastExportAt : null,
    };
  } catch {
    return defaultMeta();
  }
}

function saveMeta(meta: JournalMeta): void {
  if (!isBrowser()) return;
  localStorage.setItem(META_KEY, JSON.stringify(meta));
}

export function loadEntries(): JournalEntry[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isEntry);
  } catch {
    return [];
  }
}

function openIdb(): Promise<IDBDatabase | null> {
  if (!isBrowser() || typeof indexedDB === "undefined") {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, IDB_VERSION);
      req.onerror = () => resolve(null);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
    } catch {
      resolve(null);
    }
  });
}

async function idbGetEntries(): Promise<JournalEntry[] | null> {
  const db = await openIdb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, "readonly");
      const store = tx.objectStore(IDB_STORE);
      const req = store.get("entries");
      req.onsuccess = () => {
        const value = req.result;
        if (!Array.isArray(value)) {
          resolve(null);
          return;
        }
        resolve(value.filter(isEntry));
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    } finally {
      db.close();
    }
  });
}

async function idbSetEntries(entries: JournalEntry[]): Promise<void> {
  const db = await openIdb();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, "readwrite");
      const store = tx.objectStore(IDB_STORE);
      store.put(entries, "entries");
      store.put(new Date().toISOString(), "updatedAt");
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
    } catch {
      db.close();
      resolve();
    }
  });
}

/** Load from localStorage, falling back to IndexedDB if local is empty. */
export async function loadEntriesDurable(): Promise<JournalEntry[]> {
  const local = loadEntries();
  if (local.length > 0) {
    // Keep IndexedDB in sync when local has data
    void idbSetEntries(local);
    return local;
  }
  const fromIdb = await idbGetEntries();
  if (fromIdb && fromIdb.length > 0) {
    // Restore localStorage from the durable copy
    if (isBrowser()) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fromIdb));
      const meta = loadMeta();
      if (!meta.updatedAt) {
        saveMeta({ ...meta, updatedAt: new Date().toISOString() });
      }
    }
    return fromIdb;
  }
  return [];
}

export function saveEntries(entries: JournalEntry[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  const meta = loadMeta();
  saveMeta({ ...meta, updatedAt: new Date().toISOString() });
  void idbSetEntries(entries);
}

export function createEntry(text: string, kind: SourceKind): JournalEntry {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    text: text.trim(),
    kind,
    createdAt: new Date().toISOString(),
  };
}

export type KindStats = Record<
  SourceKind,
  { count: number; percent: number }
>;

export function computeStats(entries: JournalEntry[]): KindStats {
  const total = entries.length;
  const counts: Record<SourceKind, number> = {
    deduction: 0,
    experience: 0,
    borrowed: 0,
  };
  for (const e of entries) {
    counts[e.kind] += 1;
  }
  const percent = (n: number) =>
    total === 0 ? 0 : Math.round((n / total) * 100);

  return {
    deduction: { count: counts.deduction, percent: percent(counts.deduction) },
    experience: {
      count: counts.experience,
      percent: percent(counts.experience),
    },
    borrowed: { count: counts.borrowed, percent: percent(counts.borrowed) },
  };
}

/** Adjust rounding so percents sum to 100 when there are entries. */
export function normalizePercents(stats: KindStats, total: number): KindStats {
  if (total === 0) return stats;
  const kinds = KIND_ORDER;
  const sum = kinds.reduce((s, k) => s + stats[k].percent, 0);
  if (sum === 100) return stats;
  const largest = kinds.reduce((a, b) =>
    stats[a].count >= stats[b].count ? a : b,
  );
  const next = { ...stats };
  next[largest] = {
    ...next[largest],
    percent: next[largest].percent + (100 - sum),
  };
  return next;
}

export function exportEntriesJson(entries: JournalEntry[]): string {
  return JSON.stringify(
    {
      app: "Borrowed History Journal",
      version: 1,
      exportedAt: new Date().toISOString(),
      entries,
    },
    null,
    2,
  );
}

export function downloadJson(filename: string, content: string): void {
  if (!isBrowser()) return;
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function markExported(): void {
  const meta = loadMeta();
  saveMeta({ ...meta, lastExportAt: new Date().toISOString() });
}

/** Parse an export file (or raw entry array). Returns null if invalid. */
export function parseImportPayload(raw: string): JournalEntry[] | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      const entries = parsed.filter(isEntry);
      return entries.length > 0 || parsed.length === 0 ? entries : null;
    }
    if (parsed && typeof parsed === "object") {
      const obj = parsed as { entries?: unknown };
      if (Array.isArray(obj.entries)) {
        return obj.entries.filter(isEntry);
      }
    }
    return null;
  } catch {
    return null;
  }
}

/** Merge by id; imported entries win on conflict; sort newest first. */
export function mergeEntries(
  current: JournalEntry[],
  incoming: JournalEntry[],
): JournalEntry[] {
  const map = new Map<string, JournalEntry>();
  for (const e of current) map.set(e.id, e);
  for (const e of incoming) map.set(e.id, e);
  return Array.from(map.values()).sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = Date.now();
  const diff = Math.max(0, now - date.getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `${days}d ago`;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/** Soft nudge: true if there are entries and no export in 14+ days (or never). */
export function shouldNudgeBackup(meta: JournalMeta, entryCount: number): boolean {
  if (entryCount === 0) return false;
  if (!meta.lastExportAt) return entryCount >= 3;
  const days =
    (Date.now() - new Date(meta.lastExportAt).getTime()) / (1000 * 60 * 60 * 24);
  return days >= 14;
}
