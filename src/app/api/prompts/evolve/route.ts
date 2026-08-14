import { NextResponse } from "next/server";
import { PromptEvolutionEngine } from "@/platform/ai/evolution/PromptEvolutionEngine";

export async function POST(req: Request) {
  try {
    const { capability } = await req.json();
    
    if (!capability) {
      return NextResponse.json({ error: "Missing capability" }, { status: 400 });
    }

    const candidate = await PromptEvolutionEngine.evaluateAndEvolve(capability);

    if (candidate) {
      return NextResponse.json({ success: true, candidate, message: "Evolution generated a new candidate." });
    } else {
      return NextResponse.json({ success: true, message: "Evolution triggered, but conditions (metrics/sample size) were not met for generating a candidate." });
    }
  } catch (error) {
    console.error("Evolution trigger failed:", error);
    return NextResponse.json({ error: "Evolution engine error" }, { status: 500 });
  }
}
