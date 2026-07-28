import { ArrowUpRight } from "lucide-react";

const FRAMEWORK_URL =
  "https://twocentphilosophy.com/products/the-borrowed-history-predicament";

export function FrameworkLink() {
  return (
    <a
      href={FRAMEWORK_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-3 rounded-xl border border-border/60 bg-transparent px-4 py-3.5 transition-[border-color,background-color] duration-200 hover:border-border-strong hover:bg-surface/40"
    >
      <div className="min-w-0 flex-1">
        <p className="font-sans text-xs text-fg-subtle">Further reading</p>
        <p className="mt-0.5 font-display text-base leading-snug text-fg-muted transition-colors duration-200 group-hover:text-fg">
          The full framework is explored in{" "}
          <span className="text-accent underline decoration-accent/30 underline-offset-4 transition-colors group-hover:decoration-accent/60">
            The Borrowed History Predicament
          </span>
        </p>
      </div>
      <ArrowUpRight
        className="mt-0.5 size-4 shrink-0 text-fg-subtle transition-colors duration-200 group-hover:text-accent"
        aria-hidden
      />
    </a>
  );
}
