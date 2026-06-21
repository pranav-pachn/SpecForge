import { db } from "@/lib/db";
import { getAuthenticatedUser, jsonResponse, apiError } from "@/lib/api-helpers";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const artifact = await db.artifact.findUnique({
      where: { id: params.id },
      include: { workflow: true },
    });

    if (!artifact) return apiError("Artifact not found", 404);
    if (artifact.workflow.creatorId !== user.id) return apiError("Unauthorized", 401);

    const versions = await db.artifactVersion.findMany({
      where: { artifactId: params.id },
      orderBy: { version: "desc" },
    });

    return jsonResponse(versions);
  } catch (error) {
    return apiError("Failed to fetch versions", 500);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const artifact = await db.artifact.findUnique({
      where: { id: params.id },
      include: { workflow: true },
    });

    if (!artifact) return apiError("Artifact not found", 404);
    if (artifact.workflow.creatorId !== user.id) return apiError("Unauthorized", 401);

    const { content } = await req.json();
    if (content === undefined) return apiError("Content is required", 400);

    // Get latest version number
    const latestVersion = await db.artifactVersion.findFirst({
      where: { artifactId: params.id },
      orderBy: { version: "desc" },
    });

    const newVersionNum = latestVersion ? latestVersion.version + 1 : 1;

    const newVersion = await db.artifactVersion.create({
      data: {
        artifactId: params.id,
        version: newVersionNum,
        content,
      },
    });

    return jsonResponse(newVersion, 201);
  } catch (error) {
    return apiError("Failed to create version", 500);
  }
}
