import { DomainEvent } from '@/domain/shared/types';

export interface DomainEventHandler<T extends DomainEvent> {
  handle(event: T): Promise<void>;
}

export class DomainEventDispatcher {
  private static instance: DomainEventDispatcher;
  private handlers: Map<string, DomainEventHandler<any>[]> = new Map();

  static getInstance(): DomainEventDispatcher {
    if (!DomainEventDispatcher.instance) {
      DomainEventDispatcher.instance = new DomainEventDispatcher();
    }
    return DomainEventDispatcher.instance;
  }

  register<T extends DomainEvent>(
    eventType: string,
    handler: DomainEventHandler<T>
  ): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  async dispatch(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      const eventType = event.constructor.name;
      const handlers = this.handlers.get(eventType) || [];
      
      await Promise.all(
        handlers.map(handler => 
          handler.handle(event).catch(error => {
            console.error(`Error handling event ${eventType}:`, error);
            // In production, you might want to send this to a dead letter queue
          })
        )
      );
    }
  }

  clear(): void {
    this.handlers.clear();
  }
}

// Event handlers
export class UserCreatedEventHandler implements DomainEventHandler<any> {
  async handle(event: any): Promise<void> {
    console.log('User created event handled:', event);
    // Here you could:
    // - Send welcome email
    // - Create default user preferences
    // - Log analytics event
    // - Notify other bounded contexts
  }
}

export class OrderStatusChangedEventHandler implements DomainEventHandler<any> {
  async handle(event: any): Promise<void> {
    console.log('Order status changed event handled:', event);
    // Here you could:
    // - Send notification to customer
    // - Update analytics
    // - Trigger delivery workflow
    // - Update inventory
  }
}

// Initialize default handlers
const dispatcher = DomainEventDispatcher.getInstance();
dispatcher.register('UserCreatedEvent', new UserCreatedEventHandler());
dispatcher.register('OrderStatusChangedEvent', new OrderStatusChangedEventHandler());