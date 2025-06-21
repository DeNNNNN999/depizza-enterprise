import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AuthenticateUserUseCase } from '@/application/use-cases/authenticate-user';
import { CreateUserUseCase } from '@/application/use-cases/create-user';
import { InMemoryUserRepository } from '@/test/mocks/in-memory-user-repository';
import { User } from '@/domain/user/user';
import { ValidationError, NotFoundError } from '@/domain/shared/result';

describe('AuthenticateUserUseCase Integration', () => {
  let authenticateUserUseCase: AuthenticateUserUseCase;
  let createUserUseCase: CreateUserUseCase;
  let userRepository: InMemoryUserRepository;

  const testUserData = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: 'securePassword123',
    phone: '+1234567890'
  };

  beforeEach(async () => {
    userRepository = new InMemoryUserRepository();
    authenticateUserUseCase = new AuthenticateUserUseCase(userRepository);
    createUserUseCase = new CreateUserUseCase(userRepository);

    // Create a test user for authentication tests
    await createUserUseCase.execute(testUserData);
  });

  afterEach(() => {
    userRepository.clear();
  });

  describe('successful authentication', () => {
    it('should authenticate user with valid email and password', async () => {
      const result = await authenticateUserUseCase.execute({
        email: testUserData.email,
        password: testUserData.password
      });

      expect(result.isOk()).toBe(true);
      
      if (result.isOk()) {
        const { user, token } = result.value;
        expect(user.getEmail().getValue()).toBe(testUserData.email);
        expect(user.getFirstName()).toBe(testUserData.firstName);
        expect(typeof token).toBe('string');
        expect(token.length).toBeGreaterThan(0);
      }
    });

    it('should authenticate with email case insensitivity', async () => {
      const result = await authenticateUserUseCase.execute({
        email: testUserData.email.toUpperCase(),
        password: testUserData.password
      });

      expect(result.isOk()).toBe(true);
      
      if (result.isOk()) {
        const { user } = result.value;
        expect(user.getEmail().getValue()).toBe(testUserData.email);
      }
    });

    it('should generate valid JWT token', async () => {
      const result = await authenticateUserUseCase.execute({
        email: testUserData.email,
        password: testUserData.password
      });

      expect(result.isOk()).toBe(true);
      
      if (result.isOk()) {
        const { token } = result.value;
        
        // JWT should have 3 parts separated by dots
        const tokenParts = token.split('.');
        expect(tokenParts).toHaveLength(3);
        
        // Each part should be base64 encoded
        tokenParts.forEach(part => {
          expect(part).toMatch(/^[A-Za-z0-9_-]+$/);
        });
      }
    });

    it('should include user information in token payload', async () => {
      const result = await authenticateUserUseCase.execute({
        email: testUserData.email,
        password: testUserData.password
      });

      expect(result.isOk()).toBe(true);
      
      if (result.isOk()) {
        const { token, user } = result.value;
        
        // Decode the token payload (middle part)
        const payload = JSON.parse(
          Buffer.from(token.split('.')[1], 'base64url').toString()
        );
        
        expect(payload.sub).toBe(user.getId());
        expect(payload.email).toBe(user.getEmail().getValue());
        expect(payload.role).toBe(user.getRole());
        expect(payload.iat).toBeDefined();
        expect(payload.exp).toBeDefined();
      }
    });
  });

  describe('authentication failures', () => {
    it('should fail with non-existent email', async () => {
      const result = await authenticateUserUseCase.execute({
        email: 'nonexistent@example.com',
        password: testUserData.password
      });

      expect(result.isErr()).toBe(true);
      
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(NotFoundError);
        expect(result.error.message).toContain('Invalid email or password');
      }
    });

    it('should fail with incorrect password', async () => {
      const result = await authenticateUserUseCase.execute({
        email: testUserData.email,
        password: 'wrongPassword'
      });

      expect(result.isErr()).toBe(true);
      
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(NotFoundError);
        expect(result.error.message).toContain('Invalid email or password');
      }
    });

    it('should fail with invalid email format', async () => {
      const result = await authenticateUserUseCase.execute({
        email: 'invalid-email-format',
        password: testUserData.password
      });

      expect(result.isErr()).toBe(true);
      
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain('email');
      }
    });

    it('should fail with empty password', async () => {
      const result = await authenticateUserUseCase.execute({
        email: testUserData.email,
        password: ''
      });

      expect(result.isErr()).toBe(true);
      
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain('password');
      }
    });

    it('should fail with null/undefined credentials', async () => {
      const results = await Promise.all([
        authenticateUserUseCase.execute({
          email: null as any,
          password: testUserData.password
        }),
        authenticateUserUseCase.execute({
          email: testUserData.email,
          password: null as any
        }),
        authenticateUserUseCase.execute({
          email: undefined as any,
          password: testUserData.password
        })
      ]);

      results.forEach(result => {
        expect(result.isErr()).toBe(true);
        
        if (result.isErr()) {
          expect(result.error).toBeInstanceOf(ValidationError);
        }
      });
    });
  });

  describe('inactive user handling', () => {
    it('should fail to authenticate inactive user', async () => {
      // Create an inactive user
      const inactiveUserData = {
        firstName: 'Inactive',
        lastName: 'User',
        email: 'inactive@example.com',
        password: 'password123',
        phone: '+0987654321'
      };

      const createResult = await createUserUseCase.execute(inactiveUserData);
      expect(createResult.isOk()).toBe(true);

      if (createResult.isOk()) {
        const user = createResult.value;
        user.deactivate();
        await userRepository.save(user);

        const authResult = await authenticateUserUseCase.execute({
          email: inactiveUserData.email,
          password: inactiveUserData.password
        });

        expect(authResult.isErr()).toBe(true);
        
        if (authResult.isErr()) {
          expect(authResult.error).toBeInstanceOf(NotFoundError);
          expect(authResult.error.message).toContain('inactive');
        }
      }
    });
  });

  describe('security considerations', () => {
    it('should not reveal whether email exists or password is wrong', async () => {
      const nonExistentEmailResult = await authenticateUserUseCase.execute({
        email: 'nonexistent@example.com',
        password: 'anyPassword'
      });

      const wrongPasswordResult = await authenticateUserUseCase.execute({
        email: testUserData.email,
        password: 'wrongPassword'
      });

      expect(nonExistentEmailResult.isErr()).toBe(true);
      expect(wrongPasswordResult.isErr()).toBe(true);

      if (nonExistentEmailResult.isErr() && wrongPasswordResult.isErr()) {
        // Both should return the same generic error message
        expect(nonExistentEmailResult.error.message)
          .toBe(wrongPasswordResult.error.message);
      }
    });

    it('should hash passwords consistently', async () => {
      // Create two users with the same password
      const userData1 = {
        firstName: 'User',
        lastName: 'One',
        email: 'user1@example.com',
        password: 'samePassword123',
        phone: '+1111111111'
      };

      const userData2 = {
        firstName: 'User',
        lastName: 'Two',
        email: 'user2@example.com',
        password: 'samePassword123',
        phone: '+2222222222'
      };

      await Promise.all([
        createUserUseCase.execute(userData1),
        createUserUseCase.execute(userData2)
      ]);

      const [auth1, auth2] = await Promise.all([
        authenticateUserUseCase.execute({
          email: userData1.email,
          password: userData1.password
        }),
        authenticateUserUseCase.execute({
          email: userData2.email,
          password: userData2.password
        })
      ]);

      expect(auth1.isOk()).toBe(true);
      expect(auth2.isOk()).toBe(true);

      if (auth1.isOk() && auth2.isOk()) {
        // Tokens should be different even with same password
        expect(auth1.value.token).not.toBe(auth2.value.token);
      }
    });

    it('should generate different tokens for same user on multiple logins', async () => {
      const [result1, result2] = await Promise.all([
        authenticateUserUseCase.execute({
          email: testUserData.email,
          password: testUserData.password
        }),
        authenticateUserUseCase.execute({
          email: testUserData.email,
          password: testUserData.password
        })
      ]);

      expect(result1.isOk()).toBe(true);
      expect(result2.isOk()).toBe(true);

      if (result1.isOk() && result2.isOk()) {
        // Should generate different tokens (due to different timestamps)
        expect(result1.value.token).not.toBe(result2.value.token);
        
        // But same user ID
        expect(result1.value.user.getId()).toBe(result2.value.user.getId());
      }
    });
  });

  describe('token expiration', () => {
    it('should include expiration time in token', async () => {
      const result = await authenticateUserUseCase.execute({
        email: testUserData.email,
        password: testUserData.password
      });

      expect(result.isOk()).toBe(true);
      
      if (result.isOk()) {
        const { token } = result.value;
        
        const payload = JSON.parse(
          Buffer.from(token.split('.')[1], 'base64url').toString()
        );
        
        expect(payload.exp).toBeDefined();
        expect(payload.iat).toBeDefined();
        expect(payload.exp).toBeGreaterThan(payload.iat);
        
        // Token should expire in the future (within reasonable time)
        const now = Math.floor(Date.now() / 1000);
        expect(payload.exp).toBeGreaterThan(now);
        expect(payload.exp).toBeLessThan(now + (24 * 60 * 60)); // Less than 24 hours
      }
    });
  });

  describe('pizza-specific scenarios', () => {
    it('should handle customer authentication for pizza ordering', async () => {
      const result = await authenticateUserUseCase.execute({
        email: testUserData.email,
        password: testUserData.password
      });

      expect(result.isOk()).toBe(true);
      
      if (result.isOk()) {
        const { user, token } = result.value;
        
        expect(user.getRole()).toBe('customer');
        expect(user.isActive()).toBe(true);
        
        // Token should contain customer role for authorization
        const payload = JSON.parse(
          Buffer.from(token.split('.')[1], 'base64url').toString()
        );
        
        expect(payload.role).toBe('customer');
      }
    });

    it('should authenticate staff user with appropriate role', async () => {
      // Create a staff user
      const staffUserData = {
        firstName: 'Pizza',
        lastName: 'Staff',
        email: 'staff@depizza.com',
        password: 'staffPassword123',
        phone: '+1555555555'
      };

      const createResult = await createUserUseCase.execute(staffUserData);
      expect(createResult.isOk()).toBe(true);

      if (createResult.isOk()) {
        const user = createResult.value;
        user.promoteToStaff();
        await userRepository.save(user);

        const authResult = await authenticateUserUseCase.execute({
          email: staffUserData.email,
          password: staffUserData.password
        });

        expect(authResult.isOk()).toBe(true);
        
        if (authResult.isOk()) {
          const { user: authenticatedUser, token } = authResult.value;
          
          expect(authenticatedUser.getRole()).toBe('staff');
          
          const payload = JSON.parse(
            Buffer.from(token.split('.')[1], 'base64url').toString()
          );
          
          expect(payload.role).toBe('staff');
        }
      }
    });
  });
});
