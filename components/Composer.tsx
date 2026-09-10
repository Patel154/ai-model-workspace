"use client";

import { useCallback, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import { AttachmentRef } from "@/lib/types";
import {
  classifyFile,
  readAsText,
  readAsDataUrl,
  extractZipFiles,
  MAX_FILE_BYTES,
  humanSize
} from "@/lib/file-utils";
import FileChip from "./FileChip";
import { IconPaperclip, IconSend, IconSquare, IconAlert } from "./icons";
import clsx from "clsx";

export default function Composer({
  disabled,
  streaming,
  onSend,
  onStop
}: {
  disabled: boolean;
  streaming: boolean;
  onSend: (text: string, attachments: AttachmentRef[]) => void;
  onStop: () => void;
}) {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<AttachmentRef[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    setFileError(null);
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_BYTES) {
        setFileError(`${file.name} is too large (max ${humanSize(MAX_FILE_BYTES)}).`);
        continue;
      }
      const kind = classifyFile(file);
      try {
        if (file.name.toLowerCase().endsWith(".zip") || file.type === "application/zip") {
          const extractedFiles = await extractZipFiles(file);
          if (extractedFiles.length === 0) {
            setFileError(`${file.name} contains no supported files.`);
          } else {
            await processFiles(extractedFiles);
          }
        } else if (kind === "text") {
          const { content, truncated } = await readAsText(file);
          addAttachment({
            id: uuid(),
            name: file.name,
            mime: file.type || "text/plain",
            kind: "text",
            size: file.size,
            textContent: content,
            truncated
          });
        } else if (kind === "image") {
          const dataUrl = await readAsDataUrl(file);
          addAttachment({
            id: uuid(),
            name: file.name,
            mime: file.type || "image/*",
            kind: "image",
            size: file.size,
            dataUrl
          });
        } else if (file.name.toLowerCase().endsWith(".pdf")) {
          const form = new FormData();
          form.append("file", file);
          const res = await fetch("/api/files/parse", { method: "POST", body: form });
          const data = await res.json();
          if (!res.ok) {
            setFileError(data?.error?.message || `Couldn't read ${file.name}.`);
            continue;
          }
          addAttachment({
            id: uuid(),
            name: file.name,
            mime: "application/pdf",
            kind: "text",
            size: file.size,
            textContent: data.text,
            truncated: data.truncated
          });
        } else {
          setFileError(`${file.name} is an unsupported file type.`);
        }
      } catch {
        setFileError(`Couldn't read ${file.name}.`);
      }
    }
  }, []);

  const addAttachment = (a: AttachmentRef) => {
    setAttachments((prev) => [...prev, a]);
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSend = () => {
    if (disabled || streaming) return;
    if (!text.trim() && attachments.length === 0) return;
    onSend(text.trim(), attachments);
    setText("");
    setAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const autoGrow = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 220) + "px";
  };

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      if (disabled) return;

      const imageItems = Array.from(e.clipboardData.items).filter((item) =>
        item.type.startsWith("image/")
      );
      if (imageItems.length === 0) return;

      const imageFiles = imageItems
        .map((item, index) => {
          const blob = item.getAsFile();
          if (!blob) return null;
          const extension = blob.type.split("/")[1] || "png";
          return new File(
            [blob],
            `pasted-screenshot-${Date.now()}-${index + 1}.${extension}`,
            { type: blob.type }
          );
        })
        .filter((file): file is File => file !== null);

      if (imageFiles.length > 0) {
        e.preventDefault();
        void processFiles(imageFiles);
      }
    },
    [disabled, processFiles]
  );

  return (
    <div className="border-t border-base-border bg-base/95 px-4 pb-4 pt-3 backdrop-blur sm:px-8">
      <div className="mx-auto w-full max-w-[900px]">
        {fileError && (
          <div className="mb-2 flex items-center gap-2 rounded-lg border border-signal-bad/30 bg-signal-bad/10 px-3 py-2 text-[12px] text-signal-bad">
            <IconAlert size={13} />
            {fileError}
            <button className="ml-auto text-ink-faint hover:text-ink" onClick={() => setFileError(null)}>
              Dismiss
            </button>
          </div>
        )}

        <div
          className={clsx(
            "rounded-2xl border bg-base-surface transition-colors",
            dragOver ? "border-accent bg-accent-soft" : "border-base-border"
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files?.length) processFiles(e.dataTransfer.files);
          }}
        >
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-3.5 pt-3">
              {attachments.map((a) => (
                <FileChip key={a.id} attachment={a} onRemove={() => removeAttachment(a.id)} />
              ))}
            </div>
          )}

          <div className="flex items-end gap-2 px-2 py-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-ink-faint transition-colors hover:bg-base-hover hover:text-ink disabled:opacity-40"
              aria-label="Upload file"
            >
              <IconPaperclip size={16} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) processFiles(e.target.files);
                e.target.value = "";
              }}
            />

            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                autoGrow(e.target);
              }}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              disabled={disabled}
              placeholder={disabled ? "Choose a model to start chatting…" : "Message the model, or drop a file in…"}
              rows={1}
              className="max-h-[220px] flex-1 resize-none bg-transparent py-1.5 text-[14px] text-ink placeholder:text-ink-faint outline-none disabled:opacity-50"
            />

            {streaming ? (
              <button
                onClick={onStop}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-base-hover text-ink transition-colors hover:bg-base-border"
                aria-label="Stop generating"
              >
                <IconSquare size={13} />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={disabled || (!text.trim() && attachments.length === 0)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-white transition-all hover:bg-accent-bright disabled:bg-base-hover disabled:text-ink-faint"
                aria-label="Send message"
              >
                <IconSend size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="mt-1.5 px-1 text-center text-[10.5px] text-ink-faint">
          Enter to send · Shift+Enter for a new line · Paste screenshots directly
        </div>
      </div>
    </div>
  );
}
