import crypto from 'crypto';

export class ApiKeyService {
  async generateKey(organizationId: string, name: string) {
    const rawKey = `sf_${crypto.randomBytes(24).toString('hex')}`;
    console.log(`[ApiKeyService] ApiKey models removed. Skipping store.`);
    return {
      id: "mock-id",
      key: rawKey
    };
  }

  async validateKey(rawKey: string): Promise<string | null> {
    console.log(`[ApiKeyService] ApiKey models removed. Skipping validate.`);
    return "mock-org-id";
  }
}
