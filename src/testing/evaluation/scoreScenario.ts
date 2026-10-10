import { Scenario } from "./scenarioSchema";

export interface ScenarioScore {
  requirementCoverage: { covered: number; total: number };
  securityOmissions: string[];
  forbiddenHits: string[];
  criticalSecurityFailure: boolean;
}

export function scoreScenario(scenario: Scenario, artifacts: { specification: string; taskText: string }): ScenarioScore {
  const spec = artifacts.specification.toLowerCase();
  const tasks = artifacts.taskText.toLowerCase();
  const covered = scenario.expectedRequirements.filter((req) =>
    req.kind === "MUST" && req.keywords.every((keyword) => spec.includes(keyword.toLowerCase()) || tasks.includes(keyword.toLowerCase()))
  );
  const musts = scenario.expectedRequirements.filter((req) => req.kind === "MUST");
  const securityOmissions = scenario.expectedRequirements
    .filter((req) => req.securityRelevant && req.kind === "MUST")
    .filter((req) => !req.keywords.every((keyword) => `${spec}\n${tasks}`.includes(keyword.toLowerCase())))
    .map((req) => req.id);
  const blob = `${spec}\n${tasks}`;
  const forbiddenHits = scenario.forbiddenOutcomes.filter((phrase) => blob.includes(phrase.toLowerCase()));

  return {
    requirementCoverage: { covered: covered.length, total: musts.length },
    securityOmissions,
    forbiddenHits,
    criticalSecurityFailure: securityOmissions.length > 0,
  };
}
