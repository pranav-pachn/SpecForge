import { PluginManifest } from './interfaces/PluginManifest';
import { Logger } from '../observability/Logger';
import fs from 'fs';
import path from 'path';

export class PluginRuntime {
  private logger = new Logger('PluginRuntime');
  private plugins: Map<string, PluginManifest> = new Map();

  /**
   * Discovers and registers all installed plugins from the plugins/ directory.
   */
  async discoverPlugins(pluginsDir: string = path.join(process.cwd(), 'plugins')): Promise<void> {
    this.logger.info(`[PluginRuntime] Discovering plugins in ${pluginsDir}`);
    
    if (!fs.existsSync(pluginsDir)) {
      this.logger.warn(`Plugin directory ${pluginsDir} does not exist. Skipping discovery.`);
      return;
    }

    const entries = fs.readdirSync(pluginsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const manifestPath = path.join(pluginsDir, entry.name, 'manifest.json');
        
        if (fs.existsSync(manifestPath)) {
          try {
            const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
            const manifest = JSON.parse(manifestContent) as PluginManifest;
            this.registerPlugin(manifest);
          } catch (err: any) {
            this.logger.error(`[PluginRuntime] Failed to load manifest for ${entry.name}: ${err.message}`);
          }
        }
      }
    }
  }

  registerPlugin(manifest: PluginManifest) {
    if (this.plugins.has(manifest.id)) {
      this.logger.warn(`Plugin ${manifest.id} is already registered. Skipping.`);
      return;
    }
    
    this.plugins.set(manifest.id, manifest);
    this.logger.info(`[PluginRuntime] Registered plugin: ${manifest.name} v${manifest.version}`);
    
    // In a full implementation, this is where we would:
    // 1. Register agents with AgentRegistry
    // 2. Register MCPs with MCPBroker
    // 3. Mount API routes
  }

  getPlugin(id: string): PluginManifest | undefined {
    return this.plugins.get(id);
  }

  getAllPlugins(): PluginManifest[] {
    return Array.from(this.plugins.values());
  }
}
