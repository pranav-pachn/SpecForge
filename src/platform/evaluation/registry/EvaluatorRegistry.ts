import { Evaluator } from "../interfaces/Evaluator";
import { Capability } from "../../ai/interfaces/Capability";

export class EvaluatorRegistry {
  private evaluators = new Map<string, Evaluator>();

  register(evaluator: Evaluator): void {
    this.evaluators.set(evaluator.id, evaluator);
    console.log(`[EvaluatorRegistry] Registered ${evaluator.category} evaluator: ${evaluator.name} (${evaluator.id})`);
  }

  get(id: string): Evaluator | undefined {
    return this.evaluators.get(id);
  }

  getAll(): Evaluator[] {
    return Array.from(this.evaluators.values());
  }

  getSupporting(capability: Capability): Evaluator[] {
    return this.getAll().filter(e => e.supportsCapability(capability));
  }
}

export const evaluatorRegistry = new EvaluatorRegistry();
