import type { Meta, StoryObj } from '@storybook/react';
import { fn, userEvent, within, expect } from '@storybook/test';
import React from 'react';
import { Button } from './button';
import { Pizza, Heart, ShoppingCart, Download } from 'lucide-react';

const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile button component with multiple variants, sizes, and states. Built with Radix UI primitives and styled with Tailwind CSS.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      description: 'The visual variant of the button',
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
      description: 'The size of the button',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled',
    },
    asChild: {
      control: 'boolean',
      description: 'Whether to render as a child component',
    },
  },
  args: {
    onClick: fn(),
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic variants
export const Default: Story = {
  args: {
    children: 'Order Pizza',
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Delete Order',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'View Menu',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Save for Later',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Cancel',
  },
};

export const Link: Story = {
  args: {
    variant: 'link',
    children: 'Learn More',
  },
};

// Sizes
export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small Button',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large Button',
  },
};

export const Icon: Story = {
  args: {
    size: 'icon',
    children: <Pizza className="h-4 w-4" />,
  },
};

// States
export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled Button',
  },
};

export const Loading: Story = {
  args: {
    disabled: true,
    children: (
      <>
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
        Processing...
      </>
    ),
  },
};

// With Icons
export const WithIconLeft: Story = {
  args: {
    children: (
      <>
        <ShoppingCart className="mr-2 h-4 w-4" />
        Add to Cart
      </>
    ),
  },
};

export const WithIconRight: Story = {
  args: {
    children: (
      <>
        Download Menu
        <Download className="ml-2 h-4 w-4" />
      </>
    ),
  },
};

export const IconOnly: Story = {
  args: {
    size: 'icon',
    variant: 'outline',
    children: <Heart className="h-4 w-4" />,
    'aria-label': 'Add to favorites',
  },
};

// Interactive Examples
export const InteractiveExample: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-4">
      <h3 className="text-lg font-semibold">Pizza Order Actions</h3>
      <div className="flex gap-2">
        <Button onClick={() => alert('Added to cart!')}>
          <ShoppingCart className="mr-2 h-4 w-4" />
          Add to Cart
        </Button>
        <Button variant="outline" onClick={() => alert('Added to favorites!')}>
          <Heart className="mr-2 h-4 w-4" />
          Favorite
        </Button>
        <Button variant="ghost" onClick={() => alert('Viewing details!')}>
          View Details
        </Button>
      </div>
      
      <h4 className="text-md font-medium mt-4">Order Management</h4>
      <div className="flex gap-2">
        <Button variant="secondary">Edit Order</Button>
        <Button variant="destructive">Cancel Order</Button>
      </div>
    </div>
  ),
};

// Form Examples
export const FormActions: Story = {
  render: () => (
    <div className="w-full max-w-md space-y-4 p-4">
      <h3 className="text-lg font-semibold">Checkout Form</h3>
      <div className="space-y-2">
        <input
          type="email"
          placeholder="Email address"
          className="w-full rounded-md border border-gray-300 px-3 py-2"
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          Complete Order
        </Button>
        <Button type="button" variant="outline">
          Back
        </Button>
      </div>
    </div>
  ),
};

// Responsive Examples
export const ResponsiveButtons: Story = {
  render: () => (
    <div className="space-y-4 p-4">
      <h3 className="text-lg font-semibold">Responsive Design</h3>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <Button className="w-full">Mobile First</Button>
        <Button variant="outline" className="w-full">
          Responsive
        </Button>
        <Button variant="secondary" className="w-full">
          Design
        </Button>
      </div>
    </div>
  ),
};

// Dark Mode Example
export const DarkMode: Story = {
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
  render: () => (
    <div className="dark space-y-4 p-4">
      <h3 className="text-lg font-semibold text-white">Dark Mode Support</h3>
      <div className="flex flex-wrap gap-2">
        <Button>Default</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </div>
    </div>
  ),
};

