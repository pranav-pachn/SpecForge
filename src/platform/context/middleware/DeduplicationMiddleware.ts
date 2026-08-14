import { ContextMiddleware, ContextPipelineContext, NextPipelineFunction } from "./ContextPipeline";
import crypto from "crypto";

export class DeduplicationMiddleware implements ContextMiddleware {
  async handle(context: ContextPipelineContext, next: NextPipelineFunction): Promise<void> {
    const seenHashes = new Set<string>();
    
    const originalLength = context.result.items.length;
    context.result.items = context.result.items.filter(item => {
      // Create a stable hash based on content and sourceId
      const data = `${item.sourceId || ''}:${item.content.substring(0, 100)}`;
      const hash = crypto.createHash('md5').update(data).digest('hex');
      
      if (seenHashes.has(hash)) {
        return false;
      }
      seenHashes.add(hash);
      return true;
    });

    context.result.trace!.filtered += (originalLength - context.result.items.length);

    await next(context);
  }
}
