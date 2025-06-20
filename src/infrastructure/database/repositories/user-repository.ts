import { eq } from 'drizzle-orm';
import { db } from '../connection';
import { users, type User as DBUser, type NewUser } from '../schema';
import { User } from '@/domain/user/user';
import { Result, Ok, Err, NotFoundError } from '@/domain/shared/result';
import type { ID } from '@/domain/shared/types';
import { DomainEventDispatcher } from '@/infrastructure/events/domain-event-dispatcher';

export interface UserRepository {
  findById(id: ID): Promise<Result<User, NotFoundError>>;
  findByEmail(email: string): Promise<Result<User, NotFoundError>>;
  save(user: User): Promise<Result<User, Error>>;
  existsByEmail(email: string): Promise<boolean>;
}

export class DrizzleUserRepository implements UserRepository {
  private eventDispatcher = DomainEventDispatcher.getInstance();
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

      // Dispatch domain events
      const events = user.domainEvents;
      user.clearEvents();
      if (events.length > 0) {
        await this.eventDispatcher.dispatch(events);
      }

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
    return User.reconstitute({
      id: dbUser.id,
      email: dbUser.email,
      passwordHash: dbUser.passwordHash,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      phone: dbUser.phone,
      role: dbUser.role,
      status: dbUser.status,
      emailVerified: dbUser.emailVerified,
      lastLoginAt: dbUser.lastLoginAt || undefined,
      createdAt: dbUser.createdAt,
      updatedAt: dbUser.updatedAt,
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