// Accessibility Example
export const AccessibilityExample: Story = {
  render: () => (
    <div className="space-y-4 p-4">
      <h3 className="text-lg font-semibold">Accessibility Features</h3>
      <div className="space-y-2">
        <Button aria-label="Add pizza to shopping cart" title="Add to cart">
          <ShoppingCart className="h-4 w-4" />
        </Button>
        <Button aria-describedby="help-text">
          Need Help?
        </Button>
        <p id="help-text" className="text-sm text-gray-600">
          This button will open the help dialog
        </p>
        <Button disabled aria-label="Feature coming soon">
          Coming Soon
        </Button>
      </div>
    </div>
  ),
};

// Interactive Tests
export const InteractiveTests: Story = {
  args: {
    children: 'Click Me',
    onClick: fn(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    
    // Test button is rendered
    await expect(button).toBeInTheDocument();
    
    // Test button is clickable
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalled();
  },
};

// Form Interaction Test
export const FormInteraction: Story = {
  render: () => (
    <form>
      <input type="text" placeholder="Enter your name" className="mr-2 p-2 border rounded" />
      <Button type="submit" onClick={fn()}>Submit Form</Button>
    </form>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText('Enter your name');
    const button = canvas.getByRole('button', { name: 'Submit Form' });
    
    // Fill input
    await userEvent.type(input, 'John Doe');
    await expect(input).toHaveValue('John Doe');
    
    // Click submit
    await userEvent.click(button);
  },
};

// Loading State Test
export const LoadingStateTest: Story = {
  args: {
    disabled: true,
    children: (
      <>
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
        Loading...
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    
    // Button should be disabled
    await expect(button).toBeDisabled();
    
    // Should contain loading text
    await expect(button).toHaveTextContent('Loading...');
  },
};

// Keyboard Navigation Test
export const KeyboardNavigation: Story = {
  render: () => (
    <div className="space-x-2">
      <Button>First Button</Button>
      <Button>Second Button</Button>
      <Button>Third Button</Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const firstButton = canvas.getByRole('button', { name: 'First Button' });
    const secondButton = canvas.getByRole('button', { name: 'Second Button' });
    
    // Focus first button
    firstButton.focus();
    await expect(firstButton).toHaveFocus();
    
    // Tab to second button
    await userEvent.tab();
    await expect(secondButton).toHaveFocus();
    
    // Press Enter on focused button
    await userEvent.keyboard('{Enter}');
  },
};

// Pizza Order Flow Test
export const PizzaOrderFlow: Story = {
  render: () => {
    const [cartCount, setCartCount] = React.useState(0);
    const [isLoading, setIsLoading] = React.useState(false);
    
    const addToCart = async () => {
      setIsLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCartCount(prev => prev + 1);
      setIsLoading(false);
    };
    
    return (
      <div className="p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Margherita Pizza</h3>
        <p className="text-2xl font-bold text-red-600 mb-4">$18.99</p>
        <p className="text-sm text-gray-600 mb-4">Cart items: {cartCount}</p>
        <Button 
          onClick={addToCart}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
              Adding to Cart...
            </>
          ) : (
            <>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to Cart
            </>
          )}
        </Button>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const addButton = canvas.getByRole('button');
    const cartCounter = canvas.getByText(/Cart items: \d+/);
    
    // Initial state
    await expect(cartCounter).toHaveTextContent('Cart items: 0');
    await expect(addButton).toHaveTextContent('Add to Cart');
    
    // Click add to cart
    await userEvent.click(addButton);
    
    // Should show loading state
    await expect(addButton).toHaveTextContent('Adding to Cart...');
    await expect(addButton).toBeDisabled();
    
    // Wait for completion (with timeout)
    await canvas.findByText('Add to Cart', {}, { timeout: 2000 });
    
    // Should update cart count
    await expect(cartCounter).toHaveTextContent('Cart items: 1');
    await expect(addButton).not.toBeDisabled();
  },
};