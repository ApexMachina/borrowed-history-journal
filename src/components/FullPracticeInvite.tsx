import { useState } from "react";
import { tryUnlock } from "@/lib/access";
import { cn } from "@/lib/utils";

type Props = {
  onUnlocked: () => void;
};

export function FullPracticeInvite({ onUnlocked }: Props) {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(false);

  const handleUnlock = () => {
    if (tryUnlock(code)) {
      setError(false);
      onUnlocked();
    } else {
      setError(true);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-border px-4 font-sans text-sm text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
      >
        Over time
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-border px-4 py-4">
      <label className="block">
        <span className="font-sans text-xs text-fg-subtle">Unlock phrase</span>
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleUnlock();
          }}
          placeholder="full practice"
          className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3 py-2.5 font-sans text-sm text-fg placeholder:text-fg-subtle focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </label>
      {error && (
        <p className="mt-2 font-sans text-xs text-fg-subtle">Not recognized.</p>
      )}
      <div className="mt-3 flex gap-3">
        <button
          type="button"
          onClick={handleUnlock}
          className={cn(
            "inline-flex min-h-10 flex-1 items-center justify-center rounded-xl bg-accent px-4",
            "font-sans text-sm font-medium text-accent-fg transition-opacity hover:opacity-90",
          )}
        >
          Unlock
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(false);
          }}
          className="font-sans text-xs text-fg-subtle transition-colors hover:text-fg-muted"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
