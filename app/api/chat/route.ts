import { NextRequest, NextResponse } from "next/server";
import { getApiKey, getBaseUrl, ConfigError } from "@/lib/server-config";
import { classifyUpstreamError } from "@/lib/api-errors";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

interface ChatRequestBody {
  modelId: string;
  messages: Array<{
    role: "user" | "assistant" | "system";
    content: string | Array<Record<string, unknown>>;
  }>;
}

export async function POST(req: NextRequest) {
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

  let body: ChatRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { message: "Malformed request body.", type: "bad_request" } },
      { status: 400 }
    );
  }

  if (!body.modelId || !Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json(
      {
        error: {
          message: "A model and at least one message are required.",
          type: "bad_request"
        }
      },
      { status: 400 }
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: body.modelId,
        messages: body.messages,
        stream: true
      })
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: {
          message:
            "Couldn't reach the Experiential Labs API. Check your network connection.",
          type: "network_error"
        }
      },
      { status: 502 }
    );
  }

  if (!upstream.ok || !upstream.body) {
    const classified = await classifyUpstreamError(upstream);
    return NextResponse.json(
      { error: { message: classified.message, type: classified.type } },
      { status: classified.status }
    );
  }

  // Pass the upstream SSE stream straight through to the client. The
  // client parses the same `data: {...}` chunks an OpenAI-compatible
  // streaming response emits, so we don't need to buffer or reshape
  // anything here — this keeps latency to first token minimal.
  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no"
    }
  });
}
