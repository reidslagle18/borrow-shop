"use client";

import { useState } from "react";

/** A pill that opens a checklist popover for multi-selecting filter values. */
export default function MultiSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  if (options.length === 0) return null;

  function toggle(o: string) {
    onChange(selected.includes(o) ? selected.filter((x) => x !== o) : [...selected, o]);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm transition-colors ${
          selected.length
            ? "border-ink bg-ink text-cream"
            : "border-ink/15 bg-white text-ink/60"
        }`}
      >
        {label}
        {selected.length ? ` · ${selected.length}` : ""}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 mt-1.5 max-h-72 w-52 overflow-y-auto rounded-2xl border border-ink/10 bg-white p-1.5 shadow-lg">
            {selected.length > 0 && (
              <button
                onClick={() => onChange([])}
                className="mb-1 block w-full rounded-xl px-3 py-1.5 text-left text-[13px] text-ink/45 hover:bg-cream/60"
              >
                Clear {label.toLowerCase()}
              </button>
            )}
            {options.map((o) => {
              const on = selected.includes(o);
              return (
                <button
                  key={o}
                  onClick={() => toggle(o)}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm ${
                    on ? "bg-cream" : "hover:bg-cream/60"
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] ${
                      on ? "border-ink bg-ink text-cream" : "border-ink/30 text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                  {o}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
