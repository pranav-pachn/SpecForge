import { db } from "@/lib/db";
import { PermissionGuard } from "../governance/rbac/PermissionGuard";

export class CommentService {
  
  /**
   * Adds a comment to any entity (Artifact, Workflow, Review, Task).
   */
  static async addComment(
    organizationId: string,
    entityType: string,
    entityId: string,
    userId: string,
    content: string,
    parentId?: string
  ) {
    // Basic org validation - must be a member to comment
    await PermissionGuard.requireOrgRole(organizationId, "MEMBER", userId);

    return await db.comment.create({
      data: {
        organizationId,
        entityType,
        entityId,
        userId,
        content,
        parentId
      },
      include: {
        user: { select: { id: true, name: true, image: true, email: true } }
      }
    });
  }

  /**
   * Retrieves comments for an entity, including their replies.
   * Standard nesting allows up to 1 level of replies to prevent deep thread issues.
   */
  static async getComments(organizationId: string, entityType: string, entityId: string) {
    return await db.comment.findMany({
      where: {
        organizationId,
        entityType,
        entityId,
        parentId: null // Top-level comments
      },
      include: {
        user: { select: { id: true, name: true, image: true, email: true } },
        replies: {
          include: {
            user: { select: { id: true, name: true, image: true, email: true } }
          },
          orderBy: { createdAt: "asc" }
        }
      },
      orderBy: { createdAt: "asc" }
    });
  }

  /**
   * Deletes a comment. Only the author or an Org ADMIN can delete it.
   */
  static async deleteComment(commentId: string, userId: string, organizationId: string) {
    const comment = await db.comment.findUnique({ where: { id: commentId } });
    
    if (!comment) {
      throw new Error("Comment not found");
    }

    if (comment.userId !== userId) {
      // If not the author, require ADMIN
      await PermissionGuard.requireOrgRole(organizationId, "ADMIN", userId);
    }

    await db.comment.delete({ where: { id: commentId } });
  }
}
