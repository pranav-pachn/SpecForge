import { MCPCapability } from "./MCPCapability";
import { MCPRequest } from "./MCPRequest";
import { MCPResponse } from "./MCPResponse";
import { ContextItem } from "@/platform/context/interfaces/RetrievedContext";

export interface MCPConnector {
  id: string;
  name: string;
  type: "REPOSITORY" | "FILESYSTEM" | "DATABASE" | "BROWSER" | "DOCUMENTS";
  capabilities: MCPCapability[];
  permissions: string[]; // ["READ", "WRITE", "EXECUTE", "DELETE"]

  isAvailable(): Promise<boolean>;
  supports(capability: MCPCapability): boolean;
  connect(): Promise<void>;
  
  // For Context Layer (retrieval mode)
  search(request: MCPRequest): Promise<ContextItem[]>;
  
  // For Agent Runtime (execution mode)
  execute(request: MCPRequest): Promise<MCPResponse>;
  
  disconnect(): Promise<void>;
}
