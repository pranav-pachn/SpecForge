export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  
  // Platform permissions requested by this plugin
  permissions: string[]; // e.g., ["WORKFLOW_READ", "GRAPH_WRITE", "SECRETS_READ"]

  // Specific integrations exposed
  capabilities: {
    agents?: AgentDefinition[];
    mcpConnectors?: MCPConnectorDefinition[];
    uiExtensions?: UIExtensionDefinition[];
    apiRoutes?: ApiRouteDefinition[];
  };

  // Required user/org configuration
  settingsSchema?: Record<string, SettingDefinition>;
}

export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  entrypoint: string; // Path to logic
}

export interface MCPConnectorDefinition {
  id: string;
  name: string;
  serverUrl?: string; // If remote
  localEntrypoint?: string; // If embedded
}

export interface UIExtensionDefinition {
  mountPoint: 'DASHBOARD_WIDGET' | 'WORKFLOW_SIDEBAR' | 'SETTINGS_TAB';
  componentPath: string;
}

export interface ApiRouteDefinition {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  handler: string;
}

export interface SettingDefinition {
  type: 'string' | 'boolean' | 'number' | 'secret';
  label: string;
  required: boolean;
}
