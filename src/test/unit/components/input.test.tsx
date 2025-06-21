import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '@/components/ui/input';
import { forwardRef } from 'react';

// Mock forwardRef for testing
const TestInput = forwardRef<HTMLInputElement, React.ComponentProps<typeof Input>>(
  (props, ref) => <Input {...props} ref={ref} />
);
TestInput.displayName = 'TestInput';

describe('Input Component', () => {
  describe('rendering', () => {
    it('should render input with default type', () => {
      render(<Input placeholder="Enter text" />);
      
      const input = screen.getByPlaceholderText('Enter text');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'text');
    });

    it('should render input with specific type', () => {
      render(<Input type="email" placeholder="Enter email" />);
      
      const input = screen.getByPlaceholderText('Enter email');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('should render password input', () => {
      render(<Input type="password" placeholder="Enter password" />);
      
      const input = screen.getByPlaceholderText('Enter password');
      expect(input).toHaveAttribute('type', 'password');
    });

    it('should render number input', () => {
      render(<Input type="number" placeholder="Enter quantity" />);
      
      const input = screen.getByPlaceholderText('Enter quantity');
      expect(input).toHaveAttribute('type', 'number');
    });
  });

  describe('styling', () => {
    it('should have default input classes', () => {
      render(<Input data-testid="input" />);
      
      const input = screen.getByTestId('input');
      expect(input).toHaveClass(
        'flex',
        'h-10',
        'w-full',
        'rounded-md',
        'border',
        'border-input',
        'bg-background',
        'px-3',
        'py-2',
        'text-sm'
      );
    });

    it('should accept custom className', () => {
      render(<Input className="custom-class" data-testid="input" />);
      
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('custom-class');
      expect(input).toHaveClass('flex'); // Should keep default classes
    });

    it('should have focus and disabled states', () => {
      render(<Input data-testid="input" />);
      
      const input = screen.getByTestId('input');
      expect(input).toHaveClass(
        'focus-visible:outline-none',
        'focus-visible:ring-2',
        'focus-visible:ring-ring',
        'disabled:cursor-not-allowed',
        'disabled:opacity-50'
      );
    });
  });

  describe('interactions', () => {
    it('should handle text input', async () => {
      const user = userEvent.setup();
      render(<Input data-testid="input" />);
      
      const input = screen.getByTestId('input') as HTMLInputElement;
      await user.type(input, 'Hello World');
      
      expect(input.value).toBe('Hello World');
    });

    it('should handle onChange events', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      
      render(<Input onChange={handleChange} data-testid="input" />);
      
      const input = screen.getByTestId('input');
      await user.type(input, 'test');
      
      expect(handleChange).toHaveBeenCalled();
      expect(handleChange).toHaveBeenCalledTimes(4); // One for each character
    });

    it('should handle focus and blur events', async () => {
      const user = userEvent.setup();
      const handleFocus = vi.fn();
      const handleBlur = vi.fn();
      
      render(
        <Input
          onFocus={handleFocus}
          onBlur={handleBlur}
          data-testid="input"
        />
      );
      
      const input = screen.getByTestId('input');
      
      await user.click(input);
      expect(handleFocus).toHaveBeenCalledTimes(1);
      
      await user.tab();
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('should handle keyboard events', () => {
      const handleKeyDown = vi.fn();
      render(<Input onKeyDown={handleKeyDown} data-testid="input" />);
      
      const input = screen.getByTestId('input');
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
      
      expect(handleKeyDown).toHaveBeenCalledTimes(1);
    });
  });

  describe('form integration', () => {
    it('should work with form labels', () => {
      render(
        <div>
          <label htmlFor="email-input">Email Address</label>
          <Input id="email-input" type="email" />
        </div>
      );
      
      const label = screen.getByLabelText('Email Address');
      expect(label).toBeInTheDocument();
      expect(label).toHaveAttribute('type', 'email');
    });

    it('should handle form submission', () => {
      const handleSubmit = vi.fn();
      
      render(
        <form onSubmit={handleSubmit}>
          <Input name="username" defaultValue="testuser" />
          <button type="submit">Submit</button>
        </form>
      );
      
      const submitButton = screen.getByRole('button');
      fireEvent.click(submitButton);
      
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    it('should handle controlled inputs', async () => {
      const user = userEvent.setup();
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        return (
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            data-testid="controlled-input"
          />
        );
      };
      
      render(<TestComponent />);
      
      const input = screen.getByTestId('controlled-input') as HTMLInputElement;
      await user.type(input, 'controlled');
      
      expect(input.value).toBe('controlled');
    });
  });

  describe('validation states', () => {
    it('should handle required attribute', () => {
      render(<Input required data-testid="input" />);
      
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('required');
    });

    it('should handle disabled state', () => {
      render(<Input disabled data-testid="input" />);
      
      const input = screen.getByTestId('input');
      expect(input).toBeDisabled();
    });

    it('should handle readonly state', () => {
      render(<Input readOnly value="read only" data-testid="input" />);
      
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('readonly');
    });

    it('should handle min and max length', () => {
      render(
        <Input
          minLength={3}
          maxLength={10}
          data-testid="input"
        />
      );
      
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('minLength', '3');
      expect(input).toHaveAttribute('maxLength', '10');
    });

    it('should handle pattern validation', () => {
      render(
        <Input
          pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
          placeholder="123-456-7890"
          data-testid="phone-input"
        />
      );
      
      const input = screen.getByTestId('phone-input');
      expect(input).toHaveAttribute('pattern', '[0-9]{3}-[0-9]{3}-[0-9]{4}');
    });
  });

  describe('pizza-specific use cases', () => {
    it('should handle pizza quantity input', () => {
      render(
        <Input
          type="number"
          min="1"
          max="10"
          defaultValue="1"
          placeholder="Quantity"
          data-testid="quantity-input"
        />
      );
      
      const input = screen.getByTestId('quantity-input');
      expect(input).toHaveAttribute('type', 'number');
      expect(input).toHaveAttribute('min', '1');
      expect(input).toHaveAttribute('max', '10');
    });

    it('should handle delivery address input', () => {
      render(
        <Input
          type="text"
          placeholder="Enter delivery address"
          required
          data-testid="address-input"
        />
      );
      
      const input = screen.getByTestId('address-input');
      expect(input).toHaveAttribute('placeholder', 'Enter delivery address');
      expect(input).toHaveAttribute('required');
    });

    it('should handle phone number input', () => {
      render(
        <Input
          type="tel"
          placeholder="(555) 123-4567"
          pattern="\([0-9]{3}\) [0-9]{3}-[0-9]{4}"
          data-testid="phone-input"
        />
      );
      
      const input = screen.getByTestId('phone-input');
      expect(input).toHaveAttribute('type', 'tel');
      expect(input).toHaveAttribute('pattern', '\([0-9]{3}\) [0-9]{3}-[0-9]{4}');
    });

    it('should handle special instructions input', () => {
      render(
        <Input
          placeholder="Special instructions (optional)"
          maxLength={200}
          data-testid="instructions-input"
        />
      );
      
      const input = screen.getByTestId('instructions-input');
      expect(input).toHaveAttribute('maxLength', '200');
    });
  });

  describe('accessibility', () => {
    it('should support ARIA attributes', () => {
      render(
        <Input
          aria-label="Search pizzas"
          aria-describedby="search-help"
          data-testid="input"
        />
      );
      
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('aria-label', 'Search pizzas');
      expect(input).toHaveAttribute('aria-describedby', 'search-help');
    });

    it('should support error states with ARIA', () => {
      render(
        <Input
          aria-invalid="true"
          aria-describedby="error-message"
          data-testid="input"
        />
      );
      
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby', 'error-message');
    });

    it('should have proper focus management', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <Input data-testid="input1" />
          <Input data-testid="input2" />
        </div>
      );
      
      const input1 = screen.getByTestId('input1');
      const input2 = screen.getByTestId('input2');
      
      await user.tab();
      expect(input1).toHaveFocus();
      
      await user.tab();
      expect(input2).toHaveFocus();
    });
  });

  describe('ref forwarding', () => {
    it('should forward ref to input element', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<TestInput ref={ref} />);
      
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });

    it('should allow imperative focus', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<TestInput ref={ref} data-testid="input" />);
      
      ref.current?.focus();
      
      const input = screen.getByTestId('input');
      expect(input).toHaveFocus();
    });
  });
});
