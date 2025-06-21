/**
 * Test factory utilities for creating domain objects with realistic test data.
 * These factories help maintain consistency across tests and reduce boilerplate.
 */

import { User } from '@/domain/user/user';
import { Order } from '@/domain/order/order';
import { Money } from '@/domain/shared/money';
import { Email } from '@/domain/shared/email';
import { Result } from '@/domain/shared/result';

/**
 * User factory for creating test users
 */
export class UserFactory {
  private static counter = 0;

  static create(overrides: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone: string;
    role: 'customer' | 'staff' | 'admin';
    isActive: boolean;
  }> = {}): User {
    this.counter++;
    
    const defaults = {
      firstName: `TestUser${this.counter}`,
      lastName: 'Doe',
      email: `testuser${this.counter}@example.com`,
      password: 'securePassword123',
      phone: `+123456789${this.counter.toString().padStart(2, '0')}`,
      role: 'customer' as const,
      isActive: true
    };

    const userData = { ...defaults, ...overrides };
    const emailResult = Email.create(userData.email);
    
    if (emailResult.isErr()) {
      throw new Error(`Invalid email in test factory: ${userData.email}`);
    }

    const userResult = User.create({
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: emailResult.value,
      password: userData.password,
      phone: userData.phone
    });

    if (userResult.isErr()) {
      throw new Error(`Failed to create user in test factory: ${userResult.error.message}`);
    }

    const user = userResult.value;
    
    if (!userData.isActive) {
      user.deactivate();
    }
    
    if (userData.role === 'staff') {
      user.promoteToStaff();
    } else if (userData.role === 'admin') {
      user.promoteToAdmin();
    }

    return user;
  }

  static createCustomer(overrides?: Partial<Parameters<typeof UserFactory.create>[0]>): User {
    return this.create({ ...overrides, role: 'customer' });
  }

  static createStaff(overrides?: Partial<Parameters<typeof UserFactory.create>[0]>): User {
    return this.create({ ...overrides, role: 'staff' });
  }

  static createAdmin(overrides?: Partial<Parameters<typeof UserFactory.create>[0]>): User {
    return this.create({ ...overrides, role: 'admin' });
  }

  static createInactive(overrides?: Partial<Parameters<typeof UserFactory.create>[0]>): User {
    return this.create({ ...overrides, isActive: false });
  }

  static createBatch(count: number, overrides?: Partial<Parameters<typeof UserFactory.create>[0]>): User[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  static reset(): void {
    this.counter = 0;
  }
}

/**
 * Money factory for creating test money objects
 */
export class MoneyFactory {
  static create(amount: number = 10.99, currency: string = 'USD'): Money {
    const result = Money.create(amount, currency);
    
    if (result.isErr()) {
      throw new Error(`Failed to create money in test factory: ${result.error.message}`);
    }
    
    return result.value;
  }

  static zero(currency: string = 'USD'): Money {
    return this.create(0, currency);
  }

  static pizzaPrice(size: 'small' | 'medium' | 'large' = 'medium'): Money {
    const prices = {
      small: 12.99,
      medium: 16.99,
      large: 22.99
    };
    
    return this.create(prices[size]);
  }

  static random(min: number = 1, max: number = 100): Money {
    const amount = Math.random() * (max - min) + min;
    return this.create(Math.round(amount * 100) / 100);
  }
}

/**
 * Order factory for creating test orders
 */
export class OrderFactory {
  private static counter = 0;

  static create(overrides: Partial<{
    customerId: string;
    items: Array<{
      pizzaId: string;
      quantity: number;
      size: 'small' | 'medium' | 'large';
      customizations: string[];
    }>;
    deliveryAddress: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    specialInstructions?: string;
    status: string;
  }> = {}): Order {
    this.counter++;
    
    const defaults = {
      customerId: `customer-${this.counter}`,
      items: [
        {
          pizzaId: 'margherita-001',
          quantity: 1,
          size: 'medium' as const,
          customizations: []
        }
      ],
      deliveryAddress: {
        street: `${this.counter} Test Street`,
        city: 'Test City',
        state: 'CA',
        zipCode: '90210',
        country: 'USA'
      },
      specialInstructions: undefined,
      status: 'pending'
    };

    const orderData = { ...defaults, ...overrides };
    
    // Create a mock order using the Order domain model
    // Note: This would need the actual Order.create method implementation
    const orderResult = Order.create({
      customerId: orderData.customerId,
      items: orderData.items,
      deliveryAddress: orderData.deliveryAddress,
      specialInstructions: orderData.specialInstructions
    });

    if (orderResult.isErr()) {
      throw new Error(`Failed to create order in test factory: ${orderResult.error.message}`);
    }

    return orderResult.value;
  }

