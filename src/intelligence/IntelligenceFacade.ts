import { DriftEngine } from "./drift/DriftEngine";
import { GraphService } from "./graph/GraphService";
import { DecisionQuery } from "./memory/DecisionQuery";
import { CoverageEngine } from "./validation/CoverageEngine";
import { ImpactPredictor } from "./impact/ImpactPredictor";

let initialized = false;

export class IntelligenceFacade {
  static get graph() { return GraphService; }
  static get memory() { return DecisionQuery; }
  static get validation() { return CoverageEngine; }
  static get impact() { return ImpactPredictor; }

  static initialize() {
    if (initialized) return;
    
    // Wire up event listeners
    DriftEngine.initialize();
    
    initialized = true;
    console.log("[IntelligenceFacade] Subsystems initialized.");
  }
}
