/**
 * Common test utilities and helper functions for the DePizza application.
 * These utilities help reduce duplication and provide consistent testing patterns.
 */

import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'vitest';
import { Result } from '@/domain/shared/result';
import { Maybe } from '@/domain/shared/functional';

/**
 * Test helpers for domain Result types
 */
export class ResultTestHelpers {
  /**
   * Assert that a Result is Ok and return the value
   */
  static expectOk<T, E>(result: Result<T, E>): T {
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      return result.value;
    }
    throw new Error('Expected Ok result but got Err');
  }

  /**
   * Assert that a Result is Err and return the error
   */
  static expectErr<T, E>(result: Result<T, E>): E {
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      return result.error;
    }
    throw new Error('Expected Err result but got Ok');
  }

  /**
   * Assert that a Result is Ok with specific value
   */
  static expectOkValue<T, E>(result: Result<T, E>, expectedValue: T): void {
    const value = this.expectOk(result);
    expect(value).toEqual(expectedValue);
  }

  /**
   * Assert that a Result is Err with specific error type
   */
  static expectErrType<T, E>(result: Result<T, E>, errorConstructor: new (...args: any[]) => E): E {
    const error = this.expectErr(result);
    expect(error).toBeInstanceOf(errorConstructor);
    return error;
  }
}

/**
 * Test helpers for Maybe types
 */
export class MaybeTestHelpers {
  /**
   * Assert that a Maybe is Some and return the value
   */
  static expectSome<T>(maybe: Maybe<T>): T {
    expect(maybe.isSome()).toBe(true);
    if (maybe.isSome()) {
      return maybe.value;
    }
    throw new Error('Expected Some but got None');
  }

  /**
   * Assert that a Maybe is None
   */
  static expectNone<T>(maybe: Maybe<T>): void {
    expect(maybe.isNone()).toBe(true);
  }

  /**
   * Assert that a Maybe is Some with specific value
   */
  static expectSomeValue<T>(maybe: Maybe<T>, expectedValue: T): void {
    const value = this.expectSome(maybe);
    expect(value).toEqual(expectedValue);
  }
}

/**
 * UI Test helpers for common interactions
 */
export class UITestHelpers {
  /**
   * Fill a form field by label
   */
  static async fillField(labelText: string, value: string): Promise<void> {
    const user = userEvent.setup();
    const field = screen.getByLabelText(labelText);
    await user.clear(field);
    await user.type(field, value);
  }

  /**
   * Fill a form field by placeholder
   */
  static async fillFieldByPlaceholder(placeholder: string, value: string): Promise<void> {
    const user = userEvent.setup();
    const field = screen.getByPlaceholderText(placeholder);
    await user.clear(field);
    await user.type(field, value);
  }

  /**
   * Click a button by text
   */
  static async clickButton(buttonText: string): Promise<void> {
    const user = userEvent.setup();
    const button = screen.getByRole('button', { name: buttonText });
    await user.click(button);
  }

  /**
   * Submit a form
   */
  static async submitForm(): Promise<void> {
    const user = userEvent.setup();
    const submitButton = screen.getByRole('button', { name: /submit|save|create|login|register/i });
    await user.click(submitButton);
  }

  /**
   * Wait for element to appear
   */
  static async waitForElement(text: string, timeout = 3000): Promise<HTMLElement> {
    return await screen.findByText(text, {}, { timeout });
  }

  /**
   * Wait for element to disappear
   */
  static async waitForElementToDisappear(text: string, timeout = 3000): Promise<void> {
    await waitFor(
      () => {
        expect(screen.queryByText(text)).not.toBeInTheDocument();
      },
      { timeout }
    );
  }

  /**
   * Check if loading state is active
   */
  static expectLoading(): void {
    expect(screen.getByText(/loading|spinner|processing/i)).toBeInTheDocument();
  }

  /**
   * Check if error message is displayed
   */
  static expectError(errorText?: string): void {
    if (errorText) {
      expect(screen.getByText(errorText)).toBeInTheDocument();
    } else {
      expect(screen.getByText(/error|failed|invalid/i)).toBeInTheDocument();
    }
  }

  /**
   * Check if success message is displayed
   */
  static expectSuccess(successText?: string): void {
    if (successText) {
      expect(screen.getByText(successText)).toBeInTheDocument();
    } else {
      expect(screen.getByText(/success|created|saved|completed/i)).toBeInTheDocument();
    }
  }

