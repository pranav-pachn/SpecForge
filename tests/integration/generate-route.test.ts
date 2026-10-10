import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const h = vi.hoisted(() => ({
  user: vi.fn(),
  findUnique: vi.fn(),
  findMany: vi.fn(),
  persist: vi.fn(async () => undefined),
  last: null as null | { pipeline: string; clarify: unknown; planning: unknown },
}));

vi.mock("@/infrastructure/services/api-helpers", () => ({
  getAuthenticatedUser: h.user,
  apiError: (message: string, status = 400) =>
    Response.json({ error: message }, { status }),
}));

vi.mock("@/platform/storage/db", () => ({
  db: {
    workflow: { findUnique: h.findUnique },
    clarificationQuestion: { findMany: h.findMany },
  },
}));

vi.mock("@/workflow/engine/WorkflowEngine", () => ({
  WorkflowEngine: class {
    async execute(pipeline: { name: string }, ctx: { artifacts: { clarify?: unknown; planning?: unknown } }) {
      h.last = { pipeline: pipeline.name, clarify: ctx.artifacts.clarify, planning: ctx.artifacts.planning };
    }
  },
}));

vi.mock("@/workflow/artifacts/persistArtifacts", () => ({
  persistPipelineArtifacts: h.persist,
}));

import { POST } from "@/app/api/workflows/[id]/generate/route";

function post(body: unknown, raw = false) {
  const req = new NextRequest("http://localhost/api/workflows/wf-1/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: raw ? String(body) : JSON.stringify(body),
  });
  return POST(req, { params: { id: "wf-1" } });
}

beforeEach(() => {
  h.user.mockReset();
  h.findUnique.mockReset();
  h.findMany.mockReset();
  h.persist.mockClear();
  h.last = null;
  h.user.mockResolvedValue({ id: "user-1" });
  h.findUnique.mockResolvedValue({ id: "wf-1", creatorId: "user-1" });
  h.findMany.mockResolvedValue([]);
});

describe("POST /api/workflows/[id]/generate", () => {
  it("returns 401 when there is no session", async () => {
    h.user.mockResolvedValue(null);
    const res = await post({ rawIdea: "x" });
    expect(res.status).toBe(401);
    expect(h.findUnique).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid JSON", async () => {
    const res = await post("{", true);
    expect(res.status).toBe(400);
  });

  it("returns 404 when the workflow is not owned by the caller", async () => {
    h.findUnique.mockResolvedValue(null);
    const res = await post({ rawIdea: "x" });
    expect(res.status).toBe(404);
  });

  it("returns 409 and does not start generation when a blocking question is open", async () => {
    h.findMany.mockResolvedValue([
      { id: "q-missing", status: "OPEN", category: "MISSING_DECISION", impact: null },
    ]);
    const res = await post({ phase: "generate", rawIdea: "API keys" });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain("q-missing");
    expect(h.last).toBeNull();
    expect(h.persist).not.toHaveBeenCalled();
  });

  it("treats a required-impact question as blocking", async () => {
    h.findMany.mockResolvedValue([
      { id: "q-req", status: "OPEN", category: "preference", impact: { isRequired: true } },
    ]);
    const res = await post({ phase: "generate", rawIdea: "API keys" });
    expect(res.status).toBe(409);
  });

  it("does not block the clarify phase on open questions", async () => {
    h.findMany.mockResolvedValue([
      { id: "q-conflict", status: "OPEN", category: "CONFLICT", impact: null },
    ]);
    const res = await post({ phase: "clarify", rawIdea: "API keys" });
    expect(res.status).toBe(200);
    expect(h.findMany).not.toHaveBeenCalled();
    expect(h.last?.pipeline).toBe("InteractiveClarification");
  });

  it("injects saved clarifications and the plan, then persists", async () => {
    h.findMany.mockResolvedValue([
      { id: "q-soft", status: "OPEN", category: "preference", impact: null },
    ]);
    const clarifications = [{ question: "Do keys expire?", rationale: "Yes, 90 days" }];
    const planning = { intent: "Issue API keys" };
    const res = await post({ phase: "generate", rawIdea: "API keys", clarifications, planning });

    expect(res.status).toBe(200);
    expect(await res.text()).toContain("event: complete");
    expect(h.last?.pipeline).toBe("InteractiveGeneration");
    expect(h.last?.clarify).toMatchObject({ questions: clarifications, confidenceScore: 100 });
    expect(h.last?.planning).toEqual(planning);
    expect(h.persist).toHaveBeenCalledOnce();
  });
});
