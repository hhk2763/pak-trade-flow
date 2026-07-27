import "server-only";

// DeepSeek exposes an OpenAI-compatible REST API, so this is a plain fetch
// wrapper rather than an SDK dependency — the whole surface we need is one
// endpoint with a messages array.
//
// The base URL is configurable because the same DeepSeek models are reachable
// either directly or through an OpenAI-compatible gateway such as OpenRouter,
// and the two take different key formats and model ids.
const DEFAULT_BASE_URL = "https://api.deepseek.com";
const DEFAULT_MODEL = "deepseek-chat";
const REQUEST_TIMEOUT_MS = 25_000;

// OpenRouter issues keys in this shape; DeepSeek's own are `sk-` + 32 hex.
const OPENROUTER_KEY_PREFIX = "sk-or-v1-";
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export class DeepSeekError extends Error {}

export function isDeepSeekConfigured(): boolean {
  return Boolean(process.env.DEEPSEEK_API_KEY);
}

/**
 * Sends a chat completion and returns the assistant's text.
 *
 * Throws DeepSeekError on any failure (missing key, timeout, non-2xx,
 * unexpected payload shape) — callers decide whether to retry or fall back,
 * since what to do about an outage depends on the feature, not on the client.
 */
export async function deepseekChat(
  messages: ChatMessage[],
  opts: { temperature?: number; maxTokens?: number } = {}
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) {
    throw new DeepSeekError(
      "DEEPSEEK_API_KEY is not set. Add it to .env.local (see .env.example)."
    );
  }

  // Model name is env-overridable so a provider-side rename doesn't require a
  // code change and redeploy.
  const model = process.env.DEEPSEEK_MODEL || DEFAULT_MODEL;
  const baseUrl = (process.env.DEEPSEEK_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");

  // An OpenRouter key sent to api.deepseek.com fails with a bare 401 that reads
  // like a bad key rather than a misrouted one — worth naming explicitly, since
  // both providers hand out keys beginning "sk-".
  if (apiKey.startsWith(OPENROUTER_KEY_PREFIX) && baseUrl === DEFAULT_BASE_URL) {
    throw new DeepSeekError(
      `DEEPSEEK_API_KEY looks like an OpenRouter key ("${OPENROUTER_KEY_PREFIX}…") but ` +
        `DEEPSEEK_BASE_URL points at DeepSeek directly. Set ` +
        `DEEPSEEK_BASE_URL=${OPENROUTER_BASE_URL} and DEEPSEEK_MODEL=deepseek/deepseek-chat, ` +
        `or supply a native DeepSeek key instead.`
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        // Ignored by DeepSeek; OpenRouter uses these to attribute the traffic.
        "HTTP-Referer": "https://github.com/hhk2763/pak-trade-flow",
        "X-Title": "PAK Trade Flow",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: opts.temperature ?? 0.2,
        max_tokens: opts.maxTokens ?? 300,
        stream: false,
      }),
      signal: controller.signal,
      cache: "no-store",
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new DeepSeekError(`DeepSeek request timed out after ${REQUEST_TIMEOUT_MS}ms.`);
    }
    throw new DeepSeekError(
      `DeepSeek request failed: ${err instanceof Error ? err.message : String(err)}`
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    // Include the body — DeepSeek returns actionable messages here (bad key,
    // insufficient balance, rate limit) that are painful to diagnose without.
    const body = await response.text().catch(() => "<unreadable body>");
    throw new DeepSeekError(`DeepSeek returned ${response.status}: ${body.slice(0, 500)}`);
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new DeepSeekError("DeepSeek returned no message content.");
  }

  return content;
}
