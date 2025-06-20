import { Result, Ok, Err, ValidationError, AlreadyExistsError } from '@/domain/shared/result';
import { User, type UserRole } from '@/domain/user/user';
import type { UserRepository } from '@/infrastructure/database/repositories/user-repository';
import type { ID } from '@/domain/shared/types';

export interface RegisterUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role?: UserRole;
}

export interface RegisterUserResponse {
  user: User;
}

export class RegisterUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(request: RegisterUserRequest): Promise<Result<RegisterUserResponse, ValidationError | AlreadyExistsError | Error>> {
    // Check if user already exists
    const existingUser = await this.userRepository.existsByEmail(request.email);
    if (existingUser) {
      return Err(new AlreadyExistsError('User', 'email', request.email));
    }

    // Create domain user
    const userResult = await User.create({
      id: crypto.randomUUID() as ID,
      email: request.email,
      password: request.password,
      firstName: request.firstName,
      lastName: request.lastName,
      phone: request.phone,
      role: request.role,
    });

    if (userResult.isErr()) {
      return Err(userResult.error);
    }

    const user = userResult.value;

    // Save user
    const saveResult = await this.userRepository.save(user);
    if (saveResult.isErr()) {
      return Err(saveResult.error);
    }

    return Ok({ user: saveResult.value });
  }
}