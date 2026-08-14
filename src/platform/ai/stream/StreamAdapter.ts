import { AIStreamChunk } from "../interfaces/AIResponse";
// Note: assuming a Runtime StreamManager interface exists or will be injected.
// The purpose of this adapter is to bridge the Gateway's AsyncIterable to the Runtime's push-based StreamManager.

export interface RuntimeStreamManager {
  push(chunk: string): void;
  close(): void;
  error(err: Error): void;
}

export class StreamAdapter {
  
  /**
   * Consumes an AsyncIterable stream from the AIGateway and pushes it to the Runtime StreamManager.
   */
  static async consume(
    stream: AsyncIterable<AIStreamChunk>, 
    manager: RuntimeStreamManager
  ): Promise<void> {
    try {
      for await (const chunk of stream) {
        manager.push(chunk.text);
      }
      manager.close();
    } catch (err: any) {
      manager.error(err);
    }
  }
}
