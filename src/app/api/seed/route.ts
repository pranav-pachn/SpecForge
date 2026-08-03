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

    // Create organization if not exists
    let orgMember = await prisma.orgMember.findFirst({
      where: { userId: demoUser.id },
      include: { organization: true }
    });

    let org;
    if (!orgMember) {
      const orgName = "Acme Corp Demo";
      org = await prisma.organization.create({
        data: {
          name: orgName,
          slug: orgName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.random().toString(36).substring(2, 6),
          ownerId: demoUser.id,
          plan: "PRO",
          members: {
            create: {
              userId: demoUser.id,
              role: "OWNER"
            }
          }
        }
      });
    } else {
      org = orgMember.organization;
    }

    // Create a demo project
    let project = await prisma.project.findFirst({
      where: { organizationId: org.id, name: "SaaS Dashboard Redesign" }
    });

    if (!project) {
      project = await prisma.project.create({
        data: {
          name: "SaaS Dashboard Redesign",
          description: "A complete overhaul of the analytics dashboard.",
          organizationId: org.id,
        }
      });
    }

    return NextResponse.json({ success: true, message: "Demo seeded successfully" });
  } catch (error) {
    console.error("Failed to seed demo data:", error);
    return NextResponse.json({ error: "Failed to seed demo data" }, { status: 500 });
  }
}
