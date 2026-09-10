"use client";

import { Conversation } from "@/lib/types";
import { IconPlus, IconMessage, IconTrash, IconSettings } from "./icons";
import clsx from "clsx";

export default function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onOpenSettings,
  open,
  onClose
}: {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onOpenSettings: () => void;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {open && (
        <button
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={onClose}
          aria-label="Close navigation"
        />
      )}
      <aside className={clsx(
        "fixed inset-y-0 left-0 z-40 flex h-full w-[min(264px,calc(100vw-2rem))] shrink-0 flex-col border-r border-base-border bg-base-surface shadow-panel transition-transform md:static md:z-auto md:w-[264px] md:translate-x-0 md:bg-base-surface/60 md:shadow-none",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-white shadow-glow">
          <span className="text-xs font-bold">EL</span>
        </div>
        <div className="leading-tight">
          <div className="text-[13px] font-semibold text-ink">Experiential Labs</div>
          <div className="text-[11px] text-ink-faint">Workspace</div>
        </div>
      </div>

      <div className="px-3 pb-2">
        <button
          onClick={onNew}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-base-border bg-base-elevated px-3 py-2.5 text-[13px] font-medium text-ink transition-colors hover:border-accent/40 hover:bg-accent-soft hover:text-accent"
        >
          <IconPlus size={14} />
          New chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2.5 pb-3 pt-2">
        <div className="px-1.5 pb-1.5 text-[11px] font-medium tracking-wide text-ink-faint">
          Conversations
        </div>
        {conversations.length === 0 && (
          <div className="mx-1.5 mt-2 rounded-xl border border-dashed border-base-border px-3 py-4 text-center text-[12px] text-ink-faint">
            Your chats will show up here once you start one.
          </div>
        )}
        <div className="flex flex-col gap-0.5">
          {conversations.map((c) => (
            <div
              key={c.id}
              className={clsx(
                "group flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] transition-colors cursor-pointer",
                c.id === activeId
                  ? "bg-base-hover text-ink"
                  : "text-ink-dim hover:bg-base-hover/60 hover:text-ink"
              )}
              onClick={() => onSelect(c.id)}
            >
              <IconMessage size={13} className="shrink-0 text-ink-faint" />
              <span className="min-w-0 flex-1 truncate">{c.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(c.id);
                }}
                className="shrink-0 rounded-md p-1 text-ink-faint opacity-0 transition-opacity hover:bg-base-border hover:text-signal-bad group-hover:opacity-100"
                aria-label="Delete conversation"
              >
                <IconTrash size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-base-border p-3">
        <button
          onClick={onOpenSettings}
          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-ink-dim transition-colors hover:bg-base-hover hover:text-ink"
        >
          <IconSettings size={14} />
          Settings & connection
        </button>
      </div>
      </aside>
    </>
  );
}
