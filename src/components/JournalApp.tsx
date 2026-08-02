import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { Download, Feather, RotateCcw, Upload } from "lucide-react";
import type { JournalEntry, JournalMeta, SourceKind } from "@/lib/journal";
import {
  createEntry,
  downloadJson,
  exportEntriesJson,
  loadEntriesDurable,
  loadMeta,
  markExported,
  mergeEntries,
  parseImportPayload,
  saveEntries,
  shouldNudgeBackup,
} from "@/lib/journal";
import { cn } from "@/lib/utils";
import { CategoryButton } from "./CategoryButton";
import { EntryList } from "./EntryList";
import { FrameworkLink } from "./FrameworkLink";
import { StatsPanel } from "./StatsPanel";

type View = "compose" | "review";

export function JournalApp() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [meta, setMeta] = useState<JournalMeta>({
    updatedAt: null,
    lastExportAt: null,
  });
  const [hydrated, setHydrated] = useState(false);
  const [text, setText] = useState("");
  const [view, setView] = useState<View>("compose");
  const [lastKind, setLastKind] = useState<SourceKind | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = await loadEntriesDurable();
      if (cancelled) return;
      setEntries(loaded);
      setMeta(loadMeta());
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((next: JournalEntry[]) => {
    setEntries(next);
    saveEntries(next);
    setMeta(loadMeta());
  }, []);

  const flash = useCallback((message: string) => {
    setStatus(message);
    window.setTimeout(() => setStatus(null), 4000);
  }, []);

  const handleSave = (kind: SourceKind) => {
    const trimmed = text.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    const entry = createEntry(trimmed, kind);
    const next = [entry, ...entries];
    persist(next);
    setLastKind(kind);
    setText("");
    setView("review");
    window.setTimeout(() => setSaving(false), 180);
  };

  const handleExport = () => {
    if (entries.length === 0) return;
    const stamp = new Date().toISOString().slice(0, 10);
    downloadJson(
      `borrowed-history-journal-${stamp}.json`,
      exportEntriesJson(entries),
    );
    markExported();
    setMeta(loadMeta());
    flash("Backup saved to your downloads.");
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const raw = await file.text();
      const incoming = parseImportPayload(raw);
      if (incoming === null) {
        flash("That file could not be read as a journal backup.");
        return;
      }
      if (incoming.length === 0) {
        flash("That backup contains no entries.");
        return;
      }
      const merged = mergeEntries(entries, incoming);
      const added = merged.length - entries.length;
      persist(merged);
      setView("review");
      flash(
        added > 0
          ? `Restored ${incoming.length} from backup (${added} new).`
          : `Loaded backup — ${incoming.length} entries already present.`,
      );
    } catch {
      flash("Could not open that file.");
    }
  };

  const handleClearAll = () => {
    if (entries.length === 0) return;
    const ok = window.confirm(
      "Clear all entries from this device? Export a backup first if you want them later.",
    );
    if (!ok) return;
    persist([]);
    setLastKind(null);
    setView("compose");
    flash("Journal cleared on this device.");
  };

  const canSave = text.trim().length > 0 && !saving;
  const showBackupNudge = shouldNudgeBackup(meta, entries.length);

  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, color-mix(in oklab, var(--color-accent) 6%, transparent), transparent 55%), radial-gradient(ellipse 60% 40% at 100% 100%, color-mix(in oklab, #4a3a6a 12%, transparent), transparent 50%)",
        }}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        onChange={handleImportFile}
        tabIndex={-1}
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pb-10 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-6 sm:pt-10">
        <header className="mb-8 sm:mb-10">
          <div className="mb-4 flex items-center gap-2.5 text-accent">
            <Feather className="size-4 opacity-80" strokeWidth={1.5} aria-hidden />
            <span className="font-sans text-[0.7rem] font-medium uppercase tracking-[0.18em] text-accent-soft">
              A private practice
            </span>
          </div>
          <h1 className="font-display text-[1.85rem] font-medium leading-[1.15] tracking-tight text-fg sm:text-4xl">
            Borrowed History Journal
          </h1>
          <p className="mt-3 max-w-prose font-sans text-sm leading-relaxed text-fg-muted sm:text-[0.9375rem]">
            Write a short claim or reflection. Then notice where it came from —
            deduction, direct experience, or something you only received.
          </p>
        </header>

        {status && (
          <p
            role="status"
            className="mb-4 rounded-xl border border-border/80 bg-surface/70 px-3 py-2 text-center font-sans text-xs text-fg-muted"
          >
            {status}
          </p>
        )}

        {!hydrated ? (
          <div
            className="flex flex-1 flex-col gap-4 opacity-50"
            aria-busy
            aria-label="Loading journal"
          >
            <div className="h-32 animate-pulse rounded-2xl bg-surface" />
            <div className="h-14 animate-pulse rounded-xl bg-surface" />
            <div className="h-14 animate-pulse rounded-xl bg-surface" />
            <div className="h-14 animate-pulse rounded-xl bg-surface" />
          </div>
        ) : view === "compose" ? (
          <ComposeView
            text={text}
            onTextChange={setText}
            canSave={canSave}
            onSave={handleSave}
            hasEntries={entries.length > 0}
            onOpenReview={() => setView("review")}
            onImport={handleImportClick}
          />
        ) : (
          <ReviewView
            entries={entries}
            lastKind={lastKind}
            showBackupNudge={showBackupNudge}
            onNewEntry={() => {
              setLastKind(null);
              setView("compose");
            }}
            onExport={handleExport}
            onImport={handleImportClick}
            onClear={handleClearAll}
          />
        )}

        <footer className="mt-auto pt-10 text-center">
          <p className="font-sans text-[0.7rem] leading-relaxed tracking-wide text-fg-subtle">
            Kept privately on this device (browser storage).
            <br />
            Export a backup file if you want a copy you can restore later.
          </p>
        </footer>
      </div>
    </div>
  );
}

