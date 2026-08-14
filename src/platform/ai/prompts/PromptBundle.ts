import { Schema } from "zod";

export interface PromptBundle {
  id: string;
  version: number;
  system: string;
  template: string; // The user prompt template (with placeholders)
  temperature?: number;
  maxTokens?: number;
  schema?: Schema<any>;
}
