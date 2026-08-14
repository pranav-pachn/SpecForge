import { Capability } from "./Capability";
import { Schema, z } from "zod";

export interface AIRequest {
  capability: Capability;
  system?: string;
  prompt?: string; // Optional if variables are provided (resolves via registry)
  variables?: Record<string, any>;
  schema?: z.ZodType<any>;
  temperature?: number;
  maxTokens?: number;

  // Observability Context
  traceId?: string;
  parentSpanId?: string;
  promptVariantId?: string;
}
