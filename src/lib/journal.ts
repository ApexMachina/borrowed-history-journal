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

export function saveEntries(entries: JournalEntry[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
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
  let sum = kinds.reduce((s, k) => s + stats[k].percent, 0);
  if (sum === 100) return stats;
  // Give remainder to the largest bucket
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
