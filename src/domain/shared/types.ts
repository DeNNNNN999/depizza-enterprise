import { z } from 'zod';

export type ID = string;
export type UUID = string;
export type Timestamp = Date;

export const IDSchema = z.string().uuid();
export const TimestampSchema = z.date();

export interface Entity {
  id: ID;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ValueObject {
  equals(other: ValueObject): boolean;
}

export interface DomainEvent {
  eventId: ID;
  occurredOn: Timestamp;
  eventVersion: number;
}

export interface AggregateRoot extends Entity {
  domainEvents: DomainEvent[];
  clearEvents(): void;
  addDomainEvent(event: DomainEvent): void;
}

export abstract class BaseEntity implements Entity {
  constructor(
    public readonly id: ID,
    public readonly createdAt: Timestamp = new Date(),
    public readonly updatedAt: Timestamp = new Date()
  ) {}
}

export abstract class BaseAggregateRoot extends BaseEntity implements AggregateRoot {
  private _domainEvents: DomainEvent[] = [];

  get domainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  clearEvents(): void {
    this._domainEvents = [];
  }

  addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }
}