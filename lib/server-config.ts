// Server-only config. This module must never be imported from client
// components — Next.js will throw a build error if it leaks into a
// client bundle because it reads process.env directly on the server.

export function getApiKey(): string {
  const key = process.env.EXPERIENTIAL_LABS_API_KEY;
  if (!key) {
    throw new ConfigError(
      "EXPERIENTIAL_LABS_API_KEY is not set. Add it to a .env.local file at the project root."
    );
  }
  return key;
}

export function getBaseUrl(): string {
  return (
    process.env.EXPERIENTIAL_LABS_BASE_URL || "https://api.experientiallabs.ai/v1"
  );
}

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}
