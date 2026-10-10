import fs from "fs";
import path from "path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WorkflowContext } from "@/workflow/engine/WorkflowContext";
import { ScenarioSchema, type Scenario } from "@/testing/evaluation/scenarioSchema";
import { scoreScenario } from "@/testing/evaluation/scoreScenario";

interface RecordedCall {
  capability: string;
  system?: string;
  prompt: string;
}

const calls: RecordedCall[] = [];
const failing = new Set<string>();
const fixtures: Record<string, unknown> = {};

vi.mock("@/ai/gateway/gateway", () => ({
  gateway: {
    async executeObject(req: { capability: string; system?: string; prompt: string; schema: { parse: (v: unknown) => unknown } }) {
      calls.push({ capability: req.capability, system: req.system, prompt: req.prompt });
      if (failing.has(req.capability)) throw new Error(`provider down: ${req.capability}`);
      const fixture = fixtures[req.capability];
      if (fixture === undefined) throw new Error(`no fixture for ${req.capability}`);
      // The real gateway validates against the schema; do the same so fixtures cannot drift.
      return { object: req.schema.parse(fixture), cached: false };
    },
  },
}));

vi.mock("@/context/knowledge/ContextBuilder", () => ({
  ContextBuilder: { build: async () => "" },
}));

const trace = { derivedFrom: "idea", reason: "test", confidence: 80, sourceComponent: "test" };
const emptyCategory = { score: 90, items: [] };

function seedFixtures(specMarkdown: string) {
  fixtures.planning = {
    intent: "Manage API keys",
    goals: ["Let scripts authenticate"],
    features: [{ name: "Key issuance", description: "Create keys", traceability: trace }],
    constraints: [],
    risks: [],
  };
  fixtures.clarify = {
    assumptions: [],
    questions: [{
      question: "Do keys expire?",
      kind: "MISSING_DECISION",
      options: [{ label: "Yes", value: "yes" }, { label: "No", value: "no" }],
      traceability: trace,
    }],
    confidenceScore: 60,
  };
  fixtures.spec = {
    markdown: specMarkdown,
    requirements: [{ id: "REQ-001", text: "Keys expire after 90 days", kind: "MUST", source: "CLARIFIED" }],
    sections: [{ title: "Overview", content: "x", traceability: trace }],
  };
  fixtures.architect = {
    modules: [{ name: "keys", responsibility: "issue keys", dependencies: [], traceability: trace }],
    services: [],
    entities: [],
    apis: [],
    database: { tables: ["api_keys"], indexes: [], notes: "" },
    externalIntegrations: [],
    architectureDiagram: "flowchart TD; A-->B",
  };
  fixtures.tasks = {
    tasks: [{
      title: "Add expiry check",
      description: "Reject expired keys",
      acceptanceCriteria: ["Expired key returns 401"],
      verificationNotes: "unit test",
      priority: 1,
      order: 1,
      complexity: "S",
      dependencies: [],
      requirements: ["REQ-001"],
      traceability: trace,
    }],
  };
  fixtures.review = {
    categories: {
      coverage: emptyCategory, testing: emptyCategory, security: emptyCategory, performance: emptyCategory,
      architecture: emptyCategory, deployment: emptyCategory, rollback: emptyCategory,
    },
    overallScore: 90,
  };
  fixtures.validation = { explanations: [] };
}

function newContext(rawIdea: string): WorkflowContext {
  return {
    input: { workflowId: "wf-1", userId: "user-1", rawIdea },
    artifacts: {},
    execution: { startedAt: new Date(), stages: [] },
  };
}

const SPEC_MARKER = "SPEC-MARKER-7f3a";
const ANSWER_MARKER = "ANSWER-MARKER-90-days";

beforeEach(() => {
  calls.length = 0;
  failing.clear();
  for (const key of Object.keys(fixtures)) delete fixtures[key];
  seedFixtures(`# Spec\n${SPEC_MARKER}\nREQ-001 keys expire after 90 days`);
});

async function runAll(ctx: WorkflowContext, opts: { answerClarifications?: boolean } = {}) {
  const { PlannerAgent } = await import("@/agents/PlannerAgent");
  const { ClarifierAgent } = await import("@/agents/ClarifierAgent");
  const { SpecificationAgent } = await import("@/agents/SpecificationAgent");
  const { ArchitectAgent } = await import("@/agents/ArchitectAgent");
  const { TaskPlannerAgent } = await import("@/agents/TaskPlannerAgent");
  const { ReviewerAgent } = await import("@/agents/ReviewerAgent");
  const { ValidatorAgent } = await import("@/agents/ValidatorAgent");

  ctx.artifacts.planning = await new PlannerAgent().execute(ctx);
  ctx.artifacts.clarify = await new ClarifierAgent().execute(ctx);
  if (opts.answerClarifications) {
    // Mirrors what POST /api/workflows/[id]/generate does with saved answers.
    ctx.artifacts.clarify = {
      ...ctx.artifacts.clarify,
      questions: ctx.artifacts.clarify.questions.map((q) => ({ ...q, rationale: ANSWER_MARKER })),
    };
  }
  ctx.artifacts.spec = await new SpecificationAgent().execute(ctx);
  ctx.artifacts.architect = await new ArchitectAgent().execute(ctx);
  ctx.artifacts.tasks = await new TaskPlannerAgent().execute(ctx);
  ctx.artifacts.review = await new ReviewerAgent().execute(ctx);
  ctx.artifacts.validation = await new ValidatorAgent().execute(ctx);
  return ctx;
}

