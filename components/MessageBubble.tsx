"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChatMessage } from "@/lib/types";
import CodeBlock from "./CodeBlock";
import { IconAlert, IconFile, IconImage, IconRefresh, IconCopy, IconCheck } from "./icons";
import { humanSize } from "@/lib/file-utils";
import { memo, useState } from "react";
import clsx from "clsx";

function MessageBubble({
  message,
  modelName,
  attachmentMap,
  onRegenerate,
  isLast
}: {
  message: ChatMessage;
  modelName?: string;
  attachmentMap: Map<string, string>;
  onRegenerate?: () => void;
  isLast: boolean;
}) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const copyAll = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (isUser) {
    return (
      <div className="flex animate-rise justify-end px-4 py-2 sm:px-8">
        <div className="max-w-[75%]">
          {message.attachments && message.attachments.length > 0 && (
            <div className="mb-1.5 flex flex-wrap justify-end gap-1.5">
              {message.attachments.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-1.5 rounded-lg border border-base-border bg-base-elevated px-2.5 py-1.5 text-[11px] text-ink-dim"
                >
                  {a.kind === "image" ? <IconImage size={12} /> : <IconFile size={12} />}
                  <span className="max-w-[140px] truncate">{a.name}</span>
                  <span className="text-ink-faint">{humanSize(a.size)}</span>
                </div>
              ))}
            </div>
          )}
          {message.content && (
            <div className="rounded-2xl rounded-tr-md bg-accent px-4 py-2.5 text-[14px] leading-relaxed text-white shadow-panel">
              {message.content}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="group animate-rise px-4 py-3 sm:px-8">
      <div className="mb-1.5 flex items-center gap-2">
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-soft text-accent">
          <span className="text-[9px] font-bold">AI</span>
        </div>
        <span className="text-[11.5px] font-medium text-ink-dim">
          {modelName || "Assistant"}
        </span>
        {message.pending && !message.content && (
          <span className="flex gap-1">
            <Dot delay="0ms" />
            <Dot delay="120ms" />
            <Dot delay="240ms" />
          </span>
        )}
      </div>

      <div className="max-w-[820px]">
        {message.content && (
          <div className="prose-chat">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code(props) {
                  const { className, children, ...rest } = props as any;
                  const inline = !className;
                  const raw = String(children).replace(/\n$/, "");
                  if (inline) {
                    return (
                      <code className={className} {...rest}>
                        {children}
                      </code>
                    );
                  }
                  const match = /language-(.+)/.exec(className || "");
                  const info = match ? match[1] : "";
                  const [lang, filename] = info.includes(":")
                    ? [info.split(":")[0], info.split(":").slice(1).join(":")]
                    : [info, undefined];
                  const original = filename ? attachmentMap.get(filename) : undefined;
                  return (
                    <CodeBlock
                      language={lang}
                      filename={filename}
                      content={raw}
                      originalContent={original}
                    />
                  );
                }
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {message.error && (
          <div className="mt-2 flex items-start gap-2 rounded-xl border border-signal-bad/30 bg-signal-bad/10 px-3.5 py-2.5 text-[13px] text-signal-bad">
            <IconAlert size={15} className="mt-0.5 shrink-0" />
            <span>{message.error}</span>
          </div>
        )}

        {!message.pending && (message.content || message.error) && (
          <div className="mt-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {message.content && (
              <button
                onClick={copyAll}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-ink-faint hover:bg-base-hover hover:text-ink"
              >
                {copied ? <IconCheck size={12} className="text-signal-good" /> : <IconCopy size={12} />}
                {copied ? "Copied" : "Copy"}
              </button>
            )}
            {isLast && onRegenerate && (
              <button
                onClick={onRegenerate}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-ink-faint hover:bg-base-hover hover:text-ink"
              >
                <IconRefresh size={12} />
                Regenerate
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="h-1.5 w-1.5 animate-pulseDot rounded-full bg-ink-faint"
      style={{ animationDelay: delay }}
    />
  );
}

export default memo(MessageBubble);
