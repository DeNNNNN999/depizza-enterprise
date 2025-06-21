import { describe, it, expect } from 'vitest';
import { Money } from '@/domain/shared/money';
import { ValidationError } from '@/domain/shared/result';

describe('Money Value Object', () => {
  describe('creation', () => {
    it('should create money with valid amount and currency', () => {
      const money = Money.create(10.50, 'USD');
      
      expect(money.amount).toBe(10.50);
      expect(money.currency).toBe('USD');
    });

    it('should create money from cents', () => {
      const money = Money.fromCents(1050, 'USD');
      
      expect(money.amount).toBe(10.50);
      expect(money.currency).toBe('USD');
    });

    it('should throw error for negative amount', () => {
      expect(() => Money.create(-10, 'USD')).toThrow(ValidationError);
    });
  });

  describe('operations', () => {
    it('should add money of same currency', () => {
      const money1 = Money.create(10, 'USD');
      const money2 = Money.create(5, 'USD');
      const result = money1.add(money2);
      
      expect(result.amount).toBe(15);
      expect(result.currency).toBe('USD');
    });

    it('should subtract money of same currency', () => {
      const money1 = Money.create(10, 'USD');
      const money2 = Money.create(3, 'USD');
      const result = money1.subtract(money2);
      
      expect(result.amount).toBe(7);
      expect(result.currency).toBe('USD');
    });

    it('should multiply money by factor', () => {
      const money = Money.create(10, 'USD');
      const result = money.multiply(2.5);
      
      expect(result.amount).toBe(25);
      expect(result.currency).toBe('USD');
    });

    it('should throw error when adding different currencies', () => {
      const money1 = Money.create(10, 'USD');
      const money2 = Money.create(5, 'EUR');
      
      expect(() => money1.add(money2)).toThrow(ValidationError);
    });

    it('should throw error when subtracting more than available', () => {
      const money1 = Money.create(5, 'USD');
      const money2 = Money.create(10, 'USD');
      
      expect(() => money1.subtract(money2)).toThrow(ValidationError);
    });

    it('should throw error when multiplying by negative factor', () => {
      const money = Money.create(10, 'USD');
      
      expect(() => money.multiply(-2)).toThrow(ValidationError);
    });
  });

  describe('comparison', () => {
    it('should compare money amounts correctly', () => {
      const money1 = Money.create(10, 'USD');
      const money2 = Money.create(5, 'USD');
      const money3 = Money.create(15, 'USD');
      
      expect(money1.isGreaterThan(money2)).toBe(true);
      expect(money1.isLessThan(money3)).toBe(true);
      expect(money2.isGreaterThan(money3)).toBe(false);
    });

    it('should throw error when comparing different currencies', () => {
      const money1 = Money.create(10, 'USD');
      const money2 = Money.create(5, 'EUR');
      
      expect(() => money1.isGreaterThan(money2)).toThrow(ValidationError);
    });
  });

  describe('equality', () => {
    it('should be equal when amount and currency match', () => {
      const money1 = Money.create(10, 'USD');
      const money2 = Money.create(10, 'USD');
      
      expect(money1.equals(money2)).toBe(true);
    });

    it('should not be equal when amounts differ', () => {
      const money1 = Money.create(10, 'USD');
      const money2 = Money.create(5, 'USD');
      
      expect(money1.equals(money2)).toBe(false);
    });

    it('should not be equal when currencies differ', () => {
      const money1 = Money.create(10, 'USD');
      const money2 = Money.create(10, 'EUR');
      
      expect(money1.equals(money2)).toBe(false);
    });
  });

  describe('formatting', () => {
    it('should format money as currency string', () => {
      const money = Money.create(10.50, 'USD');
      const formatted = money.toString();
      
      expect(formatted).toMatch(/\$10\.50/);
    });
  });

  describe('cents conversion', () => {
    it('should convert to cents correctly', () => {
      const money = Money.create(10.50, 'USD');
      expect(money.toCents()).toBe(1050);
    });

    it('should handle rounding for cents conversion', () => {
      const money = Money.create(10.999, 'USD');
      expect(money.toCents()).toBe(1100);
    });
  });
});