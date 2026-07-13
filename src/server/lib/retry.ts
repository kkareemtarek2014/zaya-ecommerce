/**
 * Retry helper for provider HTTP calls (P15).
 * Retries on network failures, 429, and 5xx. Does not retry other 4xx.
 */

export type RetryOptions = {
  attempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  /** Optional label for logs */
  label?: string;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isRetryableHttpStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

export class HttpRetryError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = 'HttpRetryError';
    this.status = status;
    this.body = body;
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {},
): Promise<T> {
  const attempts = Math.max(1, opts.attempts ?? 3);
  const baseDelayMs = opts.baseDelayMs ?? 250;
  const maxDelayMs = opts.maxDelayMs ?? 4_000;
  const label = opts.label ?? 'provider';

  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const retryable =
        err instanceof HttpRetryError
          ? isRetryableHttpStatus(err.status)
          : err instanceof TypeError ||
            (err instanceof Error &&
              /network|fetch failed|ECONNRESET|ETIMEDOUT|timeout/i.test(
                err.message,
              ));

      if (!retryable || i === attempts - 1) throw err;

      const delay = Math.min(maxDelayMs, baseDelayMs * 2 ** i);
      console.warn(
        `[retry:${label}] attempt ${i + 1}/${attempts} failed; waiting ${delay}ms`,
        err instanceof Error ? err.message : err,
      );
      await sleep(delay);
    }
  }
  throw lastError;
}

/**
 * Fetch that throws `HttpRetryError` on non-OK so `withRetry` can back off.
 * Callers still parse JSON after success.
 */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  opts?: RetryOptions,
): Promise<Response> {
  return withRetry(async () => {
    const res = await fetch(input, init);
    if (!res.ok && isRetryableHttpStatus(res.status)) {
      const text = await res.text().catch(() => '');
      throw new HttpRetryError(
        res.status,
        `HTTP ${res.status}`,
        text.slice(0, 500),
      );
    }
    return res;
  }, opts);
}
