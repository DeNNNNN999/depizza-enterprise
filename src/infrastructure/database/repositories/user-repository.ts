import { eq } from 'drizzle-orm';
import { db } from '../connection';
import { users, type User as DBUser, type NewUser } from '../schema';
import { User } from '@/domain/user/user';
import { Result, Ok, Err, NotFoundError } from '@/domain/shared/result';
import type { ID } from '@/domain/shared/types';

export interface UserRepository {
  findById(id: ID): Promise<Result<User, NotFoundError>>;
  findByEmail(email: string): Promise<Result<User, NotFoundError>>;
  save(user: User): Promise<Result<User, Error>>;
  existsByEmail(email: string): Promise<boolean>;
}

export class DrizzleUserRepository implements UserRepository {
  async findById(id: ID): Promise<Result<User, NotFoundError>> {
    try {
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (!dbUser) {
        return Err(new NotFoundError('User', id));
      }

      return Ok(this.toDomain(dbUser));
    } catch (error) {
      return Err(new NotFoundError('User', id));
    }
  }

  async findByEmail(email: string): Promise<Result<User, NotFoundError>> {
    try {
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);

      if (!dbUser) {
        return Err(new NotFoundError('User'));
      }

      return Ok(this.toDomain(dbUser));
    } catch (error) {
      return Err(new NotFoundError('User'));
    }
  }

  async save(user: User): Promise<Result<User, Error>> {
    try {
      const dbUser = this.fromDomain(user);
      
      const [savedUser] = await db
        .insert(users)
        .values(dbUser)
        .onConflictDoUpdate({
          target: users.id,
          set: {
            firstName: dbUser.firstName,
            lastName: dbUser.lastName,
            phone: dbUser.phone,
            status: dbUser.status,
            emailVerified: dbUser.emailVerified,
            lastLoginAt: dbUser.lastLoginAt,
            updatedAt: new Date(),
          },
        })
        .returning();

      return Ok(this.toDomain(savedUser));
    } catch (error) {
      return Err(error instanceof Error ? error : new Error('Failed to save user'));
    }
  }

  async existsByEmail(email: string): Promise<boolean> {
    try {
      const [result] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);

      return !!result;
    } catch {
      return false;
    }
  }

  private toDomain(dbUser: DBUser): User {
    // This is a simplified mapping - in real implementation,
    // you would need to handle the password hash and other sensitive data properly
    return Object.create(User.prototype, {
      id: { value: dbUser.id },
      email: { value: dbUser.email },
      firstName: { value: dbUser.firstName },
      lastName: { value: dbUser.lastName },
      phone: { value: dbUser.phone },
      role: { value: dbUser.role },
      createdAt: { value: dbUser.createdAt },
      updatedAt: { value: dbUser.updatedAt },
      _status: { value: dbUser.status, writable: true },
      _emailVerified: { value: dbUser.emailVerified, writable: true },
      _lastLoginAt: { value: dbUser.lastLoginAt, writable: true },
      _passwordHash: { value: dbUser.passwordHash, writable: true },
    });
  }

  private fromDomain(user: User): NewUser {
    return {
      id: user.id,
      email: user.email,
      passwordHash: (user as any)._passwordHash,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}