"use client";

import { IconX, IconRefresh, IconAlert, IconCheck } from "./icons";

export default function SettingsModal({
  open,
  onClose,
  status,
  error,
  modelCount,
  onRefetch
}: {
  open: boolean;
  onClose: () => void;
  status: "idle" | "connected" | "error";
  error: string | null;
  modelCount: number;
  onRefetch: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[420px] animate-rise overflow-hidden rounded-2xl border border-base-border bg-base-elevated shadow-panel">
        <div className="flex items-center justify-between border-b border-base-border px-5 py-4">
          <h2 className="text-[14px] font-semibold text-ink">Settings & connection</h2>
          <button onClick={onClose} className="rounded-md p-1 text-ink-faint hover:bg-base-hover hover:text-ink">
            <IconX size={15} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="flex items-center justify-between rounded-xl border border-base-border bg-base-surface px-4 py-3">
            <div className="flex items-center gap-2.5">
              {status === "connected" ? (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-signal-good/15 text-signal-good">
                  <IconCheck size={14} />
                </span>
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-signal-bad/15 text-signal-bad">
                  <IconAlert size={14} />
                </span>
              )}
              <div>
                <div className="text-[13px] font-medium text-ink">
                  {status === "connected" ? "Connected" : "Connection issue"}
                </div>
                <div className="text-[11.5px] text-ink-faint">
                  {status === "connected" ? `${modelCount} models available` : error || "Unable to reach the API"}
                </div>
              </div>
            </div>
            <button
              onClick={onRefetch}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-faint hover:bg-base-hover hover:text-ink"
              aria-label="Retry connection"
            >
              <IconRefresh size={14} />
            </button>
          </div>

          <div className="rounded-xl border border-base-border bg-base-surface px-4 py-3 text-[12.5px] leading-relaxed text-ink-dim">
            Your API key lives only in <code className="rounded bg-base-hover px-1 py-0.5 font-mono text-[11.5px]">.env.local</code> on
            the server — it's never sent to or readable from the browser. To change it, edit
            <code className="rounded bg-base-hover px-1 py-0.5 font-mono text-[11.5px]"> EXPERIENTIAL_LABS_API_KEY</code> and restart the dev server.
          </div>

          <div className="rounded-xl border border-base-border bg-base-surface px-4 py-3 text-[12.5px] leading-relaxed text-ink-dim">
            Conversations are stored locally in this browser only. Clearing site data will remove your chat history.
          </div>
        </div>
      </div>
    </div>
  );
}