const promptFor = (capability: string) => calls.find((c) => c.capability === capability)?.prompt ?? "";

describe("pipeline data flow (scripted gateway)", () => {
  it("runs every stage in order and stores each artifact under its capability id", async () => {
    const ctx = await runAll(newContext("API keys for scripts"));
    expect(calls.map((c) => c.capability)).toEqual([
      "planning", "clarify", "spec", "architect", "tasks", "review", "validation",
    ]);
    expect(Object.keys(ctx.artifacts).sort()).toEqual(
      ["architect", "clarify", "planning", "review", "spec", "tasks", "validation"],
    );
  });

  it("passes clarification answers into the specification prompt", async () => {
    await runAll(newContext("API keys for scripts"), { answerClarifications: true });
    expect(promptFor("spec")).toContain(ANSWER_MARKER);
  });

  it("feeds the generated spec markdown to architect, tasks, review and validation", async () => {
    await runAll(newContext("API keys for scripts"));
    for (const capability of ["architect", "tasks", "review", "validation"]) {
      expect(promptFor(capability), capability).toContain(SPEC_MARKER);
    }
  });

  it("feeds architecture to task planning and tasks to review", async () => {
    await runAll(newContext("API keys for scripts"));
    expect(promptFor("tasks")).toContain("api_keys");
    expect(promptFor("review")).toContain("Add expiry check");
  });

  it("never renders 'undefined' into a downstream prompt", async () => {
    await runAll(newContext("API keys for scripts"));
    for (const call of calls) expect(call.prompt, call.capability).not.toContain("undefined");
  });
});

describe("failure behavior", () => {
  it("planner and clarifier degrade to schema-valid fallbacks, flagged as fallback", async () => {
    failing.add("planning");
    failing.add("clarify");
    const { PlannerAgent } = await import("@/agents/PlannerAgent");
    const { ClarifierAgent } = await import("@/agents/ClarifierAgent");
    const { PlannerOutputSchema } = await import("@/ai/schemas/plannerSchema");
    const { ClarifierOutputSchema } = await import("@/ai/schemas/clarifierSchema");
    const ctx = newContext("API keys for scripts");

    ctx.artifacts.planning = await new PlannerAgent().execute(ctx);
    expect(PlannerOutputSchema.safeParse(ctx.artifacts.planning).success).toBe(true);
    expect(ctx.artifacts.planning.risks.join(" ")).toMatch(/fallback/i);

    const clarify = await new ClarifierAgent().execute(ctx);
    expect(ClarifierOutputSchema.safeParse(clarify).success).toBe(true);
    expect(clarify.questions[0].traceability.reason).toMatch(/fallback/i);
  });

  it("spec generation surfaces provider failure instead of inventing a spec", async () => {
    failing.add("spec");
    const { SpecificationAgent } = await import("@/agents/SpecificationAgent");
    await expect(new SpecificationAgent().execute(newContext("x"))).rejects.toThrow(/provider down/);
  });

  it("a malformed model response is rejected by schema validation", async () => {
    fixtures.tasks = { tasks: [{ title: "missing everything else" }] };
    const { TaskPlannerAgent } = await import("@/agents/TaskPlannerAgent");
    await expect(new TaskPlannerAgent().execute(newContext("x"))).rejects.toThrow();
  });
});

describe("scenario scoring catches bad output", () => {
  const root = path.join(process.cwd(), "src", "testing", "scenarios");
  const scenarios: Scenario[] = fs
    .readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => path.join(root, d.name, "scenario.json"))
    .filter((file) => fs.existsSync(file))
    .map((file) => ScenarioSchema.safeParse(JSON.parse(fs.readFileSync(file, "utf8"))))
    .flatMap((r) => (r.success ? [r.data] : []));

  it("loads the contract scenarios", () => {
    expect(scenarios.length).toBeGreaterThanOrEqual(6);
  });

  it("an empty spec covers nothing and fails security-relevant MUSTs", () => {
    for (const scenario of scenarios) {
      const score = scoreScenario(scenario, { specification: "", taskText: "" });
      const musts = scenario.expectedRequirements.filter((r) => r.kind === "MUST");
      expect(score.requirementCoverage.covered, scenario.id).toBe(0);
      expect(score.requirementCoverage.total, scenario.id).toBe(musts.length);
      if (musts.some((r) => r.securityRelevant)) expect(score.criticalSecurityFailure, scenario.id).toBe(true);
    }
  });

  it("a spec that states a forbidden outcome is flagged", () => {
    for (const scenario of scenarios.filter((s) => s.forbiddenOutcomes.length > 0)) {
      const score = scoreScenario(scenario, { specification: scenario.forbiddenOutcomes.join("\n"), taskText: "" });
      expect(score.forbiddenHits.length, scenario.id).toBe(scenario.forbiddenOutcomes.length);
    }
  });

  it("a spec containing every MUST keyword gets full coverage", () => {
    for (const scenario of scenarios) {
      const keywords = scenario.expectedRequirements.filter((r) => r.kind === "MUST").flatMap((r) => r.keywords);
      const score = scoreScenario(scenario, { specification: keywords.join(" "), taskText: "" });
      expect(score.requirementCoverage.covered, scenario.id).toBe(score.requirementCoverage.total);
      expect(score.criticalSecurityFailure, scenario.id).toBe(false);
    }
  });
});
