"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import { Conversation, ChatMessage } from "@/lib/types";
import { loadConversations, saveConversations } from "@/lib/storage";

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const stored = loadConversations();
    setConversations(stored);
    if (stored.length > 0) setActiveId(stored[0].id);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveConversations(conversations);
      saveTimerRef.current = null;
    }, 250);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [conversations, hydrated]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const active = conversations.find((c) => c.id === activeId) || null;

  const createConversation = useCallback((modelId: string | null) => {
    const conv: Conversation = {
      id: uuid(),
      title: "New chat",
      modelId,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setConversations((prev) => [conv, ...prev]);
    setActiveId(conv.id);
    return conv.id;
  }, []);

  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeId === id) setActiveId(null);
    },
    [activeId]
  );

  const clearConversation = useCallback((id: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, messages: [], updatedAt: Date.now() } : c))
    );
  }, []);

  const renameConversation = useCallback((id: string, title: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title } : c))
    );
  }, []);

  const setConversationModel = useCallback((id: string, modelId: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, modelId, updatedAt: Date.now() } : c))
    );
  }, []);

  const appendMessage = useCallback((id: string, message: ChatMessage) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const isFirstUserMsg = c.messages.length === 0 && message.role === "user";
        return {
          ...c,
          messages: [...c.messages, message],
          updatedAt: Date.now(),
          title: isFirstUserMsg ? deriveTitle(message.content) : c.title
        };
      })
    );
  }, []);

  const updateMessage = useCallback(
    (convId: string, messageId: string, patch: Partial<ChatMessage>) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== convId) return c;
          return {
            ...c,
            updatedAt: Date.now(),
            messages: c.messages.map((m) =>
              m.id === messageId ? { ...m, ...patch } : m
            )
          };
        })
      );
    },
    []
  );

  const removeMessage = useCallback((convId: string, messageId: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? { ...c, messages: c.messages.filter((m) => m.id !== messageId) }
          : c
      )
    );
  }, []);

  return {
    conversations,
    active,
    activeId,
    setActiveId,
    createConversation,
    deleteConversation,
    clearConversation,
    renameConversation,
    setConversationModel,
    appendMessage,
    updateMessage,
    removeMessage,
    hydrated
  };
}

function deriveTitle(content: string): string {
  const clean = content.trim().replace(/\s+/g, " ");
  if (!clean) return "New chat";
  return clean.length > 48 ? clean.slice(0, 48) + "…" : clean;
}
