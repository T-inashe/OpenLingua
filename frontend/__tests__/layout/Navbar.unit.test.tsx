import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Navbar from '../../src/components/layout/Navbar';

// Wrapper component for router context
const RouterWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Navbar Component', () => {
  describe('Rendering', () => {
    test('renders navbar element', () => {
      render(
        <RouterWrapper>
          <Navbar />
        </RouterWrapper>
      );
      
      const navbar = screen.getByRole('navigation');
      expect(navbar).toBeInTheDocument();
      expect(navbar).toHaveClass('bg-blue-600', 'text-white', 'px-6', 'py-4', 'flex', 'justify-between', 'items-center');
    });

    test('renders brand/logo', () => {
      render(
        <RouterWrapper>
          <Navbar />
        </RouterWrapper>
      );
      
      const brand = screen.getByRole('heading', { level: 1 });
      expect(brand).toBeInTheDocument();
      expect(brand).toHaveTextContent('OpenLingua');
      expect(brand).toHaveClass('text-xl', 'font-bold');
    });

    test('renders navigation menu', () => {
      render(
        <RouterWrapper>
          <Navbar />
        </RouterWrapper>
      );
      
      const navList = screen.getByRole('list');
      expect(navList).toBeInTheDocument();
      expect(navList).toHaveClass('flex', 'space-x-6');
    });

    test('renders all navigation links', () => {
      render(
        <RouterWrapper>
          <Navbar />
        </RouterWrapper>
      );
      
      expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'About Us' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Testimonials' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Sign In' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Register' })).toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    test('Home link has correct href', () => {
      render(
        <RouterWrapper>
          <Navbar />
        </RouterWrapper>
      );
      
      const homeLink = screen.getByRole('link', { name: 'Home' });
      expect(homeLink).toHaveAttribute('href', '/');
    });

    test('About Us link has correct href', () => {
      render(
        <RouterWrapper>
          <Navbar />
        </RouterWrapper>
      );
      
      const aboutLink = screen.getByRole('link', { name: 'About Us' });
      expect(aboutLink).toHaveAttribute('href', '/about');
    });

    test('Testimonials link has correct href', () => {
      render(
        <RouterWrapper>
          <Navbar />
        </RouterWrapper>
      );
      
      const testimonialsLink = screen.getByRole('link', { name: 'Testimonials' });
      expect(testimonialsLink).toHaveAttribute('href', '/testimonials');
    });

    test('Sign In link has correct href', () => {
      render(
        <RouterWrapper>
          <Navbar />
        </RouterWrapper>
      );
      
      const signInLink = screen.getByRole('link', { name: 'Sign In' });
      expect(signInLink).toHaveAttribute('href', '/signin');
    });

    test('Register link has correct href', () => {
      render(
        <RouterWrapper>
          <Navbar />
        </RouterWrapper>
      );
      
      const registerLink = screen.getByRole('link', { name: 'Register' });
      expect(registerLink).toHaveAttribute('href', '/register');
    });
  });

  describe('Structure and Layout', () => {
    test('has correct number of navigation items', () => {
      render(
        <RouterWrapper>
          <Navbar />
        </RouterWrapper>
      );
      
      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(5);
    });

    test('maintains proper navbar structure', () => {
      render(
        <RouterWrapper>
          <Navbar />
        </RouterWrapper>
      );
      
      const navbar = screen.getByRole('navigation');
      const heading = screen.getByRole('heading', { level: 1 });
      const navList = screen.getByRole('list');
      
      expect(navbar).toContainElement(heading);
      expect(navbar).toContainElement(navList);
    });
  });

  describe('Accessibility', () => {
    test('navbar has proper semantic structure', () => {
      render(
        <RouterWrapper>
          <Navbar />
        </RouterWrapper>
      );
      
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByRole('list')).toBeInTheDocument();
      expect(screen.getAllByRole('listitem')).toHaveLength(5);
    });

    test('all links are accessible', () => {
      render(
        <RouterWrapper>
          <Navbar />
        </RouterWrapper>
      );
      
      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(5);
      
      links.forEach(link => {
        expect(link).toBeVisible();
        expect(link).toHaveAttribute('href');
      });
    });

    test('brand heading is accessible', () => {
      render(
        <RouterWrapper>
          <Navbar />
        </RouterWrapper>
      );
      
      const heading = screen.getByRole('heading', { level: 1, name: 'OpenLingua' });
      expect(heading).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    test('applies correct navbar styling', () => {
      render(
        <RouterWrapper>
          <Navbar />
        </RouterWrapper>
      );
      
      const navbar = screen.getByRole('navigation');
      expect(navbar).toHaveClass(
        'bg-blue-600',
        'text-white',
        'px-6',
        'py-4',
        'flex',
        'justify-between',
        'items-center'
      );
    });

    test('applies correct brand styling', () => {
      render(
        <RouterWrapper>
          <Navbar />
        </RouterWrapper>
      );
      
      const brand = screen.getByRole('heading', { level: 1 });
      expect(brand).toHaveClass('text-xl', 'font-bold');
    });

    test('applies correct navigation list styling', () => {
      render(
        <RouterWrapper>
          <Navbar />
        </RouterWrapper>
      );
      
      const navList = screen.getByRole('list');
      expect(navList).toHaveClass('flex', 'space-x-6');
    });
  });

  describe('Integration', () => {
    test('renders without errors', () => {
      expect(() => 
        render(
          <RouterWrapper>
            <Navbar />
          </RouterWrapper>
        )
      ).not.toThrow();
    });

    test('works with React Router', () => {
      render(
        <RouterWrapper>
          <Navbar />
        </RouterWrapper>
      );
      
      // All links should render without router errors
      expect(screen.getAllByRole('link')).toHaveLength(5);
    });

    test('maintains consistent rendering', () => {
      const { container: container1 } = render(
        <RouterWrapper>
          <Navbar />
        </RouterWrapper>
      );
      const { container: container2 } = render(
        <RouterWrapper>
          <Navbar />
        </RouterWrapper>
      );
      
      expect(container1.innerHTML).toBe(container2.innerHTML);
    });
  });

  describe('Content Validation', () => {
    test('contains expected navigation text', () => {
      render(
        <RouterWrapper>
          <Navbar />
        </RouterWrapper>
      );
      
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('About Us')).toBeInTheDocument();
      expect(screen.getByText('Testimonials')).toBeInTheDocument();
      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.getByText('Register')).toBeInTheDocument();
    });

    test('brand text is correct', () => {
      render(
        <RouterWrapper>
          <Navbar />
        </RouterWrapper>
      );
      
      expect(screen.getByText('OpenLingua')).toBeInTheDocument();
    });
  });
});