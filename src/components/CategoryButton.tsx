import type { SourceKind } from "@/lib/journal";
import { KIND_META } from "@/lib/journal";
import { cn } from "@/lib/utils";

type Props = {
  kind: SourceKind;
  selected?: boolean;
  disabled?: boolean;
  onSelect: (kind: SourceKind) => void;
};

const kindAccent: Record<SourceKind, string> = {
  deduction:
    "border-deduction/40 hover:border-deduction/70 hover:bg-deduction/8 data-[selected=true]:border-deduction data-[selected=true]:bg-deduction/12 data-[selected=true]:shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-deduction)_50%,transparent)]",
  experience:
    "border-experience/40 hover:border-experience/70 hover:bg-experience/8 data-[selected=true]:border-experience data-[selected=true]:bg-experience/12 data-[selected=true]:shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-experience)_50%,transparent)]",
  borrowed:
    "border-borrowed/40 hover:border-borrowed/70 hover:bg-borrowed/8 data-[selected=true]:border-borrowed data-[selected=true]:bg-borrowed/12 data-[selected=true]:shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-borrowed)_50%,transparent)]",
};

const kindDot: Record<SourceKind, string> = {
  deduction: "bg-deduction",
  experience: "bg-experience",
  borrowed: "bg-borrowed",
};

export function CategoryButton({
  kind,
  selected = false,
  disabled = false,
  onSelect,
}: Props) {
  const meta = KIND_META[kind];

  return (
    <button
      type="button"
      disabled={disabled}
      data-selected={selected}
      onClick={() => onSelect(kind)}
      className={cn(
        "group flex w-full flex-col items-start gap-1 rounded-xl border bg-surface/60 px-4 py-3.5 text-left transition-[border-color,background-color,transform,box-shadow] duration-200 ease-out",
        "active:scale-[0.99] disabled:opacity-40 disabled:active:scale-100",
        "min-h-11",
        kindAccent[kind],
      )}
    >
      <span className="flex items-center gap-2.5">
        <span
          className={cn(
            "size-2 shrink-0 rounded-full opacity-80 transition-opacity duration-200",
            kindDot[kind],
            selected && "opacity-100",
          )}
          aria-hidden
        />
        <span className="font-sans text-sm font-medium tracking-wide text-fg">
          {meta.label}
        </span>
      </span>
      <span className="pl-[18px] text-xs leading-relaxed text-fg-muted">
        {meta.description}
      </span>
    </button>
  );
}
