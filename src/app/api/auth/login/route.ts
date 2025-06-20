import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AuthenticateUserUseCase } from '@/application/use-cases/auth/authenticate-user';
import { DrizzleUserRepository } from '@/infrastructure/database/repositories/user-repository';

const LoginRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = LoginRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const userRepository = new DrizzleUserRepository();
    const authenticateUseCase = new AuthenticateUserUseCase(userRepository);

    const result = await authenticateUseCase.execute(validationResult.data);

    if (result.isErr()) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 401 }
      );
    }

    const { user, accessToken, refreshToken } = result.value;

    // Set HTTP-only cookies for tokens
    const response = NextResponse.json(
      {
        message: 'Authentication successful',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      },
      { status: 200 }
    );

    // Set secure HTTP-only cookies
    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600, // 1 hour
      path: '/',
    });

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 3600, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}