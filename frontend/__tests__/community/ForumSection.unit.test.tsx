import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ForumSection from '../../src/components/community/ForumSection';
import type { Forum, User } from '../../src/types/course';

// Mock the utility function
jest.mock('../../src/utils/courseUtils', () => ({
  getRelativeTime: jest.fn((dateString: string) => {
    if (dateString === '2025-01-01T10:00:00Z') return '2 hours ago';
    if (dateString === '2025-01-02T10:00:00Z') return '1 day ago';
    return 'just now';
  })
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  MessageSquare: ({ size, className }: { size?: number; className?: string }) => 
    <div data-testid="message-square-icon" data-size={size} className={className}>MessageSquare</div>,
  SendHorizonal: ({ size }: { size?: number }) => 
    <div data-testid="send-icon" data-size={size}>Send</div>,
  Loader2: ({ size, className }: { size?: number; className?: string }) => 
    <div data-testid="loader-icon" data-size={size} className={className}>Loading</div>,
}));

describe('ForumSection Unit Tests', () => {
  const mockUser: User = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    avatar: 'https://example.com/avatar.jpg'
  };

  const mockForums: Forum[] = [
    {
      content: 'This is a test forum post',
      author: mockUser,
      createdAt: '2025-01-01T10:00:00Z'
    },
    {
      content: 'Another forum post',
      author: {
        id: '2',
        name: 'Another User',
        email: 'another@example.com',
        avatar: 'https://example.com/avatar2.jpg'
      },
      createdAt: '2025-01-02T10:00:00Z'
    }
  ];

  const mockOnCreateForum = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    test('renders forum section with heading', () => {
      render(
        <ForumSection
          forums={mockForums}
          currentUser={mockUser}
          isVisible={true}
          onCreateForum={mockOnCreateForum}
        />
      );

      expect(screen.getByText('Forum Discussion')).toBeInTheDocument();
      expect(screen.getByTestId('message-square-icon')).toBeInTheDocument();
    });

    test('renders forum posts correctly', () => {
      render(
        <ForumSection
          forums={mockForums}
          currentUser={mockUser}
          isVisible={true}
          onCreateForum={mockOnCreateForum}
        />
      );

      expect(screen.getByText('This is a test forum post')).toBeInTheDocument();
      expect(screen.getByText('Another forum post')).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('Another User')).toBeInTheDocument();
    });

    test('renders empty state when no forums exist', () => {
      render(
        <ForumSection
          forums={[]}
          currentUser={mockUser}
          isVisible={true}
          onCreateForum={mockOnCreateForum}
        />
      );

      expect(screen.getByText('No messages yet.')).toBeInTheDocument();
      expect(screen.getByText('Start the conversation!')).toBeInTheDocument();
    });

    test('applies correct visibility classes when visible', () => {
      const { container } = render(
        <ForumSection
          forums={mockForums}
          currentUser={mockUser}
          isVisible={true}
          onCreateForum={mockOnCreateForum}
        />
      );

      const section = container.querySelector('section');
      expect(section).toHaveClass('translate-y-0', 'opacity-100');
    });

    test('applies correct visibility classes when not visible', () => {
      const { container } = render(
        <ForumSection
          forums={mockForums}
          currentUser={mockUser}
          isVisible={false}
          onCreateForum={mockOnCreateForum}
        />
      );

      const section = container.querySelector('section');
      expect(section).toHaveClass('translate-y-8', 'opacity-0');
    });
  });

  describe('Form Interaction', () => {
    test('allows typing in the message textarea', () => {
      render(
        <ForumSection
          forums={mockForums}
          currentUser={mockUser}
          isVisible={true}
          onCreateForum={mockOnCreateForum}
        />
      );

      const textarea = screen.getByLabelText('Write your forum message');
      fireEvent.change(textarea, { target: { value: 'New forum message' } });

      expect(textarea).toHaveValue('New forum message');
    });

    test('shows character count', () => {
      render(
        <ForumSection
          forums={mockForums}
          currentUser={mockUser}
          isVisible={true}
          onCreateForum={mockOnCreateForum}
        />
      );

      const textarea = screen.getByLabelText('Write your forum message');
      fireEvent.change(textarea, { target: { value: 'Hello' } });

      expect(screen.getByText('5/500 characters')).toBeInTheDocument();
    });

    test('disables submit button when message is empty', () => {
      render(
        <ForumSection
          forums={mockForums}
          currentUser={mockUser}
          isVisible={true}
          onCreateForum={mockOnCreateForum}
        />
      );

      const submitButton = screen.getByRole('button', { name: /post message to forum/i });
      expect(submitButton).toBeDisabled();
    });

    test('enables submit button when message is valid', () => {
      render(
        <ForumSection
          forums={mockForums}
          currentUser={mockUser}
          isVisible={true}
          onCreateForum={mockOnCreateForum}
        />
      );

      const textarea = screen.getByLabelText('Write your forum message');
      fireEvent.change(textarea, { target: { value: 'Valid message' } });

      const submitButton = screen.getByRole('button', { name: /post message to forum/i });
      expect(submitButton).not.toBeDisabled();
    });

    test('shows validation error for empty message', () => {
      render(
        <ForumSection
          forums={mockForums}
          currentUser={mockUser}
          isVisible={true}
          onCreateForum={mockOnCreateForum}
        />
      );

      const textarea = screen.getByLabelText('Write your forum message');
      fireEvent.change(textarea, { target: { value: '   ' } }); // Only whitespace

      expect(screen.getByText('Message cannot be empty')).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    test('calls onCreateForum when form is submitted with valid data', async () => {
      mockOnCreateForum.mockResolvedValueOnce(undefined);

      render(
        <ForumSection
          forums={mockForums}
          currentUser={mockUser}
          isVisible={true}
          onCreateForum={mockOnCreateForum}
        />
      );

      const textarea = screen.getByLabelText('Write your forum message');
      const submitButton = screen.getByRole('button', { name: /post message to forum/i });

      fireEvent.change(textarea, { target: { value: 'Test forum message' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnCreateForum).toHaveBeenCalledWith('Test forum message');
      });
    });

    test('clears form after successful submission', async () => {
      mockOnCreateForum.mockResolvedValueOnce(undefined);

      render(
        <ForumSection
          forums={mockForums}
          currentUser={mockUser}
          isVisible={true}
          onCreateForum={mockOnCreateForum}
        />
      );

      const textarea = screen.getByLabelText('Write your forum message');
      fireEvent.change(textarea, { target: { value: 'Test message' } });
      fireEvent.click(screen.getByRole('button', { name: /post message to forum/i }));

      await waitFor(() => {
        expect(textarea).toHaveValue('');
      });
    });

    test('shows loading state during submission', async () => {
      let resolveSubmission: () => void;
      const submissionPromise = new Promise<void>((resolve) => {
        resolveSubmission = resolve;
      });
      mockOnCreateForum.mockReturnValueOnce(submissionPromise);

      render(
        <ForumSection
          forums={mockForums}
          currentUser={mockUser}
          isVisible={true}
          onCreateForum={mockOnCreateForum}
        />
      );

      const textarea = screen.getByLabelText('Write your forum message');
      fireEvent.change(textarea, { target: { value: 'Test message' } });
      fireEvent.click(screen.getByRole('button', { name: /post message to forum/i }));

      expect(screen.getByText('Posting...')).toBeInTheDocument();
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();

      resolveSubmission!();
      await waitFor(() => {
        expect(screen.getByText('Post')).toBeInTheDocument();
      });
    });

    test('does not submit when user is not logged in', async () => {
      render(
        <ForumSection
          forums={mockForums}
          currentUser={null}
          isVisible={true}
          onCreateForum={mockOnCreateForum}
        />
      );

      const textarea = screen.getByLabelText('Write your forum message');
      fireEvent.change(textarea, { target: { value: 'Test message' } });
      fireEvent.click(screen.getByRole('button', { name: /post message to forum/i }));

      expect(mockOnCreateForum).not.toHaveBeenCalled();
    });

    test('handles submission errors gracefully', async () => {
      mockOnCreateForum.mockRejectedValueOnce(new Error('Submission failed'));

      render(
        <ForumSection
          forums={mockForums}
          currentUser={mockUser}
          isVisible={true}
          onCreateForum={mockOnCreateForum}
        />
      );

      const textarea = screen.getByLabelText('Write your forum message');
      const submitButton = screen.getByRole('button', { name: /post message to forum/i });
      
      fireEvent.change(textarea, { target: { value: 'Test message' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnCreateForum).toHaveBeenCalledWith('Test message');
      });

      // After error, the form should reset (loading state should end)
      await waitFor(() => {
        expect(screen.getByText('Post')).toBeInTheDocument();
      });
      
      // The message should not be cleared on error since there's no error handling
      expect(textarea).toHaveValue('Test message');
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels and roles', () => {
      render(
        <ForumSection
          forums={mockForums}
          currentUser={mockUser}
          isVisible={true}
          onCreateForum={mockOnCreateForum}
        />
      );

      expect(screen.getByRole('region', { name: /forum discussion/i })).toBeInTheDocument();
      expect(screen.getByLabelText('Write your forum message')).toBeInTheDocument();
      expect(screen.getByRole('feed', { name: /forum messages/i })).toBeInTheDocument();
    });

    test('has proper form structure', () => {
      render(
        <ForumSection
          forums={mockForums}
          currentUser={mockUser}
          isVisible={true}
          onCreateForum={mockOnCreateForum}
        />
      );

      expect(screen.getByRole('button', { name: /post message to forum/i })).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /post message to forum/i })).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles very long messages within character limit', () => {
      render(
        <ForumSection
          forums={mockForums}
          currentUser={mockUser}
          isVisible={true}
          onCreateForum={mockOnCreateForum}
        />
      );

      const longMessage = 'a'.repeat(500);
      const textarea = screen.getByLabelText('Write your forum message');
      fireEvent.change(textarea, { target: { value: longMessage } });

      expect(screen.getByText('500/500 characters')).toBeInTheDocument();
    });

    test('handles forum posts with special characters', () => {
      const specialForums: Forum[] = [
        {
          content: 'Special chars: ñáéíóú 中文 🎉 <script>alert("xss")</script>',
          author: mockUser,
          createdAt: '2025-01-01T10:00:00Z'
        }
      ];

      render(
        <ForumSection
          forums={specialForums}
          currentUser={mockUser}
          isVisible={true}
          onCreateForum={mockOnCreateForum}
        />
      );

      expect(screen.getByText(/Special chars: ñáéíóú 中文 🎉/)).toBeInTheDocument();
    });
  });
});