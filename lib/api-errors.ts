// Shared upstream-error classification for the Experiential Labs API,
// used by both the /models and /chat routes so error handling behaves
// consistently across the app.

export interface ClassifiedError {
  message: string;
  type: string;
  status: number;
}

export async function classifyUpstreamError(
  upstream: Response
): Promise<ClassifiedError> {
  const status = upstream.status;
  let raw: any = null;
  try {
    raw = await upstream.json();
  } catch {
    // Body wasn't JSON (or was already consumed) — fall through to generic messaging.
  }
  const upstreamMessage: string | undefined =
    raw?.error?.message || raw?.message;
  const normalizedMessage = upstreamMessage?.toLowerCase() || "";
  const isCredits =
    normalizedMessage.includes("credit") ||
    normalizedMessage.includes("quota") ||
    normalizedMessage.includes("balance") ||
    normalizedMessage.includes("buy credits") ||
    normalizedMessage.includes("purchase") ||
    normalizedMessage.includes("card verification");

  if (status === 401 || status === 403) {
    return {
      status,
      type: "auth_error",
      message: "The Experiential Labs API key is invalid or unauthorized."
    };
  }
  if (status === 404) {
    return {
      status,
      type: "model_unavailable",
      message:
        upstreamMessage ||
        "That model isn't available right now. It may have been removed or renamed — try refreshing the model list."
    };
  }
  if (status === 402 || status === 429) {
    return {
      status,
      type: isCredits ? "insufficient_credits" : "rate_limit",
      message: isCredits
        ? upstreamMessage || "Your Experiential Labs account is out of credits."
        : "Rate limit reached on the Experiential Labs API. Slow down and try again shortly."
    };
  }
  if (status === 400) {
    const isCapability =
      upstreamMessage?.toLowerCase().includes("image") ||
      upstreamMessage?.toLowerCase().includes("vision") ||
      upstreamMessage?.toLowerCase().includes("modality") ||
      upstreamMessage?.toLowerCase().includes("does not support");
    return {
      status,
      type: isCapability ? "unsupported_capability" : "bad_request",
      message:
        upstreamMessage ||
        "The request wasn't valid for this model. It may not support one of the inputs you sent (e.g. images or files)."
    };
  }
  if (status >= 500) {
    return {
      status,
      type: "upstream_error",
      message: "The Experiential Labs API is currently unavailable. Try again in a moment."
    };
  }
  return {
    status,
    type: "api_error",
    message: upstreamMessage || "The Experiential Labs API returned an error."
  };
}
