import { ContextProfile } from "../ContextBuilder";
import { RetrievedNode } from "../Node";

export class SpecificationContext implements ContextProfile {
  capability = "specification";

  getTypes(): string[] {
    return ["requirement", "planning", "architecture", "standards"];
  }

  format(nodes: RetrievedNode[]): string {
    let output = "## Engineering Memory\n\n";

    const planning = nodes.filter(n => n.type === "planning");
    if (planning.length > 0) {
      output += "### Historical Planning Decisions\n";
      planning.forEach(p => output += `${p.content}\n\n`);
    }

    const architecture = nodes.filter(n => n.type === "architecture" || n.type === "api");
    if (architecture.length > 0) {
      output += "### Architecture Decisions\n";
      architecture.forEach(a => output += `${a.content}\n\n`);
    }

    const requirements = nodes.filter(n => n.type === "requirement");
    if (requirements.length > 0) {
      output += "### Requirements & Rationale\n";
      requirements.forEach(r => output += `${r.content}\n\n`);
    }

    return output;
  }
}
