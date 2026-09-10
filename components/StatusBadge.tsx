"use client";

type Status = "idle" | "connected" | "error";

export default function StatusBadge({ status, label }: { status: Status; label: string }) {
  const color =
    status === "connected" ? "bg-signal-good" : status === "error" ? "bg-signal-bad" : "bg-ink-faint";
  const dotAnim = status === "idle" ? "animate-pulseDot" : "";
  return (
    <div className="flex items-center gap-2 text-xs text-ink-dim">
      <span className={`h-1.5 w-1.5 rounded-full ${color} ${dotAnim}`} />
      <span>{label}</span>
    </div>
  );
}
