import { NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";

export async function POST() {
  try {
    const demoEmail = "demo@specforge.dev";

    // Create user if not exists
    let demoUser = await prisma.user.findUnique({
      where: { email: demoEmail }
    });

    if (!demoUser) {
      demoUser = await prisma.user.create({
        data: {
          email: demoEmail,
          name: "Demo User",
          passwordHash: "demo_bypassed",
        }
      });
    }

    // Create workspace if not exists
    let workspaceMember = await prisma.workspaceMember.findFirst({
      where: { userId: demoUser.id },
      include: { workspace: true }
    });

    let workspace;
    if (!workspaceMember) {
      workspace = await prisma.workspace.create({
        data: {
          name: "Acme Corp Demo",
          members: {
            create: {
              userId: demoUser.id,
              role: "ADMIN"
            }
          }
        }
      });
    } else {
      workspace = workspaceMember.workspace;
    }

    // Create a demo project
    let project = await prisma.project.findFirst({
      where: { workspaceId: workspace.id, name: "SaaS Dashboard Redesign" }
    });

    if (!project) {
      project = await prisma.project.create({
        data: {
          name: "SaaS Dashboard Redesign",
          description: "A complete overhaul of the analytics dashboard.",
          workspaceId: workspace.id,
        }
      });
    }

    return NextResponse.json({ success: true, message: "Demo seeded successfully" });
  } catch (error) {
    console.error("Failed to seed demo data:", error);
    return NextResponse.json({ error: "Failed to seed demo data" }, { status: 500 });
  }
}
