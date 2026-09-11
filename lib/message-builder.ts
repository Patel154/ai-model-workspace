import { ChatMessage } from "./types";
import { SYSTEM_PROMPT } from "./prompt";

export type ApiContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export interface ApiMessage {
  role: "user" | "assistant" | "system";
  content: string | ApiContentPart[];
}

/**
 * Converts our internal conversation history into OpenAI-compatible chat
 * messages, inlining text-file attachments as fenced code blocks and
 * image attachments as multimodal image_url parts.
 */
export function buildApiMessages(messages: ChatMessage[]): ApiMessage[] {
  const out: ApiMessage[] = [{ role: "system", content: SYSTEM_PROMPT }];

  for (const m of messages) {
    if (m.role !== "user" && m.role !== "assistant") continue;
    if (m.pending && !m.content) continue; // skip empty in-flight placeholders

    const images = (m.attachments || []).filter((a) => a.kind === "image" && a.dataUrl);
    const textFiles = (m.attachments || []).filter(
      (a) => a.kind === "text" && a.textContent
    );

    let textBody = m.content;
    for (const f of textFiles) {
      textBody += `\n\nFile: ${f.name}${f.truncated ? " (truncated)" : ""}\n\`\`\`${extToLang(f.name)}\n${f.textContent}\n\`\`\``;
    }

    if (images.length > 0 && m.role === "user") {
      const parts: ApiContentPart[] = [{ type: "text", text: textBody }];
      for (const img of images) {
        parts.push({ type: "image_url", image_url: { url: img.dataUrl! } });
      }
      out.push({ role: m.role, content: parts });
    } else {
      out.push({ role: m.role, content: textBody });
    }
  }

  return out;
}

function extToLang(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    py: "python",
    js: "javascript",
    jsx: "jsx",
    ts: "typescript",
    tsx: "tsx",
    html: "html",
    htm: "html",
    css: "css",
    scss: "scss",
    json: "json",
    md: "markdown",
    mdx: "markdown",
    vue: "html",
    sh: "bash",
    yml: "yaml",
    yaml: "yaml",
    sql: "sql",
    cs: "csharp"
  };
  return map[ext] || ext || "text";
}
