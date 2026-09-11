"use client";

import { useEffect, useMemo, useRef } from "react";
import { ChatMessage, NormalizedModel } from "@/lib/types";
import MessageBubble from "./MessageBubble";
import EmptyState from "./EmptyState";

export default function ChatMessages({
  messages,
  models,
  onRegenerate
}: {
  messages: ChatMessage[];
  models: NormalizedModel[];
  onRegenerate: () => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wasNearBottomRef = useRef(true);

  useEffect(() => {
    const container = containerRef.current?.parentElement;
    if (!container) return;

    const updateScrollState = () => {
      wasNearBottomRef.current =
        container.scrollHeight - container.scrollTop - container.clientHeight < 96;
    };

    updateScrollState();
    container.addEventListener("scroll", updateScrollState, { passive: true });
    return () => container.removeEventListener("scroll", updateScrollState);
  }, []);

  useEffect(() => {
    if (wasNearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ block: "end", behavior: "auto" });
    }
  }, [messages.length, messages[messages.length - 1]?.content]);

  const attachmentKey = messages
    .filter((m) => m.role === "user" && m.attachments?.length)
    .map((m) => m.attachments!.map((a) => `${a.id}:${a.name}:${a.textContent || ""}`).join("|"))
    .join(";");

  const attachmentMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of messages) {
      if (m.role !== "user") continue;
      for (const a of m.attachments || []) {
        if (a.kind === "text" && a.textContent) map.set(a.name, a.textContent);
      }
    }
    return map;
  }, [attachmentKey]);

  const modelNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of models) map.set(m.id, m.displayName);
    return map;
  }, [models]);

  const lastAssistantId = [...messages].reverse().find((m) => m.role === "assistant")?.id;

  if (messages.length === 0) {
    return <EmptyState />;
  }

  return (
    <div ref={containerRef} className="mx-auto flex w-full max-w-[900px] flex-1 flex-col py-4">
      {messages.map((m) => (
        <MessageBubble
          key={m.id}
          message={m}
          modelName={m.modelId ? modelNameById.get(m.modelId) || m.modelId : undefined}
          attachmentMap={attachmentMap}
          isLast={m.id === lastAssistantId}
          onRegenerate={m.id === lastAssistantId ? onRegenerate : undefined}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
