import { db } from "@/lib/db";
import { getAuthenticatedUser, jsonResponse, apiError } from "@/lib/api-helpers";
import { NextRequest } from "next/server";

const DEFAULT_PROFILES = [
  {
    name: "CURSOR",
    config: JSON.stringify({
      promptTemplate: "Use @file references. Be concise. Provide complete code without omitting details for brevity. Avoid pleasantries.",
    })
  },
  {
    name: "CLAUDE_CODE",
    config: JSON.stringify({
      promptTemplate: "Use <context> blocks. Explain reasoning thoroughly before writing code. Check for edge cases.",
    })
  }
];

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    let profiles = await db.toolProfile.findMany({
      orderBy: { name: "asc" }
    });

    // Seed defaults if empty
    if (profiles.length === 0) {
      await db.$transaction(
        DEFAULT_PROFILES.map(p => 
          db.toolProfile.upsert({
            where: { name: p.name },
            update: {},
            create: p
          })
        )
      );
      profiles = await db.toolProfile.findMany({ orderBy: { name: "asc" } });
    }

    return jsonResponse(profiles);
  } catch (error) {
    return apiError("Failed to fetch tool profiles", 500);
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const { name, config } = await req.json();
    
    if (!name || !config) {
      return apiError("Name and config are required", 400);
    }

    const profile = await db.toolProfile.create({
      data: { name, config: JSON.stringify(config) }
    });

    return jsonResponse(profile, 201);
  } catch (error) {
    return apiError("Failed to create tool profile", 500);
  }
}