function ComposeView({
  text,
  onTextChange,
  canSave,
  onSave,
  hasEntries,
  onOpenReview,
  onImport,
}: {
  text: string;
  onTextChange: (v: string) => void;
  canSave: boolean;
  onSave: (kind: SourceKind) => void;
  hasEntries: boolean;
  onOpenReview: () => void;
  onImport: () => void;
}) {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-2">
        <label
          htmlFor="claim"
          className="font-sans text-xs font-medium uppercase tracking-[0.14em] text-fg-subtle"
        >
          Claim or reflection
        </label>
        <textarea
          id="claim"
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          rows={4}
          maxLength={500}
          placeholder="Something you believe, remember, or recently learned…"
          className={cn(
            "w-full resize-none rounded-2xl border border-border bg-surface px-4 py-3.5",
            "font-sans text-base leading-relaxed text-fg placeholder:text-fg-subtle",
            "shadow-soft transition-[border-color,box-shadow] duration-200",
            "focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20",
            "min-h-[7.5rem]",
          )}
        />
        <div className="flex justify-end">
          <span className="font-sans text-xs tabular-nums text-fg-subtle">
            {text.length}/500
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <p className="font-sans text-xs font-medium uppercase tracking-[0.14em] text-fg-subtle">
          Where does this come from?
        </p>
        <p className="mb-1 font-sans text-sm text-fg-muted">
          Choose the source that feels most honest. There is no right answer.
        </p>
        <div className="flex flex-col gap-2.5">
          <CategoryButton
            kind="deduction"
            disabled={!canSave}
            onSelect={onSave}
          />
          <CategoryButton
            kind="experience"
            disabled={!canSave}
            onSelect={onSave}
          />
          <CategoryButton
            kind="borrowed"
            disabled={!canSave}
            onSelect={onSave}
          />
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        {hasEntries && (
          <button
            type="button"
            onClick={onOpenReview}
            className="font-sans text-sm text-fg-muted underline decoration-border underline-offset-4 transition-colors hover:text-fg hover:decoration-fg-muted"
          >
            View your composition
          </button>
        )}
        <button
          type="button"
          onClick={onImport}
          className="inline-flex items-center gap-1.5 font-sans text-xs text-fg-subtle transition-colors hover:text-fg-muted"
        >
          <Upload className="size-3.5" aria-hidden />
          Restore from backup
        </button>
      </div>
    </div>
  );
}

function ReviewView({
  entries,
  lastKind,
  showBackupNudge,
  onNewEntry,
  onExport,
  onImport,
  onClear,
}: {
  entries: JournalEntry[];
  lastKind: SourceKind | null;
  showBackupNudge: boolean;
  onNewEntry: () => void;
  onExport: () => void;
  onImport: () => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-300">
      {lastKind && (
        <p className="font-display text-lg italic leading-snug text-fg-muted">
          Noted as {lastKind === "experience" ? "direct experience" : lastKind}.
          Here is the shape of what you have gathered so far.
        </p>
      )}

      <StatsPanel entries={entries} />

      {showBackupNudge && entries.length > 0 && (
        <p className="rounded-xl border border-border/70 bg-bg-elevated/50 px-4 py-3 font-sans text-xs leading-relaxed text-fg-muted">
          A quiet reminder: export a backup file when you can. Browser storage
          is private, but not immortal — clearing site data or switching
          devices can erase it.
        </p>
      )}

      <EntryList entries={entries} />

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={onNewEntry}
          className={cn(
            "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl",
            "bg-accent px-4 py-3 font-sans text-sm font-medium text-accent-fg",
            "transition-[transform,opacity] duration-150 hover:opacity-90 active:scale-[0.99]",
          )}
        >
          Write another
        </button>

        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-1">
          <button
            type="button"
            onClick={onExport}
            disabled={entries.length === 0}
            className="inline-flex items-center gap-1.5 font-sans text-xs text-fg-subtle transition-colors hover:text-fg-muted disabled:opacity-30"
          >
            <Download className="size-3.5" aria-hidden />
            Export backup
          </button>
          <button
            type="button"
            onClick={onImport}
            className="inline-flex items-center gap-1.5 font-sans text-xs text-fg-subtle transition-colors hover:text-fg-muted"
          >
            <Upload className="size-3.5" aria-hidden />
            Restore
          </button>
          <button
            type="button"
            onClick={onClear}
            disabled={entries.length === 0}
            className="inline-flex items-center gap-1.5 font-sans text-xs text-fg-subtle transition-colors hover:text-fg-muted disabled:opacity-30"
          >
            <RotateCcw className="size-3.5" aria-hidden />
            Clear all
          </button>
        </div>
      </div>

      <FrameworkLink />
    </div>
  );
}
