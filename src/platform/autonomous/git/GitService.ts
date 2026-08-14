import { IGitAdapter, SimpleGitAdapter } from "./GitAdapter";

export class GitService {
  private adapter: IGitAdapter;

  constructor(adapter?: IGitAdapter) {
    this.adapter = adapter || new SimpleGitAdapter();
  }

  async checkout(cwd: string, branch: string): Promise<void> {
    await this.adapter.checkout(cwd, branch);
  }

  async branch(cwd: string, branchName: string): Promise<void> {
    await this.adapter.branch(cwd, branchName);
  }

  async commit(cwd: string, message: string): Promise<void> {
    await this.adapter.commit(cwd, message);
  }

  async stash(cwd: string, message?: string): Promise<void> {
    await this.adapter.stash(cwd, message);
  }

  async reset(cwd: string, hard: boolean = true): Promise<void> {
    await this.adapter.reset(cwd, hard);
  }

  async push(cwd: string): Promise<void> {
    await this.adapter.push(cwd);
  }

  async openPR(cwd: string, title: string, body: string, base: string, head: string): Promise<string> {
    return this.adapter.openPR(cwd, title, body, base, head);
  }
}

export const gitService = new GitService();
