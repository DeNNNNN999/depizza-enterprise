import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { DIContainer } from '@/infrastructure/di/container';
import { UserRoleSchema } from '@/domain/user/user';

const RegisterRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  role: UserRoleSchema.optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = RegisterRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const container = DIContainer.getInstance();
    const registerUseCase = container.getRegisterUserUseCase();

    const result = await registerUseCase.execute(validationResult.data);

    if (result.isErr()) {
      const error = result.error;
      
      if (error.code === 'ALREADY_EXISTS') {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        );
      }
      
      if (error.code === 'VALIDATION_ERROR') {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Registration failed' },
        { status: 500 }
      );
    }

    const { user } = result.value;

    return NextResponse.json(
      {
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}