import { RetrievedContext } from "./interfaces/RetrievedContext";

export interface PromptBundle {
  systemPrompt: string;
  template: string;
  variables: Record<string, string>;
}

export interface FinalPrompt {
  system: string;
  prompt: string;
  estimatedTokens: number;
}

export class PromptBuilder {
  /**
   * Assembles the retrieved context into a final prompt block,
   * injecting it into the provided PromptBundle.
   */
  build(bundle: PromptBundle, context: RetrievedContext): FinalPrompt {
    // 1. Format the context blocks
    const contextStr = context.items.map((item, index) => {
      let block = `--- Context Source: ${item.source} | Provider: ${item.provider} | Method: ${item.retrievalMethod} (Confidence: ${item.confidence.toFixed(2)}) ---\n`;
      block += item.content.trim() + "\n";
      return block;
    }).join('\n');

    // 2. Inject context into the template
    let finalUserPrompt = bundle.template;
    
    // Replace custom variables first
    for (const [key, value] of Object.entries(bundle.variables)) {
      finalUserPrompt = finalUserPrompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    // Inject the assembled context block
    finalUserPrompt = finalUserPrompt.replace(/{{CONTEXT}}/g, contextStr || "No relevant context found.");

    const finalTokens = Math.ceil(finalUserPrompt.length / 4) + Math.ceil(bundle.systemPrompt.length / 4);
    
    // Update the trace
    if (context.trace) {
      context.trace.finalTokens = finalTokens;
    }

    return {
      system: bundle.systemPrompt,
      prompt: finalUserPrompt,
      estimatedTokens: finalTokens
    };
  }
}

export const promptBuilder = new PromptBuilder();
