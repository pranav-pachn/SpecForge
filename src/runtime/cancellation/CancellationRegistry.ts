import { CancellationToken } from './CancellationToken';

export class CancellationRegistry {
  private static instance: CancellationRegistry;
  private tokens: Map<string, CancellationToken> = new Map();

  private constructor() {}

  public static getInstance(): CancellationRegistry {
    if (!CancellationRegistry.instance) {
      CancellationRegistry.instance = new CancellationRegistry();
    }
    return CancellationRegistry.instance;
  }

  public register(workflowId: string): CancellationToken {
    const token = new CancellationToken();
    this.tokens.set(workflowId, token);
    return token;
  }

  public get(workflowId: string): CancellationToken | undefined {
    return this.tokens.get(workflowId);
  }

  public cancel(workflowId: string): void {
    const token = this.tokens.get(workflowId);
    if (token) {
      token.cancel();
      // We don't remove it from the map immediately, in case components are still checking it
    }
  }

  public unregister(workflowId: string): void {
    this.tokens.delete(workflowId);
  }
}
