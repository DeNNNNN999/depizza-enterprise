import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

describe('Card Component', () => {
  describe('rendering', () => {
    it('should render basic card structure', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Title</CardTitle>
            <CardDescription>Test Description</CardDescription>
          </CardHeader>
          <CardContent>Test Content</CardContent>
          <CardFooter>Test Footer</CardFooter>
        </Card>
      );
      
      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
      expect(screen.getByText('Test Footer')).toBeInTheDocument();
    });

    it('should render card without optional sections', () => {
      render(
        <Card>
          <CardContent>Minimal Card</CardContent>
        </Card>
      );
      
      expect(screen.getByText('Minimal Card')).toBeInTheDocument();
    });

    it('should render complex pizza card content', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Margherita Pizza</CardTitle>
            <CardDescription>Fresh mozzarella, basil, san marzano tomatoes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">$18.99</span>
              <span className="text-sm">4.8 ⭐</span>
            </div>
          </CardContent>
        </Card>
      );
      
      expect(screen.getByText('Margherita Pizza')).toBeInTheDocument();
      expect(screen.getByText('Fresh mozzarella, basil, san marzano tomatoes')).toBeInTheDocument();
      expect(screen.getByText('$18.99')).toBeInTheDocument();
      expect(screen.getByText('4.8 ⭐')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('should have default card classes', () => {
      render(<Card data-testid="card">Content</Card>);
      
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('rounded-lg', 'border', 'bg-card', 'text-card-foreground', 'shadow-sm');
    });

    it('should accept custom className', () => {
      render(<Card className="custom-class" data-testid="card">Content</Card>);
      
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('custom-class');
      expect(card).toHaveClass('rounded-lg'); // Should keep default classes
    });

    it('should apply hover effects when specified', () => {
      render(
        <Card className="hover:shadow-lg transition-shadow" data-testid="card">
          Content
        </Card>
      );
      
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('hover:shadow-lg', 'transition-shadow');
    });
  });

  describe('card header', () => {
    it('should render header with proper structure', () => {
      render(
        <Card>
          <CardHeader data-testid="header">
            <CardTitle>Header Title</CardTitle>
          </CardHeader>
        </Card>
      );
      
      const header = screen.getByTestId('header');
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6');
      expect(screen.getByText('Header Title')).toBeInTheDocument();
    });

    it('should render title with proper heading level', () => {
      render(
        <CardTitle>Pizza Title</CardTitle>
      );
      
      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toBeInTheDocument();
      expect(title).toHaveClass('text-2xl', 'font-semibold', 'leading-none', 'tracking-tight');
    });

    it('should render description with proper styling', () => {
      render(
        <CardDescription>Pizza description with details</CardDescription>
      );
      
      const description = screen.getByText('Pizza description with details');
      expect(description).toHaveClass('text-sm', 'text-muted-foreground');
    });
  });

  describe('card content', () => {
    it('should render content with proper padding', () => {
      render(
        <Card>
          <CardContent data-testid="content">
            Main content area
          </CardContent>
        </Card>
      );
      
      const content = screen.getByTestId('content');
      expect(content).toHaveClass('p-6', 'pt-0');
    });

    it('should handle complex content structure', () => {
      render(
        <Card>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>Orders: 47</div>
              <div>Rating: 4.9</div>
            </div>
          </CardContent>
        </Card>
      );
      
      expect(screen.getByText('Orders: 47')).toBeInTheDocument();
      expect(screen.getByText('Rating: 4.9')).toBeInTheDocument();
    });
  });

  describe('card footer', () => {
    it('should render footer with proper styling', () => {
      render(
        <Card>
          <CardFooter data-testid="footer">
            Footer content
          </CardFooter>
        </Card>
      );
      
      const footer = screen.getByTestId('footer');
      expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0');
    });

    it('should handle button groups in footer', () => {
      render(
        <Card>
          <CardFooter>
            <div className="flex gap-2 w-full">
              <button>Add to Cart</button>
              <button>View Details</button>
            </div>
          </CardFooter>
        </Card>
      );
      
      expect(screen.getByRole('button', { name: 'Add to Cart' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'View Details' })).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should support ARIA attributes', () => {
      render(
        <Card aria-label="Pizza card" role="article" data-testid="card">
          <CardContent>Accessible card</CardContent>
        </Card>
      );
      
      const card = screen.getByTestId('card');
      expect(card).toHaveAttribute('aria-label', 'Pizza card');
      expect(card).toHaveAttribute('role', 'article');
    });

    it('should have proper heading hierarchy', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Main Pizza Title</CardTitle>
            <CardDescription>Pizza description</CardDescription>
          </CardHeader>
        </Card>
      );
      
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Main Pizza Title');
    });

    it('should support keyboard navigation when interactive', () => {
      render(
        <Card tabIndex={0} data-testid="interactive-card">
          <CardContent>Interactive card</CardContent>
        </Card>
      );
      
      const card = screen.getByTestId('interactive-card');
      expect(card).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('responsive behavior', () => {
    it('should handle different card widths', () => {
      render(
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card data-testid="responsive-card">
            <CardContent>Responsive card</CardContent>
          </Card>
        </div>
      );
      
      const card = screen.getByTestId('responsive-card');
      expect(card).toBeInTheDocument();
    });
  });

  describe('loading states', () => {
    it('should render loading skeleton', () => {
      render(
        <Card>
          <CardHeader>
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" data-testid="loading-title"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2" data-testid="loading-desc"></div>
            </div>
          </CardHeader>
        </Card>
      );
      
      expect(screen.getByTestId('loading-title')).toBeInTheDocument();
      expect(screen.getByTestId('loading-desc')).toBeInTheDocument();
    });
  });
});
