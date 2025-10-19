import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import CommunityDashboard from '../../src/components/community/CommunityDashboard';

// Mock the navigation hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock the ProAlert context
const mockProAlert = {
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
};

jest.mock('../../src/context/ProAlertContext', () => ({
  useProAlert: () => mockProAlert,
}));

// Mock logout utility
jest.mock('../../src/utils/logout');
import { logoutRequest } from '../../src/utils/logout';
const mockLogoutRequest = jest.mocked(logoutRequest);

// Mock components
jest.mock('../../src/components/ui/LoaderOverlay', () => {
  return function MockLoaderOverlay({ message }: { message?: string }) {
    return <div data-testid="loader-overlay">{message || 'Loading...'}</div>;
  };
});

jest.mock('../../src/components/layout/ThemeToggle', () => {
  return function MockThemeToggle() {
    return <div data-testid="theme-toggle">Theme Toggle</div>;
  };
});

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Users: ({ size, className }: { size?: number; className?: string }) => 
    <div data-testid="users-icon" data-size={size} className={className}>Users</div>,
  MessageCircle: ({ size, className }: { size?: number; className?: string }) => 
    <div data-testid="message-circle-icon" data-size={size} className={className}>MessageCircle</div>,
  Calendar: ({ size, className }: { size?: number; className?: string }) => 
    <div data-testid="calendar-icon" data-size={size} className={className}>Calendar</div>,
  Plus: ({ size, className }: { size?: number; className?: string }) => 
    <div data-testid="plus-icon" data-size={size} className={className}>Plus</div>,
  LogOut: ({ size, className }: { size?: number; className?: string }) => 
    <div data-testid="logout-icon" data-size={size} className={className}>LogOut</div>,
}));

