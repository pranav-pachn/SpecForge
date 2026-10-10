import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    return NextResponse.json({});
  } catch (error) {
    console.error("Failed to fetch prompt leaderboard:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
