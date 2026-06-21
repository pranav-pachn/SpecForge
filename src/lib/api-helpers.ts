import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function getAuthenticatedUser() {
  const session = await auth();
  if (!session?.user?.id) {
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
