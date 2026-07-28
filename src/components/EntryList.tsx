import type { JournalEntry } from "@/lib/journal";
import { KIND_META, formatRelativeTime } from "@/lib/journal";
import { cn } from "@/lib/utils";

type Props = {
  entries: JournalEntry[];
  limit?: number;
};

export function EntryList({ entries, limit = 8 }: Props) {
  const recent = [...entries]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, limit);

  if (recent.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h3 className="font-sans text-xs font-medium uppercase tracking-[0.14em] text-fg-subtle">
        Recent
      </h3>
      <ul className="flex flex-col gap-2">
        {recent.map((entry) => (
          <li
            key={entry.id}
            className="rounded-xl border border-border/80 bg-bg-elevated/60 px-4 py-3"
          >
            <p className="font-sans text-sm leading-relaxed text-fg">
              {entry.text}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span
                className={cn(
                  "font-sans text-xs font-medium",
                  KIND_META[entry.kind].colorClass,
                )}
              >
                {KIND_META[entry.kind].shortLabel}
              </span>
              <span className="font-sans text-xs text-fg-subtle tabular-nums">
                {formatRelativeTime(entry.createdAt)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
