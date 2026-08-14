import { connectorRegistry } from "../registry/ConnectorRegistry";

export class ConnectorLoader {
  /**
   * Dynamically loads and registers all connectors.
   * In a future plugin system, this would scan a `plugins/` directory.
   * For now, it manually registers the built-in connectors.
   */
  static async load() {
    // Dynamic import to avoid circular dependencies at boot
    try {
      const { GitHubConnector } = await import("../connectors/github/GitHubConnector");
      connectorRegistry.register(new GitHubConnector());
    } catch(e) {}

    try {
      const { FilesystemConnector } = await import("../connectors/filesystem/FilesystemConnector");
      connectorRegistry.register(new FilesystemConnector());
    } catch(e) {}

    try {
      const { PostgresConnector } = await import("../connectors/postgres/PostgresConnector");
      connectorRegistry.register(new PostgresConnector());
    } catch(e) {}

    try {
      const { BrowserConnector } = await import("../connectors/browser/BrowserConnector");
      connectorRegistry.register(new BrowserConnector());
    } catch(e) {}

    try {
      const { DocsConnector } = await import("../connectors/docs/DocsConnector");
      connectorRegistry.register(new DocsConnector());
    } catch(e) {}
  }
}
