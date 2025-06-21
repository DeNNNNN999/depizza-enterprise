import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CreateUserUseCase } from '@/application/use-cases/create-user';
import { InMemoryUserRepository } from '@/test/mocks/in-memory-user-repository';
import { User } from '@/domain/user/user';
import { Email } from '@/domain/shared/email';
import { ValidationError, ConflictError } from '@/domain/shared/result';

describe('CreateUserUseCase Integration', () => {
  let createUserUseCase: CreateUserUseCase;
  let userRepository: InMemoryUserRepository;

  beforeEach(() => {
    userRepository = new InMemoryUserRepository();
    createUserUseCase = new CreateUserUseCase(userRepository);
  });

  afterEach(() => {
    userRepository.clear();
  });

  describe('successful user creation', () => {
    it('should create a new user with valid data', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'securePassword123',
        phone: '+1234567890'
      };

      const result = await createUserUseCase.execute(userData);

      expect(result.isOk()).toBe(true);
      
      if (result.isOk()) {
        const user = result.value;
        expect(user.getFirstName()).toBe('John');
        expect(user.getLastName()).toBe('Doe');
        expect(user.getEmail().getValue()).toBe('john.doe@example.com');
        expect(user.getPhone()).toBe('+1234567890');
        expect(user.getRole()).toBe('customer');
        expect(user.isActive()).toBe(true);
      }
    });

    it('should store user in repository', async () => {
      const userData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        password: 'anotherPassword456',
        phone: '+0987654321'
      };

      const result = await createUserUseCase.execute(userData);
      
      expect(result.isOk()).toBe(true);
      
      if (result.isOk()) {
        const userId = result.value.getId();
        const storedUser = await userRepository.findById(userId);
        
        expect(storedUser.isSome()).toBe(true);
        
        if (storedUser.isSome()) {
          expect(storedUser.value.getEmail().getValue()).toBe('jane.smith@example.com');
        }
      }
    });

    it('should hash password before storage', async () => {
      const userData = {
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice.johnson@example.com',
        password: 'plainTextPassword',
        phone: '+1122334455'
      };

      const result = await createUserUseCase.execute(userData);
      
      expect(result.isOk()).toBe(true);
      
      if (result.isOk()) {
        const user = result.value;
        const isPasswordValid = await user.validatePassword('plainTextPassword');
        const isWrongPasswordInvalid = await user.validatePassword('wrongPassword');
        
        expect(isPasswordValid).toBe(true);
        expect(isWrongPasswordInvalid).toBe(false);
      }
    });
  });

  describe('validation errors', () => {
    it('should fail with invalid email', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
        password: 'securePassword123',
        phone: '+1234567890'
      };

      const result = await createUserUseCase.execute(userData);

      expect(result.isErr()).toBe(true);
      
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain('email');
      }
    });

    it('should fail with weak password', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: '123', // Too short
        phone: '+1234567890'
      };

      const result = await createUserUseCase.execute(userData);

      expect(result.isErr()).toBe(true);
      
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain('password');
      }
    });

    it('should fail with empty first name', async () => {
      const userData = {
        firstName: '',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'securePassword123',
        phone: '+1234567890'
      };

      const result = await createUserUseCase.execute(userData);

      expect(result.isErr()).toBe(true);
      
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain('firstName');
      }
    });

    it('should fail with invalid phone number', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'securePassword123',
        phone: 'invalid-phone'
      };

      const result = await createUserUseCase.execute(userData);

      expect(result.isErr()).toBe(true);
      
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain('phone');
      }
    });
  });

  describe('conflict errors', () => {
    it('should fail when email already exists', async () => {
      const email = 'duplicate@example.com';
      
      // Create first user
      const firstUserData = {
        firstName: 'First',
        lastName: 'User',
        email,
        password: 'password123',
        phone: '+1111111111'
      };

      const firstResult = await createUserUseCase.execute(firstUserData);
      expect(firstResult.isOk()).toBe(true);

      // Try to create second user with same email
      const secondUserData = {
        firstName: 'Second',
        lastName: 'User',
        email, // Same email
        password: 'password456',
        phone: '+2222222222'
      };

      const secondResult = await createUserUseCase.execute(secondUserData);
      
      expect(secondResult.isErr()).toBe(true);
      
      if (secondResult.isErr()) {
        expect(secondResult.error).toBeInstanceOf(ConflictError);
        expect(secondResult.error.message).toContain('email');
      }
    });

    it('should fail when phone already exists', async () => {
      const phone = '+1234567890';
      
      // Create first user
      const firstUserData = {
        firstName: 'First',
        lastName: 'User',
        email: 'first@example.com',
        password: 'password123',
        phone
      };

      const firstResult = await createUserUseCase.execute(firstUserData);
      expect(firstResult.isOk()).toBe(true);

      // Try to create second user with same phone
      const secondUserData = {
        firstName: 'Second',
        lastName: 'User',
        email: 'second@example.com',
        password: 'password456',
        phone // Same phone
      };

      const secondResult = await createUserUseCase.execute(secondUserData);
      
      expect(secondResult.isErr()).toBe(true);
      
      if (secondResult.isErr()) {
        expect(secondResult.error).toBeInstanceOf(ConflictError);
        expect(secondResult.error.message).toContain('phone');
      }
    });
  });

  describe('edge cases', () => {
    it('should handle email case insensitivity', async () => {
      const userData1 = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'JOHN.DOE@EXAMPLE.COM',
        password: 'password123',
        phone: '+1111111111'
      };

      const userData2 = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'john.doe@example.com', // Same email, different case
        password: 'password456',
        phone: '+2222222222'
      };

      const result1 = await createUserUseCase.execute(userData1);
      expect(result1.isOk()).toBe(true);

      const result2 = await createUserUseCase.execute(userData2);
      expect(result2.isErr()).toBe(true);
      
      if (result2.isErr()) {
        expect(result2.error).toBeInstanceOf(ConflictError);
      }
    });

    it('should handle special characters in names', async () => {
      const userData = {
        firstName: 'José',
        lastName: 'García-López',
        email: 'jose.garcia@example.com',
        password: 'securePassword123',
        phone: '+1234567890'
      };

      const result = await createUserUseCase.execute(userData);

      expect(result.isOk()).toBe(true);
      
      if (result.isOk()) {
        const user = result.value;
        expect(user.getFirstName()).toBe('José');
        expect(user.getLastName()).toBe('García-López');
      }
    });

    it('should handle international phone numbers', async () => {
      const testCases = [
        { phone: '+44 20 7946 0958', country: 'UK' },
        { phone: '+33 1 42 86 83 26', country: 'France' },
        { phone: '+49 30 12345678', country: 'Germany' },
        { phone: '+81 3 1234 5678', country: 'Japan' }
      ];

      for (const { phone, country } of testCases) {
        const userData = {
          firstName: 'Test',
          lastName: country,
          email: `test.${country.toLowerCase()}@example.com`,
          password: 'password123',
          phone
        };

        const result = await createUserUseCase.execute(userData);
        
        expect(result.isOk()).toBe(true);
        
        if (result.isOk()) {
          expect(result.value.getPhone()).toBe(phone);
        }
      }
    });
  });

  describe('business rules', () => {
    it('should create user with customer role by default', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'securePassword123',
        phone: '+1234567890'
      };

      const result = await createUserUseCase.execute(userData);

      expect(result.isOk()).toBe(true);
      
      if (result.isOk()) {
        expect(result.value.getRole()).toBe('customer');
      }
    });

    it('should create active user by default', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'securePassword123',
        phone: '+1234567890'
      };

      const result = await createUserUseCase.execute(userData);

      expect(result.isOk()).toBe(true);
      
      if (result.isOk()) {
        expect(result.value.isActive()).toBe(true);
      }
    });

    it('should generate unique user ID', async () => {
      const userData1 = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        phone: '+1111111111'
      };

      const userData2 = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        password: 'password456',
        phone: '+2222222222'
      };

      const result1 = await createUserUseCase.execute(userData1);
      const result2 = await createUserUseCase.execute(userData2);

      expect(result1.isOk()).toBe(true);
      expect(result2.isOk()).toBe(true);
      
      if (result1.isOk() && result2.isOk()) {
        expect(result1.value.getId()).not.toBe(result2.value.getId());
      }
    });

    it('should set creation timestamp', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'securePassword123',
        phone: '+1234567890'
      };

      const beforeCreation = new Date();
      const result = await createUserUseCase.execute(userData);
      const afterCreation = new Date();

      expect(result.isOk()).toBe(true);
      
      if (result.isOk()) {
        const createdAt = result.value.getCreatedAt();
        expect(createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
        expect(createdAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
      }
    });
  });
});
