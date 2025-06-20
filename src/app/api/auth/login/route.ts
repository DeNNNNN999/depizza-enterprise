import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { DIContainer } from '@/infrastructure/di/container';

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

    const container = DIContainer.getInstance();
    const authenticateUseCase = container.getAuthenticateUserUseCase();

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