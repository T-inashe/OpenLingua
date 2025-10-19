import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoaderOverlay from '../../src/components/ui/LoaderOverlay';

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Loader2: ({ size, className }: { size?: number; className?: string }) => 
    <div data-testid="loader-icon" data-size={size} className={className}></div>,
}));

describe('LoaderOverlay Component', () => {
  describe('Rendering', () => {
    test('renders loader overlay', () => {
      const { container } = render(<LoaderOverlay />);
      
      const overlay = container.firstChild as HTMLElement;
      expect(overlay).toHaveClass('fixed');
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    test('renders with custom message', () => {
      const customMessage = 'Please wait...';
      render(<LoaderOverlay message={customMessage} />);
      
      expect(screen.getByText(customMessage)).toBeInTheDocument();
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    test('renders with default message when none provided', () => {
      render(<LoaderOverlay />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    test('renders loader icon with correct size', () => {
      render(<LoaderOverlay />);
      
      const icon = screen.getByTestId('loader-icon');
      expect(icon).toHaveAttribute('data-size', '32');
    });
  });

  describe('Styling Classes', () => {
    test('overlay has correct styling', () => {
      const { container } = render(<LoaderOverlay />);
      const overlay = container.firstChild as HTMLElement;
      
      expect(overlay).toHaveClass('fixed');
      expect(overlay).toHaveClass('inset-0');
      expect(overlay).toHaveClass('z-50');
      expect(overlay).toHaveClass('flex');
      expect(overlay).toHaveClass('items-center');
      expect(overlay).toHaveClass('justify-center');
      expect(overlay).toHaveClass('bg-slate-950/60');
      expect(overlay).toHaveClass('backdrop-blur-sm');
    });

    test('container has correct styling', () => {
      const { container } = render(<LoaderOverlay />);
      const overlay = container.firstChild as HTMLElement;
      const innerContainer = overlay.firstChild as HTMLElement;
      
      expect(innerContainer).toHaveClass('flex');
      expect(innerContainer).toHaveClass('flex-col');
      expect(innerContainer).toHaveClass('items-center');
      expect(innerContainer).toHaveClass('gap-3');
      expect(innerContainer).toHaveClass('bg-white/10');
      expect(innerContainer).toHaveClass('border');
      expect(innerContainer).toHaveClass('border-white/20');
      expect(innerContainer).toHaveClass('rounded-xl');
      expect(innerContainer).toHaveClass('px-6');
      expect(innerContainer).toHaveClass('py-5');
      expect(innerContainer).toHaveClass('text-white');
      expect(innerContainer).toHaveClass('shadow-xl');
    });

    test('icon has correct styling', () => {
      render(<LoaderOverlay />);
      
      const icon = screen.getByTestId('loader-icon');
      expect(icon).toHaveClass('animate-spin');
      expect(icon).toHaveClass('text-cyan-300');
    });

    test('message has correct styling', () => {
      render(<LoaderOverlay />);
      
      const message = screen.getByText('Loading...');
      expect(message).toHaveClass('text-sm');
      expect(message).toHaveClass('font-medium');
      expect(message).toHaveClass('tracking-wide');
      expect(message).toHaveClass('text-white/90');
    });
  });

  describe('Props Handling', () => {
    test('handles custom message prop', () => {
      const testMessage = 'Uploading files...';
      render(<LoaderOverlay message={testMessage} />);
      
      expect(screen.getByText(testMessage)).toBeInTheDocument();
    });

    test('handles empty string message', () => {
      const { container } = render(<LoaderOverlay message="" />);
      
      const messageSpan = container.querySelector('span');
      expect(messageSpan).toHaveTextContent('');
      expect(messageSpan).toBeInTheDocument();
    });

    test('handles undefined message prop', () => {
      render(<LoaderOverlay />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    test('handles null message', () => {
      const { container } = render(<LoaderOverlay message={null as any} />);
      
      const messageSpan = container.querySelector('span');
      // When null is passed, it overrides the default, so we expect empty content
      expect(messageSpan).toHaveTextContent('');
    });

    test('handles very long message', () => {
      const longMessage = 'This is a very long loading message that should still render properly without breaking the layout or causing any issues';
      render(<LoaderOverlay message={longMessage} />);
      
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    test('has correct DOM structure', () => {
      const { container } = render(<LoaderOverlay />);
      
      const overlay = container.firstChild as HTMLElement;
      expect(overlay.tagName).toBe('DIV');
      
      const contentContainer = overlay.firstChild as HTMLElement;
      expect(contentContainer.tagName).toBe('DIV');
      
      const icon = contentContainer.firstChild as HTMLElement;
      const message = contentContainer.lastChild as HTMLElement;
      
      expect(icon).toHaveAttribute('data-testid', 'loader-icon');
      expect(message.tagName).toBe('SPAN');
    });

    test('maintains proper element hierarchy', () => {
      const { container } = render(<LoaderOverlay />);
      
      const overlay = container.firstChild as HTMLElement;
      const contentContainer = overlay.firstChild as HTMLElement;
      const icon = screen.getByTestId('loader-icon');
      const message = screen.getByText('Loading...');
      
      expect(contentContainer).toContainElement(icon);
      expect(contentContainer).toContainElement(message);
    });

    test('overlay covers entire viewport', () => {
      const { container } = render(<LoaderOverlay />);
      const overlay = container.firstChild as HTMLElement;
      
      expect(overlay).toHaveClass('fixed');
      expect(overlay).toHaveClass('inset-0');
    });

    test('has proper z-index for modal behavior', () => {
      const { container } = render(<LoaderOverlay />);
      const overlay = container.firstChild as HTMLElement;
      
      expect(overlay).toHaveClass('z-50');
    });
  });

  describe('Accessibility', () => {
    test('loading message is visible to screen readers', () => {
      render(<LoaderOverlay />);
      
      const message = screen.getByText('Loading...');
      expect(message).toBeVisible();
    });

    test('custom message is visible to screen readers', () => {
      const customMessage = 'Processing your request...';
      render(<LoaderOverlay message={customMessage} />);
      
      const message = screen.getByText(customMessage);
      expect(message).toBeVisible();
    });

    test('loader icon is properly identified', () => {
      render(<LoaderOverlay />);
      
      const icon = screen.getByTestId('loader-icon');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Visual Effects', () => {
    test('has glassmorphism container effect', () => {
      const { container } = render(<LoaderOverlay />);
      const overlay = container.firstChild as HTMLElement;
      const innerContainer = overlay.firstChild as HTMLElement;
      
      expect(innerContainer).toHaveClass('bg-white/10');
      expect(innerContainer).toHaveClass('border');
      expect(innerContainer).toHaveClass('border-white/20');
      expect(innerContainer).toHaveClass('rounded-xl');
      expect(innerContainer).toHaveClass('shadow-xl');
    });

    test('has semi-transparent background', () => {
      const { container } = render(<LoaderOverlay />);
      const overlay = container.firstChild as HTMLElement;
      
      expect(overlay).toHaveClass('bg-slate-950/60');
    });

    test('has backdrop blur effect', () => {
      const { container } = render(<LoaderOverlay />);
      const overlay = container.firstChild as HTMLElement;
      
      expect(overlay).toHaveClass('backdrop-blur-sm');
    });

    test('loader has spinning animation', () => {
      render(<LoaderOverlay />);
      
      const icon = screen.getByTestId('loader-icon');
      expect(icon).toHaveClass('animate-spin');
    });
  });

  describe('Integration', () => {
    test('renders without errors', () => {
      expect(() => render(<LoaderOverlay />)).not.toThrow();
    });

    test('maintains consistent rendering', () => {
      const { container: container1 } = render(<LoaderOverlay />);
      const { container: container2 } = render(<LoaderOverlay />);
      
      expect(container1.innerHTML).toBe(container2.innerHTML);
    });

    test('handles rapid re-renders', () => {
      const { rerender } = render(<LoaderOverlay message="Loading..." />);
      
      rerender(<LoaderOverlay message="Still loading..." />);
      expect(screen.getByText('Still loading...')).toBeInTheDocument();
      
      rerender(<LoaderOverlay message="Almost done..." />);
      expect(screen.getByText('Almost done...')).toBeInTheDocument();
    });
  });
});