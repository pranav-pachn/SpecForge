import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const h = vi.hoisted(() => ({
  user: vi.fn(),
  analyze: vi.fn(),
  persist: vi.fn(),
  findMany: vi.fn(),
  findFirst: vi.fn(),
}));

vi.mock("@/infrastructure/services/api-helpers", () => ({
  getAuthenticatedUser: h.user,
  apiError: (message: string, status = 400) => Response.json({ error: message }, { status }),
  jsonResponse: (data: unknown, status = 200) => Response.json(data, { status }),
}));

vi.mock("@/server/reviews/analyzeReview", () => ({
  analyzeReview: h.analyze,
}));

vi.mock("@/server/reviews/persistReview", () => ({
  persistReview: h.persist,
  toReviewRun: (run: unknown) => run,
}));

vi.mock("@/platform/storage/db", () => ({
  db: {
    reviewRun: {
      findMany: h.findMany,
      findFirst: h.findFirst,
    },
  },
}));

import { POST, GET } from "@/app/api/code-reviews/route";
import { GET as GET_ONE } from "@/app/api/code-reviews/[id]/route";

function post(body: unknown) {
  return POST(new NextRequest("http://localhost/api/code-reviews", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }));
}

beforeEach(() => {
  h.user.mockReset();
  h.analyze.mockReset();
  h.persist.mockReset();
  h.findMany.mockReset();
  h.findFirst.mockReset();
  h.user.mockResolvedValue({ id: "user-1" });
});

describe("code review routes", () => {
  it("returns 401 without a session", async () => {
    h.user.mockResolvedValue(null);
    expect((await post({ kind: "CODE", content: "const a = 1;" })).status).toBe(401);
    expect(h.analyze).not.toHaveBeenCalled();
  });

  it("returns 400 for an empty submission", async () => {
    const res = await post({ kind: "CODE", content: "" });
    expect(res.status).toBe(400);
    expect(h.analyze).not.toHaveBeenCalled();
  });

  it("persists a failed provider run instead of reporting a pass", async () => {
    h.analyze.mockResolvedValue({
      status: "FAILED",
      summary: "The review did not finish because the model provider failed.",
      findings: [],
      decision: { outcome: "INCOMPLETE", reasons: ["Provider request failed"], blockingFindingFingerprints: [] },
      checks: [{ analyzer: "provider", status: "ERROR", required: true, summary: "Provider request failed" }],
      droppedFindings: 0,
      provider: null,
      model: null,
      fallbackUsed: false,
    });
    h.persist.mockResolvedValue({ id: "run-1", status: "FAILED", outcome: "INCOMPLETE" });

    const res = await post({ kind: "CODE", content: "const a = 1;" });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toMatchObject({ id: "run-1", status: "FAILED", outcome: "INCOMPLETE" });
    expect(h.persist).toHaveBeenCalledWith("user-1", expect.objectContaining({ kind: "CODE" }), expect.objectContaining({ status: "FAILED" }));
  });

  it("lists only the caller's runs", async () => {
    h.findMany.mockResolvedValue([]);
    const res = await GET();
    expect(res.status).toBe(200);
    expect(h.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: "user-1" } }));
  });

  it("does not return another user's review", async () => {
    h.findFirst.mockResolvedValue(null);
    const res = await GET_ONE(new Request("http://localhost/api/code-reviews/run-9"), { params: { id: "run-9" } });
    expect(res.status).toBe(404);
    expect(h.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "run-9", userId: "user-1" },
    }));
  });
});
