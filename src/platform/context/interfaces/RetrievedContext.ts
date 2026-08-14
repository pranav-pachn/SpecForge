export interface ContextItem {
  source: string;
  sourceId?: string;
  provider: string;
  retrievalMethod: string;
  content: string;
  score: number;
  confidence: number;
  freshness: number;
  metadata?: Record<string, unknown>;
}

export interface ContextTrace {
  retrieved: number;
  filtered: number;
  compressed: number;
  dropped: number;
  finalTokens: number;
}

export interface RetrievedContext {
  items: ContextItem[];
  providerResults?: Record<string, any>;
  trace?: {
    retrievalTime: number;
    providerLatencies: Record<string, number>;
    providersUsed: string[];
    droppedItems: number;
    compressionRatio?: number;
    totalTokens?: number;
    // Legacy support
    retrieved: number;
    filtered: number;
    compressed: number;
    dropped: number;
    finalTokens: number;
  };
  // Legacy support
  totalTokens?: number;
  wasTrimmed?: boolean;
}
