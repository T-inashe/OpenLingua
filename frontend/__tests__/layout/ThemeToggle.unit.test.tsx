import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ThemeToggle from '../../src/components/layout/ThemeToggle';
import { ThemeProvider } from '../../src/context/ThemeContext';

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Moon: ({ size }: { size?: number }) => 
    <svg data-testid="moon-icon" data-size={size}>Moon</svg>,
  Sun: ({ size }: { size?: number }) => 
    <svg data-testid="sun-icon" data-size={size}>Sun</svg>,
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Wrapper component with theme provider
const ThemeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe('ThemeToggle Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    document.body.classList.remove('theme-light', 'theme-dark');
  });

  describe('Rendering', () => {
    test('renders theme toggle button', () => {
      render(
        <ThemeWrapper>
          <ThemeToggle />
        </ThemeWrapper>
      );
      
      const button = screen.getByRole('button', { name: 'Toggle theme' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('type', 'button');
    });

    test('renders with dark theme by default', () => {
      render(
        <ThemeWrapper>
          <ThemeToggle />
        </ThemeWrapper>
      );
      
      expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
      expect(screen.getByText('Light mode')).toBeInTheDocument();
      expect(screen.queryByTestId('moon-icon')).not.toBeInTheDocument();
    });

    test('displays correct icon size', () => {
      render(
        <ThemeWrapper>
          <ThemeToggle />
        </ThemeWrapper>
      );
      
      const icon = screen.getByTestId('sun-icon');
      expect(icon).toHaveAttribute('data-size', '16');
    });
  });

  describe('Theme Functionality', () => {
    test('toggles from dark to light theme', () => {
      render(
        <ThemeWrapper>
          <ThemeToggle />
        </ThemeWrapper>
      );
      
      const button = screen.getByRole('button', { name: 'Toggle theme' });
      fireEvent.click(button);
      
      expect(screen.getByTestId('moon-icon')).toBeInTheDocument();
      expect(screen.getByText('Dark mode')).toBeInTheDocument();
      expect(screen.queryByTestId('sun-icon')).not.toBeInTheDocument();
    });

    test('toggles from light to dark theme', () => {
      render(
        <ThemeWrapper>
          <ThemeToggle />
        </ThemeWrapper>
      );
      
      const button = screen.getByRole('button', { name: 'Toggle theme' });
      
      // First click: dark to light
      fireEvent.click(button);
      expect(screen.getByTestId('moon-icon')).toBeInTheDocument();
      
      // Second click: light to dark
      fireEvent.click(button);
      expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
      expect(screen.getByText('Light mode')).toBeInTheDocument();
    });

    test('updates localStorage when theme changes', () => {
      render(
        <ThemeWrapper>
          <ThemeToggle />
        </ThemeWrapper>
      );
      
      const button = screen.getByRole('button', { name: 'Toggle theme' });
      fireEvent.click(button);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('openlingua-theme', 'light');
    });

    test('updates document body classes when theme changes', () => {
      render(
        <ThemeWrapper>
          <ThemeToggle />
        </ThemeWrapper>
      );
      
      const button = screen.getByRole('button', { name: 'Toggle theme' });
      fireEvent.click(button);
      
      expect(document.body).toHaveClass('theme-light');
      expect(document.body).not.toHaveClass('theme-dark');
    });
  });

  describe('Styling', () => {
    test('applies dark theme styles correctly', () => {
      render(
        <ThemeWrapper>
          <ThemeToggle />
        </ThemeWrapper>
      );
      
      const button = screen.getByRole('button', { name: 'Toggle theme' });
      expect(button).toHaveClass(
        'flex',
        'items-center',
        'gap-1',
        'px-3',
        'py-2',
        'rounded-full',
        'border',
        'border-white/15',
        'bg-white/10',
        'text-white',
        'text-sm',
        'font-medium',
        'transition-all',
        'duration-200',
        'hover:bg-white/20'
      );
    });

    test('applies light theme styles correctly', () => {
      render(
        <ThemeWrapper>
          <ThemeToggle />
        </ThemeWrapper>
      );
      
      const button = screen.getByRole('button', { name: 'Toggle theme' });
      
      // Toggle to light theme
      fireEvent.click(button);
      
      expect(button).toHaveClass(
        'flex',
        'items-center',
        'gap-1',
        'px-3',
        'py-2',
        'rounded-full',
        'border',
        'border-slate-300',
        'bg-slate-200',
        'text-slate-800',
        'text-sm',
        'font-medium',
        'transition-all',
        'duration-200',
        'hover:bg-slate-300'
      );
    });
  });

  describe('Accessibility', () => {
    test('has proper aria-label', () => {
      render(
        <ThemeWrapper>
          <ThemeToggle />
        </ThemeWrapper>
      );
      
      const button = screen.getByRole('button', { name: 'Toggle theme' });
      expect(button).toHaveAttribute('aria-label', 'Toggle theme');
    });

    test('is keyboard accessible', () => {
      render(
        <ThemeWrapper>
          <ThemeToggle />
        </ThemeWrapper>
      );
      
      const button = screen.getByRole('button', { name: 'Toggle theme' });
      button.focus();
      expect(button).toHaveFocus();
    });

    test('provides descriptive text for screen readers', () => {
      render(
        <ThemeWrapper>
          <ThemeToggle />
        </ThemeWrapper>
      );
      
      expect(screen.getByText('Light mode')).toBeInTheDocument();
      
      // After toggle
      const button = screen.getByRole('button', { name: 'Toggle theme' });
      fireEvent.click(button);
      expect(screen.getByText('Dark mode')).toBeInTheDocument();
    });

    test('button is properly focusable', () => {
      render(
        <ThemeWrapper>
          <ThemeToggle />
        </ThemeWrapper>
      );
      
      const button = screen.getByRole('button', { name: 'Toggle theme' });
      expect(button).not.toHaveAttribute('tabindex', '-1');
    });
  });

  describe('Integration', () => {
    test('renders without errors', () => {
      expect(() => 
        render(
          <ThemeWrapper>
            <ThemeToggle />
          </ThemeWrapper>
        )
      ).not.toThrow();
    });

    test('works with theme context', () => {
      render(
        <ThemeWrapper>
          <ThemeToggle />
        </ThemeWrapper>
      );
      
      // Should render without context errors
      expect(screen.getByRole('button', { name: 'Toggle theme' })).toBeInTheDocument();
    });

    test('throws error when used outside theme provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => render(<ThemeToggle />)).toThrow(
        'useTheme must be used within a ThemeProvider'
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('State Persistence', () => {
    test('reads initial theme from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('light');
      
      render(
        <ThemeWrapper>
          <ThemeToggle />
        </ThemeWrapper>
      );
      
      expect(screen.getByTestId('moon-icon')).toBeInTheDocument();
      expect(screen.getByText('Dark mode')).toBeInTheDocument();
    });

    test('saves theme preference to localStorage', () => {
      render(
        <ThemeWrapper>
          <ThemeToggle />
        </ThemeWrapper>
      );
      
      const button = screen.getByRole('button', { name: 'Toggle theme' });
      fireEvent.click(button);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('openlingua-theme', 'light');
    });

    test('handles invalid localStorage values gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid-theme');
      
      expect(() =>
        render(
          <ThemeWrapper>
            <ThemeToggle />
          </ThemeWrapper>
        )
      ).not.toThrow();
      
      // Should default to dark theme when invalid value
      expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
    });
  });

  describe('System Preference Integration', () => {
    test('respects system dark mode preference when no stored preference', () => {
      (window.matchMedia as jest.Mock).mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      render(
        <ThemeWrapper>
          <ThemeToggle />
        </ThemeWrapper>
      );
      
      expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
    });

    test('respects system light mode preference when no stored preference', () => {
      (window.matchMedia as jest.Mock).mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: light)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      render(
        <ThemeWrapper>
          <ThemeToggle />
        </ThemeWrapper>
      );
      
      expect(screen.getByTestId('moon-icon')).toBeInTheDocument();
    });
  });
});