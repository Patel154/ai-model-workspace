"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { NormalizedModel } from "@/lib/types";
import { formatContextLength } from "@/lib/model-utils";
import { IconChevronDown, IconSearch, IconEye, IconWrench, IconBolt } from "./icons";
import clsx from "clsx";

export default function ModelSelector({
  models,
  loading,
  selectedId,
  onSelect
}: {
  models: NormalizedModel[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = models.find((m) => m.id === selectedId) || null;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
    else setQuery("");
  }, [open]);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? models.filter(
          (m) =>
            m.displayName.toLowerCase().includes(q) ||
            m.id.toLowerCase().includes(q) ||
            m.provider.toLowerCase().includes(q)
        )
      : models;
    const groups = new Map<string, NormalizedModel[]>();
    for (const m of filtered) {
      const key = m.provider;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(m);
    }
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [models, query]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={loading}
        className={clsx(
          "group flex items-center gap-2.5 rounded-full border border-base-border bg-base-surface px-3.5 py-2 text-sm transition-all hover:border-base-borderStrong hover:bg-base-hover disabled:opacity-60",
          open && "border-accent/50 shadow-glow"
        )}
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-soft text-accent">
          <IconBolt size={12} />
        </span>
        <span className="flex flex-col items-start leading-tight">
          <span className="text-[13px] font-medium text-ink">
            {loading ? "Loading models…" : selected ? selected.displayName : "Choose a model"}
          </span>
          {selected && (
            <span className="text-[11px] text-ink-faint">{selected.provider}</span>
          )}
        </span>
        <IconChevronDown
          size={14}
          className={clsx("ml-1 text-ink-faint transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-[min(380px,calc(100vw-1.5rem))] animate-rise overflow-hidden rounded-2xl border border-base-border bg-base-elevated shadow-panel">
          <div className="flex items-center gap-2 border-b border-base-border px-3.5 py-3">
            <IconSearch size={14} className="text-ink-faint" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search models or providers…"
              className="w-full bg-transparent text-sm text-ink placeholder:text-ink-faint outline-none"
            />
          </div>

          <div className="max-h-[360px] overflow-y-auto p-1.5">
            {grouped.length === 0 && (
              <div className="px-3 py-6 text-center text-sm text-ink-faint">
                No models match "{query}"
              </div>
            )}
            {grouped.map(([provider, list]) => (
              <div key={provider} className="mb-1">
                <div className="px-2.5 pb-1 pt-2 text-[11px] font-medium tracking-wide text-ink-faint">
                  {provider}
                </div>
                {list.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      onSelect(m.id);
                      setOpen(false);
                    }}
                    className={clsx(
                      "flex w-full items-center justify-between gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-base-hover",
                      m.id === selectedId && "bg-accent-soft"
                    )}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-medium text-ink">{m.displayName}</div>
                      <div className="truncate text-[11px] text-ink-faint">{m.id}</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {m.supportsVision === "yes" && (
                        <span title="Supports image input" className="text-ink-dim">
                          <IconEye size={13} />
                        </span>
                      )}
                      {m.supportsTools === "yes" && (
                        <span title="Supports tool calling" className="text-ink-dim">
                          <IconWrench size={13} />
                        </span>
                      )}
                      <span className="rounded-full border border-base-border px-1.5 py-0.5 text-[10px] text-ink-faint">
                        {formatContextLength(m.contextLength)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