  static createPending(overrides?: Partial<Parameters<typeof OrderFactory.create>[0]>): Order {
    return this.create({ ...overrides, status: 'pending' });
  }

  static createConfirmed(overrides?: Partial<Parameters<typeof OrderFactory.create>[0]>): Order {
    return this.create({ ...overrides, status: 'confirmed' });
  }

  static createDelivered(overrides?: Partial<Parameters<typeof OrderFactory.create>[0]>): Order {
    return this.create({ ...overrides, status: 'delivered' });
  }

  static createWithMultiplePizzas(overrides?: Partial<Parameters<typeof OrderFactory.create>[0]>): Order {
    return this.create({
      ...overrides,
      items: [
        {
          pizzaId: 'margherita-001',
          quantity: 2,
          size: 'large',
          customizations: ['extra-cheese']
        },
        {
          pizzaId: 'pepperoni-002',
          quantity: 1,
          size: 'medium',
          customizations: ['thin-crust']
        },
        {
          pizzaId: 'hawaiian-003',
          quantity: 1,
          size: 'small',
          customizations: []
        }
      ]
    });
  }

  static createLargeOrder(overrides?: Partial<Parameters<typeof OrderFactory.create>[0]>): Order {
    return this.create({
      ...overrides,
      items: [
        {
          pizzaId: 'margherita-001',
          quantity: 5,
          size: 'large',
          customizations: []
        },
        {
          pizzaId: 'pepperoni-002',
          quantity: 3,
          size: 'large',
          customizations: ['extra-pepperoni']
        }
      ]
    });
  }

  static createBatch(count: number, overrides?: Partial<Parameters<typeof OrderFactory.create>[0]>): Order[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  static reset(): void {
    this.counter = 0;
  }
}

/**
 * Pizza data factory for realistic pizza configurations
 */
export class PizzaFactory {
  static readonly PIZZA_TYPES = {
    'margherita-001': {
      name: 'Margherita Suprema',
      basePrice: { small: 12.99, medium: 16.99, large: 22.99 },
      ingredients: ['mozzarella', 'basil', 'tomato sauce'],
      dietary: ['vegetarian']
    },
    'pepperoni-002': {
      name: 'Pepperoni Classic',
      basePrice: { small: 14.99, medium: 18.99, large: 24.99 },
      ingredients: ['pepperoni', 'mozzarella', 'tomato sauce'],
      dietary: []
    },
    'hawaiian-003': {
      name: 'Hawaiian Paradise',
      basePrice: { small: 15.99, medium: 19.99, large: 25.99 },
      ingredients: ['ham', 'pineapple', 'mozzarella', 'tomato sauce'],
      dietary: []
    },
    'veggie-004': {
      name: 'Garden Veggie',
      basePrice: { small: 13.99, medium: 17.99, large: 23.99 },
      ingredients: ['bell peppers', 'mushrooms', 'onions', 'olives', 'mozzarella'],
      dietary: ['vegetarian']
    },
    'truffle-005': {
      name: 'Truffle Deluxe',
      basePrice: { small: 24.99, medium: 32.99, large: 42.99 },
      ingredients: ['truffle oil', 'wild mushrooms', 'fontina cheese', 'arugula'],
      dietary: ['vegetarian', 'premium']
    }
  };

  static readonly CUSTOMIZATIONS = {
    'extra-cheese': { price: 2.00, name: 'Extra Cheese' },
    'extra-pepperoni': { price: 3.00, name: 'Extra Pepperoni' },
    'thin-crust': { price: 0.00, name: 'Thin Crust' },
    'thick-crust': { price: 1.00, name: 'Thick Crust' },
    'gluten-free-crust': { price: 4.00, name: 'Gluten-Free Crust' },
    'vegan-cheese': { price: 3.50, name: 'Vegan Cheese' },
    'no-pineapple': { price: 0.00, name: 'No Pineapple' },
    'extra-spicy': { price: 0.50, name: 'Extra Spicy' }
  };

  static getRandomPizzaId(): string {
    const pizzaIds = Object.keys(this.PIZZA_TYPES);
    return pizzaIds[Math.floor(Math.random() * pizzaIds.length)];
  }

