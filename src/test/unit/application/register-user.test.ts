import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegisterUserUseCase } from '@/application/use-cases/auth/register-user';
import { User } from '@/domain/user/user';
import { Ok, Err, AlreadyExistsError, ValidationError } from '@/domain/shared/result';
import type { UserRepository } from '@/infrastructure/database/repositories/user-repository';

// Mock UserRepository
const mockUserRepository: UserRepository = {
  findById: vi.fn(),
  findByEmail: vi.fn(),
  save: vi.fn(),
  existsByEmail: vi.fn(),
};

describe('RegisterUserUseCase', () => {
  let registerUserUseCase: RegisterUserUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    registerUserUseCase = new RegisterUserUseCase(mockUserRepository);
  });

  const validRequest = {
    email: 'test@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1234567890',
    role: 'CUSTOMER' as const,
  };

  describe('successful registration', () => {
    it('should register user successfully', async () => {
      // Arrange
      vi.mocked(mockUserRepository.existsByEmail).mockResolvedValue(false);
      
      const mockUser = await User.create({
        id: '123e4567-e89b-12d3-a456-426614174000',
        ...validRequest,
      });
      
      if (mockUser.isOk()) {
        vi.mocked(mockUserRepository.save).mockResolvedValue(Ok(mockUser.value));
      }

      // Act
      const result = await registerUserUseCase.execute(validRequest);

      // Assert
      expect(result.isOk()).toBe(true);
      expect(mockUserRepository.existsByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockUserRepository.save).toHaveBeenCalled();
      
      if (result.isOk()) {
        expect(result.value.user.email).toBe('test@example.com');
        expect(result.value.user.firstName).toBe('John');
      }
    });

    it('should normalize email to lowercase', async () => {
      // Arrange
      const requestWithUppercaseEmail = {
        ...validRequest,
        email: 'TEST@EXAMPLE.COM',
      };
      
      vi.mocked(mockUserRepository.existsByEmail).mockResolvedValue(false);
      
      const mockUser = await User.create({
        id: '123e4567-e89b-12d3-a456-426614174000',
        ...requestWithUppercaseEmail,
      });
      
      if (mockUser.isOk()) {
        vi.mocked(mockUserRepository.save).mockResolvedValue(Ok(mockUser.value));
      }

      // Act
      const result = await registerUserUseCase.execute(requestWithUppercaseEmail);

      // Assert
      expect(mockUserRepository.existsByEmail).toHaveBeenCalledWith('TEST@EXAMPLE.COM');
      
      if (result.isOk()) {
        expect(result.value.user.email).toBe('test@example.com');
      }
    });

    it('should set default role to CUSTOMER when not provided', async () => {
      // Arrange
      const requestWithoutRole = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
      };
      
      vi.mocked(mockUserRepository.existsByEmail).mockResolvedValue(false);
      
      const mockUser = await User.create({
        id: '123e4567-e89b-12d3-a456-426614174000',
        ...requestWithoutRole,
      });
      
      if (mockUser.isOk()) {
        vi.mocked(mockUserRepository.save).mockResolvedValue(Ok(mockUser.value));
      }

      // Act
      const result = await registerUserUseCase.execute(requestWithoutRole);

      // Assert
      if (result.isOk()) {
        expect(result.value.user.role).toBe('CUSTOMER');
      }
    });
  });

  describe('validation errors', () => {
    it('should return error when user already exists', async () => {
      // Arrange
      vi.mocked(mockUserRepository.existsByEmail).mockResolvedValue(true);

      // Act
      const result = await registerUserUseCase.execute(validRequest);

      // Assert
      expect(result.isErr()).toBe(true);
      expect(mockUserRepository.save).not.toHaveBeenCalled();
      
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(AlreadyExistsError);
        expect(result.error.message).toContain('already exists');
      }
    });

    it('should return error for invalid email', async () => {
      // Arrange
      const invalidRequest = {
        ...validRequest,
        email: 'invalid-email',
      };
      
      vi.mocked(mockUserRepository.existsByEmail).mockResolvedValue(false);

      // Act
      const result = await registerUserUseCase.execute(invalidRequest);

      // Assert
      expect(result.isErr()).toBe(true);
      expect(mockUserRepository.save).not.toHaveBeenCalled();
      
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain('Invalid email format');
      }
    });

    it('should return error for weak password', async () => {
      // Arrange
      const invalidRequest = {
        ...validRequest,
        password: '123',
      };
      
      vi.mocked(mockUserRepository.existsByEmail).mockResolvedValue(false);

      // Act
      const result = await registerUserUseCase.execute(invalidRequest);

      // Assert
      expect(result.isErr()).toBe(true);
      expect(mockUserRepository.save).not.toHaveBeenCalled();
      
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain('Password must be at least 8 characters');
      }
    });

    it('should return error for empty first name', async () => {
      // Arrange
      const invalidRequest = {
        ...validRequest,
        firstName: '',
      };
      
      vi.mocked(mockUserRepository.existsByEmail).mockResolvedValue(false);

      // Act
      const result = await registerUserUseCase.execute(invalidRequest);

      // Assert
      expect(result.isErr()).toBe(true);
      expect(mockUserRepository.save).not.toHaveBeenCalled();
      
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain('First name is required');
      }
    });

    it('should return error for invalid phone', async () => {
      // Arrange
      const invalidRequest = {
        ...validRequest,
        phone: '123',
      };
      
      vi.mocked(mockUserRepository.existsByEmail).mockResolvedValue(false);

      // Act
      const result = await registerUserUseCase.execute(invalidRequest);

      // Assert
      expect(result.isErr()).toBe(true);
      expect(mockUserRepository.save).not.toHaveBeenCalled();
      
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain('Invalid phone number format');
      }
    });
  });

  describe('repository errors', () => {
    it('should handle repository save error', async () => {
      // Arrange
      vi.mocked(mockUserRepository.existsByEmail).mockResolvedValue(false);
      vi.mocked(mockUserRepository.save).mockResolvedValue(
        Err(new Error('Database connection failed'))
      );

      // Act
      const result = await registerUserUseCase.execute(validRequest);

      // Assert
      expect(result.isErr()).toBe(true);
      
      if (result.isErr()) {
        expect(result.error.message).toBe('Database connection failed');
      }
    });

    it('should handle repository check error', async () => {
      // Arrange
      vi.mocked(mockUserRepository.existsByEmail).mockRejectedValue(
        new Error('Database connection failed')
      );

      // Act & Assert
      await expect(registerUserUseCase.execute(validRequest)).rejects.toThrow(
        'Database connection failed'
      );
    });
  });

  describe('domain events', () => {
    it('should generate user created event', async () => {
      // Arrange
      vi.mocked(mockUserRepository.existsByEmail).mockResolvedValue(false);
      
      let savedUser: User | undefined;
      vi.mocked(mockUserRepository.save).mockImplementation(async (user) => {
        savedUser = user;
        return Ok(user);
      });

      // Act
      const result = await registerUserUseCase.execute(validRequest);

      // Assert
      expect(result.isOk()).toBe(true);
      expect(savedUser).toBeDefined();
      expect(savedUser!.domainEvents.length).toBe(1);
      expect(savedUser!.domainEvents[0].constructor.name).toBe('UserCreatedEvent');
    });
  });
});