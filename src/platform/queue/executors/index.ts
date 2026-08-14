import { JobType } from '../interfaces/RuntimeJob';
import { ExecutorRegistry } from './ExecutorRegistry';
import { AgentJobExecutor } from './AgentJobExecutor';

// Initialize the registry
const registry = ExecutorRegistry.getInstance();

registry.register(JobType.AGENT, new AgentJobExecutor());
// other executors would be registered here
