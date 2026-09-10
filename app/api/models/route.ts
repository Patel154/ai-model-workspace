import { NextResponse } from "next/server";
import { getApiKey, getBaseUrl, ConfigError } from "@/lib/server-config";
import { normalizeModel } from "@/lib/model-utils";
import { classifyUpstreamError } from "@/lib/api-errors";
import { RawModel } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  let apiKey: string;
  let baseUrl: string;

  try {
    apiKey = getApiKey();
    baseUrl = getBaseUrl();
  } catch (err) {
    if (err instanceof ConfigError) {
      return NextResponse.json(
        { error: { message: err.message, type: "config_error" } },
        { status: 500 }
      );
    }
    throw err;
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${baseUrl}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store"
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: {
          message:
            "Couldn't reach the Experiential Labs API. Check your network connection and the configured base URL.",
          type: "network_error"
        }
      },
      { status: 502 }
    );
  }

  if (!upstream.ok) {
    const classified = await classifyUpstreamError(upstream);
    return NextResponse.json(
      { error: { message: classified.message, type: classified.type } },
      { status: classified.status }
    );
  }

  const body = await upstream.json().catch(() => null);
  const list: RawModel[] = Array.isArray(body?.data) ? body.data : [];

  const models = list
    .map(normalizeModel)
    .sort((a, b) => a.displayName.localeCompare(b.displayName));

  return NextResponse.json({ models });
}
