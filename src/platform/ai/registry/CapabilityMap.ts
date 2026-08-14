import { Capability } from "../interfaces/Capability";
import { TaskProfile } from "../interfaces/TaskProfile";

export interface CapabilityRouting {
  profile: TaskProfile;
  primary: string; // Model ID
  fallbacks: string[]; // Model IDs
}

import capabilitiesConfig from './capabilities.json';

// In Phase 4C, this is loaded from capabilities.json
export const CapabilityMap: Record<Capability, CapabilityRouting> = capabilitiesConfig as Record<Capability, CapabilityRouting>;

