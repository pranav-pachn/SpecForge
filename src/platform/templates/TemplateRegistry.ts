import { db } from "@/platform/storage/db";
import { Template } from "@prisma/client";

export class TemplateRegistry {
  /**
   * Retrieves all available templates for an organization, 
   * merging Global templates with Organization-specific templates.
   */
  static async getAvailableTemplates(orgId: string): Promise<Template[]> {
    return await db.template.findMany({
      where: {
        OR: [
          { organizationId: null }, // Global
          { organizationId: orgId } // Org-specific
        ],
        isDeprecated: false
      },
      orderBy: { version: "desc" }
    });
  }

  /**
   * Retrieves a specific template version. 
   * Resolves overrides: Org > Global.
   */
  static async getTemplate(orgId: string, name: string, version?: number): Promise<Template | null> {
    const whereClause: any = { name };
    if (version) whereClause.version = version;
    
    // Fetch all matching by name (and version if provided)
    const templates = await db.template.findMany({
      where: whereClause,
      orderBy: { version: "desc" }
    });

    if (templates.length === 0) return null;

    // Filter to those accessible
    const accessible = templates.filter(t => t.organizationId === null || t.organizationId === orgId);

    // Prefer Org-specific over Global if versions are identical
    const orgSpecific = accessible.find(t => t.organizationId === orgId);
    if (orgSpecific) return orgSpecific;

    // Fallback to latest global
    return accessible[0] || null;
  }
}
