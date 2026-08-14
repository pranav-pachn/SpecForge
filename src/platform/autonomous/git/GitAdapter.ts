import { execSync } from "child_process";

export interface IGitAdapter {
  checkout(cwd: string, branch: string): Promise<void>;
  branch(cwd: string, branchName: string): Promise<void>;
  commit(cwd: string, message: string): Promise<void>;
  stash(cwd: string, message?: string): Promise<void>;
  reset(cwd: string, hard?: boolean): Promise<void>;
  push(cwd: string): Promise<void>;
  openPR(cwd: string, title: string, body: string, base: string, head: string): Promise<string>;
}

export class SimpleGitAdapter implements IGitAdapter {
  async checkout(cwd: string, branch: string): Promise<void> {
    execSync(`git checkout ${branch}`, { cwd });
  }

  async branch(cwd: string, branchName: string): Promise<void> {
    execSync(`git checkout -b ${branchName}`, { cwd });
  }

  async commit(cwd: string, message: string): Promise<void> {
    execSync(`git add .`, { cwd });
    execSync(`git commit -m "${message}"`, { cwd });
  }

  async stash(cwd: string, message?: string): Promise<void> {
    const cmd = message ? `git stash save "${message}"` : `git stash`;
    execSync(cmd, { cwd });
  }

  async reset(cwd: string, hard: boolean = true): Promise<void> {
    const cmd = hard ? `git reset --hard` : `git reset`;
    execSync(cmd, { cwd });
  }

  async push(cwd: string): Promise<void> {
    execSync(`git push`, { cwd });
  }

  async openPR(cwd: string, title: string, body: string, base: string, head: string): Promise<string> {
    // Requires gh cli
    const output = execSync(`gh pr create --title "${title}" --body "${body}" --base ${base} --head ${head}`, { cwd });
    return output.toString().trim();
  }
}
