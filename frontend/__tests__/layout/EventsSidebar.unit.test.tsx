import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import EventsSidebar from '../../src/components/layout/EventsSidebar';

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Calendar: ({ size, className }: { size?: number; className?: string }) => 
    <div data-testid="calendar-icon" data-size={size} className={className}>Calendar</div>,
}));

// Mock data
const mockEvents = [
  {
    id: '1',
    title: 'isiXhosa Grammar Workshop',
    description: 'Learn advanced grammar concepts in isiXhosa',
    datetime: '2025-10-15T14:00:00Z',
    attendingCount: 8,
    attending: false,
    capacity: 15,
    location: 'Online',
    type: 'workshop'
  },
  {
    id: '2',
    title: 'Cultural Exchange Session',
    description: 'Share cultural insights and stories',
    datetime: '2025-10-20T16:00:00Z',
    attendingCount: 12,
    attending: true,
    capacity: 20,
    location: 'Community Center',
    type: 'cultural'
  },
  {
    id: '3',
    title: 'Q&A with Language Expert',
    description: 'Ask questions about language learning',
    datetime: '2025-10-25T18:00:00Z',
    attendingCount: 25,
    attending: false,
    capacity: 25,
    location: 'Virtual Room',
    type: 'qa'
  }
];

const mockProps = {
  open: true,
  events: mockEvents,
  onClose: jest.fn(),
  onAttend: jest.fn()
};

