/**
 * Removes sensitive data from event payloads before persisting to the Audit Log.
 */
export class PayloadSanitizer {
  private static readonly SENSITIVE_KEYS = [
    "password",
    "token",
    "cookie",
    "apikey",
    "api_key",
    "authorization",
    "secret",
    "access_token",
    "refresh_token"
  ];

  /**
   * Recursively sanitizes an object, stripping keys that match sensitive patterns.
   */
  static sanitize(payload: any): any {
    if (!payload || typeof payload !== "object") {
      return payload;
    }

    if (Array.isArray(payload)) {
      return payload.map(item => this.sanitize(item));
    }

    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(payload)) {
      const lowerKey = key.toLowerCase();
      
      let isSensitive = false;
      for (const sensitiveKey of this.SENSITIVE_KEYS) {
        if (lowerKey.includes(sensitiveKey)) {
          isSensitive = true;
          break;
        }
      }

      if (isSensitive) {
        sanitized[key] = "[REDACTED]";
      } else {
        sanitized[key] = this.sanitize(value);
      }
    }

    return sanitized;
  }
}
