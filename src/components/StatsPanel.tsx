import type { JournalEntry } from "@/lib/journal";
import {
  KIND_META,
  KIND_ORDER,
  computeStats,
  normalizePercents,
} from "@/lib/journal";
import { cn } from "@/lib/utils";

type Props = {
  entries: JournalEntry[];
};

export function StatsPanel({ entries }: Props) {
  const total = entries.length;
  const stats = normalizePercents(computeStats(entries), total);

  if (total === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface/50 px-5 py-6">
        <p className="font-display text-lg text-fg-muted">
          No entries yet.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface/50 p-5 shadow-soft sm:p-6">
      <div className="mb-5 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-xl font-medium tracking-tight text-fg sm:text-2xl">
          Of what you have written
        </h2>
        <span className="shrink-0 font-sans text-xs tabular-nums text-fg-subtle">
          {total} {total === 1 ? "entry" : "entries"}
        </span>
      </div>

      <div className="mb-5 flex h-2.5 overflow-hidden rounded-full bg-bg-elevated">
        {KIND_ORDER.map((kind) => {
          const pct = stats[kind].percent;
          if (pct === 0) return null;
          return (
            <div
              key={kind}
              className={cn(
                "h-full transition-[width] duration-500 ease-out",
                KIND_META[kind].barClass,
              )}
              style={{ width: `${pct}%` }}
              title={`${KIND_META[kind].shortLabel}: ${pct}%`}
            />
          );
        })}
      </div>

      <ul className="flex flex-col gap-4">
        {KIND_ORDER.map((kind) => {
          const { percent, count } = stats[kind];
          const meta = KIND_META[kind];
          return (
            <li key={kind}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <span className={cn("font-sans text-sm font-medium", meta.colorClass)}>
                  {meta.label}
                </span>
                <span className="font-display text-2xl font-medium tabular-nums tracking-tight text-fg">
                  {percent}
                  <span className="ml-0.5 text-base text-fg-muted">%</span>
                </span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-bg-elevated">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-500 ease-out",
                    meta.barClass,
                  )}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="mt-1.5 font-sans text-xs text-fg-subtle tabular-nums">
                {count} {count === 1 ? "entry" : "entries"}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
