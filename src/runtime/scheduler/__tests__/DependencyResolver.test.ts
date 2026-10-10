import { describe, expect, it } from "vitest";
import { DependencyResolver, CircularDependencyError } from "../DependencyResolver";
import { AgentMetadata } from "../../interfaces/AgentMetadata";

describe("DependencyResolver", () => {
  const getMockMetadata = (deps: Record<string, string[]>) => (id: string): AgentMetadata => ({
    id,
    name: id,
    version: "1.0",
    capabilities: [],
    dependencies: deps[id] || [],
  });

  it("resolves dependencies in topological waves", () => {
    const agents = ["A", "B", "C", "D"];
    const deps = {
      A: [],
      B: ["A"],
      C: ["A"],
      D: ["B", "C"],
    };

    const groups = DependencyResolver.resolve(agents, getMockMetadata(deps));

    expect(groups.length).toBe(3);
    expect(groups[0].agentIds).toEqual(["A"]);
    expect(groups[1].agentIds.sort()).toEqual(["B", "C"].sort());
    expect(groups[2].agentIds).toEqual(["D"]);
  });

  it("throws CircularDependencyError when a cycle exists", () => {
    const agents = ["A", "B", "C"];
    const deps = {
      A: ["C"],
      B: ["A"],
      C: ["B"],
    };

    expect(() => {
      DependencyResolver.resolve(agents, getMockMetadata(deps));
    }).toThrow(CircularDependencyError);
  });
});
