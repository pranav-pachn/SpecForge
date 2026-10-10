import { NextResponse } from "next/server";
import { auth } from "@/platform/auth";

export async function getAuthenticatedUser() {
  if (process.env.NODE_ENV !== "production" && process.env.E2E_TEST_USER) {
    return JSON.parse(process.env.E2E_TEST_USER);
  }
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  
  // Verify the user actually exists in the DB to avoid foreign key errors from stale JWTs
  const { db } = await import("@/platform/storage/db");
  const dbUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true }
  });
  
  if (!dbUser) {
    return null;
  }

  return { ...session.user, id: session.user.id };
}

export function jsonResponse(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
