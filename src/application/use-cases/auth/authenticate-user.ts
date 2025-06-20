import { Result, Ok, Err, NotFoundError, ValidationError } from '@/domain/shared/result';
import { User } from '@/domain/user/user';
import type { UserRepository } from '@/infrastructure/database/repositories/user-repository';
import jwt from 'jsonwebtoken';

export interface AuthenticateUserRequest {
  email: string;
  password: string;
}

export interface AuthenticateUserResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export class AuthenticateUserUseCase {
  constructor(
    private userRepository: UserRepository,
    private jwtSecret: string = process.env.JWT_SECRET || 'fallback-secret'
  ) {}

  async execute(request: AuthenticateUserRequest): Promise<Result<AuthenticateUserResponse, NotFoundError | ValidationError | Error>> {
    // Find user by email
    const userResult = await this.userRepository.findByEmail(request.email);
    if (userResult.isErr()) {
      return Err(new ValidationError('Invalid email or password'));
    }

    const user = userResult.value;

    // Check if user is active
    if (!user.isActive()) {
      return Err(new ValidationError('Account is suspended or deleted'));
    }

    // Verify password
    const isPasswordValid = await user.verifyPassword(request.password);
    if (!isPasswordValid) {
      return Err(new ValidationError('Invalid email or password'));
    }

    // Record login
    user.recordLogin();
    await this.userRepository.save(user);

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return Ok({
      user,
      accessToken,
      refreshToken,
    });
  }

  private generateAccessToken(user: User): string {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      this.jwtSecret,
      { expiresIn: '1h' }
    );
  }

  private generateRefreshToken(user: User): string {
    return jwt.sign(
      {
        userId: user.id,
        type: 'refresh',
      },
      this.jwtSecret,
      { expiresIn: '7d' }
    );
  }
}