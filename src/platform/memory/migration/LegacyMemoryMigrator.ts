export class LegacyMemoryMigrator {
  static async runMigration(batchSize: number = 50) {
    console.log(`[LegacyMemoryMigrator] Memory models removed. Skipping migration.`);
    return 0;
  }
}
