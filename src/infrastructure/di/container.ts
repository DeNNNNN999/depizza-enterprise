import { RegisterUserUseCase } from '@/application/use-cases/auth/register-user';
import { AuthenticateUserUseCase } from '@/application/use-cases/auth/authenticate-user';
import { DrizzleUserRepository, type UserRepository } from '@/infrastructure/database/repositories/user-repository';

// Dependency Injection Container
export class DIContainer {
  private static instance: DIContainer;
  private userRepository: UserRepository;
  private registerUserUseCase: RegisterUserUseCase;
  private authenticateUserUseCase: AuthenticateUserUseCase;

  private constructor() {
    this.initializeDependencies();
  }

  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  private initializeDependencies(): void {
    // Infrastructure layer
    this.userRepository = new DrizzleUserRepository();

    // Application layer - inject dependencies
    this.registerUserUseCase = new RegisterUserUseCase(this.userRepository);
    this.authenticateUserUseCase = new AuthenticateUserUseCase(
      this.userRepository,
      process.env.JWT_SECRET
    );
  }

  getUserRepository(): UserRepository {
    return this.userRepository;
  }

  getRegisterUserUseCase(): RegisterUserUseCase {
    return this.registerUserUseCase;
  }

  getAuthenticateUserUseCase(): AuthenticateUserUseCase {
    return this.authenticateUserUseCase;
  }

  // Factory method for testing with mocks
  static createForTesting(overrides: {
    userRepository?: UserRepository;
    jwtSecret?: string;
  }): DIContainer {
    const container = new DIContainer();
    
    if (overrides.userRepository) {
      container.userRepository = overrides.userRepository;
    }
    
    container.registerUserUseCase = new RegisterUserUseCase(container.userRepository);
    container.authenticateUserUseCase = new AuthenticateUserUseCase(
      container.userRepository,
      overrides.jwtSecret
    );
    
    return container;
  }
}