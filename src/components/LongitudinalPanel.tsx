import { useMemo, useState } from "react";
import type { JournalEntry } from "@/lib/journal";
import { KIND_META, KIND_ORDER } from "@/lib/journal";
import {
  PERIODS,
  type PeriodId,
  driftNote,
  periodStats,
} from "@/lib/practice";
import { cn } from "@/lib/utils";

type Props = {
  entries: JournalEntry[];
};

export function LongitudinalPanel({ entries }: Props) {
  const [period, setPeriod] = useState<PeriodId>("all");
  const { stats, total } = useMemo(
    () => periodStats(entries, period),
    [entries, period],
  );
  const drift = useMemo(() => driftNote(entries), [entries]);

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface/50 px-5 py-6">
        <p className="font-display text-lg text-fg-muted">
          Over time, the shape of your sources will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface/50 p-5 shadow-soft sm:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between">
        <h2 className="font-display text-xl font-medium tracking-tight text-fg sm:text-2xl">
          Over time
        </h2>
        <div className="flex flex-wrap gap-1.5">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={cn(
                "rounded-full px-3 py-1 font-sans text-xs transition-colors duration-150",
                period === p.id
                  ? "bg-accent/20 text-accent"
                  : "text-fg-subtle hover:text-fg-muted",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <p className="mb-4 font-sans text-xs tabular-nums text-fg-subtle">
        {total} {total === 1 ? "entry" : "entries"} in this window
      </p>

      {total === 0 ? (
        <p className="font-display text-base text-fg-muted">
          Nothing written in this period yet.
        </p>
      ) : (
        <>
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
                />
              );
            })}
          </div>

          <ul className="flex flex-col gap-3">
            {KIND_ORDER.map((kind) => (
              <li
                key={kind}
                className="flex items-baseline justify-between gap-3"
              >
                <span
                  className={cn(
                    "font-sans text-sm font-medium",
                    KIND_META[kind].colorClass,
                  )}
                >
                  {KIND_META[kind].shortLabel}
                </span>
                <span className="font-display text-xl tabular-nums text-fg">
                  {stats[kind].percent}
                  <span className="ml-0.5 text-sm text-fg-muted">%</span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      {drift && (
        <p className="mt-6 border-t border-border pt-5 font-display text-base italic leading-relaxed text-fg-muted">
          {drift}
        </p>
      )}
    </div>
  );
}
