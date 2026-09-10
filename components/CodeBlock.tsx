"use client";

import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { IconCopy, IconCheck, IconFile } from "./icons";
import DiffBlock from "./DiffBlock";
import clsx from "clsx";

export default function CodeBlock({
  language,
  filename,
  content,
  originalContent
}: {
  language: string;
  filename?: string;
  content: string;
  originalContent?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [showDiff, setShowDiff] = useState(false);

  const canDiff = Boolean(filename && originalContent && originalContent !== content);

  const copy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-base-border bg-[#0D0E12]">
      <div className="flex items-center justify-between gap-3 border-b border-base-border bg-base-elevated/70 px-3.5 py-2">
        <div className="flex min-w-0 items-center gap-2 text-[12px] text-ink-dim">
          {filename ? (
            <>
              <IconFile size={12} className="shrink-0 text-ink-faint" />
              <span className="truncate font-mono">{filename}</span>
            </>
          ) : (
            <span className="font-mono text-ink-faint">{language || "text"}</span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {canDiff && (
            <button
              onClick={() => setShowDiff((v) => !v)}
              className={clsx(
                "rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                showDiff
                  ? "bg-accent-soft text-accent"
                  : "text-ink-faint hover:bg-base-hover hover:text-ink"
              )}
            >
              {showDiff ? "Hide diff" : "Compare to original"}
            </button>
          )}
          <button
            onClick={copy}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-ink-faint transition-colors hover:bg-base-hover hover:text-ink"
          >
            {copied ? <IconCheck size={12} className="text-signal-good" /> : <IconCopy size={12} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      {showDiff && originalContent ? (
        <div className="px-3.5 py-3">
          <DiffBlock original={originalContent} modified={content} />
        </div>
      ) : (
        <SyntaxHighlighter
          language={language || "text"}
          style={oneDark}
          customStyle={{
            margin: 0,
            background: "transparent",
            padding: "14px",
            fontSize: "12.5px",
            lineHeight: 1.6
          }}
          wrapLongLines
        >
          {content}
        </SyntaxHighlighter>
      )}
    </div>
  );
}
