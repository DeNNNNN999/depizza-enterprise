import { z } from 'zod';
import { ValueObject } from './types';
import { ValidationError } from './result';

export const CurrencySchema = z.enum(['USD', 'EUR', 'RUB']);
export type Currency = z.infer<typeof CurrencySchema>;

export const MoneySchema = z.object({
  amount: z.number().positive(),
  currency: CurrencySchema,
});

export class Money implements ValueObject {
  private constructor(
    public readonly amount: number,
    public readonly currency: Currency
  ) {
    if (amount < 0) {
      throw new ValidationError('Money amount cannot be negative');
    }
  }

  static create(amount: number, currency: Currency): Money {
    return new Money(amount, currency);
  }

  static fromCents(cents: number, currency: Currency): Money {
    return new Money(cents / 100, currency);
  }

  toCents(): number {
    return Math.round(this.amount * 100);
  }

  add(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    this.ensureSameCurrency(other);
    const result = this.amount - other.amount;
    if (result < 0) {
      throw new ValidationError('Cannot subtract more money than available');
    }
    return new Money(result, this.currency);
  }

  multiply(factor: number): Money {
    if (factor < 0) {
      throw new ValidationError('Cannot multiply money by negative factor');
    }
    return new Money(this.amount * factor, this.currency);
  }

  equals(other: ValueObject): boolean {
    if (!(other instanceof Money)) return false;
    return this.amount === other.amount && this.currency === other.currency;
  }

  isGreaterThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.amount > other.amount;
  }

  isLessThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.amount < other.amount;
  }

  toString(): string {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency,
    });
    return formatter.format(this.amount);
  }

  private ensureSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new ValidationError(
        `Cannot perform operation with different currencies: ${this.currency} and ${other.currency}`
      );
    }
  }
}