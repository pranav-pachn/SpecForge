import { ContextProfile } from "../ContextBuilder";
import { RetrievedNode } from "../Node";

export class ArchitectContext implements ContextProfile {
  capability = "architect";

  getTypes(): string[] {
    return ["requirement", "planning", "architecture", "standards"];
  }

  format(nodes: RetrievedNode[]): string {
    let output = "## Engineering Memory\n\n";

    const requirements = nodes.filter(n => n.type === "requirement");
    if (requirements.length > 0) {
      output += "### Core Requirements\n";
      requirements.forEach(r => output += `${r.content}\n\n`);
    }

    const planning = nodes.filter(n => n.type === "planning");
    if (planning.length > 0) {
      output += "### Implementation Strategy\n";
      planning.forEach(p => output += `${p.content}\n\n`);
    }

    return output;
  }
}
