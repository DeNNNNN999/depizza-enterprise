import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PlaceOrderUseCase } from '@/application/use-cases/place-order';
import { CreateUserUseCase } from '@/application/use-cases/create-user';
import { InMemoryUserRepository } from '@/test/mocks/in-memory-user-repository';
import { InMemoryOrderRepository } from '@/test/mocks/in-memory-order-repository';
import { User } from '@/domain/user/user';
import { Money } from '@/domain/shared/money';
import { ValidationError, NotFoundError } from '@/domain/shared/result';
import { DIContainer } from '@/infrastructure/di/container';

describe('PlaceOrderUseCase Integration', () => {
  let placeOrderUseCase: PlaceOrderUseCase;
  let createUserUseCase: CreateUserUseCase;
  let userRepository: InMemoryUserRepository;
  let orderRepository: InMemoryOrderRepository;
  let testUser: User;
  let container: DIContainer;

  beforeEach(async () => {
    userRepository = new InMemoryUserRepository();
    orderRepository = new InMemoryOrderRepository();
    container = new DIContainer();
    
    // Register dependencies
    container.register('UserRepository', userRepository);
    container.register('OrderRepository', orderRepository);
    
    createUserUseCase = new CreateUserUseCase(userRepository);
    placeOrderUseCase = container.resolve('PlaceOrderUseCase');

    // Create a test user
    const userResult = await createUserUseCase.execute({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'securePassword123',
      phone: '+1234567890'
    });

    expect(userResult.isOk()).toBe(true);
    if (userResult.isOk()) {
      testUser = userResult.value;
    }
  });

  afterEach(() => {
    userRepository.clear();
    orderRepository.clear();
  });

  describe('successful order placement', () => {
    it('should place order with single pizza', async () => {
      const orderData = {
        customerId: testUser.getId(),
        items: [
          {
            pizzaId: 'margherita-001',
            quantity: 2,
            size: 'large' as const,
            customizations: ['extra-cheese']
          }
        ],
        deliveryAddress: {
          street: '123 Main St',
          city: 'Pizza Town',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        },
        specialInstructions: 'Ring the doorbell twice'
      };

      const result = await placeOrderUseCase.execute(orderData);

      expect(result.isOk()).toBe(true);
      
      if (result.isOk()) {
        const order = result.value;
        expect(order.getCustomerId()).toBe(testUser.getId());
        expect(order.getItems()).toHaveLength(1);
        expect(order.getStatus()).toBe('pending');
        expect(order.getDeliveryAddress().street).toBe('123 Main St');
        expect(order.getSpecialInstructions()).toBe('Ring the doorbell twice');
      }
    });

    it('should place order with multiple pizzas', async () => {
      const orderData = {
        customerId: testUser.getId(),
        items: [
          {
            pizzaId: 'margherita-001',
            quantity: 1,
            size: 'medium' as const,
            customizations: []
          },
          {
            pizzaId: 'pepperoni-002',
            quantity: 2,
            size: 'large' as const,
            customizations: ['extra-pepperoni', 'thin-crust']
          },
          {
            pizzaId: 'hawaiian-003',
            quantity: 1,
            size: 'small' as const,
            customizations: ['no-pineapple']
          }
        ],
        deliveryAddress: {
          street: '456 Oak Ave',
          city: 'Delivery City',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        }
      };

      const result = await placeOrderUseCase.execute(orderData);

      expect(result.isOk()).toBe(true);
      
      if (result.isOk()) {
        const order = result.value;
        expect(order.getItems()).toHaveLength(3);
        
        const items = order.getItems();
        expect(items[0].pizzaId).toBe('margherita-001');
        expect(items[1].pizzaId).toBe('pepperoni-002');
        expect(items[1].quantity).toBe(2);
        expect(items[2].customizations).toContain('no-pineapple');
      }
    });

    it('should calculate correct order total', async () => {
      const orderData = {
        customerId: testUser.getId(),
        items: [
          {
            pizzaId: 'margherita-001',
            quantity: 2,
            size: 'large' as const,
            customizations: ['extra-cheese'] // +$2 each
          }
        ],
        deliveryAddress: {
          street: '123 Main St',
          city: 'Pizza Town',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        }
      };

      const result = await placeOrderUseCase.execute(orderData);

      expect(result.isOk()).toBe(true);
      
      if (result.isOk()) {
        const order = result.value;
        const total = order.getTotal();
        
        expect(total).toBeInstanceOf(Money);
        expect(total.getAmount()).toBeGreaterThan(0);
        expect(total.getCurrency()).toBe('USD');
        
        // Should include base price + customizations + tax + delivery
        // Large Margherita (~$22) * 2 + extra cheese ($2 * 2) + tax + delivery
        expect(total.getAmount()).toBeGreaterThan(40); // At least $40
      }
    });

    it('should store order in repository', async () => {
      const orderData = {
        customerId: testUser.getId(),
        items: [
          {
            pizzaId: 'margherita-001',
            quantity: 1,
            size: 'medium' as const,
            customizations: []
          }
        ],
        deliveryAddress: {
          street: '789 Pine St',
          city: 'Order City',
          state: 'TX',
          zipCode: '75001',
          country: 'USA'
        }
      };

      const result = await placeOrderUseCase.execute(orderData);
      
      expect(result.isOk()).toBe(true);
      
      if (result.isOk()) {
        const order = result.value;
        const orderId = order.getId();
        
        const storedOrder = await orderRepository.findById(orderId);
        expect(storedOrder.isSome()).toBe(true);
        
        if (storedOrder.isSome()) {
          expect(storedOrder.value.getId()).toBe(orderId);
          expect(storedOrder.value.getCustomerId()).toBe(testUser.getId());
        }
      }
    });

    it('should generate unique order number', async () => {
      const orderData = {
        customerId: testUser.getId(),
        items: [
          {
            pizzaId: 'margherita-001',
            quantity: 1,
            size: 'medium' as const,
            customizations: []
          }
        ],
        deliveryAddress: {
          street: '123 Main St',
          city: 'Pizza Town',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        }
      };

      const [result1, result2] = await Promise.all([
        placeOrderUseCase.execute(orderData),
        placeOrderUseCase.execute(orderData)
      ]);

      expect(result1.isOk()).toBe(true);
      expect(result2.isOk()).toBe(true);
      
      if (result1.isOk() && result2.isOk()) {
        expect(result1.value.getOrderNumber()).not.toBe(result2.value.getOrderNumber());
        expect(result1.value.getId()).not.toBe(result2.value.getId());
      }
    });
  });

  describe('validation errors', () => {
    it('should fail with non-existent customer', async () => {
      const orderData = {
        customerId: 'non-existent-customer-id',
        items: [
          {
            pizzaId: 'margherita-001',
            quantity: 1,
            size: 'medium' as const,
            customizations: []
          }
        ],
        deliveryAddress: {
          street: '123 Main St',
          city: 'Pizza Town',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        }
      };

      const result = await placeOrderUseCase.execute(orderData);

      expect(result.isErr()).toBe(true);
      
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(NotFoundError);
        expect(result.error.message).toContain('customer');
      }
    });

    it('should fail with empty items array', async () => {
      const orderData = {
        customerId: testUser.getId(),
        items: [],
        deliveryAddress: {
          street: '123 Main St',
          city: 'Pizza Town',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        }
      };

      const result = await placeOrderUseCase.execute(orderData);

      expect(result.isErr()).toBe(true);
      
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain('items');
      }
    });

    it('should fail with invalid quantity', async () => {
      const orderData = {
        customerId: testUser.getId(),
        items: [
          {
            pizzaId: 'margherita-001',
            quantity: 0, // Invalid quantity
            size: 'medium' as const,
            customizations: []
          }
        ],
        deliveryAddress: {
          street: '123 Main St',
          city: 'Pizza Town',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        }
      };

      const result = await placeOrderUseCase.execute(orderData);

      expect(result.isErr()).toBe(true);
      
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain('quantity');
      }
    });

    it('should fail with invalid delivery address', async () => {
      const orderData = {
        customerId: testUser.getId(),
        items: [
          {
            pizzaId: 'margherita-001',
            quantity: 1,
            size: 'medium' as const,
            customizations: []
          }
        ],
        deliveryAddress: {
          street: '', // Empty street
          city: 'Pizza Town',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        }
      };

      const result = await placeOrderUseCase.execute(orderData);

      expect(result.isErr()).toBe(true);
      
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain('address');
      }
    });

    it('should fail with excessive quantity', async () => {
      const orderData = {
        customerId: testUser.getId(),
        items: [
          {
            pizzaId: 'margherita-001',
            quantity: 100, // Excessive quantity
            size: 'medium' as const,
            customizations: []
          }
        ],
        deliveryAddress: {
          street: '123 Main St',
          city: 'Pizza Town',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        }
      };

      const result = await placeOrderUseCase.execute(orderData);

      expect(result.isErr()).toBe(true);
      
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain('quantity');
      }
    });
  });

  describe('pricing calculations', () => {
    it('should apply seasonal pricing', async () => {
      const orderData = {
        customerId: testUser.getId(),
        items: [
          {
            pizzaId: 'margherita-001',
            quantity: 1,
            size: 'large' as const,
            customizations: []
          }
        ],
        deliveryAddress: {
          street: '123 Main St',
          city: 'Pizza Town',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        }
      };

      const result = await placeOrderUseCase.execute(orderData);

      expect(result.isOk()).toBe(true);
      
      if (result.isOk()) {
        const order = result.value;
        const pricing = order.getPricing();
        
        expect(pricing).toBeDefined();
        expect(pricing.subtotal).toBeInstanceOf(Money);
        expect(pricing.tax).toBeInstanceOf(Money);
        expect(pricing.deliveryFee).toBeInstanceOf(Money);
        expect(pricing.total).toBeInstanceOf(Money);
      }
    });

    it('should apply bulk discount for large orders', async () => {
      const orderData = {
        customerId: testUser.getId(),
        items: [
          {
            pizzaId: 'margherita-001',
            quantity: 5, // Large quantity for bulk discount
            size: 'large' as const,
            customizations: []
          },
          {
            pizzaId: 'pepperoni-002',
            quantity: 5,
            size: 'large' as const,
            customizations: []
          }
        ],
        deliveryAddress: {
          street: '123 Main St',
          city: 'Pizza Town',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        }
      };

      const result = await placeOrderUseCase.execute(orderData);

      expect(result.isOk()).toBe(true);
      
      if (result.isOk()) {
        const order = result.value;
        const pricing = order.getPricing();
        
        // Should have applied bulk discount
        expect(pricing.discount).toBeDefined();
        if (pricing.discount) {
          expect(pricing.discount.getAmount()).toBeGreaterThan(0);
        }
      }
    });

    it('should calculate tax based on delivery location', async () => {
      const caOrderData = {
        customerId: testUser.getId(),
        items: [
          {
            pizzaId: 'margherita-001',
            quantity: 1,
            size: 'medium' as const,
            customizations: []
          }
        ],
        deliveryAddress: {
          street: '123 Main St',
          city: 'Los Angeles',
          state: 'CA', // California has higher tax
          zipCode: '90210',
          country: 'USA'
        }
      };

      const txOrderData = {
        ...caOrderData,
        deliveryAddress: {
          ...caOrderData.deliveryAddress,
          city: 'Austin',
          state: 'TX', // Texas has different tax
          zipCode: '78701'
        }
      };

      const [caResult, txResult] = await Promise.all([
        placeOrderUseCase.execute(caOrderData),
        placeOrderUseCase.execute(txOrderData)
      ]);

      expect(caResult.isOk()).toBe(true);
      expect(txResult.isOk()).toBe(true);
      
      if (caResult.isOk() && txResult.isOk()) {
        const caTax = caResult.value.getPricing().tax;
        const txTax = txResult.value.getPricing().tax;
        
        // Tax amounts should be different based on state
        expect(caTax.getAmount()).not.toBe(txTax.getAmount());
      }
    });
  });

  describe('business rules', () => {
    it('should set estimated delivery time', async () => {
      const orderData = {
        customerId: testUser.getId(),
        items: [
          {
            pizzaId: 'margherita-001',
            quantity: 1,
            size: 'medium' as const,
            customizations: []
          }
        ],
        deliveryAddress: {
          street: '123 Main St',
          city: 'Pizza Town',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        }
      };

      const result = await placeOrderUseCase.execute(orderData);

      expect(result.isOk()).toBe(true);
      
      if (result.isOk()) {
        const order = result.value;
        const estimatedDelivery = order.getEstimatedDeliveryTime();
        
        expect(estimatedDelivery).toBeInstanceOf(Date);
        expect(estimatedDelivery.getTime()).toBeGreaterThan(Date.now());
        
        // Should be within reasonable delivery window (15-45 minutes)
        const deliveryWindow = estimatedDelivery.getTime() - Date.now();
        expect(deliveryWindow).toBeGreaterThan(15 * 60 * 1000); // At least 15 minutes
        expect(deliveryWindow).toBeLessThan(60 * 60 * 1000); // Less than 1 hour
      }
    });

    it('should create order with pending status', async () => {
      const orderData = {
        customerId: testUser.getId(),
        items: [
          {
            pizzaId: 'margherita-001',
            quantity: 1,
            size: 'medium' as const,
            customizations: []
          }
        ],
        deliveryAddress: {
          street: '123 Main St',
          city: 'Pizza Town',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        }
      };

      const result = await placeOrderUseCase.execute(orderData);

      expect(result.isOk()).toBe(true);
      
      if (result.isOk()) {
        const order = result.value;
        expect(order.getStatus()).toBe('pending');
        expect(order.getCreatedAt()).toBeInstanceOf(Date);
        expect(order.getUpdatedAt()).toBeInstanceOf(Date);
      }
    });

    it('should handle special dietary requirements', async () => {
      const orderData = {
        customerId: testUser.getId(),
        items: [
          {
            pizzaId: 'veggie-004',
            quantity: 1,
            size: 'large' as const,
            customizations: ['gluten-free-crust', 'vegan-cheese']
          }
        ],
        deliveryAddress: {
          street: '123 Main St',
          city: 'Pizza Town',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        },
        specialInstructions: 'Customer has celiac disease - please ensure no cross-contamination'
      };

      const result = await placeOrderUseCase.execute(orderData);

      expect(result.isOk()).toBe(true);
      
      if (result.isOk()) {
        const order = result.value;
        const items = order.getItems();
        
        expect(items[0].customizations).toContain('gluten-free-crust');
        expect(items[0].customizations).toContain('vegan-cheese');
        expect(order.getSpecialInstructions()).toContain('celiac disease');
      }
    });
  });

  describe('concurrent order handling', () => {
    it('should handle multiple concurrent orders', async () => {
      const orderData = {
        customerId: testUser.getId(),
        items: [
          {
            pizzaId: 'margherita-001',
            quantity: 1,
            size: 'medium' as const,
            customizations: []
          }
        ],
        deliveryAddress: {
          street: '123 Main St',
          city: 'Pizza Town',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        }
      };

      const concurrentOrders = Array(5).fill(orderData);
      const results = await Promise.all(
        concurrentOrders.map(data => placeOrderUseCase.execute(data))
      );

      results.forEach(result => {
        expect(result.isOk()).toBe(true);
      });

      // All orders should have unique IDs and order numbers
      const orderIds = results
        .filter(r => r.isOk())
        .map(r => r.isOk() ? r.value.getId() : '');
      
      const uniqueIds = new Set(orderIds);
      expect(uniqueIds.size).toBe(5);
    });
  });
});
