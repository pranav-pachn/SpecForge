export interface ModelProfile {
  id: string; // e.g., 'gemini-2.5-pro'
  providerId: string; // e.g., 'gemini'
  displayName: string;
  contextWindow: number;
  maxOutputTokens: number;
  supportsStructuredOutput: boolean;
  supportsStreaming: boolean;
  capabilities: string[]; // Traits like 'LONG_REASONING', 'FAST_STRUCTURED', 'EMBEDDING'
}
