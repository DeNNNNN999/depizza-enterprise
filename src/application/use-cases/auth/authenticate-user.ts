import { Result, Ok, Err, NotFoundError, ValidationError } from '@/domain/shared/result';
import { User } from '@/domain/user/user';
import type { UserRepository } from '@/infrastructure/database/repositories/user-repository';
import { SignJWT } from 'jose';

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
  private readonly jwtSecret: Uint8Array;

  constructor(
    private userRepository: UserRepository,
    jwtSecret?: string
  ) {
    const secret = jwtSecret || process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is required');
    }
    this.jwtSecret = new TextEncoder().encode(secret);
  }

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
    const accessToken = await this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);

    return Ok({
      user,
      accessToken,
      refreshToken,
    });
  }

  private async generateAccessToken(user: User): Promise<string> {
    return await new SignJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(this.jwtSecret);
  }

  private async generateRefreshToken(user: User): Promise<string> {
    return await new SignJWT({
      userId: user.id,
      type: 'refresh',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(this.jwtSecret);
  }
}