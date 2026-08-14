export interface PromptExecutionMetadata {
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  streaming?: boolean;
  reasoning?: boolean;
  stopSequences?: string[];
}

export interface PromptBundle {
  readonly template: string;
  readonly systemPrompt: string;
  readonly metadata: PromptExecutionMetadata;
}
