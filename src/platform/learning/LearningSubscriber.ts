import { PlatformEventBus } from '../../platform/events/PlatformEventBus';
import { Logger } from '../../platform/observability/Logger';

export class LearningSubscriber {
  private logger = new Logger('LearningSubscriber');

  constructor(private eventBus: typeof PlatformEventBus) {
    this.subscribe();
  }

  private subscribe() {
    console.log(`[LearningSubscriber] EventType models removed. Skipping subscription.`);
  }
}
