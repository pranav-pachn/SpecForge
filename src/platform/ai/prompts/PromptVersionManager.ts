export class PromptVersionManager {
  static async proposeCandidate(
    capability: string,
    systemPrompt: string,
    userTemplate: string,
    parentVersionId?: string,
    provider?: string,
    model?: string,
    config?: {
      temperature?: number;
      maxTokens?: number;
    }
  ) {
    console.log(`[PromptVersionManager] proposeCandidate disabled.`);
    return { id: "mock-id", status: "EXPERIMENTAL", capability };
  }

  static async promoteToActive(variantId: string, approvedBy: string) {
    console.log(`[PromptVersionManager] promoteToActive disabled.`);
    return { id: variantId, status: "ACTIVE" };
  }
}
