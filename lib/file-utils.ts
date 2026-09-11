// Client-side helpers for classifying and reading uploaded files.
import JSZip from "jszip";

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
export const MAX_ARCHIVE_ENTRIES = 100;
const POWERPOINT_EXTENSIONS = new Set(["pptx", "pptm"]);

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
  if (POWERPOINT_EXTENSIONS.has(ext)) return "binary"; // extracted from OOXML below
  if (ext === "zip" || file.type === "application/zip") return "binary";
  return "binary";
}

export async function extractPowerPointText(
  file: File
): Promise<{ content: string; truncated: boolean; slides: number }> {
  const archive = await JSZip.loadAsync(file);
  const slideEntries = Object.values(archive.files)
    .filter((entry) => /^ppt\/slides\/slide\d+\.xml$/i.test(entry.name) && !entry.dir)
    .sort((a, b) => {
      const number = (name: string) => Number(name.match(/slide(\d+)\.xml$/i)?.[1] || 0);
      return number(a.name) - number(b.name);
    });

  if (slideEntries.length === 0) {
    throw new Error("This PowerPoint file does not contain readable slides.");
  }
  if (slideEntries.length > MAX_ARCHIVE_ENTRIES) {
    throw new Error(`PowerPoint contains too many slides (max ${MAX_ARCHIVE_ENTRIES}).`);
  }

  const slideTexts: string[] = [];
  for (let index = 0; index < slideEntries.length; index += 1) {
    const xml = await slideEntries[index].async("string");
    const document = new DOMParser().parseFromString(xml, "application/xml");
    if (document.querySelector("parsererror")) {
      throw new Error("PowerPoint contains an unreadable slide.");
    }
    const text = Array.from(document.getElementsByTagName("a:t"))
      .map((node) => node.textContent || "")
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (text) slideTexts.push(`Slide ${index + 1}\n${text}`);
  }

  const full = slideTexts.join("\n\n");
  const truncated = full.length > MAX_TEXT_CHARS;
  return {
    content: truncated ? full.slice(0, MAX_TEXT_CHARS) : full,
    truncated,
    slides: slideEntries.length
  };
}

export async function extractZipFiles(file: File): Promise<File[]> {
  const archive = await JSZip.loadAsync(file);
  const entries = Object.values(archive.files).filter((entry) => !entry.dir);
  if (entries.length > MAX_ARCHIVE_ENTRIES) {
    throw new Error(`ZIP contains too many files (max ${MAX_ARCHIVE_ENTRIES}).`);
  }

  const extracted: File[] = [];
  for (const entry of entries) {
    const name = entry.name.replace(/^\/+/, "");
    if (!name || name.includes("..")) continue;
    const blob = await entry.async("blob");
    if (blob.size > MAX_FILE_BYTES) continue;
    extracted.push(new File([blob], name, { type: blob.type || mimeFor(name) }));
  }
  return extracted;
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

function mimeFor(filename: string): string {
  const ext = extOf(filename);
  if (IMAGE_EXTENSIONS.has(ext)) return `image/${ext === "jpg" ? "jpeg" : ext}`;
  if (ext in TEXT_EXTENSIONS) return "text/plain";
  return "application/octet-stream";
}
