import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/ui/badge';

describe('Badge Component', () => {
  describe('rendering', () => {
    it('should render badge with text', () => {
      render(<Badge>New</Badge>);
      
      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('should render badge with icons', () => {
      render(
        <Badge>
          🍕 Vegetarian
        </Badge>
      );
      
      expect(screen.getByText('🍕 Vegetarian')).toBeInTheDocument();
    });

    it('should render empty badge', () => {
      render(<Badge data-testid="empty-badge"></Badge>);
      
      expect(screen.getByTestId('empty-badge')).toBeInTheDocument();
    });
  });

  describe('variants', () => {
    it('should apply default variant', () => {
      render(<Badge data-testid="badge">Default</Badge>);
      
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('bg-primary', 'text-primary-foreground');
    });

    it('should apply secondary variant', () => {
      render(<Badge variant="secondary" data-testid="badge">Secondary</Badge>);
      
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('bg-secondary', 'text-secondary-foreground');
    });

    it('should apply destructive variant', () => {
      render(<Badge variant="destructive" data-testid="badge">Error</Badge>);
      
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('bg-destructive', 'text-destructive-foreground');
    });

    it('should apply outline variant', () => {
      render(<Badge variant="outline" data-testid="badge">Outline</Badge>);
      
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('text-foreground');
    });
  });

  describe('styling', () => {
    it('should have default badge classes', () => {
      render(<Badge data-testid="badge">Badge</Badge>);
      
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass(
        'inline-flex',
        'items-center',
        'rounded-full',
        'border',
        'px-2.5',
        'py-0.5',
        'text-xs',
        'font-semibold'
      );
    });

    it('should accept custom className', () => {
      render(<Badge className="custom-class" data-testid="badge">Custom</Badge>);
      
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('custom-class');
      expect(badge).toHaveClass('inline-flex'); // Should keep default classes
    });

    it('should support size variations through custom classes', () => {
      render(<Badge className="px-4 py-2 text-sm" data-testid="large-badge">Large</Badge>);
      
      const badge = screen.getByTestId('large-badge');
      expect(badge).toHaveClass('px-4', 'py-2', 'text-sm');
    });
  });

  describe('pizza-specific use cases', () => {
    it('should render dietary badges', () => {
      const { rerender } = render(<Badge variant="secondary">Vegetarian</Badge>);
      expect(screen.getByText('Vegetarian')).toBeInTheDocument();
      
      rerender(<Badge variant="outline">Vegan</Badge>);
      expect(screen.getByText('Vegan')).toBeInTheDocument();
      
      rerender(<Badge variant="destructive">Spicy</Badge>);
      expect(screen.getByText('Spicy')).toBeInTheDocument();
    });

    it('should render status badges', () => {
      const { rerender } = render(<Badge>New</Badge>);
      expect(screen.getByText('New')).toBeInTheDocument();
      
      rerender(<Badge variant="secondary">Popular</Badge>);
      expect(screen.getByText('Popular')).toBeInTheDocument();
      
      rerender(<Badge variant="outline">Limited Time</Badge>);
      expect(screen.getByText('Limited Time')).toBeInTheDocument();
    });

    it('should render order status badges', () => {
      const { rerender } = render(<Badge>Preparing</Badge>);
      expect(screen.getByText('Preparing')).toBeInTheDocument();
      
      rerender(<Badge variant="secondary">Ready</Badge>);
      expect(screen.getByText('Ready')).toBeInTheDocument();
      
      rerender(<Badge variant="destructive">Cancelled</Badge>);
      expect(screen.getByText('Cancelled')).toBeInTheDocument();
    });

    it('should handle badges with icons and text', () => {
      render(
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          🌿 Organic
        </Badge>
      );
      
      expect(screen.getByText('🌿 Organic')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should support ARIA attributes', () => {
      render(
        <Badge aria-label="Vegetarian option" data-testid="badge">
          🌱
        </Badge>
      );
      
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveAttribute('aria-label', 'Vegetarian option');
    });

    it('should have proper role when interactive', () => {
      render(
        <Badge role="button" tabIndex={0} data-testid="interactive-badge">
          Click me
        </Badge>
      );
      
      const badge = screen.getByTestId('interactive-badge');
      expect(badge).toHaveAttribute('role', 'button');
      expect(badge).toHaveAttribute('tabIndex', '0');
    });

    it('should support screen reader text', () => {
      render(
        <Badge>
          Hot
          <span className="sr-only">spicy level indicator</span>
        </Badge>
      );
      
      expect(screen.getByText('Hot')).toBeInTheDocument();
      expect(screen.getByText('spicy level indicator')).toBeInTheDocument();
    });
  });

  describe('responsive behavior', () => {
    it('should handle different screen sizes', () => {
      render(
        <Badge className="text-xs sm:text-sm" data-testid="responsive-badge">
          Responsive
        </Badge>
      );
      
      const badge = screen.getByTestId('responsive-badge');
      expect(badge).toHaveClass('text-xs', 'sm:text-sm');
    });
  });

  describe('color variations', () => {
    it('should support custom color schemes', () => {
      render(
        <Badge className="bg-orange-100 text-orange-800" data-testid="custom-color">
          Hot & Spicy
        </Badge>
      );
      
      const badge = screen.getByTestId('custom-color');
      expect(badge).toHaveClass('bg-orange-100', 'text-orange-800');
    });

    it('should support dark mode colors', () => {
      render(
        <Badge className="dark:bg-green-900 dark:text-green-100" data-testid="dark-badge">
          Eco-Friendly
        </Badge>
      );
      
      const badge = screen.getByTestId('dark-badge');
      expect(badge).toHaveClass('dark:bg-green-900', 'dark:text-green-100');
    });
  });

  describe('grouped badges', () => {
    it('should render multiple badges together', () => {
      render(
        <div className="flex gap-2">
          <Badge>Vegetarian</Badge>
          <Badge variant="secondary">Gluten Free</Badge>
          <Badge variant="outline">Organic</Badge>
        </div>
      );
      
      expect(screen.getByText('Vegetarian')).toBeInTheDocument();
      expect(screen.getByText('Gluten Free')).toBeInTheDocument();
      expect(screen.getByText('Organic')).toBeInTheDocument();
    });
  });
});
