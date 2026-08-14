export interface Chunk {
  index: number;
  content: string;
  source: string;
  sourceId: string;
  tokens: number;
}

export abstract class Chunker {
  /**
   * Splits a document into manageable chunks for embedding and retrieval.
   */
  abstract chunk(content: string, source: string, sourceId: string): Chunk[];

  /**
   * Heuristic token estimation (1 token ≈ 4 characters)
   */
  protected estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}

export class MarkdownChunker extends Chunker {
  private maxTokens: number;

  constructor(maxTokens = 500) {
    super();
    this.maxTokens = maxTokens;
  }

  chunk(content: string, source: string, sourceId: string): Chunk[] {
    // A naive markdown chunker: split by double newline (paragraphs/sections)
    // and group them until maxTokens is reached.
    const blocks = content.split(/\n\s*\n/);
    
    const chunks: Chunk[] = [];
    let currentContent = "";
    let currentIndex = 0;

    for (const block of blocks) {
      if (!block.trim()) continue;

      const potentialContent = currentContent ? `${currentContent}\n\n${block}` : block;
      
      if (this.estimateTokens(potentialContent) > this.maxTokens && currentContent) {
        // Push current and start new
        chunks.push({
          index: currentIndex++,
          content: currentContent.trim(),
          source,
          sourceId,
          tokens: this.estimateTokens(currentContent.trim())
        });
        currentContent = block;
      } else {
        currentContent = potentialContent;
      }
    }

    if (currentContent.trim()) {
      chunks.push({
        index: currentIndex,
        content: currentContent.trim(),
        source,
        sourceId,
        tokens: this.estimateTokens(currentContent.trim())
      });
    }

    return chunks;
  }
}
