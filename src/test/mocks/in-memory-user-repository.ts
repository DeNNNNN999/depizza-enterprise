import { User } from '@/domain/user/user';
import { UserRepository } from '@/domain/user/user-repository';
import { Email } from '@/domain/shared/email';
import { Maybe } from '@/domain/shared/functional';

/**
 * In-memory implementation of UserRepository for testing purposes.
 * Provides a fast, isolated storage mechanism without external dependencies.
 */
export class InMemoryUserRepository implements UserRepository {
  private users: Map<string, User> = new Map();
  private emailIndex: Map<string, string> = new Map(); // email -> userId
  private phoneIndex: Map<string, string> = new Map(); // phone -> userId

  async save(user: User): Promise<void> {
    const userId = user.getId();
    const email = user.getEmail().getValue().toLowerCase();
    const phone = user.getPhone();

    // Update indexes
    this.emailIndex.set(email, userId);
    this.phoneIndex.set(phone, userId);
    
    // Store user
    this.users.set(userId, user);
  }

  async findById(id: string): Promise<Maybe<User>> {
    const user = this.users.get(id);
    return user ? Maybe.some(user) : Maybe.none();
  }

  async findByEmail(email: Email): Promise<Maybe<User>> {
    const normalizedEmail = email.getValue().toLowerCase();
    const userId = this.emailIndex.get(normalizedEmail);
    
    if (!userId) {
      return Maybe.none();
    }
    
    const user = this.users.get(userId);
    return user ? Maybe.some(user) : Maybe.none();
  }

  async findByPhone(phone: string): Promise<Maybe<User>> {
    const userId = this.phoneIndex.get(phone);
    
    if (!userId) {
      return Maybe.none();
    }
    
    const user = this.users.get(userId);
    return user ? Maybe.some(user) : Maybe.none();
  }

  async existsByEmail(email: Email): Promise<boolean> {
    const normalizedEmail = email.getValue().toLowerCase();
    return this.emailIndex.has(normalizedEmail);
  }

  async existsByPhone(phone: string): Promise<boolean> {
    return this.phoneIndex.has(phone);
  }

  async findActiveUsers(): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.isActive());
  }

  async findUsersByRole(role: 'customer' | 'staff' | 'admin'): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.getRole() === role);
  }

  async countUsers(): Promise<number> {
    return this.users.size;
  }

  async countActiveUsers(): Promise<number> {
    return Array.from(this.users.values()).filter(user => user.isActive()).length;
  }

  async delete(id: string): Promise<void> {
    const user = this.users.get(id);
    
    if (user) {
      const email = user.getEmail().getValue().toLowerCase();
      const phone = user.getPhone();
      
      // Remove from indexes
      this.emailIndex.delete(email);
      this.phoneIndex.delete(phone);
      
      // Remove user
      this.users.delete(id);
    }
  }

  /**
   * Test utility methods
   */
  
  /**
   * Clear all stored data. Useful for test cleanup.
   */
  clear(): void {
    this.users.clear();
    this.emailIndex.clear();
    this.phoneIndex.clear();
  }

  /**
   * Get all stored users. Useful for testing.
   */
  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  /**
   * Get user count. Useful for testing.
   */
  size(): number {
    return this.users.size;
  }

  /**
   * Check if a user exists by ID. Useful for testing.
   */
  hasUser(id: string): boolean {
    return this.users.has(id);
  }

  /**
   * Get internal state for debugging. Useful for testing.
   */
  getInternalState(): {
    userCount: number;
    emailIndexSize: number;
    phoneIndexSize: number;
    emails: string[];
    phones: string[];
  } {
    return {
      userCount: this.users.size,
      emailIndexSize: this.emailIndex.size,
      phoneIndexSize: this.phoneIndex.size,
      emails: Array.from(this.emailIndex.keys()),
      phones: Array.from(this.phoneIndex.keys())
    };
  }

  /**
   * Simulate database transaction for testing complex scenarios.
   */
  async transaction<T>(operation: () => Promise<T>): Promise<T> {
    // Save current state
    const userBackup = new Map(this.users);
    const emailBackup = new Map(this.emailIndex);
    const phoneBackup = new Map(this.phoneIndex);

    try {
      return await operation();
    } catch (error) {
      // Rollback on error
      this.users = userBackup;
      this.emailIndex = emailBackup;
      this.phoneIndex = phoneBackup;
      throw error;
    }
  }

  /**
   * Simulate database connection issues for testing error handling.
   */
  private simulateConnectionError = false;

  simulateConnectionFailure(): void {
    this.simulateConnectionError = true;
  }

  restoreConnection(): void {
    this.simulateConnectionError = false;
  }

  private checkConnection(): void {
    if (this.simulateConnectionError) {
      throw new Error('Simulated database connection error');
    }
  }

  /**
   * Override methods to include connection simulation
   */
  async saveWithConnectionCheck(user: User): Promise<void> {
    this.checkConnection();
    return this.save(user);
  }

  async findByIdWithConnectionCheck(id: string): Promise<Maybe<User>> {
    this.checkConnection();
    return this.findById(id);
  }

  /**
   * Seed the repository with test data
   */
  async seed(users: User[]): Promise<void> {
    for (const user of users) {
      await this.save(user);
    }
  }

  /**
   * Create a snapshot of current state for comparison testing
   */
  createSnapshot(): {
    users: Array<{
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      role: string;
      isActive: boolean;
      createdAt: Date;
    }>;
  } {
    return {
      users: Array.from(this.users.values()).map(user => ({
        id: user.getId(),
        firstName: user.getFirstName(),
        lastName: user.getLastName(),
        email: user.getEmail().getValue(),
        phone: user.getPhone(),
        role: user.getRole(),
        isActive: user.isActive(),
        createdAt: user.getCreatedAt()
      }))
    };
  }

  /**
   * Find users created within a date range (useful for testing time-based queries)
   */
  async findUsersCreatedBetween(startDate: Date, endDate: Date): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => {
      const createdAt = user.getCreatedAt();
      return createdAt >= startDate && createdAt <= endDate;
    });
  }

  /**
   * Simulate slow database operations for performance testing
   */
  private simulateDelay = 0;

  setSimulatedDelay(milliseconds: number): void {
    this.simulateDelay = milliseconds;
  }

  private async delay(): Promise<void> {
    if (this.simulateDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.simulateDelay));
    }
  }

  async saveWithDelay(user: User): Promise<void> {
    await this.delay();
    return this.save(user);
  }

  async findByEmailWithDelay(email: Email): Promise<Maybe<User>> {
    await this.delay();
    return this.findByEmail(email);
  }
}
