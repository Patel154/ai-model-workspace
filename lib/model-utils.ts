import { NormalizedModel, RawModel } from "./types";

/**
 * Experiential Labs is OpenAI-compatible, and /v1/models responses can vary
 * in how much metadata they include (some providers add context_length,
 * pricing, capability flags, etc — the base OpenAI spec only guarantees
 * `id`). We normalize defensively and mark anything we can't determine as
 * "unknown" rather than guessing from the model's name.
 */
export function normalizeModel(raw: RawModel): NormalizedModel {
  const contextLength =
    raw.context_length ??
    raw.context_window ??
    raw.top_provider?.context_length ??
    undefined;

  const provider = inferProvider(raw);

  return {
    id: raw.id,
    displayName: raw.name || prettifyId(raw.id),
    provider,
    description: raw.description,
    contextLength,
    supportsVision: detectCapability(raw, "vision"),
    supportsTools: detectCapability(raw, "tools"),
    raw
  };
}

function inferProvider(raw: RawModel): string {
  if (raw.owned_by) return raw.owned_by;
  // Fall back to the first path segment of the id, e.g. "anthropic/claude-..."
  if (raw.id.includes("/")) return raw.id.split("/")[0];
  return "Experiential Labs";
}

function prettifyId(id: string): string {
  const last = id.includes("/") ? id.split("/").slice(1).join("/") : id;
  return last
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function detectCapability(
  raw: RawModel,
  cap: "vision" | "tools"
): "yes" | "no" | "unknown" {
  // 1. Explicit capabilities object.
  if (raw.capabilities) {
    if (cap === "vision" && typeof raw.capabilities.vision === "boolean") {
      return raw.capabilities.vision ? "yes" : "no";
    }
    if (cap === "tools") {
      const t = raw.capabilities.tools ?? raw.capabilities.function_calling;
      if (typeof t === "boolean") return t ? "yes" : "no";
    }
  }
  // 2. OpenRouter-style architecture.modality / input_modalities.
  if (cap === "vision") {
    const modality = raw.architecture?.modality;
    if (modality && typeof modality === "string") {
      if (modality.includes("image")) return "yes";
      if (modality.startsWith("text->")) return "no";
    }
    const inputs = raw.architecture?.input_modalities;
    if (Array.isArray(inputs)) {
      return inputs.includes("image") ? "yes" : "no";
    }
  }
  // 3. Unknown — never guess from the model name.
  return "unknown";
}

export function formatContextLength(n?: number): string {
  if (!n) return "—";
  if (n >= 1000) return `${Math.round(n / 1000)}K tokens`;
  return `${n} tokens`;
}