describe('EventsSidebar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders sidebar when open', () => {
      render(<EventsSidebar {...mockProps} />);
      
      expect(screen.getByRole('complementary')).toBeInTheDocument();
      expect(screen.getByText('Upcoming Events')).toBeInTheDocument();
      expect(screen.getByLabelText('Close events sidebar')).toBeInTheDocument();
    });

    test('applies correct classes when closed', () => {
      render(<EventsSidebar {...mockProps} open={false} />);
      
      const sidebar = screen.getByRole('complementary', { hidden: true });
      expect(sidebar).toHaveClass('translate-x-full');
      expect(sidebar).toHaveAttribute('aria-hidden', 'true');
    });

    test('applies correct classes when open', () => {
      render(<EventsSidebar {...mockProps} />);
      
      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toHaveClass('translate-x-0');
      expect(sidebar).toHaveAttribute('aria-hidden', 'false');
    });

    test('renders events list with proper accessibility', () => {
      render(<EventsSidebar {...mockProps} />);
      
      expect(screen.getByRole('list', { name: 'Upcoming events' })).toBeInTheDocument();
      const eventItems = screen.getAllByRole('listitem');
      expect(eventItems).toHaveLength(3);
    });

    test('renders empty state when no events', () => {
      render(<EventsSidebar {...mockProps} events={[]} />);
      
      expect(screen.getByTestId('calendar-icon')).toBeInTheDocument();
      expect(screen.getByText('No upcoming events')).toBeInTheDocument();
      expect(screen.getByText('Check back later for new events!')).toBeInTheDocument();
    });
  });

  describe('Event Display', () => {
    test('displays event information correctly', () => {
      render(<EventsSidebar {...mockProps} />);
      
      // Check first event
      expect(screen.getByText('isiXhosa Grammar Workshop')).toBeInTheDocument();
      expect(screen.getByText('Learn advanced grammar concepts in isiXhosa')).toBeInTheDocument();
      expect(screen.getByText('workshop')).toBeInTheDocument();
      expect(screen.getByText('📍 Online')).toBeInTheDocument();
      expect(screen.getByText('👥 8/15 attending')).toBeInTheDocument();
    });

    test('applies correct type styling', () => {
      render(<EventsSidebar {...mockProps} />);
      
      const workshopType = screen.getByText('workshop');
      expect(workshopType).toHaveClass('bg-green-600/20', 'text-green-400');
      
      const culturalType = screen.getByText('cultural');
      expect(culturalType).toHaveClass('bg-purple-600/20', 'text-purple-400');
      
      const qaType = screen.getByText('qa');
      expect(qaType).toHaveClass('bg-blue-600/20', 'text-blue-400');
    });

    test('displays capacity status correctly', () => {
      render(<EventsSidebar {...mockProps} />);
      
      // Event with available spots
      expect(screen.getByText('7 spots left')).toBeInTheDocument();
      
      // Event with available spots
      expect(screen.getByText('8 spots left')).toBeInTheDocument();
      
      // Full event
      expect(screen.getByText('Full')).toBeInTheDocument();
    });

    test('formats datetime correctly', () => {
      render(<EventsSidebar {...mockProps} />);
      
      // Check that dates are formatted (exact format may vary by locale)
      const dateElements = screen.getAllByText(/📅/);
      expect(dateElements).toHaveLength(3);
      
      // Check for datetime attributes on time elements
      const timeElements = screen.getAllByRole('time');
      expect(timeElements[0]).toHaveAttribute('datetime', '2025-10-15T14:00:00Z');
      expect(timeElements[1]).toHaveAttribute('datetime', '2025-10-20T16:00:00Z');
      expect(timeElements[2]).toHaveAttribute('datetime', '2025-10-25T18:00:00Z');
    });
  });

  describe('Interactions', () => {
    test('calls onClose when close button is clicked', () => {
      render(<EventsSidebar {...mockProps} />);
      
      const closeButton = screen.getByLabelText('Close events sidebar');
      fireEvent.click(closeButton);
      
      expect(mockProps.onClose).toHaveBeenCalledTimes(1);
    });

    test('calls onAttend when attend button is clicked', () => {
      render(<EventsSidebar {...mockProps} />);
      
      const attendButtons = screen.getAllByText(/👋 Join Event|✅ Attending/);
      fireEvent.click(attendButtons[0]);
      
      expect(mockProps.onAttend).toHaveBeenCalledWith('1');
    });

    test('shows correct button text based on attendance status', () => {
      render(<EventsSidebar {...mockProps} />);
      
      // Not attending
      expect(screen.getByText('👋 Join Event')).toBeInTheDocument();
      
      // Already attending
      expect(screen.getByText('✅ Attending')).toBeInTheDocument();
    });

    test('disables button for full events when not attending', () => {
      render(<EventsSidebar {...mockProps} />);
      
      const fullEventButton = screen.getByText('🚫 Event Full');
      expect(fullEventButton).toBeDisabled();
      expect(fullEventButton).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');
    });

    test('button has correct aria attributes', () => {
      render(<EventsSidebar {...mockProps} />);
      
      const attendingButton = screen.getByText('✅ Attending');
      expect(attendingButton).toHaveAttribute('aria-pressed', 'true');
      expect(attendingButton).toHaveAttribute('aria-label', 'Stop attending Cultural Exchange Session');
      
      const joinButton = screen.getByText('👋 Join Event');
      expect(joinButton).toHaveAttribute('aria-pressed', 'false');
      expect(joinButton).toHaveAttribute('aria-label', 'Attend isiXhosa Grammar Workshop');
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA attributes', () => {
      render(<EventsSidebar {...mockProps} />);
      
      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toHaveAttribute('aria-labelledby', 'sidebar-heading');
      expect(sidebar).toHaveAttribute('aria-hidden', 'false');
      
      expect(screen.getByRole('heading', { level: 2 })).toHaveAttribute('id', 'sidebar-heading');
    });

    test('close button has proper accessibility', () => {
      render(<EventsSidebar {...mockProps} />);
      
      const closeButton = screen.getByLabelText('Close events sidebar');
      expect(closeButton).toHaveClass('focus:ring-2', 'focus:ring-cyan-400');
    });

    test('attend buttons have focus styling', () => {
      render(<EventsSidebar {...mockProps} />);
      
      const buttons = screen.getAllByRole('button').filter(btn => 
        btn.textContent?.includes('Join Event') || btn.textContent?.includes('Attending')
      );
      
      buttons.forEach(button => {
        expect(button).toHaveClass('focus:ring-2');
      });
    });
  });

  describe('Edge Cases', () => {
    test('handles events without optional fields', () => {
      const minimalEvent = {
        id: '4',
        title: 'Basic Event',
        description: 'Simple event',
        datetime: '2025-11-01T10:00:00Z',
        attendingCount: 5,
        attending: false
      };

      render(<EventsSidebar {...mockProps} events={[minimalEvent]} />);
      
      expect(screen.getByText('Basic Event')).toBeInTheDocument();
      expect(screen.getByText('👥 5 attending')).toBeInTheDocument();
      expect(screen.queryByText(/📍/)).not.toBeInTheDocument();
      expect(screen.queryByText(/spots left|Full/)).not.toBeInTheDocument();
    });

    test('handles unknown event type', () => {
      const unknownTypeEvent = {
        ...mockEvents[0],
        type: 'unknown'
      };

      render(<EventsSidebar {...mockProps} events={[unknownTypeEvent]} />);
      
      const typeElement = screen.getByText('unknown');
      expect(typeElement).toHaveClass('bg-gray-600/20', 'text-gray-400');
    });

    test('handles events with zero capacity', () => {
      const zeroCapacityEvent = {
        ...mockEvents[0],
        capacity: 0,
        attendingCount: 0
      };

      render(<EventsSidebar {...mockProps} events={[zeroCapacityEvent]} />);
      
      // Check for attendance count - capacity 0 is falsy so "/" and capacity status won't be rendered
      expect(screen.getByText(/👥 0.*attending/)).toBeInTheDocument();
      // When capacity is 0 (falsy), no capacity status is shown
      expect(screen.queryByText('Full')).not.toBeInTheDocument();
      expect(screen.queryByText(/spots left/)).not.toBeInTheDocument();
    });
  });
});