import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReviewsSection from '../../src/components/community/ReviewsSection';
import type { Review, User } from '../../src/types/course';

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
  Star: ({ size, fill, className }: { size?: number; fill?: string; className?: string }) => 
    <div data-testid="star-icon" data-size={size} data-fill={fill} className={className}>Star</div>,
  Loader2: ({ size, className }: { size?: number; className?: string }) => 
    <div data-testid="loader-icon" data-size={size} className={className}>Loading</div>,
}));

describe('ReviewsSection Unit Tests', () => {
  const mockUser: User = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    avatar: 'https://example.com/avatar.jpg'
  };

  const mockReviews: Review[] = [
    {
      id: '1',
      user: mockUser,
      review: 'Great course content!',
      rating: 5,
      helpfulCount: 3,
      helpful: true,
      userMarkedHelpful: false,
      createdAt: '2025-01-01T10:00:00Z'
    },
    {
      id: '2',
      user: {
        id: '2',
        name: 'Another User',
        email: 'another@example.com',
        avatar: 'https://example.com/avatar2.jpg'
      },
      review: 'Could be better',
      rating: 3,
      helpfulCount: 1,
      helpful: false,
      userMarkedHelpful: true,
      createdAt: '2025-01-02T10:00:00Z'
    }
  ];

  const mockOnCreateReview = jest.fn();
  const mockOnToggleReviewHelpful = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    test('renders reviews section with heading', () => {
      render(
        <ReviewsSection
          reviews={mockReviews}
          currentUser={mockUser}
          isVisible={true}
          onCreateReview={mockOnCreateReview}
          onToggleReviewHelpful={mockOnToggleReviewHelpful}
        />
      );

      expect(screen.getByText('Reviews & Ratings')).toBeInTheDocument();
    });

    test('renders review list correctly', () => {
      render(
        <ReviewsSection
          reviews={mockReviews}
          currentUser={mockUser}
          isVisible={true}
          onCreateReview={mockOnCreateReview}
          onToggleReviewHelpful={mockOnToggleReviewHelpful}
        />
      );

      expect(screen.getByText('Great course content!')).toBeInTheDocument();
      expect(screen.getByText('Could be better')).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('Another User')).toBeInTheDocument();
    });

    test('renders star ratings correctly', () => {
      render(
        <ReviewsSection
          reviews={mockReviews}
          currentUser={mockUser}
          isVisible={true}
          onCreateReview={mockOnCreateReview}
          onToggleReviewHelpful={mockOnToggleReviewHelpful}
        />
      );

      // Each review has 5 stars, so we should have 10 star icons total
      const starIcons = screen.getAllByTestId('star-icon');
      expect(starIcons).toHaveLength(10);
    });

    test('renders empty state when no reviews exist', () => {
      render(
        <ReviewsSection
          reviews={[]}
          currentUser={mockUser}
          isVisible={true}
          onCreateReview={mockOnCreateReview}
          onToggleReviewHelpful={mockOnToggleReviewHelpful}
        />
      );

      expect(screen.getByText('No reviews yet.')).toBeInTheDocument();
      expect(screen.getByText('Be the first to review this course!')).toBeInTheDocument();
    });

    test('applies correct visibility classes when visible', () => {
      const { container } = render(
        <ReviewsSection
          reviews={mockReviews}
          currentUser={mockUser}
          isVisible={true}
          onCreateReview={mockOnCreateReview}
          onToggleReviewHelpful={mockOnToggleReviewHelpful}
        />
      );

      const section = container.querySelector('section');
      expect(section).toHaveClass('translate-y-0', 'opacity-100');
    });

    test('applies correct visibility classes when not visible', () => {
      const { container } = render(
        <ReviewsSection
          reviews={mockReviews}
          currentUser={mockUser}
          isVisible={false}
          onCreateReview={mockOnCreateReview}
          onToggleReviewHelpful={mockOnToggleReviewHelpful}
        />
      );

      const section = container.querySelector('section');
      expect(section).toHaveClass('translate-y-8', 'opacity-0');
    });
  });

  describe('Review Form Interaction', () => {
    test('allows typing in the review textarea', () => {
      render(
        <ReviewsSection
          reviews={mockReviews}
          currentUser={mockUser}
          isVisible={true}
          onCreateReview={mockOnCreateReview}
          onToggleReviewHelpful={mockOnToggleReviewHelpful}
        />
      );

      const textarea = screen.getByLabelText('Your Review');
      fireEvent.change(textarea, { target: { value: 'New review text' } });

      expect(textarea).toHaveValue('New review text');
    });

    test('shows character count for review text', () => {
      render(
        <ReviewsSection
          reviews={mockReviews}
          currentUser={mockUser}
          isVisible={true}
          onCreateReview={mockOnCreateReview}
          onToggleReviewHelpful={mockOnToggleReviewHelpful}
        />
      );

      const textarea = screen.getByLabelText('Your Review');
      fireEvent.change(textarea, { target: { value: 'Hello' } });

      expect(screen.getByText('5/500 characters')).toBeInTheDocument();
    });

    test('allows selecting rating', () => {
      render(
        <ReviewsSection
          reviews={mockReviews}
          currentUser={mockUser}
          isVisible={true}
          onCreateReview={mockOnCreateReview}
          onToggleReviewHelpful={mockOnToggleReviewHelpful}
        />
      );

      const ratingSelect = screen.getByLabelText('Select rating');
      fireEvent.change(ratingSelect, { target: { value: '4' } });

      expect(ratingSelect).toHaveValue('4');
    });

    test('disables submit button when review text is empty', () => {
      render(
        <ReviewsSection
          reviews={mockReviews}
          currentUser={mockUser}
          isVisible={true}
          onCreateReview={mockOnCreateReview}
          onToggleReviewHelpful={mockOnToggleReviewHelpful}
        />
      );

      const submitButton = screen.getByRole('button', { name: /submit review/i });
      expect(submitButton).toBeDisabled();
    });

    test('enables submit button when review is valid', () => {
      render(
        <ReviewsSection
          reviews={mockReviews}
          currentUser={mockUser}
          isVisible={true}
          onCreateReview={mockOnCreateReview}
          onToggleReviewHelpful={mockOnToggleReviewHelpful}
        />
      );

      const textarea = screen.getByLabelText('Your Review');
      fireEvent.change(textarea, { target: { value: 'Valid review' } });

      const submitButton = screen.getByRole('button', { name: /submit review/i });
      expect(submitButton).not.toBeDisabled();
    });

    test('shows validation error for empty review', () => {
      render(
        <ReviewsSection
          reviews={mockReviews}
          currentUser={mockUser}
          isVisible={true}
          onCreateReview={mockOnCreateReview}
          onToggleReviewHelpful={mockOnToggleReviewHelpful}
        />
      );

      const textarea = screen.getByLabelText('Your Review');
      fireEvent.change(textarea, { target: { value: '   ' } }); // Only whitespace

      expect(screen.getByText('Review cannot be empty')).toBeInTheDocument();
    });
  });

  describe('Review Form Submission', () => {
    test('calls onCreateReview when form is submitted with valid data', async () => {
      mockOnCreateReview.mockResolvedValueOnce(undefined);

      render(
        <ReviewsSection
          reviews={mockReviews}
          currentUser={mockUser}
          isVisible={true}
          onCreateReview={mockOnCreateReview}
          onToggleReviewHelpful={mockOnToggleReviewHelpful}
        />
      );

      const textarea = screen.getByLabelText('Your Review');
      const ratingSelect = screen.getByLabelText('Select rating');
      const submitButton = screen.getByRole('button', { name: /submit review/i });

      fireEvent.change(textarea, { target: { value: 'Great course!' } });
      fireEvent.change(ratingSelect, { target: { value: '4' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnCreateReview).toHaveBeenCalledWith('Great course!', 4);
      });
    });

    test('resets form after successful submission', async () => {
      mockOnCreateReview.mockResolvedValueOnce(undefined);

      render(
        <ReviewsSection
          reviews={mockReviews}
          currentUser={mockUser}
          isVisible={true}
          onCreateReview={mockOnCreateReview}
          onToggleReviewHelpful={mockOnToggleReviewHelpful}
        />
      );

      const textarea = screen.getByLabelText('Your Review');
      const ratingSelect = screen.getByLabelText('Select rating');

      fireEvent.change(textarea, { target: { value: 'Test review' } });
      fireEvent.change(ratingSelect, { target: { value: '3' } });
      fireEvent.submit(screen.getByTestId('review-form'));

      await waitFor(() => {
        expect(textarea).toHaveValue('');
        expect(ratingSelect).toHaveValue('5'); // Default rating
      });
    });

    test('shows loading state during submission', async () => {
      let resolveSubmission: () => void;
      const submissionPromise = new Promise<void>((resolve) => {
        resolveSubmission = resolve;
      });
      mockOnCreateReview.mockReturnValueOnce(submissionPromise);

      render(
        <ReviewsSection
          reviews={mockReviews}
          currentUser={mockUser}
          isVisible={true}
          onCreateReview={mockOnCreateReview}
          onToggleReviewHelpful={mockOnToggleReviewHelpful}
        />
      );

      const textarea = screen.getByLabelText('Your Review');
      fireEvent.change(textarea, { target: { value: 'Test review' } });
      fireEvent.submit(screen.getByTestId('review-form'));

      expect(screen.getByText('Submitting...')).toBeInTheDocument();
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();

      resolveSubmission!();
      await waitFor(() => {
        expect(screen.getByText('Submit Review')).toBeInTheDocument();
      });
    });

    test('does not submit when user is not logged in', async () => {
      render(
        <ReviewsSection
          reviews={mockReviews}
          currentUser={null}
          isVisible={true}
          onCreateReview={mockOnCreateReview}
          onToggleReviewHelpful={mockOnToggleReviewHelpful}
        />
      );

      const textarea = screen.getByLabelText('Your Review');
      fireEvent.change(textarea, { target: { value: 'Test review' } });
      fireEvent.submit(screen.getByTestId('review-form'));

      expect(mockOnCreateReview).not.toHaveBeenCalled();
    });
  });

  describe('Helpful Button Interaction', () => {
    test('calls onToggleReviewHelpful when helpful button is clicked', () => {
      render(
        <ReviewsSection
          reviews={mockReviews}
          currentUser={mockUser}
          isVisible={true}
          onCreateReview={mockOnCreateReview}
          onToggleReviewHelpful={mockOnToggleReviewHelpful}
        />
      );

      const helpfulButtons = screen.getAllByRole('button', { name: /mark review as.*helpful/i });
      fireEvent.click(helpfulButtons[0]);

      expect(mockOnToggleReviewHelpful).toHaveBeenCalledWith('1');
    });

    test('displays correct helpful count', () => {
      render(
        <ReviewsSection
          reviews={mockReviews}
          currentUser={mockUser}
          isVisible={true}
          onCreateReview={mockOnCreateReview}
          onToggleReviewHelpful={mockOnToggleReviewHelpful}
        />
      );

      expect(screen.getByText('Helpful (3)')).toBeInTheDocument();
      expect(screen.getByText('Helpful (1)')).toBeInTheDocument();
    });

    test('shows correct button state for marked helpful reviews', () => {
      render(
        <ReviewsSection
          reviews={mockReviews}
          currentUser={mockUser}
          isVisible={true}
          onCreateReview={mockOnCreateReview}
          onToggleReviewHelpful={mockOnToggleReviewHelpful}
        />
      );

      const helpfulButtons = screen.getAllByRole('button', { name: /mark review as.*helpful/i });
      
      // First review is not marked helpful by user
      expect(helpfulButtons[0]).toHaveAttribute('aria-pressed', 'false');
      
      // Second review is marked helpful by user
      expect(helpfulButtons[1]).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels and roles', () => {
      render(
        <ReviewsSection
          reviews={mockReviews}
          currentUser={mockUser}
          isVisible={true}
          onCreateReview={mockOnCreateReview}
          onToggleReviewHelpful={mockOnToggleReviewHelpful}
        />
      );

      expect(screen.getByRole('region', { name: /reviews & ratings/i })).toBeInTheDocument();
      expect(screen.getByRole('feed', { name: /course reviews/i })).toBeInTheDocument();
      expect(screen.getByLabelText('Your Review')).toBeInTheDocument();
      expect(screen.getByLabelText('Select rating')).toBeInTheDocument();
    });

    test('has proper star rating accessibility', () => {
      render(
        <ReviewsSection
          reviews={mockReviews}
          currentUser={mockUser}
          isVisible={true}
          onCreateReview={mockOnCreateReview}
          onToggleReviewHelpful={mockOnToggleReviewHelpful}
        />
      );

      // Should have screen reader text for star ratings
      expect(screen.getByText('5 out of 5 stars')).toBeInTheDocument();
      expect(screen.getByText('3 out of 5 stars')).toBeInTheDocument();
    });

    test('has proper form structure', () => {
      render(
        <ReviewsSection
          reviews={mockReviews}
          currentUser={mockUser}
          isVisible={true}
          onCreateReview={mockOnCreateReview}
          onToggleReviewHelpful={mockOnToggleReviewHelpful}
        />
      );

      expect(screen.getByTestId('review-form')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit review/i })).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles very long reviews within character limit', () => {
      render(
        <ReviewsSection
          reviews={mockReviews}
          currentUser={mockUser}
          isVisible={true}
          onCreateReview={mockOnCreateReview}
          onToggleReviewHelpful={mockOnToggleReviewHelpful}
        />
      );

      const longReview = 'a'.repeat(500);
      const textarea = screen.getByLabelText('Your Review');
      fireEvent.change(textarea, { target: { value: longReview } });

      expect(screen.getByText('500/500 characters')).toBeInTheDocument();
    });

    test('handles all rating options', () => {
      render(
        <ReviewsSection
          reviews={mockReviews}
          currentUser={mockUser}
          isVisible={true}
          onCreateReview={mockOnCreateReview}
          onToggleReviewHelpful={mockOnToggleReviewHelpful}
        />
      );

      const options = screen.getAllByRole('option');

      expect(options).toHaveLength(5);
      expect(options[0]).toHaveTextContent('⭐ 1 Star');
      expect(options[4]).toHaveTextContent('⭐⭐⭐⭐⭐ 5 Stars');
    });

    test('handles reviews with special characters', () => {
      const specialReviews: Review[] = [
        {
          id: '1',
          user: mockUser,
          review: 'Special chars: ñáéíóú 中文 🎉 <script>alert("xss")</script>',
          rating: 4,
          helpfulCount: 0,
          helpful: false,
          userMarkedHelpful: false,
          createdAt: '2025-01-01T10:00:00Z'
        }
      ];

      render(
        <ReviewsSection
          reviews={specialReviews}
          currentUser={mockUser}
          isVisible={true}
          onCreateReview={mockOnCreateReview}
          onToggleReviewHelpful={mockOnToggleReviewHelpful}
        />
      );

      expect(screen.getByText(/Special chars: ñáéíóú 中文 🎉/)).toBeInTheDocument();
    });

    test('handles submission errors gracefully', async () => {
      mockOnCreateReview.mockRejectedValueOnce(new Error('Submission failed'));

      render(
        <ReviewsSection
          reviews={mockReviews}
          currentUser={mockUser}
          isVisible={true}
          onCreateReview={mockOnCreateReview}
          onToggleReviewHelpful={mockOnToggleReviewHelpful}
        />
      );

      const textarea = screen.getByLabelText('Your Review');
      fireEvent.change(textarea, { target: { value: 'Test review' } });
      fireEvent.submit(screen.getByTestId('review-form'));

      await waitFor(() => {
        expect(mockOnCreateReview).toHaveBeenCalledWith('Test review', 5);
      });

      // After error, the form should reset (loading state should end)
      await waitFor(() => {
        expect(screen.getByText('Submit Review')).toBeInTheDocument();
      });
      
      // The review text should not be cleared on error since there's no error handling
      expect(textarea).toHaveValue('Test review');
    });
  });
});