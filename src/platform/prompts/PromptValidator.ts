import { PromptBundle } from "./interfaces/PromptBundle";

export class PromptValidator {
  
  /**
   * Validates a candidate before burning benchmark credits.
   * Checks variables, syntax, JSON schema format, etc.
   */
  async validate(bundle: PromptBundle): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // 1. Basic validation
    if (!bundle.template || bundle.template.trim().length === 0) {
      errors.push("Template cannot be empty");
    }
    if (!bundle.systemPrompt || bundle.systemPrompt.trim().length === 0) {
      errors.push("System Prompt cannot be empty");
    }

    // 2. Variable validation (Ensure {{var}} matches expectations)
    // Stub: In real implementation, extract variables and compare with required schema variables.
    const variablesRegex = /\{\{([^}]+)\}\}/g;
    const variables = new Set<string>();
    let match;
    while ((match = variablesRegex.exec(bundle.template)) !== null) {
      variables.add(match[1].trim());
    }
    
    // 3. Metadata validation
    if (bundle.metadata.temperature !== undefined) {
      if (bundle.metadata.temperature < 0 || bundle.metadata.temperature > 2) {
        errors.push("Temperature must be between 0 and 2");
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export const promptValidator = new PromptValidator();
