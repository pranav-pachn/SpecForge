import { db } from "@/lib/db";
import { AuditLog, Prisma } from "@prisma/client";

/**
 * Immutable Repository for Audit Logs.
 * Strictly Append and Find operations only.
 */
export class AuditRepository {
  /**
   * Appends a new immutable log to the audit trail.
   */
  static async append(data: Omit<Prisma.AuditLogUncheckedCreateInput, "id" | "createdAt">): Promise<AuditLog> {
    return await db.auditLog.create({
      data
    });
  }

  /**
   * Finds logs based on provided filters.
   */
  static async find(where: Prisma.AuditLogWhereInput, limit: number = 50, cursor?: string): Promise<AuditLog[]> {
    return await db.auditLog.findMany({
      where,
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: "desc" }
    });
  }

  // NOTE: deliberately omitted update() and delete() to enforce immutability.
}