  static getRandomCustomizations(count: number = 2): string[] {
    const customizations = Object.keys(this.CUSTOMIZATIONS);
    const shuffled = customizations.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  static getPizzaPrice(pizzaId: string, size: 'small' | 'medium' | 'large'): number {
    const pizza = this.PIZZA_TYPES[pizzaId as keyof typeof this.PIZZA_TYPES];
    return pizza ? pizza.basePrice[size] : 16.99;
  }

  static getCustomizationPrice(customization: string): number {
    const custom = this.CUSTOMIZATIONS[customization as keyof typeof this.CUSTOMIZATIONS];
    return custom ? custom.price : 0;
  }
}

/**
 * Address factory for creating test delivery addresses
 */
export class AddressFactory {
  private static counter = 0;

  static create(overrides: Partial<{
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }> = {}) {
    this.counter++;
    
    const defaults = {
      street: `${this.counter} Test Street`,
      city: 'Test City',
      state: 'CA',
      zipCode: '90210',
      country: 'USA'
    };

    return { ...defaults, ...overrides };
  }

  static createCA(overrides?: Partial<Parameters<typeof AddressFactory.create>[0]>) {
    return this.create({ ...overrides, state: 'CA', zipCode: '90210' });
  }

  static createNY(overrides?: Partial<Parameters<typeof AddressFactory.create>[0]>) {
    return this.create({ ...overrides, state: 'NY', zipCode: '10001' });
  }

  static createTX(overrides?: Partial<Parameters<typeof AddressFactory.create>[0]>) {
    return this.create({ ...overrides, state: 'TX', zipCode: '75001' });
  }

  static createInternational(country: string, overrides?: Partial<Parameters<typeof AddressFactory.create>[0]>) {
    const countryDefaults = {
      'UK': { city: 'London', state: 'England', zipCode: 'SW1A 1AA' },
      'Canada': { city: 'Toronto', state: 'ON', zipCode: 'M5V 3A8' },
      'Germany': { city: 'Berlin', state: 'Berlin', zipCode: '10115' },
      'France': { city: 'Paris', state: 'Île-de-France', zipCode: '75001' }
    };

    const defaults = countryDefaults[country as keyof typeof countryDefaults] || {
      city: 'International City',
      state: 'State',
      zipCode: '00000'
    };

    return this.create({ ...defaults, ...overrides, country });
  }

  static reset(): void {
    this.counter = 0;
  }
}

/**
 * Comprehensive factory reset for all factories
 */
export function resetAllFactories(): void {
  UserFactory.reset();
  OrderFactory.reset();
  AddressFactory.reset();
}

/**
 * Helper for creating realistic test scenarios
 */
export class ScenarioFactory {
  /**
   * Create a typical pizza order scenario
   */
  static pizzaParty(): {
    customer: User;
    orders: Order[];
  } {
    const customer = UserFactory.createCustomer({
      firstName: 'Party',
      lastName: 'Host',
      email: 'party@example.com'
    });

    const orders = [
      OrderFactory.createWithMultiplePizzas({
        customerId: customer.getId(),
        specialInstructions: 'Ring doorbell - party in progress!'
      }),
      OrderFactory.createLargeOrder({
        customerId: customer.getId(),
        specialInstructions: 'Leave at door'
      })
    ];

    return { customer, orders };
  }

  /**
   * Create a loyal customer scenario
   */
  static loyalCustomer(): {
    customer: User;
    orders: Order[];
  } {
    const customer = UserFactory.createCustomer({
      firstName: 'Loyal',
      lastName: 'Customer',
      email: 'loyal@example.com'
    });

    const orders = OrderFactory.createBatch(8, {
      customerId: customer.getId()
    });

    return { customer, orders };
  }

  /**
   * Create a new customer first order scenario
   */
  static firstTimeCustomer(): {
    customer: User;
    order: Order;
  } {
    const customer = UserFactory.createCustomer({
      firstName: 'New',
      lastName: 'Customer',
      email: 'newbie@example.com'
    });

    const order = OrderFactory.createPending({
      customerId: customer.getId(),
      specialInstructions: 'First time ordering - please call if any issues'
    });

    return { customer, order };
  }

  /**
   * Create a staff management scenario
   */
  static staffScenario(): {
    manager: User;
    staff: User[];
    customers: User[];
  } {
    const manager = UserFactory.createAdmin({
      firstName: 'Store',
      lastName: 'Manager',
      email: 'manager@depizza.com'
    });

    const staff = [
      UserFactory.createStaff({
        firstName: 'Kitchen',
        lastName: 'Staff',
        email: 'kitchen@depizza.com'
      }),
      UserFactory.createStaff({
        firstName: 'Delivery',
        lastName: 'Driver',
        email: 'delivery@depizza.com'
      })
    ];

    const customers = UserFactory.createBatch(5);

    return { manager, staff, customers };
  }
}