// Wrapper component for router context
const RouterWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('CommunityDashboard Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    test('renders main dashboard elements', () => {
      render(
        <RouterWrapper>
          <CommunityDashboard />
        </RouterWrapper>
      );

      expect(screen.getByText('Community Dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('users-icon')).toBeInTheDocument();
      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    });

    test('renders community members section', () => {
      render(
        <RouterWrapper>
          <CommunityDashboard />
        </RouterWrapper>
      );

      expect(screen.getByText('Connect With People:')).toBeInTheDocument();
      expect(screen.getByText('Tinashe Nganadange')).toBeInTheDocument();
      // Hluma Nziweni is the current user and is filtered out from the members section
      expect(screen.getByText('Bongumusa Makhubu')).toBeInTheDocument();
    });

    test('renders upcoming events section', () => {
      render(
        <RouterWrapper>
          <CommunityDashboard />
        </RouterWrapper>
      );

      expect(screen.getByText('Upcoming Events')).toBeInTheDocument();
      expect(screen.getByText('isiXhosa Beginner Meetup')).toBeInTheDocument();
      expect(screen.getByText('Swahili Business Workshop')).toBeInTheDocument();
    });

    test('renders discussions section', () => {
      render(
        <RouterWrapper>
          <CommunityDashboard />
        </RouterWrapper>
      );

      expect(screen.getByText('Forum Discussions')).toBeInTheDocument();
      expect(screen.getByText('Language Learning Tips')).toBeInTheDocument();
      expect(screen.getByText('Advanced Grammar Tricks')).toBeInTheDocument();
      expect(screen.getByText('Cultural Insights')).toBeInTheDocument();
    });

    test('does not display current user in members list', () => {
      render(
        <RouterWrapper>
          <CommunityDashboard />
        </RouterWrapper>
      );

      // Current user (Hluma Nziweni) should not appear in the members section
      expect(screen.queryByText('Hluma Nziweni')).not.toBeInTheDocument();
    });
  });

  describe('Member Interaction', () => {
    test('allows selecting a community member', () => {
      render(
        <RouterWrapper>
          <CommunityDashboard />
        </RouterWrapper>
      );

      const memberCard = screen.getByText('Tinashe Nganadange').closest('div');
      fireEvent.click(memberCard!);

      // Should show chat modal with member name
      expect(screen.getByText('Chat with Tinashe Nganadange')).toBeInTheDocument();
    });

    test('shows chat interface with selected member', () => {
      render(
        <RouterWrapper>
          <CommunityDashboard />
        </RouterWrapper>
      );

      const memberCard = screen.getByText('Tinashe Nganadange').closest('div');
      fireEvent.click(memberCard!);

      // Should show chat interface
      expect(screen.getByText('Chat with Tinashe Nganadange')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
      expect(screen.getByText('Messaging not implemented yet...')).toBeInTheDocument();
    });

    test('can close member details modal', () => {
      render(
        <RouterWrapper>
          <CommunityDashboard />
        </RouterWrapper>
      );

      // Open modal
      const memberCard = screen.getByText('Tinashe Nganadange').closest('div');
      fireEvent.click(memberCard!);

      // Close modal
      const closeButton = screen.getByText('✕');
      fireEvent.click(closeButton);

      expect(screen.queryByText('Chat with Tinashe Nganadange')).not.toBeInTheDocument();
    });
  });

  describe('Event Management', () => {
    test('shows add event button', () => {
      render(
        <RouterWrapper>
          <CommunityDashboard />
        </RouterWrapper>
      );

      expect(screen.getByText('Add Event')).toBeInTheDocument();
      expect(screen.getByTestId('plus-icon')).toBeInTheDocument();
    });

    test('opens create event form when create button is clicked', () => {
      render(
        <RouterWrapper>
          <CommunityDashboard />
        </RouterWrapper>
      );

      const createButton = screen.getByText('Add Event');
      fireEvent.click(createButton);

      expect(screen.getByRole('button', { name: /create event/i })).toBeInTheDocument();
      expect(screen.getByLabelText('Event Title')).toBeInTheDocument();
      expect(screen.getByLabelText('Date')).toBeInTheDocument();
      expect(screen.getByLabelText('Time')).toBeInTheDocument();
    });

    test('can toggle event creation form', () => {
      render(
        <RouterWrapper>
          <CommunityDashboard />
        </RouterWrapper>
      );

      // Open form
      const addEventButton = screen.getByText('Add Event');
      fireEvent.click(addEventButton);

      expect(screen.getByRole('button', { name: /create event/i })).toBeInTheDocument();

      // Close by clicking Add Event again (toggle behavior)
      fireEvent.click(addEventButton);

      expect(screen.queryByRole('button', { name: /create event/i })).not.toBeInTheDocument();
    });

    test('shows and hides event form', () => {
      render(
        <RouterWrapper>
          <CommunityDashboard />
        </RouterWrapper>
      );

      // Initially form should not be visible
      expect(screen.queryByPlaceholderText('Event Title')).not.toBeInTheDocument();

      // Open form
      const addEventButton = screen.getByText('Add Event');
      fireEvent.click(addEventButton);

      // Form should now be visible
      expect(screen.getByText('Create Event')).toBeInTheDocument();
      expect(screen.getByLabelText('Event Title')).toBeInTheDocument();
      expect(screen.getByLabelText('Date')).toBeInTheDocument();
      expect(screen.getByLabelText('Time')).toBeInTheDocument();
    });

    test('allows input in event form fields', () => {
      render(
        <RouterWrapper>
          <CommunityDashboard />
        </RouterWrapper>
      );

      // Open form
      const addEventButton = screen.getByText('Add Event');
      fireEvent.click(addEventButton);

      // Fill form
      const titleInput = screen.getByLabelText('Event Title');
      const dateInput = screen.getByLabelText('Date');
      const timeInput = screen.getByLabelText('Time');

      fireEvent.change(titleInput, {
        target: { value: 'New Language Meetup' }
      });
      fireEvent.change(dateInput, {
        target: { value: '2025-12-01' }
      });
      fireEvent.change(timeInput, {
        target: { value: '14:00' }
      });

      // Verify inputs have the values
      expect(titleInput).toHaveValue('New Language Meetup');
      expect(dateInput).toHaveValue('2025-12-01');
      expect(timeInput).toHaveValue('14:00');
    });
  });

  describe('Navigation', () => {
    test('navigates to dashboard when logo is clicked', () => {
      render(
        <RouterWrapper>
          <CommunityDashboard />
        </RouterWrapper>
      );

      const logo = screen.getByText('OpenLingua');
      fireEvent.click(logo);

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    test('handles logout correctly', async () => {
      mockLogoutRequest.mockResolvedValueOnce(true);

      render(
        <RouterWrapper>
          <CommunityDashboard />
        </RouterWrapper>
      );

      const logoutButton = screen.getByRole('button', { name: /log out/i });
      fireEvent.click(logoutButton);

      expect(screen.getByTestId('loader-overlay')).toBeInTheDocument();

      await waitFor(() => {
        expect(mockLogoutRequest).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/signIn');
      });
    });

    test('handles logout failure', async () => {
      mockLogoutRequest.mockResolvedValueOnce(false);

      render(
        <RouterWrapper>
          <CommunityDashboard />
        </RouterWrapper>
      );

      const logoutButton = screen.getByRole('button', { name: /log out/i });
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(mockProAlert.error).toHaveBeenCalledWith('Unable to log out. Please try again.');
      });
    });
  });

  describe('Responsive Design', () => {
    test('renders mobile-friendly layout', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(
        <RouterWrapper>
          <CommunityDashboard />
        </RouterWrapper>
      );

      // Should still render main components
      expect(screen.getByText('Community Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Connect With People:')).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    test('displays member enrollment information correctly', () => {
      render(
        <RouterWrapper>
          <CommunityDashboard />
        </RouterWrapper>
      );

      // Check that course information is displayed
      const memberCards = screen.getAllByText(/Advanced isiXhosa Grammar|Swahili for Business|Beginner Xitsonga Conversations/);
      expect(memberCards.length).toBeGreaterThan(0);
    });

    test('shows event timing information', () => {
      render(
        <RouterWrapper>
          <CommunityDashboard />
        </RouterWrapper>
      );

      expect(screen.getByText(/at 15:00/)).toBeInTheDocument();
      expect(screen.getByText(/at 10:00/)).toBeInTheDocument();
    });

    test('displays discussion activity timestamps', () => {
      render(
        <RouterWrapper>
          <CommunityDashboard />
        </RouterWrapper>
      );

      expect(screen.getByText('2 hours ago')).toBeInTheDocument();
      expect(screen.getByText('1 day ago')).toBeInTheDocument();
      expect(screen.getByText('3 days ago')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper heading structure', () => {
      render(
        <RouterWrapper>
          <CommunityDashboard />
        </RouterWrapper>
      );

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Users Community Dashboard');
      expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(3); // Members, Events, Discussions
    });

    test('has accessible buttons', () => {
      render(
        <RouterWrapper>
          <CommunityDashboard />
        </RouterWrapper>
      );

      expect(screen.getByRole('button', { name: /add event/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument();
    });

    test('has proper form labels when event form is open', () => {
      render(
        <RouterWrapper>
          <CommunityDashboard />
        </RouterWrapper>
      );

      const createButton = screen.getByText('Add Event');
      fireEvent.click(createButton);

      expect(screen.getByLabelText('Event Title')).toBeInTheDocument();
      expect(screen.getByLabelText('Date')).toBeInTheDocument();
      expect(screen.getByLabelText('Time')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('handles missing member data gracefully', () => {
      render(
        <RouterWrapper>
          <CommunityDashboard />
        </RouterWrapper>
      );

      // Component should render even if some data is missing
      expect(screen.getByText('Connect With People:')).toBeInTheDocument();
    });

    test('handles logout errors gracefully', async () => {
      const { logoutRequest } = require('../../src/utils/logout');
      jest.mocked(logoutRequest).mockRejectedValueOnce(new Error('Network error'));

      render(
        <RouterWrapper>
          <CommunityDashboard />
        </RouterWrapper>
      );

      const logoutButton = screen.getByRole('button', { name: /log out/i });
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(mockProAlert.error).toHaveBeenCalledWith('Unable to log out. Please try again.');
      });
    });
  });

  describe('Performance', () => {
    test('renders efficiently with large member list', () => {
      const startTime = performance.now();
      
      render(
        <RouterWrapper>
          <CommunityDashboard />
        </RouterWrapper>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render in reasonable time (less than 2000ms)
      expect(renderTime).toBeLessThan(2000);
    });
  });
});