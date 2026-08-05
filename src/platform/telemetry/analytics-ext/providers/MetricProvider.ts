export interface MetricProvider {
  /**
   * Calculates a specific metric for an organization, optionally scoped to a team.
   */
  calculate(orgId: string, teamId?: string | null): Promise<number | null>;
}
