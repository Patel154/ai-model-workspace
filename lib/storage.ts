import { Conversation } from "./types";

const STORAGE_KEY = "exlabs.conversations.v1";
const LAST_MODEL_KEY = "exlabs.last-model.v1";

export function loadConversations(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveConversations(conversations: Conversation[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch {
    // Storage full or unavailable — conversations simply won't persist.
  }
}

export function loadLastModel(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(LAST_MODEL_KEY);
}

export function saveLastModel(modelId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LAST_MODEL_KEY, modelId);
}
