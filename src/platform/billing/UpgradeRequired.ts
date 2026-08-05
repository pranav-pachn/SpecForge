export class UpgradeRequiredError extends Error {
  public requiredTier: string;
  public feature: string;
  public currentTier: string;
  public upgradeUrl: string;

  constructor(feature: string, currentTier: string, requiredTier: string = "PRO") {
    super(`Action blocked. Upgrade to ${requiredTier} to use ${feature}.`);
    this.name = "UpgradeRequiredError";
    this.feature = feature;
    this.currentTier = currentTier;
    this.requiredTier = requiredTier;
    this.upgradeUrl = `/organization/billing/upgrade?feature=${encodeURIComponent(feature)}`;
  }
}
