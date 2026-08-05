export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { registerSubscribers } = await import('./platform/events/registry');
    const { PlatformEventBus } = await import('./platform/events/PlatformEventBus');
    const { EventWorker } = await import('./platform/queue/EventWorker');
    const { registerStandardAgents } = await import('./workflow/engine/Pipeline');
    const { RuntimeRegistry } = await import('./runtime/RuntimeRegistry');

    PlatformEventBus.initializeTransport();
    registerSubscribers();
    
    // Register agents to the runtime
    registerStandardAgents(RuntimeRegistry.getInstance());
    
    // Initialize the worker to listen for events in the background
    new EventWorker();
    
    console.log('[PlatformEventBus] Subscribers and background worker initialized.');
  }
}
