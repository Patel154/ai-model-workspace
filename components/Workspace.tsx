"use client";

import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import ModelSelector from "./ModelSelector";
import ChatMessages from "./ChatMessages";
import Composer from "./Composer";
import StatusBadge from "./StatusBadge";
import SettingsModal from "./SettingsModal";
import { useModels } from "@/hooks/useModels";
import { useConversations } from "@/hooks/useConversations";
import { useChatStream } from "@/hooks/useChatStream";
import { loadLastModel, saveLastModel } from "@/lib/storage";
import { AttachmentRef } from "@/lib/types";
import { IconMenu, IconTrash } from "./icons";

export default function Workspace() {
  const { models, loading: modelsLoading, error: modelsError, status, refetch } = useModels();
  const {
    conversations,
    active,
    activeId,
    setActiveId,
    createConversation,
    deleteConversation,
    clearConversation,
    setConversationModel,
    appendMessage,
    updateMessage,
    removeMessage,
    hydrated
  } = useConversations();
  const { run, regenerate, stop, streamingId } = useChatStream({
    appendMessage,
    updateMessage,
    removeMessage
  });

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pendingModel, setPendingModel] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Seed the model choice: prefer the active conversation's model, then the
  // last model used anywhere, then the first model the API returns.
  useEffect(() => {
    if (models.length === 0) return;
    if (active?.modelId) return;
    if (pendingModel) return;
    const last = loadLastModel();
    const fallback = models.find((m) => m.id === last)?.id || models[0].id;
    setPendingModel(fallback);
  }, [models, active, pendingModel]);

  const currentModelId = active?.modelId || pendingModel;
  const isStreaming = streamingId !== null;

  const handleSelectModel = (modelId: string) => {
    saveLastModel(modelId);
    if (active) {
      setConversationModel(active.id, modelId);
    } else {
      setPendingModel(modelId);
    }
  };

  const handleNewChat = () => {
    createConversation(currentModelId || null);
  };

  const ensureConversation = (): string => {
    if (active) return active.id;
    return createConversation(currentModelId || null);
  };

  const handleSend = (text: string, attachments: AttachmentRef[]) => {
    if (!currentModelId) return;
    const convId = ensureConversation();
    const history = active?.id === convId ? active.messages : [];
    run(convId, currentModelId, history, text, attachments);
  };

  const handleRegenerate = () => {
    if (!active || !currentModelId) return;
    const lastAssistant = [...active.messages].reverse().find((m) => m.role === "assistant");
    regenerate(active.id, currentModelId, active.messages, lastAssistant?.id || null);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-base">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={(id) => {
          setActiveId(id);
          setSidebarOpen(false);
        }}
        onNew={() => {
          handleNewChat();
          setSidebarOpen(false);
        }}
        onDelete={deleteConversation}
        onOpenSettings={() => {
          setSettingsOpen(true);
          setSidebarOpen(false);
        }}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-2 border-b border-base-border px-3 py-2.5 sm:gap-3 sm:px-6 sm:py-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-ink-faint transition-colors hover:bg-base-hover hover:text-ink md:hidden"
              aria-label="Open navigation"
            >
              <IconMenu size={18} />
            </button>
            <ModelSelector
              models={models}
              loading={modelsLoading}
              selectedId={currentModelId}
              onSelect={handleSelectModel}
            />
            {active && active.messages.length > 0 && (
              <span className="hidden max-w-[220px] truncate text-[12.5px] text-ink-faint sm:inline">
                {active.title}
              </span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <StatusBadge
              status={status}
              label={
                status === "connected"
                  ? "API connected"
                  : status === "error"
                  ? "Connection issue"
                  : "Connecting…"
              }
            />
            {active && active.messages.length > 0 && (
              <button
                onClick={() => clearConversation(active.id)}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[12px] text-ink-faint transition-colors hover:bg-base-hover hover:text-ink sm:px-2.5"
              >
                <IconTrash size={12} />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
          </div>
        </header>

        {modelsError && status === "error" && (
          <div className="border-b border-signal-bad/30 bg-signal-bad/10 px-6 py-2 text-center text-[12.5px] text-signal-bad">
            {modelsError}
          </div>
        )}

        <div className="flex flex-1 flex-col overflow-y-auto">
          <ChatMessages
            messages={active?.messages || []}
            models={models}
            onRegenerate={handleRegenerate}
          />
        </div>

        <Composer
          disabled={!hydrated || !currentModelId}
          streaming={isStreaming}
          onSend={handleSend}
          onStop={stop}
        />
      </div>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        status={status}
        error={modelsError}
        modelCount={models.length}
        onRefetch={refetch}
      />
    </div>
  );
}
