import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret'
);

const publicPaths = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/menu/pizzas',
  '/',
  '/menu',
  '/about',
];

const adminPaths = [
  '/api/admin',
  '/api/menu/pizzas',
];

const protectedPaths = [
  '/api/orders',
  '/api/user',
  '/dashboard',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if path is public
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Get tokens from cookies
  const accessToken = request.cookies.get('accessToken')?.value;
  
  if (!accessToken) {
    return redirectToLogin(request);
  }

  try {
    // Verify JWT token
    const { payload } = await jwtVerify(accessToken, JWT_SECRET) as { payload: JWTPayload };
    
    // Check admin permissions for admin paths
    if (isAdminPath(pathname) && payload.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Add user info to headers for downstream handlers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.userId);
    requestHeaders.set('x-user-email', payload.email);
    requestHeaders.set('x-user-role', payload.role);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error('JWT verification failed:', error);
    
    // Try to refresh token if available
    const refreshToken = request.cookies.get('refreshToken')?.value;
    
    if (refreshToken) {
      try {
        const refreshResponse = await refreshAccessToken(refreshToken);
        if (refreshResponse) {
          const response = NextResponse.next();
          response.cookies.set('accessToken', refreshResponse.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 3600,
            path: '/',
          });
          return response;
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }
    }

    return redirectToLogin(request);
  }
}

function isPublicPath(pathname: string): boolean {
  return publicPaths.some(path => 
    pathname === path || 
    (path.endsWith('*') && pathname.startsWith(path.slice(0, -1)))
  );
}

function isAdminPath(pathname: string): boolean {
  return adminPaths.some(path => pathname.startsWith(path));
}

function isProtectedPath(pathname: string): boolean {
  return protectedPaths.some(path => pathname.startsWith(path));
}

function redirectToLogin(request: NextRequest): NextResponse {
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('from', request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string } | null> {
  try {
    const { payload } = await jwtVerify(refreshToken, JWT_SECRET) as { payload: JWTPayload & { type: string } };
    
    if (payload.type !== 'refresh') {
      return null;
    }

    // Generate new access token
    const newAccessToken = await new jose.SignJWT({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(JWT_SECRET);

    return { accessToken: newAccessToken };
  } catch {
    return null;
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};