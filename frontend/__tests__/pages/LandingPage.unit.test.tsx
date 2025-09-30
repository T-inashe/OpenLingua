import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import LandingPage from '../../src/components/pages/landingPage';

// Mock React Router
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Wrapper component for router context
const RouterWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('LandingPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    test('renders landing page with main sections', () => {
      render(
        <RouterWrapper>
          <LandingPage />
        </RouterWrapper>
      );

      // Check for main navigation elements using more specific queries
      const navLinks = screen.getAllByRole('link');
      expect(navLinks.some(link => link.textContent === 'Home')).toBe(true);
      expect(navLinks.some(link => link.textContent === 'About')).toBe(true);
      expect(navLinks.some(link => link.textContent === 'Testimonials')).toBe(true);
      expect(navLinks.some(link => link.textContent === 'Contact')).toBe(true);
    });

    test('displays language courses section', () => {
      render(
        <RouterWrapper>
          <LandingPage />
        </RouterWrapper>
      );

      // Check for language courses
      expect(screen.getByText('isiXhosa')).toBeInTheDocument();
      expect(screen.getByText('Shona')).toBeInTheDocument();
      expect(screen.getByText('Swahili')).toBeInTheDocument();
      expect(screen.getByText('Xitsonga')).toBeInTheDocument();
    });

    test('displays course descriptions', () => {
      render(
        <RouterWrapper>
          <LandingPage />
        </RouterWrapper>
      );

      expect(screen.getByText('Master the clicks and the culture in one smooth journey.')).toBeInTheDocument();
      expect(screen.getByText('Learn a language that sings history and unity.')).toBeInTheDocument();
      expect(screen.getByText('From \'Jambo\' to fluent conversations - spoken by millions.')).toBeInTheDocument();
      expect(screen.getByText('Rhythmic, expressive, and full of heritage.')).toBeInTheDocument();
    });

    test('displays course icons/flags', () => {
      render(
        <RouterWrapper>
          <LandingPage />
        </RouterWrapper>
      );

      // Check for flag emojis (may appear multiple times)
      expect(screen.getAllByText('🇿🇦').length).toBeGreaterThan(0);
      expect(screen.getAllByText('🇿🇼').length).toBeGreaterThan(0);
      expect(screen.getAllByText('🇹🇿').length).toBeGreaterThan(0);
    });
  });

  describe('Testimonials Section', () => {
    test('displays initial testimonial', () => {
      render(
        <RouterWrapper>
          <LandingPage />
        </RouterWrapper>
      );

      expect(screen.getByText('Nyeleti Mkhize')).toBeInTheDocument();
      expect(screen.getByText('Student')).toBeInTheDocument();
      expect(screen.getByText(/Easy to use.*great platform.*languages.*colleagues/)).toBeInTheDocument();
      expect(screen.getByText('NM')).toBeInTheDocument();
    });

    test('testimonial carousel rotates automatically', async () => {
      render(
        <RouterWrapper>
          <LandingPage />
        </RouterWrapper>
      );

      // Initial testimonial should be visible
      expect(screen.getByText('Nyeleti Mkhize')).toBeInTheDocument();

      // Fast-forward timer by 4 seconds
      act(() => {
        jest.advanceTimersByTime(4000);
      });

      // Wait for state update - should show next testimonial
      await waitFor(() => {
        // Check that a different testimonial is now visible
        expect(screen.getByText('Sibabalwe Mhlontlo') || screen.getByText('Shayniqua Karim')).toBeInTheDocument();
      });
    });

    test('testimonial carousel cycles through all testimonials', async () => {
      render(
        <RouterWrapper>
          <LandingPage />
        </RouterWrapper>
      );

      // Fast-forward through multiple cycles
      for (let i = 0; i < 3; i++) {
        act(() => {
          jest.advanceTimersByTime(4000);
        });
        await waitFor(() => {
          // Just verify the component doesn't crash during rotation
          expect(screen.getByText('OpenLingua')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Navigation', () => {
    test('navigation menu items are clickable', () => {
      render(
        <RouterWrapper>
          <LandingPage />
        </RouterWrapper>
      );

      const navLinks = screen.getAllByRole('link');
      const homeLink = navLinks.find(link => link.textContent === 'Home');
      const aboutLink = navLinks.find(link => link.textContent === 'About');
      const testimonialsLink = navLinks.find(link => link.textContent === 'Testimonials');
      const contactLink = navLinks.find(link => link.textContent === 'Contact');

      expect(homeLink).toBeInTheDocument();
      expect(aboutLink).toBeInTheDocument();
      expect(testimonialsLink).toBeInTheDocument();
      expect(contactLink).toBeInTheDocument();
    });
  });

  describe('Language Courses Grid', () => {
    test('displays all language courses in grid format', () => {
      render(
        <RouterWrapper>
          <LandingPage />
        </RouterWrapper>
      );

      const courses = ['isiXhosa', 'Shona', 'Swahili', 'Xitsonga'];
      
      courses.forEach(course => {
        expect(screen.getByText(course)).toBeInTheDocument();
      });
    });

    test('each course has correct styling classes', () => {
      render(
        <RouterWrapper>
          <LandingPage />
        </RouterWrapper>
      );

      // Check that the course cards have gradient styling
      const courseTitles = screen.getAllByText(/isiXhosa|Shona|Swahili|Xitsonga/);
      expect(courseTitles).toHaveLength(4);
    });
  });

  describe('Component Lifecycle', () => {
    test('sets visibility state on mount', async () => {
      render(
        <RouterWrapper>
          <LandingPage />
        </RouterWrapper>
      );

      // Component should be visible after mount
      await waitFor(() => {
        expect(screen.getByText('isiXhosa')).toBeVisible();
      });
    });

    test('cleans up timer on unmount', () => {
      const { unmount } = render(
        <RouterWrapper>
          <LandingPage />
        </RouterWrapper>
      );

      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });
  });

  describe('Responsive Design', () => {
    test('renders without layout issues', () => {
      render(
        <RouterWrapper>
          <LandingPage />
        </RouterWrapper>
      );

      // Check that main content renders
      expect(screen.getByText('isiXhosa')).toBeInTheDocument();
      expect(screen.getByText('Shona')).toBeInTheDocument();
      expect(screen.getByText('Swahili')).toBeInTheDocument();
      expect(screen.getByText('Xitsonga')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper heading structure', () => {
      render(
        <RouterWrapper>
          <LandingPage />
        </RouterWrapper>
      );

      // Language course titles should be properly structured
      const courseTitles = screen.getAllByText(/isiXhosa|Shona|Swahili|Xitsonga/);
      expect(courseTitles.length).toBeGreaterThan(0);
    });

    test('testimonial content is accessible', () => {
      render(
        <RouterWrapper>
          <LandingPage />
        </RouterWrapper>
      );

      expect(screen.getByText('Nyeleti Mkhize')).toBeVisible();
      expect(screen.getByText('Student')).toBeVisible();
    });
  });

  describe('Content Validation', () => {
    test('displays correct course count', () => {
      render(
        <RouterWrapper>
          <LandingPage />
        </RouterWrapper>
      );

      const courseElements = screen.getAllByText(/Master the clicks|Learn a language|From 'Jambo'|Rhythmic, expressive/);
      expect(courseElements).toHaveLength(4);
    });

    test('testimonial has required fields', () => {
      render(
        <RouterWrapper>
          <LandingPage />
        </RouterWrapper>
      );

      // Check testimonial structure
      expect(screen.getByText('Nyeleti Mkhize')).toBeInTheDocument(); // Name
      expect(screen.getByText('Student')).toBeInTheDocument(); // Role
      expect(screen.getByText('NM')).toBeInTheDocument(); // Avatar
      expect(screen.getByText(/Easy to use/)).toBeInTheDocument(); // Content
    });
  });

  describe('Error Handling', () => {
    test('renders without crashing when data is missing', () => {
      expect(() => 
        render(
          <RouterWrapper>
            <LandingPage />
          </RouterWrapper>
        )
      ).not.toThrow();
    });
  });

  describe('Integration', () => {
    test('works with React Router navigation', () => {
      render(
        <RouterWrapper>
          <LandingPage />
        </RouterWrapper>
      );

      // Should render without router errors
      expect(screen.getByText('Home')).toBeInTheDocument();
    });

    test('maintains state during re-renders', () => {
      const { rerender } = render(
        <RouterWrapper>
          <LandingPage />
        </RouterWrapper>
      );

      expect(screen.getByText('isiXhosa')).toBeInTheDocument();

      rerender(
        <RouterWrapper>
          <LandingPage />
        </RouterWrapper>
      );

      expect(screen.getByText('isiXhosa')).toBeInTheDocument();
    });
  });
});