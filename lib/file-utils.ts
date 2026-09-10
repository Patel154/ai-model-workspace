// Client-side helpers for classifying and reading uploaded files.

const TEXT_EXTENSIONS: Record<string, string> = {
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
  txt: "text",
  yml: "yaml",
  yaml: "yaml",
  sh: "bash",
  go: "go",
  rs: "rust",
  java: "java",
  rb: "ruby",
  php: "php",
  c: "c",
  h: "c",
  cpp: "cpp",
  cs: "csharp",
  sql: "sql",
  toml: "toml",
  env: "bash",
  vue: "html"
};

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg"]);

// A generous but bounded cap so we don't blow the context window of
// whichever model is selected. ~120k chars is roughly 30-40k tokens.
export const MAX_TEXT_CHARS = 120_000;
export const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15MB

export function extOf(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

export function classifyFile(file: File): "text" | "image" | "binary" {
  const ext = extOf(file.name);
  if (IMAGE_EXTENSIONS.has(ext) || file.type.startsWith("image/")) {
    return "image";
  }
  if (ext in TEXT_EXTENSIONS || file.type.startsWith("text/") || ext === "") {
    return "text";
  }
  if (ext === "pdf") return "binary"; // handled server-side
  return "binary";
}

export function languageFor(filename: string): string {
  const ext = extOf(filename);
  return TEXT_EXTENSIONS[ext] || "text";
}

export function readAsText(
  file: File
): Promise<{ content: string; truncated: boolean }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const full = String(reader.result || "");
      const truncated = full.length > MAX_TEXT_CHARS;
      resolve({
        content: truncated ? full.slice(0, MAX_TEXT_CHARS) : full,
        truncated
      });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

export function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
