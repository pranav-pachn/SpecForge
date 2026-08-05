export class AgentCancelledError extends Error {
  constructor(message = 'Agent execution was cancelled.') {
    super(message);
    this.name = 'AgentCancelledError';
  }
}

export class CancellationToken {
  private _isCancelled = false;
  private _children: CancellationToken[] = [];

  get isCancelled(): boolean {
    return this._isCancelled;
  }

  cancel(): void {
    if (this._isCancelled) return;
    this._isCancelled = true;
    for (const child of this._children) {
      child.cancel();
    }
  }

  throwIfCancelled(): void {
    if (this._isCancelled) {
      throw new AgentCancelledError();
    }
  }

  createChild(): CancellationToken {
    const child = new CancellationToken();
    if (this._isCancelled) {
      child.cancel();
    } else {
      this._children.push(child);
    }
    return child;
  }
}
