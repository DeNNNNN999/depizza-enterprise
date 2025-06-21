import { describe, it, expect, beforeEach } from 'vitest';
import { User } from '@/domain/user/user';
import { ValidationError } from '@/domain/shared/result';

describe('User Domain Model', () => {
  const validUserProps = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1234567890',
    role: 'CUSTOMER' as const,
  };

  describe('User creation', () => {
    it('should create user with valid properties', async () => {
      const result = await User.create(validUserProps);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const user = result.value;
        expect(user.email).toBe('test@example.com');
        expect(user.firstName).toBe('John');
        expect(user.lastName).toBe('Doe');
        expect(user.role).toBe('CUSTOMER');
        expect(user.fullName).toBe('John Doe');
      }
    });

    it('should generate domain events on creation', async () => {
      const result = await User.create(validUserProps);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const user = result.value;
        expect(user.domainEvents.length).toBe(1);
        expect(user.domainEvents[0].constructor.name).toBe('UserCreatedEvent');
      }
    });

    it('should validate email format', async () => {
      const invalidProps = { ...validUserProps, email: 'invalid-email' };
      const result = await User.create(invalidProps);
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain('Invalid email format');
      }
    });

    it('should validate password strength', async () => {
      const invalidProps = { ...validUserProps, password: '123' };
      const result = await User.create(invalidProps);
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain('Password must be at least 8 characters');
      }
    });

    it('should require first name', async () => {
      const invalidProps = { ...validUserProps, firstName: '' };
      const result = await User.create(invalidProps);
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('First name is required');
      }
    });

    it('should validate phone format', async () => {
      const invalidProps = { ...validUserProps, phone: '123' };
      const result = await User.create(invalidProps);
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Invalid phone number format');
      }
    });
  });

  describe('User reconstitution', () => {
    it('should reconstitute user from persistence data', () => {
      const persistenceData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        role: 'CUSTOMER' as const,
        status: 'ACTIVE' as const,
        emailVerified: true,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const user = User.reconstitute(persistenceData);
      
      expect(user.email).toBe('test@example.com');
      expect(user.firstName).toBe('John');
      expect(user.status).toBe('ACTIVE');
      expect(user.emailVerified).toBe(true);
      expect(user.domainEvents.length).toBe(0); // No events on reconstitution
    });
  });

  describe('User operations', () => {
    let user: User;

    beforeEach(async () => {
      const result = await User.create(validUserProps);
      if (result.isOk()) {
        user = result.value;
        user.clearEvents(); // Clear creation events for cleaner tests
      }
    });

    it('should verify correct password', async () => {
      const isValid = await user.verifyPassword('password123');
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const isValid = await user.verifyPassword('wrongpassword');
      expect(isValid).toBe(false);
    });

    it('should change password with valid new password', async () => {
      const result = await user.changePassword('newpassword123');
      
      expect(result.isOk()).toBe(true);
      
      // Verify new password works
      const isValidNew = await user.verifyPassword('newpassword123');
      expect(isValidNew).toBe(true);
      
      // Verify old password no longer works
      const isValidOld = await user.verifyPassword('password123');
      expect(isValidOld).toBe(false);
    });

    it('should reject weak new password', async () => {
      const result = await user.changePassword('123');
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Password must be at least 8 characters');
      }
    });

    it('should record login timestamp', () => {
      const beforeLogin = new Date();
      user.recordLogin();
      const afterLogin = new Date();
      
      expect(user.lastLoginAt).not.toBeNull();
      expect(user.lastLoginAt!.getTime()).toBeGreaterThanOrEqual(beforeLogin.getTime());
      expect(user.lastLoginAt!.getTime()).toBeLessThanOrEqual(afterLogin.getTime());
    });

    it('should verify email and generate event', () => {
      user.verifyEmail();
      
      expect(user.emailVerified).toBe(true);
      expect(user.domainEvents.length).toBe(1);
      expect(user.domainEvents[0].constructor.name).toBe('UserActivatedEvent');
    });

    it('should not generate event if email already verified', () => {
      user.verifyEmail(); // First verification
      user.clearEvents();
      user.verifyEmail(); // Second verification
      
      expect(user.domainEvents.length).toBe(0);
    });

    it('should suspend user', () => {
      const result = user.suspend();
      
      expect(result.isOk()).toBe(true);
      expect(user.status).toBe('SUSPENDED');
      expect(user.isActive()).toBe(false);
    });

    it('should activate suspended user', () => {
      user.suspend();
      const result = user.activate();
      
      expect(result.isOk()).toBe(true);
      expect(user.status).toBe('ACTIVE');
      expect(user.isActive()).toBe(true);
    });

    it('should delete user', () => {
      user.delete();
      
      expect(user.status).toBe('DELETED');
      expect(user.isActive()).toBe(false);
    });

    it('should not allow operations on deleted user', () => {
      user.delete();
      
      const suspendResult = user.suspend();
      const activateResult = user.activate();
      
      expect(suspendResult.isErr()).toBe(true);
      expect(activateResult.isErr()).toBe(true);
    });
  });

  describe('User permissions', () => {
    it('should check user role correctly', async () => {
      const customerResult = await User.create({ ...validUserProps, role: 'CUSTOMER' });
      const adminResult = await User.create({ ...validUserProps, role: 'ADMIN' });
      
      if (customerResult.isOk() && adminResult.isOk()) {
        const customer = customerResult.value;
        const admin = adminResult.value;
        
        expect(customer.hasRole('CUSTOMER')).toBe(true);
        expect(customer.hasRole('ADMIN')).toBe(false);
        expect(admin.hasRole('ADMIN')).toBe(true);
        expect(admin.hasRole('CUSTOMER')).toBe(false);
      }
    });

    it('should check permissions correctly', async () => {
      const customerResult = await User.create({ ...validUserProps, role: 'CUSTOMER' });
      const adminResult = await User.create({ ...validUserProps, role: 'ADMIN' });
      
      if (customerResult.isOk() && adminResult.isOk()) {
        const customer = customerResult.value;
        const admin = adminResult.value;
        
        expect(customer.hasPermission('READ_MENU')).toBe(true);
        expect(customer.hasPermission('MANAGE_SYSTEM')).toBe(false);
        expect(admin.hasPermission('MANAGE_SYSTEM')).toBe(true);
        expect(admin.hasPermission('READ_MENU')).toBe(true);
      }
    });
  });
});