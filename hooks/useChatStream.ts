"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import { ChatMessage, AttachmentRef } from "@/lib/types";
import { buildApiMessages } from "@/lib/message-builder";

interface UseChatStreamArgs {
  appendMessage: (convId: string, message: ChatMessage) => void;
  updateMessage: (
    convId: string,
    messageId: string,
    patch: Partial<ChatMessage>
  ) => void;
  removeMessage: (convId: string, messageId: string) => void;
}

export function useChatStream({
  appendMessage,
  updateMessage,
  removeMessage
}: UseChatStreamArgs) {
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const pendingUpdateRef = useRef<{
    convId: string;
    messageId: string;
    content: string;
  } | null>(null);
  const updateFrameRef = useRef<number | null>(null);
  const updateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushStreamingUpdate = useCallback(() => {
    updateFrameRef.current = null;
    const pending = pendingUpdateRef.current;
    if (!pending) return;
    pendingUpdateRef.current = null;
    updateMessage(pending.convId, pending.messageId, {
      content: pending.content,
      pending: true
    });
  }, [updateMessage]);

  const queueStreamingUpdate = useCallback(
    (convId: string, messageId: string, content: string) => {
      pendingUpdateRef.current = { convId, messageId, content };
      if (updateFrameRef.current === null && updateTimerRef.current === null) {
        // Keep Markdown parsing below the rate at which tokens arrive.
        updateTimerRef.current = setTimeout(() => {
          updateTimerRef.current = null;
          updateFrameRef.current = requestAnimationFrame(flushStreamingUpdate);
        }, 50);
      }
    },
    [flushStreamingUpdate]
  );

  useEffect(() => {
    return () => {
      if (updateFrameRef.current !== null) {
        cancelAnimationFrame(updateFrameRef.current);
      }
      if (updateTimerRef.current !== null) {
        clearTimeout(updateTimerRef.current);
      }
    };
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const run = useCallback(
    async (
      convId: string,
      modelId: string,
      history: ChatMessage[],
      userText: string,
      attachments: AttachmentRef[]
    ) => {
      const userMessage: ChatMessage = {
        id: uuid(),
        role: "user",
        content: userText,
        attachments,
        createdAt: Date.now()
      };
      appendMessage(convId, userMessage);

      const assistantId = uuid();
      appendMessage(convId, {
        id: assistantId,
        role: "assistant",
        content: "",
        modelId,
        createdAt: Date.now(),
        pending: true
      });
      setStreamingId(assistantId);

      const apiMessages = buildApiMessages([...history, userMessage]);
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ modelId, messages: apiMessages }),
          signal: controller.signal
        });

        if (!res.ok || !res.body) {
          const data = await res.json().catch(() => null);
          updateMessage(convId, assistantId, {
            pending: false,
            error: data?.error?.message || `Request failed (${res.status}).`
          });
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const payload = trimmed.slice(5).trim();
            if (payload === "[DONE]") continue;
            try {
              const json = JSON.parse(payload);
              const delta = json?.choices?.[0]?.delta?.content;
              if (typeof delta === "string" && delta.length > 0) {
                accumulated += delta;
                queueStreamingUpdate(convId, assistantId, accumulated);
              }
            } catch {
              // Ignore malformed/partial SSE chunks — they self-correct
              // as more of the stream arrives.
            }
          }
        }

        if (accumulated.trim().length === 0) {
          updateMessage(convId, assistantId, {
            pending: false,
            error: "The model returned an empty response."
          });
        } else {
          if (updateFrameRef.current !== null) {
            cancelAnimationFrame(updateFrameRef.current);
            updateFrameRef.current = null;
          }
          if (updateTimerRef.current !== null) {
            clearTimeout(updateTimerRef.current);
            updateTimerRef.current = null;
          }
          flushStreamingUpdate();
          updateMessage(convId, assistantId, { pending: false });
        }
      } catch (err: any) {
        if (err?.name === "AbortError") {
          updateMessage(convId, assistantId, { pending: false });
        } else {
          updateMessage(convId, assistantId, {
            pending: false,
            error: "Connection lost while streaming the response."
          });
        }
      } finally {
        setStreamingId((cur) => (cur === assistantId ? null : cur));
        abortRef.current = null;
      }
    },
    [appendMessage, flushStreamingUpdate, queueStreamingUpdate, updateMessage]
  );

  const regenerate = useCallback(
    async (
      convId: string,
      modelId: string,
      history: ChatMessage[],
      failedAssistantId: string | null
    ) => {
      if (failedAssistantId) removeMessage(convId, failedAssistantId);
      const lastUser = [...history].reverse().find((m) => m.role === "user");
      if (!lastUser) return;
      const withoutLast = history.filter(
        (m) => m.id !== lastUser.id && m.id !== failedAssistantId
      );
      await run(convId, modelId, withoutLast, lastUser.content, lastUser.attachments || []);
    },
    [run, removeMessage]
  );

  return { run, regenerate, stop, streamingId };
}