  /**
   * Fill a complete login form
   */
  static async fillLoginForm(email: string, password: string): Promise<void> {
    await this.fillField('Email', email);
    await this.fillField('Password', password);
  }

  /**
   * Fill a complete registration form
   */
  static async fillRegistrationForm(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone: string;
  }): Promise<void> {
    await this.fillField('First Name', userData.firstName);
    await this.fillField('Last Name', userData.lastName);
    await this.fillField('Email', userData.email);
    await this.fillField('Password', userData.password);
    await this.fillField('Phone', userData.phone);
  }

  /**
   * Navigate through tabs using keyboard
   */
  static async navigateWithTab(steps: number): Promise<void> {
    const user = userEvent.setup();
    for (let i = 0; i < steps; i++) {
      await user.tab();
    }
  }

  /**
   * Check form validation errors
   */
  static expectValidationError(fieldName: string, errorMessage?: string): void {
    if (errorMessage) {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    } else {
      // Look for common validation patterns
      const errorElement = screen.getByText(/required|invalid|must be|should be/i);
      expect(errorElement).toBeInTheDocument();
    }
  }
}

/**
 * Pizza-specific test helpers
 */
export class PizzaTestHelpers {
  /**
   * Add pizza to cart interaction
   */
  static async addPizzaToCart(pizzaName: string): Promise<void> {
    const user = userEvent.setup();
    
    // Find the pizza card
    const pizzaCard = screen.getByText(pizzaName).closest('[data-testid="pizza-card"]') ||
                     screen.getByText(pizzaName).closest('.pizza-card') ||
                     screen.getByText(pizzaName).closest('article');
    
    if (!pizzaCard) {
      throw new Error(`Could not find pizza card for ${pizzaName}`);
    }

    // Click add to cart button within the card
    const addButton = within(pizzaCard as HTMLElement).getByRole('button', { name: /add to cart/i });
    await user.click(addButton);
  }

  /**
   * Select pizza size
   */
  static async selectPizzaSize(size: 'Small' | 'Medium' | 'Large'): Promise<void> {
    const user = userEvent.setup();
    const sizeButton = screen.getByRole('button', { name: size });
    await user.click(sizeButton);
  }

  /**
   * Add pizza customization
   */
  static async addCustomization(customization: string): Promise<void> {
    const user = userEvent.setup();
    const checkbox = screen.getByRole('checkbox', { name: new RegExp(customization, 'i') });
    await user.click(checkbox);
  }

  /**
   * Verify pizza in cart
   */
  static expectPizzaInCart(pizzaName: string, quantity = 1): void {
    expect(screen.getByText(pizzaName)).toBeInTheDocument();
    if (quantity > 1) {
      expect(screen.getByText(`${quantity}x`)).toBeInTheDocument();
    }
  }

  /**
   * Verify cart total
   */
  static expectCartTotal(expectedTotal: string): void {
    expect(screen.getByText(new RegExp(`total.*${expectedTotal}`, 'i'))).toBeInTheDocument();
  }

  /**
   * Complete order flow
   */
  static async completeOrder(deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  }): Promise<void> {
    // Fill delivery address
    await UITestHelpers.fillField('Street Address', deliveryAddress.street);
    await UITestHelpers.fillField('City', deliveryAddress.city);
    await UITestHelpers.fillField('State', deliveryAddress.state);
    await UITestHelpers.fillField('ZIP Code', deliveryAddress.zipCode);
    
    // Submit order
    await UITestHelpers.clickButton('Place Order');
  }
}

/**
 * Data validation helpers
 */
export class ValidationTestHelpers {
  /**
   * Test email validation
   */
  static readonly VALID_EMAILS = [
    'test@example.com',
    'user.name@domain.co.uk',
    'test123@test-domain.org',
    'user+tag@example.com'
  ];

  static readonly INVALID_EMAILS = [
    'invalid-email',
    '@example.com',
    'test@',
    'test@.com',
    'test..test@example.com',
    'test@example.',
    ''
  ];

  /**
   * Test password validation
   */
  static readonly VALID_PASSWORDS = [
    'securePassword123',
    'MyP@ssw0rd!',
    'TestPass1234',
    'Complex#Pass99'
  ];

