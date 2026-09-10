// Core shared types for the Experiential Labs dashboard.

export type ModelCapability = "vision" | "tools" | "json_mode" | "streaming";

export interface RawModel {
  id: string;
  object?: string;
  created?: number;
  owned_by?: string;
  // The following fields are non-standard extensions some OpenAI-compatible
  // providers include. We read them defensively — none are guaranteed.
  name?: string;
  description?: string;
  context_length?: number;
  context_window?: number;
  max_output_tokens?: number;
  pricing?: {
    prompt?: string | number;
    completion?: string | number;
    unit?: string;
  };
  capabilities?: {
    vision?: boolean;
    tools?: boolean;
    function_calling?: boolean;
    json_mode?: boolean;
    streaming?: boolean;
  };
  architecture?: {
    modality?: string; // e.g. "text->text" or "text+image->text"
    input_modalities?: string[];
    output_modalities?: string[];
  };
  top_provider?: {
    context_length?: number;
    max_completion_tokens?: number;
  };
  [key: string]: unknown;
}

export interface NormalizedModel {
  id: string;
  displayName: string;
  provider: string;
  description?: string;
  contextLength?: number;
  supportsVision: "yes" | "no" | "unknown";
  supportsTools: "yes" | "no" | "unknown";
  raw: RawModel;
}

export type MessageRole = "user" | "assistant" | "system";

export interface AttachmentRef {
  id: string;
  name: string;
  mime: string;
  kind: "text" | "image" | "binary";
  size: number;
  // For text-like files, the extracted text content (may be truncated).
  textContent?: string;
  // For images, a data URL used for vision-capable models.
  dataUrl?: string;
  truncated?: boolean;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  attachments?: AttachmentRef[];
  modelId?: string;
  createdAt: number;
  error?: string;
  pending?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  modelId: string | null;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface ApiErrorPayload {
  error: {
    message: string;
    type?: string;
    code?: string | number;
  };
}
