import { PlatformEventBus } from './PlatformEventBus';
import { LoggingSubscriber } from './subscribers/LoggingSubscriber';
import { MemorySubscriber } from './subscribers/MemorySubscriber';
import { ReviewSubscriber } from './subscribers/ReviewSubscriber';
import { ValidationSubscriber } from './subscribers/ValidationSubscriber';
import { MetricsSubscriber } from './subscribers/MetricsSubscriber';
import { NotificationSubscriber } from './subscribers/NotificationSubscriber';
import { ExecutionPackSubscriber } from './subscribers/ExecutionPackSubscriber';
import { UsageSubscriber } from './subscribers/UsageSubscriber';

export function registerSubscribers() {
  PlatformEventBus.register(new LoggingSubscriber());
  PlatformEventBus.register(new MemorySubscriber());
  PlatformEventBus.register(new ReviewSubscriber());
  PlatformEventBus.register(new ValidationSubscriber());
  PlatformEventBus.register(new MetricsSubscriber());
  PlatformEventBus.register(new NotificationSubscriber());
  PlatformEventBus.register(new ExecutionPackSubscriber());
  PlatformEventBus.register(new UsageSubscriber());
}
