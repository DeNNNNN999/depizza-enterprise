import { z } from 'zod';
import { BaseAggregateRoot, ID, DomainEvent } from '../shared/types';
import { ValidationError, Result, Ok, Err } from '../shared/result';
import * as bcrypt from 'bcryptjs';

export const UserRoleSchema = z.enum(['CUSTOMER', 'STAFF', 'MANAGER', 'ADMIN']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserStatusSchema = z.enum(['ACTIVE', 'SUSPENDED', 'DELETED']);
export type UserStatus = z.infer<typeof UserStatusSchema>;

export interface UserProps {
  id: ID;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role?: UserRole;
}

export class UserCreatedEvent implements DomainEvent {
  constructor(
    public readonly eventId: ID,
    public readonly userId: ID,
    public readonly email: string,
    public readonly role: UserRole,
    public readonly occurredOn: Date = new Date(),
    public readonly eventVersion: number = 1
  ) {}
}

export class UserActivatedEvent implements DomainEvent {
  constructor(
    public readonly eventId: ID,
    public readonly userId: ID,
    public readonly occurredOn: Date = new Date(),
    public readonly eventVersion: number = 1
  ) {}
}

export class User extends BaseAggregateRoot {
  private _status: UserStatus = 'ACTIVE';
  private _lastLoginAt?: Date;
  private _emailVerified: boolean = false;

  private constructor(
    id: ID,
    public readonly email: string,
    private _passwordHash: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly phone: string,
    public readonly role: UserRole
  ) {
    super(id);
  }

  static async create(props: UserProps): Promise<Result<User, ValidationError>> {
    const validation = User.validateUserProps(props);
    if (validation.isErr()) {
      return validation;
    }

    const passwordHash = await User.hashPassword(props.password);
    
    const user = new User(
      props.id,
      props.email.toLowerCase().trim(),
      passwordHash,
      props.firstName.trim(),
      props.lastName.trim(),
      props.phone.trim(),
      props.role || 'CUSTOMER'
    );

    user.addDomainEvent(
      new UserCreatedEvent(
        crypto.randomUUID(),
        user.id,
        user.email,
        user.role
      )
    );

    return Ok(user);
  }

  // Factory method for reconstitution from persistence
  static reconstitute(data: {
    id: ID;
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phone: string;
    role: UserRole;
    status: UserStatus;
    emailVerified: boolean;
    lastLoginAt?: Date;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    const user = new User(
      data.id,
      data.email,
      data.passwordHash,
      data.firstName,
      data.lastName,
      data.phone,
      data.role
    );

    // Reconstitute state without validation or events
    user._status = data.status;
    user._emailVerified = data.emailVerified;
    user._lastLoginAt = data.lastLoginAt;
    
    // Set base entity properties
    (user as any).createdAt = data.createdAt;
    (user as any).updatedAt = data.updatedAt;

    return user;
  }

  get status(): UserStatus {
    return this._status;
  }

  get lastLoginAt(): Date | null {
    return this._lastLoginAt || null;
  }

  get emailVerified(): boolean {
    return this._emailVerified;
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  async verifyPassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this._passwordHash);
  }

  async changePassword(newPassword: string): Promise<Result<void, ValidationError>> {
    if (!User.isValidPassword(newPassword)) {
      return Err(new ValidationError('Password must be at least 8 characters long and contain numbers and letters'));
    }

    this._passwordHash = await User.hashPassword(newPassword);
    return Ok(undefined);
  }

  recordLogin(): void {
    this._lastLoginAt = new Date();
  }

  verifyEmail(): void {
    if (!this._emailVerified) {
      this._emailVerified = true;
      this.addDomainEvent(
        new UserActivatedEvent(crypto.randomUUID(), this.id)
      );
    }
  }

  suspend(): Result<void, ValidationError> {
    if (this._status === 'DELETED') {
      return Err(new ValidationError('Cannot suspend deleted user'));
    }

    this._status = 'SUSPENDED';
    return Ok(undefined);
  }

  activate(): Result<void, ValidationError> {
    if (this._status === 'DELETED') {
      return Err(new ValidationError('Cannot activate deleted user'));
    }

    this._status = 'ACTIVE';
    return Ok(undefined);
  }

  delete(): void {
    this._status = 'DELETED';
  }

  isActive(): boolean {
    return this._status === 'ACTIVE';
  }

  hasRole(role: UserRole): boolean {
    return this.role === role;
  }

  hasPermission(permission: Permission): boolean {
    return ROLE_PERMISSIONS[this.role].includes(permission);
  }

  private static validateUserProps(props: UserProps): Result<void, ValidationError> {
    if (!User.isValidEmail(props.email)) {
      return Err(new ValidationError('Invalid email format'));
    }

    if (!User.isValidPassword(props.password)) {
      return Err(new ValidationError('Password must be at least 8 characters long and contain numbers and letters'));
    }

    if (!props.firstName.trim()) {
      return Err(new ValidationError('First name is required'));
    }

    if (!props.lastName.trim()) {
      return Err(new ValidationError('Last name is required'));
    }

    if (!User.isValidPhone(props.phone)) {
      return Err(new ValidationError('Invalid phone number format'));
    }

    return Ok(undefined);
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private static isValidPassword(password: string): boolean {
    return password.length >= 8 && /\d/.test(password) && /[a-zA-Z]/.test(password);
  }

  private static isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,15}$/;
    return phoneRegex.test(phone);
  }

  private static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }
}

// Permission system
export const PermissionSchema = z.enum([
  'READ_MENU',
  'WRITE_MENU',
  'READ_ORDERS',
  'WRITE_ORDERS',
  'MANAGE_ORDERS',
  'READ_USERS',
  'WRITE_USERS',
  'MANAGE_USERS',
  'READ_ANALYTICS',
  'MANAGE_SYSTEM',
]);

export type Permission = z.infer<typeof PermissionSchema>;

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  CUSTOMER: ['READ_MENU'],
  STAFF: [
    'READ_MENU',
    'READ_ORDERS',
    'WRITE_ORDERS',
  ],
  MANAGER: [
    'READ_MENU',
    'WRITE_MENU',
    'READ_ORDERS',
    'WRITE_ORDERS',
    'MANAGE_ORDERS',
    'READ_USERS',
    'READ_ANALYTICS',
  ],
  ADMIN: [
    'READ_MENU',
    'WRITE_MENU',
    'READ_ORDERS',
    'WRITE_ORDERS',
    'MANAGE_ORDERS',
    'READ_USERS',
    'WRITE_USERS',
    'MANAGE_USERS',
    'READ_ANALYTICS',
    'MANAGE_SYSTEM',
  ],
};