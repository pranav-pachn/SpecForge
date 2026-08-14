export class Logger {
  constructor(private context: string) {}

  info(msg: string, meta?: any) {
    console.log(`[${this.context}] INFO: ${msg}`, meta || '');
  }

  warn(msg: string, meta?: any) {
    console.warn(`[${this.context}] WARN: ${msg}`, meta || '');
  }

  error(msg: string, meta?: any) {
    console.error(`[${this.context}] ERROR: ${msg}`, meta || '');
  }
}
