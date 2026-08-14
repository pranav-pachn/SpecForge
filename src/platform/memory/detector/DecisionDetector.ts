export interface ChangeDetection {
  isSignificant: boolean;
  // If deterministic (like Task change), provide pre-filled details so AI is bypassed
  deterministicDetails?: {
    title: string;
    description: string;
    reason: string;
  };
}

export class DecisionDetector {
  /**
   * Compares two versions of an artifact and determines if a memory should be created.
   */
  static detect(
    artifactType: string,
    oldContent: string | null,
    newContent: string
  ): ChangeDetection {
    if (!oldContent) {
      return {
        isSignificant: true,
        deterministicDetails: {
          title: `${this.formatType(artifactType)} Created`,
          description: `Initial version of ${artifactType.toLowerCase()} was generated.`,
          reason: "Workflow progression",
        }
      };
    }

    if (oldContent === newContent) {
      return { isSignificant: false };
    }

    // For simplicity in MVP, we just do a rough check.
    const lengthDiff = Math.abs(newContent.length - oldContent.length);
    const isSignificant = lengthDiff > 50 || artifactType === "REVIEW" || artifactType === "VALIDATION";

    let deterministicDetails;
    if (artifactType === "TASKS" || artifactType === "REVIEW" || artifactType === "VALIDATION") {
      // For MVP, we provide a generic deterministic trace for these to save LLM costs.
      deterministicDetails = {
        title: `${this.formatType(artifactType)} Updated`,
        description: `Changes detected in ${artifactType.toLowerCase()}.`,
        reason: "Iterative refinement",
      };
    }

    return {
      isSignificant,
      deterministicDetails
    };
  }

  private static formatType(type: string): string {
    return type.charAt(0) + type.slice(1).toLowerCase();
  }
}
