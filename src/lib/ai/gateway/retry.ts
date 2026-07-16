export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  maxRetries = 2,
  baseDelayMs = 250
): Promise<{ result: T; retries: number; lastError?: any }> {
  let attempt = 0;
  let lastError;

  while (attempt <= maxRetries) {
    try {
      const result = await fn(attempt);
      return { result, retries: attempt };
    } catch (error: any) {
      lastError = error;
      
      // Do not retry on client-side errors or context length violations
      if (error?.statusCode === 400 || error?.message?.includes("context length")) {
        throw error;
      }

      attempt++;
      if (attempt > maxRetries) break;

      // Exponential backoff with jitter
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      const jitter = delay * 0.2 * (Math.random() * 2 - 1); // +/- 20%
      await new Promise((res) => setTimeout(res, delay + jitter));
    }
  }

  throw lastError;
}
