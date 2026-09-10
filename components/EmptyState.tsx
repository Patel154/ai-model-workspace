"use client";

import { IconBolt, IconFile, IconMessage } from "./icons";

const SUGGESTIONS = [
  "Explain what this codebase does at a glance",
  "Find the bug in this file and fix it",
  "Summarize this document into three key points",
  "Review this component for accessibility issues"
];

export default function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent shadow-glow">
        <IconBolt size={22} />
      </div>
      <h1 className="text-[19px] font-semibold text-ink">Where should we start?</h1>
      <p className="mt-1.5 max-w-[420px] text-[13.5px] leading-relaxed text-ink-faint">
        Pick a model up top, then chat or drop in a file — code, a doc, an image.
        Switch models anytime without losing the thread.
      </p>
      <div className="mt-7 grid w-full max-w-[560px] grid-cols-1 gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => (
          <div
            key={s}
            className="rounded-xl border border-base-border bg-base-surface px-3.5 py-3 text-left text-[12.5px] text-ink-dim"
          >
            <IconMessage size={12} className="mb-1.5 text-ink-faint" />
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}