  static readonly INVALID_PASSWORDS = [
    '123',          // Too short
    'password',     // No numbers
    '12345678',     // No letters
    '',             // Empty
    'a'.repeat(200) // Too long
  ];

  /**
   * Test phone number validation
   */
  static readonly VALID_PHONES = [
    '+1234567890',
    '+44 20 7946 0958',
    '+33 1 42 86 83 26',
    '+1 (555) 123-4567'
  ];

  static readonly INVALID_PHONES = [
    '123',
    'invalid-phone',
    '++1234567890',
    ''
  ];

  /**
   * Generate test data for boundary testing
   */
  static generateBoundaryStrings() {
    return {
      empty: '',
      singleChar: 'a',
      maxLength: 'a'.repeat(255),
      tooLong: 'a'.repeat(256),
      withSpaces: '  test  ',
      withSpecialChars: 'test!@#$%^&*()'
    };
  }

  /**
   * Generate test numbers for boundary testing
   */
  static generateBoundaryNumbers() {
    return {
      zero: 0,
      negative: -1,
      decimal: 10.99,
      large: 999999.99,
      tooLarge: Number.MAX_SAFE_INTEGER,
      infinity: Infinity,
      nan: NaN
    };
  }
}

/**
 * Performance testing helpers
 */
export class PerformanceTestHelpers {
  /**
   * Measure function execution time
   */
  static async measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; timeMs: number }> {
    const start = performance.now();
    const result = await fn();
    const timeMs = performance.now() - start;
    return { result, timeMs };
  }

  /**
   * Assert that function executes within time limit
   */
  static async expectWithinTime<T>(
    fn: () => Promise<T>,
    maxTimeMs: number
  ): Promise<T> {
    const { result, timeMs } = await this.measureTime(fn);
    expect(timeMs).toBeLessThan(maxTimeMs);
    return result;
  }

  /**
   * Run function multiple times and get average execution time
   */
  static async measureAverageTime<T>(
    fn: () => Promise<T>,
    iterations = 10
  ): Promise<{ averageTimeMs: number; results: T[] }> {
    const results: T[] = [];
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const { result, timeMs } = await this.measureTime(fn);
      results.push(result);
      times.push(timeMs);
    }

    const averageTimeMs = times.reduce((sum, time) => sum + time, 0) / times.length;
    return { averageTimeMs, results };
  }
}

/**
 * Async test helpers
 */
export class AsyncTestHelpers {
  /**
   * Wait for a condition to be true
   */
  static async waitForCondition(
    condition: () => boolean,
    timeout = 3000,
    interval = 100
  ): Promise<void> {
    const start = Date.now();
    
    while (Date.now() - start < timeout) {
      if (condition()) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error(`Condition not met within ${timeout}ms`);
  }

  /**
   * Create a controllable promise for testing
   */
  static createControllablePromise<T>(): {
    promise: Promise<T>;
    resolve: (value: T) => void;
    reject: (error: Error) => void;
  } {
    let resolve!: (value: T) => void;
    let reject!: (error: Error) => void;
    
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    
    return { promise, resolve, reject };
  }

  /**
   * Simulate network delay
   */
  static async simulateNetworkDelay(ms = 100): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry an async operation
   */
  static async retry<T>(
    operation: () => Promise<T>,
    maxAttempts = 3,
    delayMs = 100
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }
    
    throw lastError!;
  }
}

/**
 * Mock data generators
 */
export class MockDataHelpers {
  /**
   * Generate random string
   */
  static randomString(length = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  }

  /**
   * Generate random email
   */
  static randomEmail(): string {
    return `${this.randomString(8)}@${this.randomString(6)}.com`;
  }

  /**
   * Generate random phone number
   */
  static randomPhone(): string {
    const areaCode = Math.floor(Math.random() * 900) + 100;
    const prefix = Math.floor(Math.random() * 900) + 100;
    const suffix = Math.floor(Math.random() * 9000) + 1000;
    return `+1${areaCode}${prefix}${suffix}`;
  }

  /**
   * Generate random price
   */
  static randomPrice(min = 5, max = 50): number {
    return Math.round((Math.random() * (max - min) + min) * 100) / 100;
  }

  /**
   * Pick random item from array
   */
  static randomItem<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
  }
}
