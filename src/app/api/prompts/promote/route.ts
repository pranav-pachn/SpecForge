import { NextResponse } from "next/server";
import { PromptVersionManager } from "@/platform/ai/prompts/PromptVersionManager";

export async function POST(req: Request) {
  try {
    const { variantId, approvedBy } = await req.json();
    
    if (!variantId || !approvedBy) {
      return NextResponse.json({ error: "Missing variantId or approvedBy" }, { status: 400 });
    }

    const promoted = await PromptVersionManager.promoteToActive(variantId, approvedBy);
    
    return NextResponse.json({ success: true, promoted });
  } catch (error: any) {
    console.error("Promotion failed:", error);
    return NextResponse.json({ error: error.message || "Failed to promote" }, { status: 500 });
  }
}
