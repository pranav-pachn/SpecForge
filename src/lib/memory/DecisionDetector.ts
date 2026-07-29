import { MemoryType, MemorySeverity } from "@prisma/client";

export interface ChangeDetection {
  isSignificant: boolean;
  memoryType?: MemoryType;
  severity?: MemorySeverity;
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
        memoryType: this.mapArtifactTypeToMemoryType(artifactType),
        severity: "MEDIUM",
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
    // In a full implementation, we would parse JSON and diff specific fields.
    const lengthDiff = Math.abs(newContent.length - oldContent.length);
    const isSignificant = lengthDiff > 50 || artifactType === "REVIEW" || artifactType === "VALIDATION";

    let severity: MemorySeverity = "MEDIUM";
    if (artifactType === "ARCHITECTURE" || artifactType === "SPEC") {
      severity = "HIGH";
    }

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
      memoryType: this.mapArtifactTypeToMemoryType(artifactType),
      severity,
      deterministicDetails
    };
  }

  private static mapArtifactTypeToMemoryType(artifactType: string): MemoryType {
    switch (artifactType) {
      case "SPEC": return "REQUIREMENT_CHANGE";
      case "ARCHITECTURE": return "ARCHITECTURE_CHANGE";
      case "PLAN": return "PLANNING_CHANGE";
      case "TASKS": return "TASK_CHANGE";
      case "REVIEW": return "REVIEW_RESOLUTION";
      case "VALIDATION": return "VALIDATION_RESULT";
      default: return "REQUIREMENT_CHANGE";
    }
  }

  private static formatType(type: string): string {
    return type.charAt(0) + type.slice(1).toLowerCase();
  }
}
