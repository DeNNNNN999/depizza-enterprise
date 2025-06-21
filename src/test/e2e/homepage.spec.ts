import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display main navigation', async ({ page }) => {
    // Check header navigation
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByText('DePizza')).toBeVisible();
    
    // Check navigation links
    await expect(page.getByRole('link', { name: 'Menu' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'About' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Contact' })).toBeVisible();
    
    // Check auth buttons
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign Up' })).toBeVisible();
  });

  test('should display hero section', async ({ page }) => {
    // Check hero content
    await expect(page.getByText('Artisan Pizza, Delivered Fresh')).toBeVisible();
    await expect(page.getByText('Experience premium ingredients, traditional recipes')).toBeVisible();
    
    // Check CTA buttons
    await expect(page.getByRole('link', { name: 'Order Now' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'View Menu' })).toBeVisible();
  });

  test('should display feature highlights', async ({ page }) => {
    // Check features section
    await expect(page.getByText('Fast Delivery')).toBeVisible();
    await expect(page.getByText('Average delivery time of 25 minutes')).toBeVisible();
    
    await expect(page.getByText('Fresh Ingredients')).toBeVisible();
    await expect(page.getByText('Locally sourced, organic ingredients')).toBeVisible();
    
    await expect(page.getByText('5-Star Quality')).toBeVisible();
    await expect(page.getByText('Rated #1 pizza in the city')).toBeVisible();
  });

  test('should display featured pizzas', async ({ page }) => {
    // Check featured pizzas section
    await expect(page.getByText('Featured Pizzas')).toBeVisible();
    await expect(page.getByText('Our most popular artisan creations')).toBeVisible();
    
    // Check pizza cards
    await expect(page.getByText('Margherita Suprema')).toBeVisible();
    await expect(page.getByText('Fresh mozzarella, basil, san marzano tomatoes')).toBeVisible();
    await expect(page.getByText('$18.99')).toBeVisible();
    
    await expect(page.getByText('Truffle Deluxe')).toBeVisible();
    await expect(page.getByText('Pepperoni Classic')).toBeVisible();
    
    // Check "Add to Cart" buttons
    const addToCartButtons = page.getByRole('button', { name: 'Add to Cart' });
    await expect(addToCartButtons).toHaveCount(3);
  });

  test('should display call-to-action section', async ({ page }) => {
    await expect(page.getByText('Ready to Order?')).toBeVisible();
    await expect(page.getByText('Join thousands of satisfied customers')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Browse Full Menu' })).toBeVisible();
  });

  test('should display footer', async ({ page }) => {
    // Check footer content
    await expect(page.getByRole('contentinfo')).toBeVisible();
    await expect(page.getByText('Crafting exceptional pizzas with passion')).toBeVisible();
    
    // Check footer links
    await expect(page.getByText('Quick Links')).toBeVisible();
    await expect(page.getByText('Customer Care')).toBeVisible();
    await expect(page.getByText('Contact Info')).toBeVisible();
    
    // Check contact information
    await expect(page.getByText('(555) 123-PIZZA')).toBeVisible();
    await expect(page.getByText('hello@depizza.com')).toBeVisible();
    
    // Check copyright
    await expect(page.getByText('© 2024 DePizza. All rights reserved')).toBeVisible();
  });

  test('should navigate to menu page', async ({ page }) => {
    await page.getByRole('link', { name: 'Order Now' }).first().click();
    await expect(page).toHaveURL('/menu');
  });

  test('should navigate to login page', async ({ page }) => {
    await page.getByRole('link', { name: 'Login' }).click();
    await expect(page).toHaveURL('/login');
  });

  test('should navigate to signup page', async ({ page }) => {
    await page.getByRole('link', { name: 'Sign Up' }).click();
    await expect(page).toHaveURL('/register');
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that content is still visible on mobile
    await expect(page.getByText('DePizza')).toBeVisible();
    await expect(page.getByText('Artisan Pizza, Delivered Fresh')).toBeVisible();
    await expect(page.getByText('Featured Pizzas')).toBeVisible();
  });

  test('should have proper SEO elements', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/DePizza - Gourmet Pizza Delivery/);
    
    // Check meta description
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /Order delicious artisan pizzas/);
  });

  test('should handle pizza card interactions', async ({ page }) => {
    // Test pizza card hover states and interactions
    const pizzaCard = page.getByText('Margherita Suprema').locator('..');
    
    // Check rating display
    await expect(pizzaCard.getByText('4.8')).toBeVisible();
    
    // Check preparation time
    await expect(pizzaCard.getByText('15 min')).toBeVisible();
    
    // Check vegetarian badge
    await expect(pizzaCard.getByText('Vegetarian')).toBeVisible();
    
    // Test add to cart button
    await pizzaCard.getByRole('button', { name: 'Add to Cart' }).click();
    // Note: This would typically open a modal or navigate to cart
    // For now, we just test that the button is clickable
  });

  test('should load performance assets efficiently', async ({ page }) => {
    // Test that critical resources load quickly
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Should load within reasonable time (adjust based on requirements)
    expect(loadTime).toBeLessThan(5000);
  });

  test('should display proper loading states', async ({ page }) => {
    // Test loading behavior
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Check that main content appears
    await expect(page.getByText('DePizza')).toBeVisible();
    
    // Wait for full load
    await page.waitForLoadState('networkidle');
    
    // Check that all sections are loaded
    await expect(page.getByText('Featured Pizzas')).toBeVisible();
  });
});