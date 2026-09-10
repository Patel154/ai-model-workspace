"use client";

import { diffLines } from "diff";

export default function DiffBlock({
  original,
  modified
}: {
  original: string;
  modified: string;
}) {
  const parts = diffLines(original, modified);

  return (
    <div className="overflow-x-auto font-mono text-[12.5px] leading-[1.6]">
      {parts.map((part, i) => {
        const lines = part.value.replace(/\n$/, "").split("\n");
        const bg = part.added
          ? "bg-signal-good/10"
          : part.removed
          ? "bg-signal-bad/10"
          : "";
        const sign = part.added ? "+" : part.removed ? "-" : " ";
        const signColor = part.added
          ? "text-signal-good"
          : part.removed
          ? "text-signal-bad"
          : "text-ink-faint";
        return lines.map((line, j) => (
          <div key={`${i}-${j}`} className={`flex ${bg}`}>
            <span className={`w-6 shrink-0 select-none text-center ${signColor}`}>{sign}</span>
            <span className="whitespace-pre pr-4 text-ink-dim">{line}</span>
          </div>
        ));
      })}
    </div>
  );
}
