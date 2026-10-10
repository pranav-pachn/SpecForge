export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { registerSubscribers } = await import('./platform/events/registry');
    const { PlatformEventBus } = await import('./platform/events/PlatformEventBus');
    const { EventWorker } = await import('./platform/queue/EventWorker');
    const { registerStandardAgents } = await import('./workflow/engine/Pipeline');
    const { RuntimeRegistry } = await import('./runtime/RuntimeRegistry');

    const { QueueManager } = await import('./platform/queue/QueueManager');
    const redisUp = await QueueManager.probe();
    if (redisUp) {
      PlatformEventBus.initializeTransport();
      new EventWorker();
      console.log('[PlatformEventBus] Subscribers and background worker initialized.');
    } else if (process.env.REDIS_URL) {
      console.warn('[QueueManager] Redis is not running. Background queues are disabled.');
    } else {
      console.log('[PlatformEventBus] REDIS_URL not set. Using synchronous transport.');
    }

    registerSubscribers();
    registerStandardAgents(RuntimeRegistry.getInstance());
  }
}
