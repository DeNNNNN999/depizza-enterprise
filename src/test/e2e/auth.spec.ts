import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.describe('Registration', () => {
    test('should register new user successfully', async ({ page }) => {
      await page.goto('/register');
      
      // Fill registration form
      await page.fill('[name="firstName"]', 'John');
      await page.fill('[name="lastName"]', 'Doe');
      await page.fill('[name="email"]', `test-${Date.now()}@example.com`);
      await page.fill('[name="password"]', 'password123');
      await page.fill('[name="phone"]', '+1234567890');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Should redirect to dashboard or show success message
      await expect(page).toHaveURL(/\/dashboard|\/login/);
    });

    test('should show validation errors for invalid data', async ({ page }) => {
      await page.goto('/register');
      
      // Submit empty form
      await page.click('button[type="submit"]');
      
      // Should show validation errors
      await expect(page.getByText(/required|invalid/i)).toBeVisible();
    });

    test('should show error for existing email', async ({ page }) => {
      await page.goto('/register');
      
      // Use existing email
      await page.fill('[name="firstName"]', 'John');
      await page.fill('[name="lastName"]', 'Doe');
      await page.fill('[name="email"]', 'existing@example.com');
      await page.fill('[name="password"]', 'password123');
      await page.fill('[name="phone"]', '+1234567890');
      
      await page.click('button[type="submit"]');
      
      // Should show error message
      await expect(page.getByText(/already exists|taken/i)).toBeVisible();
    });

    test('should validate password strength', async ({ page }) => {
      await page.goto('/register');
      
      await page.fill('[name="password"]', '123');
      await page.blur('[name="password"]');
      
      // Should show password validation error
      await expect(page.getByText(/at least 8 characters/i)).toBeVisible();
    });

    test('should validate email format', async ({ page }) => {
      await page.goto('/register');
      
      await page.fill('[name="email"]', 'invalid-email');
      await page.blur('[name="email"]');
      
      // Should show email validation error
      await expect(page.getByText(/invalid email/i)).toBeVisible();
    });
  });

  test.describe('Login', () => {
    test('should login with valid credentials', async ({ page }) => {
      await page.goto('/login');
      
      // Fill login form
      await page.fill('[name="email"]', 'test@example.com');
      await page.fill('[name="password"]', 'password123');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Should redirect to dashboard
      await expect(page).toHaveURL('/dashboard');
      
      // Should show user is logged in
      await expect(page.getByText(/welcome|dashboard/i)).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');
      
      // Fill with invalid credentials
      await page.fill('[name="email"]', 'wrong@example.com');
      await page.fill('[name="password"]', 'wrongpassword');
      
      await page.click('button[type="submit"]');
      
      // Should show error message
      await expect(page.getByText(/invalid email or password/i)).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
      await page.goto('/login');
      
      // Submit empty form
      await page.click('button[type="submit"]');
      
      // Should show validation errors
      await expect(page.getByText(/email.*required/i)).toBeVisible();
      await expect(page.getByText(/password.*required/i)).toBeVisible();
    });

    test('should handle "Remember Me" functionality', async ({ page }) => {
      await page.goto('/login');
      
      await page.fill('[name="email"]', 'test@example.com');
      await page.fill('[name="password"]', 'password123');
      await page.check('[name="rememberMe"]');
      
      await page.click('button[type="submit"]');
      
      // Should set longer-lived session
      const cookies = await page.context().cookies();
      const sessionCookie = cookies.find(cookie => cookie.name.includes('session'));
      
      expect(sessionCookie).toBeDefined();
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect to login when accessing protected route', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });

    test('should preserve redirect URL after login', async ({ page }) => {
      // Try to access protected route
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/login/);
      
      // Login
      await page.fill('[name="email"]', 'test@example.com');
      await page.fill('[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Should redirect back to original URL
      await expect(page).toHaveURL('/dashboard');
    });
  });

  test.describe('Session Management', () => {
    test('should logout successfully', async ({ page, context }) => {
      // Login first
      await page.goto('/login');
      await page.fill('[name="email"]', 'test@example.com');
      await page.fill('[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      await expect(page).toHaveURL('/dashboard');
      
      // Logout
      await page.click('[data-testid="user-menu"]');
      await page.click('text=Logout');
      
      // Should redirect to home
      await expect(page).toHaveURL('/');
      
      // Should clear authentication cookies
      const cookies = await context.cookies();
      const authCookies = cookies.filter(cookie => 
        cookie.name.includes('token') || cookie.name.includes('session')
      );
      
      authCookies.forEach(cookie => {
        expect(cookie.value).toBe('');
      });
    });

    test('should handle session expiration', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('[name="email"]', 'test@example.com');
      await page.fill('[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Simulate session expiration by clearing cookies
      await page.context().clearCookies();
      
      // Try to access protected route
      await page.goto('/dashboard');
      
      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });

    test('should refresh token automatically', async ({ page }) => {
      // Login
      await page.goto('/login');
      await page.fill('[name="email"]', 'test@example.com');
      await page.fill('[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Wait for token to be close to expiration (simulated)
      await page.waitForTimeout(1000);
      
      // Make API call that should trigger token refresh
      await page.goto('/dashboard');
      
      // Should still be logged in
      await expect(page).toHaveURL('/dashboard');
    });
  });

  test.describe('Form UX', () => {
    test('should show loading state during submission', async ({ page }) => {
      await page.goto('/login');
      
      await page.fill('[name="email"]', 'test@example.com');
      await page.fill('[name="password"]', 'password123');
      
      // Submit and immediately check for loading state
      await page.click('button[type="submit"]');
      
      // Should show loading indicator
      await expect(page.getByText(/logging in|loading/i)).toBeVisible();
    });

    test('should handle keyboard navigation', async ({ page }) => {
      await page.goto('/login');
      
      // Tab through form fields
      await page.keyboard.press('Tab'); // Email field
      await page.keyboard.type('test@example.com');
      
      await page.keyboard.press('Tab'); // Password field
      await page.keyboard.type('password123');
      
      await page.keyboard.press('Tab'); // Submit button
      await page.keyboard.press('Enter');
      
      // Should submit form
      await expect(page).toHaveURL('/dashboard');
    });

    test('should toggle password visibility', async ({ page }) => {
      await page.goto('/login');
      
      await page.fill('[name="password"]', 'password123');
      
      // Password should be hidden by default
      const passwordInput = page.locator('[name="password"]');
      await expect(passwordInput).toHaveAttribute('type', 'password');
      
      // Click toggle button
      await page.click('[data-testid="toggle-password"]');
      
      // Password should be visible
      await expect(passwordInput).toHaveAttribute('type', 'text');
      
      // Click again to hide
      await page.click('[data-testid="toggle-password"]');
      await expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto('/login');
      
      // Check form has proper labels
      await expect(page.locator('label[for="email"]')).toBeVisible();
      await expect(page.locator('label[for="password"]')).toBeVisible();
      
      // Check error messages have proper ARIA attributes
      await page.click('button[type="submit"]');
      
      const errorMessage = page.getByText(/required/i).first();
      await expect(errorMessage).toHaveAttribute('role', 'alert');
    });

    test('should support screen readers', async ({ page }) => {
      await page.goto('/login');
      
      // Check form has proper structure
      await expect(page.locator('form')).toHaveAttribute('role', 'form');
      
      // Check submit button has proper description
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toHaveAccessibleName(/sign in|login/i);
    });
  });
});