"use client";

import { AttachmentRef } from "@/lib/types";
import { humanSize } from "@/lib/file-utils";
import { IconFile, IconImage, IconX, IconAlert } from "./icons";

export default function FileChip({
  attachment,
  onRemove
}: {
  attachment: AttachmentRef;
  onRemove: () => void;
}) {
  const isImage = attachment.kind === "image";
  return (
    <div className="flex items-center gap-2 rounded-lg border border-base-border bg-base-elevated py-1.5 pl-2 pr-1.5">
      {isImage && attachment.dataUrl ? (
        <img src={attachment.dataUrl} alt="" className="h-6 w-6 rounded object-cover" />
      ) : (
        <span className="flex h-6 w-6 items-center justify-center rounded bg-base-hover text-ink-faint">
          {attachment.kind === "binary" ? <IconAlert size={12} /> : <IconFile size={12} />}
        </span>
      )}
      <div className="leading-tight">
        <div className="max-w-[140px] truncate text-[12px] text-ink">{attachment.name}</div>
        <div className="text-[10px] text-ink-faint">
          {humanSize(attachment.size)}
          {attachment.truncated ? " · truncated" : ""}
        </div>
      </div>
      <button
        onClick={onRemove}
        className="ml-1 rounded-md p-1 text-ink-faint hover:bg-base-border hover:text-ink"
        aria-label={`Remove ${attachment.name}`}
      >
        <IconX size={11} />
      </button>
    </div>
  );
}
