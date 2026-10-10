import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { decideValidationStatus, engineeringReviewStatus } from "@/infrastructure/services/analysis-engine";
import { isBlockingQuestion, planQuestionMerge } from "@/workflow/clarifications/mergeQuestions";
import { planSelectiveRegeneration } from "@/workflow/drift/selectivePlan";
import { classifyStatement, extractRequirementIds } from "@/testing/evaluation/requirements";
import { ScenarioSchema } from "@/testing/evaluation/scenarioSchema";
import { scoreScenario } from "@/testing/evaluation/scoreScenario";

describe("validation honesty", () => {
  it("fails a high score when a critical issue exists", () => {
    const decision = decideValidationStatus({
      overallScore: 96,
      categories: [],
      issues: [{
        severity: "critical",
        category: "security",
        title: "Secret returned",
        description: "GET returns the stored key",
        linkedRequirementId: "REQ-001",
        recommendation: "Return only the prefix",
      }],
    });
    expect(decision.status).toBe("FAILED");
    expect(decision.vetoReasons.some((reason) => reason.includes("Secret returned"))).toBe(true);
  });

  it("marks an errored check incomplete instead of passed", () => {
    const decision = decideValidationStatus({
      overallScore: 100,
      categories: [],
      issues: [],
      checkErrored: true,
    });
    expect(decision.status).toBe("INCOMPLETE");
  });

  it("does not mark an engineering review ready when a critical finding exists", () => {
    expect(engineeringReviewStatus({
      overallScore: 90,
      categories: { security: { items: [{ issue: { priority: "CRITICAL" } }] } },
    })).toBe("NEEDS_ATTENTION");
  });
});

describe("clarification merge and blocking", () => {
  it("keeps an answered question and does not recreate it", () => {
    const plan = planQuestionMerge(
      [{ id: "q1", question: "Should keys expire?", status: "ANSWERED" }],
      [{ question: "Should keys expire?" }, { question: "Who can rotate keys?" }]
    );
    expect(plan.deleteIds).toEqual([]);
    expect(plan.keepIds).toEqual(["q1"]);
    expect(plan.create.map((q) => q.question)).toEqual(["Who can rotate keys?"]);
  });

  it("blocks conflict and required questions and ignores answered ones", () => {
    expect(isBlockingQuestion({ status: "OPEN", category: "CONFLICT" })).toBe(true);
    expect(isBlockingQuestion({ status: "OPEN", category: "General", impact: { isRequired: true } })).toBe(true);
    expect(isBlockingQuestion({ status: "ANSWERED", category: "CONFLICT" })).toBe(false);
  });

  it("does not treat hedged input as a confirmed requirement", () => {
    expect(classifyStatement("Keys should probably expire")).toBe("UNCERTAIN");
    expect(classifyStatement("If possible, generate documentation")).toBe("UNCERTAIN");
    expect(classifyStatement("Don't overcomplicate the UI")).toBe("PREFERENCE");
  });
});

describe("selective drift regeneration", () => {
  const open = [
    { id: "e1", entityType: "TASK", entityId: "task-expiration", status: "OPEN" },
    { id: "e2", entityType: "TASK", entityId: "task-unrelated", status: "OPEN" },
  ];

  it("refuses to resolve every event when no selection is given", () => {
    expect(planSelectiveRegeneration(open, {}).ok).toBe(false);
  });

  it("updates only the selected task and leaves the other event open", () => {
    const plan = planSelectiveRegeneration(open, { taskIds: ["task-expiration"] });
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.updateTaskIds).toEqual(["task-expiration"]);
    expect(plan.resolveEventIds).toEqual(["e1"]);
    expect(plan.remainingOpen).toBe(1);
  });
});

describe("requirement ids and scenario contracts", () => {
  it("extracts requirement ids from markdown", () => {
    expect(extractRequirementIds("See REQ-001 and also REQ-014.")).toEqual(["REQ-001", "REQ-014"]);
  });

  it("parses every scenario contract and refuses a fake capacity claim", () => {
    const root = path.join(process.cwd(), "src", "testing", "scenarios");
    const files = [
      "dark-mode.v1",
      "notification-system.v1",
      "api-key-management.v1",
      "messy-api-key.v1",
      "requirement-change-drift.v1",
      "conflicting-requirements.v1",
    ];
    for (const dir of files) {
      const scenario = ScenarioSchema.parse(JSON.parse(fs.readFileSync(path.join(root, dir, "scenario.json"), "utf8")));
      expect(scenario.humanReviewed).toBe(false);
    }
    const notifications = ScenarioSchema.parse(JSON.parse(fs.readFileSync(path.join(root, "notification-system.v1", "scenario.json"), "utf8")));
    const score = scoreScenario(notifications, {
      specification: "This build supports 100 concurrent users.",
      taskText: "",
    });
    expect(score.forbiddenHits.length).toBeGreaterThan(0);
    expect(score.criticalSecurityFailure).toBe(true);
  });
});
