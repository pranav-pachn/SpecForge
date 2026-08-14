import { PromptBundle } from "./PromptBundle";
import { z } from "zod";

export class PromptRegistry {
  private prompts = new Map<string, PromptBundle>();

  constructor() {
    // Phase 4B: Statically define bundles here.
    // Phase 4C: Load these from markdown files.
    this.register({
      id: "SPECIFICATION",
      version: 1,
      system: "You are an expert product manager. Given a rough idea, generate a detailed product specification.",
      template: "Idea: {{idea}}",
      temperature: 0.2,
      maxTokens: 4000
    });

    this.register({
      id: "ARCHITECTURE",
      version: 1,
      system: "You are an expert software architect. Given a product specification, design a technical architecture.",
      template: "Specification: {{spec}}",
      temperature: 0.1,
      maxTokens: 6000
    });
  }

  register(bundle: PromptBundle) {
    this.prompts.set(bundle.id, bundle);
  }

  get(id: string): PromptBundle {
    const bundle = this.prompts.get(id);
    if (!bundle) {
      throw new Error(`Prompt bundle ${id} not found.`);
    }
    return bundle;
  }

  render(bundleId: string, variables: Record<string, string>): { system: string, prompt: string } {
    const bundle = this.get(bundleId);
    let renderedPrompt = bundle.template;
    
    for (const [key, value] of Object.entries(variables)) {
      renderedPrompt = renderedPrompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    return {
      system: bundle.system,
      prompt: renderedPrompt
    };
  }
}

export const promptRegistry = new PromptRegistry();
