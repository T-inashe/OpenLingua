
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Footer from '../../src/components/layout/Footer';

describe('Footer Component', () => {
  describe('Rendering', () => {
    test('renders footer element', () => {
      render(<Footer />);
      
      const footer = screen.getByRole('contentinfo');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveClass('bg-gray-100', 'text-center', 'py-4', 'mt-6');
    });

    test('displays contact information', () => {
      render(<Footer />);
      
      expect(screen.getByText('(084)-385-0923 | University of the Witwatersrand')).toBeInTheDocument();
    });

    test('has correct structure and styling', () => {
      render(<Footer />);
      
      const footer = screen.getByRole('contentinfo');
      expect(footer.tagName).toBe('FOOTER');
      
      const paragraph = screen.getByText('(084)-385-0923 | University of the Witwatersrand');
      expect(paragraph.tagName).toBe('P');
    });
  });

  describe('Content Validation', () => {
    test('contains phone number', () => {
      render(<Footer />);
      
      expect(screen.getByText(/\(084\)-385-0923/)).toBeInTheDocument();
    });

    test('contains university name', () => {
      render(<Footer />);
      
      expect(screen.getByText(/University of the Witwatersrand/)).toBeInTheDocument();
    });

    test('has proper text separator', () => {
      render(<Footer />);
      
      expect(screen.getByText(/\|/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('footer is accessible with screen readers', () => {
      render(<Footer />);
      
      const footer = screen.getByRole('contentinfo');
      expect(footer).toBeInTheDocument();
    });

    test('text is readable', () => {
      render(<Footer />);
      
      const text = screen.getByText('(084)-385-0923 | University of the Witwatersrand');
      expect(text).toBeVisible();
    });
  });

  describe('Styling', () => {
    test('applies correct CSS classes', () => {
      render(<Footer />);
      
      const footer = screen.getByRole('contentinfo');
      expect(footer).toHaveClass(
        'bg-gray-100',
        'text-center',
        'py-4',
        'mt-6'
      );
    });
  });

  describe('Integration', () => {
    test('renders without errors', () => {
      expect(() => render(<Footer />)).not.toThrow();
    });

    test('maintains consistent output', () => {
      const { container: container1 } = render(<Footer />);
      const { container: container2 } = render(<Footer />);
      
      expect(container1.innerHTML).toBe(container2.innerHTML);
    });
  });
});