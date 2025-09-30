import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import ForumSection from '../../src/components/community/ForumSection';
import ReviewsSection from '../../src/components/community/ReviewsSection';
import type { Forum, Review, User } from '../../src/types/course';

// Mock utilities
jest.mock('../../src/utils/courseUtils', () => ({
  getRelativeTime: jest.fn((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    return diffInHours <= 2 ? `${diffInHours} hours ago` : `${Math.floor(diffInHours / 24)} days ago`;
  })
}));

// Mock icons
jest.mock('lucide-react', () => ({
  MessageSquare: ({ size, className }: { size?: number; className?: string }) => 
    <div data-testid="message-square-icon" data-size={size} className={className}>MessageSquare</div>,
  SendHorizonal: ({ size }: { size?: number }) => 
    <div data-testid="send-icon" data-size={size}>Send</div>,
  Loader2: ({ size, className }: { size?: number; className?: string }) => 
    <div data-testid="loader-icon" data-size={size} className={className}>Loading</div>,
  Star: ({ size, fill, className }: { size?: number; fill?: string; className?: string }) => 
    <div data-testid="star-icon" data-size={size} data-fill={fill} className={className}>Star</div>,
}));

// Wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Community Components Integration Tests', () => {
  const mockUser: User = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    avatar: 'https://example.com/avatar.jpg'
  };

  const mockUser2: User = {
    id: '2',
    name: 'Another User',
    email: 'another@example.com',
    avatar: 'https://example.com/avatar2.jpg'
  };

  describe('Forum and Reviews Integration', () => {
    test('forum and reviews sections work together on same page', async () => {
      const mockForums: Forum[] = [
        {
          content: 'Great discussion about the course!',
          author: mockUser,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
        }
      ];

      const mockReviews: Review[] = [
        {
          id: '1',
          user: mockUser2,
          review: 'Excellent course content and community!',
          rating: 5,
          helpfulCount: 2,
          helpful: true,
          userMarkedHelpful: false,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
        }
      ];

      const mockOnCreateForum = jest.fn().mockResolvedValue(undefined);
      const mockOnCreateReview = jest.fn().mockResolvedValue(undefined);
      const mockOnToggleReviewHelpful = jest.fn();

      render(
        <TestWrapper>
          <div>
            <ForumSection
              forums={mockForums}
              currentUser={mockUser}
              isVisible={true}
              onCreateForum={mockOnCreateForum}
            />
            <ReviewsSection
              reviews={mockReviews}
              currentUser={mockUser}
              isVisible={true}
              onCreateReview={mockOnCreateReview}
              onToggleReviewHelpful={mockOnToggleReviewHelpful}
            />
          </div>
        </TestWrapper>
      );

      // Both sections should be visible
      expect(screen.getByText('Forum Discussion')).toBeInTheDocument();
      expect(screen.getByText('Reviews & Ratings')).toBeInTheDocument();

      // Should display existing content
      expect(screen.getByText('Great discussion about the course!')).toBeInTheDocument();
      expect(screen.getByText('Excellent course content and community!')).toBeInTheDocument();

      // Should be able to interact with both forms simultaneously
      const forumTextarea = screen.getByLabelText('Write your forum message');
      const reviewTextarea = screen.getByLabelText('Your Review');

      fireEvent.change(forumTextarea, { target: { value: 'New forum post' } });
      fireEvent.change(reviewTextarea, { target: { value: 'New review' } });

      expect(forumTextarea).toHaveValue('New forum post');
      expect(reviewTextarea).toHaveValue('New review');
    });

    test('maintains independent state between forum and reviews', async () => {
      const mockOnCreateForum = jest.fn().mockResolvedValue(undefined);
      const mockOnCreateReview = jest.fn().mockResolvedValue(undefined);
      const mockOnToggleReviewHelpful = jest.fn();

      render(
        <TestWrapper>
          <div>
            <ForumSection
              forums={[]}
              currentUser={mockUser}
              isVisible={true}
              onCreateForum={mockOnCreateForum}
            />
            <ReviewsSection
              reviews={[]}
              currentUser={mockUser}
              isVisible={true}
              onCreateReview={mockOnCreateReview}
              onToggleReviewHelpful={mockOnToggleReviewHelpful}
            />
          </div>
        </TestWrapper>
      );

      // Fill and submit forum
      const forumTextarea = screen.getByLabelText('Write your forum message');
      const forumSubmitButton = screen.getByRole('button', { name: /post message to forum/i });

      fireEvent.change(forumTextarea, { target: { value: 'Forum message' } });
      fireEvent.click(forumSubmitButton);

      await waitFor(() => {
        expect(mockOnCreateForum).toHaveBeenCalledWith('Forum message');
        expect(forumTextarea).toHaveValue(''); // Should clear after submission
      });

      // Review form should remain unchanged
      const reviewTextarea = screen.getByLabelText('Your Review');
      expect(reviewTextarea).toHaveValue('');

      // Fill and submit review
      const reviewSubmitButton = screen.getByRole('button', { name: /submit review/i });

      fireEvent.change(reviewTextarea, { target: { value: 'Review text' } });
      fireEvent.click(reviewSubmitButton);

      await waitFor(() => {
        expect(mockOnCreateReview).toHaveBeenCalledWith('Review text', 5);
        expect(reviewTextarea).toHaveValue(''); // Should clear after submission
      });
    });
  });

  describe('User Authentication Integration', () => {
    test('handles user authentication consistently across components', () => {
      const mockOnCreateForum = jest.fn();
      const mockOnCreateReview = jest.fn();
      const mockOnToggleReviewHelpful = jest.fn();

      // Test with authenticated user
      const { rerender } = render(
        <TestWrapper>
          <div>
            <ForumSection
              forums={[]}
              currentUser={mockUser}
              isVisible={true}
              onCreateForum={mockOnCreateForum}
            />
            <ReviewsSection
              reviews={[]}
              currentUser={mockUser}
              isVisible={true}
              onCreateReview={mockOnCreateReview}
              onToggleReviewHelpful={mockOnToggleReviewHelpful}
            />
          </div>
        </TestWrapper>
      );

      // Both forms should be enabled
      expect(screen.getByLabelText('Write your forum message')).not.toBeDisabled();
      expect(screen.getByLabelText('Your Review')).not.toBeDisabled();

      // Test with unauthenticated user
      rerender(
        <TestWrapper>
          <div>
            <ForumSection
              forums={[]}
              currentUser={null}
              isVisible={true}
              onCreateForum={mockOnCreateForum}
            />
            <ReviewsSection
              reviews={[]}
              currentUser={null}
              isVisible={true}
              onCreateReview={mockOnCreateReview}
              onToggleReviewHelpful={mockOnToggleReviewHelpful}
            />
          </div>
        </TestWrapper>
      );

      // Forms should still be available but submissions should be handled differently
      expect(screen.getByLabelText('Write your forum message')).not.toBeDisabled();
      expect(screen.getByLabelText('Your Review')).not.toBeDisabled();

      // Attempt submissions
      fireEvent.change(screen.getByLabelText('Write your forum message'), { 
        target: { value: 'Test message' } 
      });
      const forumSubmitButton = screen.getByRole('button', { name: /post message to forum/i });
      fireEvent.click(forumSubmitButton);

      fireEvent.change(screen.getByLabelText('Your Review'), { 
        target: { value: 'Test review' } 
      });
      fireEvent.submit(screen.getByTestId('review-form'));

      // Should not have called the handlers since user is not authenticated
      expect(mockOnCreateForum).not.toHaveBeenCalled();
      expect(mockOnCreateReview).not.toHaveBeenCalled();
    });
  });

  describe('Data Flow Integration', () => {
    test('handles real-time updates between components', async () => {
      let forums: Forum[] = [];
      let reviews: Review[] = [];

      const mockOnCreateForum = jest.fn().mockImplementation(async (message: string) => {
        forums.push({
          content: message,
          author: mockUser,
          createdAt: new Date().toISOString()
        });
      });

      const mockOnCreateReview = jest.fn().mockImplementation(async (reviewText: string, rating: number) => {
        reviews.push({
          id: `${reviews.length + 1}`,
          user: mockUser,
          review: reviewText,
          rating,
          helpfulCount: 0,
          helpful: false,
          userMarkedHelpful: false,
          createdAt: new Date().toISOString()
        });
      });

      const mockOnToggleReviewHelpful = jest.fn();

      const { rerender } = render(
        <TestWrapper>
          <div>
            <ForumSection
              forums={forums}
              currentUser={mockUser}
              isVisible={true}
              onCreateForum={mockOnCreateForum}
            />
            <ReviewsSection
              reviews={reviews}
              currentUser={mockUser}
              isVisible={true}
              onCreateReview={mockOnCreateReview}
              onToggleReviewHelpful={mockOnToggleReviewHelpful}
            />
          </div>
        </TestWrapper>
      );

      // Initially empty
      expect(screen.getByText('No messages yet.')).toBeInTheDocument();
      expect(screen.getByText('No reviews yet.')).toBeInTheDocument();

      // Add forum post
      const forumTextarea = screen.getByLabelText('Write your forum message');
      fireEvent.change(forumTextarea, { target: { value: 'First forum post' } });
      fireEvent.submit(screen.getByTestId('forum-form'));

      await waitFor(() => {
        expect(mockOnCreateForum).toHaveBeenCalledWith('First forum post');
      });

      // Re-render with updated data
      rerender(
        <TestWrapper>
          <div>
            <ForumSection
              forums={forums}
              currentUser={mockUser}
              isVisible={true}
              onCreateForum={mockOnCreateForum}
            />
            <ReviewsSection
              reviews={reviews}
              currentUser={mockUser}
              isVisible={true}
              onCreateReview={mockOnCreateReview}
              onToggleReviewHelpful={mockOnToggleReviewHelpful}
            />
          </div>
        </TestWrapper>
      );

      // Forum should show new post
      expect(screen.getByText('First forum post')).toBeInTheDocument();
      expect(screen.queryByText('No messages yet.')).not.toBeInTheDocument();

      // Reviews should still be empty
      expect(screen.getByText('No reviews yet.')).toBeInTheDocument();
    });
  });

  describe('Error Handling Integration', () => {
    test('handles errors gracefully across components', async () => {
      const mockOnCreateForum = jest.fn().mockRejectedValue(new Error('Forum creation failed'));
      const mockOnCreateReview = jest.fn().mockRejectedValue(new Error('Review creation failed'));
      const mockOnToggleReviewHelpful = jest.fn();

      render(
        <TestWrapper>
          <div>
            <ForumSection
              forums={[]}
              currentUser={mockUser}
              isVisible={true}
              onCreateForum={mockOnCreateForum}
            />
            <ReviewsSection
              reviews={[]}
              currentUser={mockUser}
              isVisible={true}
              onCreateReview={mockOnCreateReview}
              onToggleReviewHelpful={mockOnToggleReviewHelpful}
            />
          </div>
        </TestWrapper>
      );

      // Try to submit forum post
      const forumTextarea = screen.getByLabelText('Write your forum message');
      fireEvent.change(forumTextarea, { target: { value: 'Test forum post' } });
      fireEvent.submit(screen.getByTestId('forum-form'));

      // Try to submit review
      const reviewTextarea = screen.getByLabelText('Your Review');
      fireEvent.change(reviewTextarea, { target: { value: 'Test review' } });
      fireEvent.submit(screen.getByTestId('review-form'));

      await waitFor(() => {
        expect(mockOnCreateForum).toHaveBeenCalled();
        expect(mockOnCreateReview).toHaveBeenCalled();
      });

      // Both components should recover from errors
      await waitFor(() => {
        expect(screen.getByText('Post')).toBeInTheDocument(); // Forum submit button
        expect(screen.getByText('Submit Review')).toBeInTheDocument(); // Review submit button
      });

      // Forms should remain functional after errors
      expect(screen.getByLabelText('Write your forum message')).not.toBeDisabled();
      expect(screen.getByLabelText('Your Review')).not.toBeDisabled();
    });
  });

  describe('Performance Integration', () => {
    test('handles large datasets efficiently', () => {
      // Create large datasets
      const largeForum: Forum[] = Array.from({ length: 100 }, (_, i) => ({
        content: `Forum post ${i + 1}`,
        author: i % 2 === 0 ? mockUser : mockUser2,
        createdAt: new Date(Date.now() - i * 60 * 60 * 1000).toISOString()
      }));

      const largeReviews: Review[] = Array.from({ length: 50 }, (_, i) => ({
        id: `${i + 1}`,
        user: i % 2 === 0 ? mockUser : mockUser2,
        review: `Review ${i + 1} with some detailed content`,
        rating: (i % 5) + 1,
        helpfulCount: Math.floor(Math.random() * 10),
        helpful: Math.random() > 0.5,
        userMarkedHelpful: Math.random() > 0.5,
        createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString()
      }));

      const mockOnCreateForum = jest.fn();
      const mockOnCreateReview = jest.fn();
      const mockOnToggleReviewHelpful = jest.fn();

      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <div>
            <ForumSection
              forums={largeForum}
              currentUser={mockUser}
              isVisible={true}
              onCreateForum={mockOnCreateForum}
            />
            <ReviewsSection
              reviews={largeReviews}
              currentUser={mockUser}
              isVisible={true}
              onCreateReview={mockOnCreateReview}
              onToggleReviewHelpful={mockOnToggleReviewHelpful}
            />
          </div>
        </TestWrapper>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render large datasets in reasonable time
      expect(renderTime).toBeLessThan(8000); // 8000ms threshold for initial render

      // Should still display content correctly
      expect(screen.getByText('Forum Discussion')).toBeInTheDocument();
      expect(screen.getByText('Reviews & Ratings')).toBeInTheDocument();
      expect(screen.getByText('Forum post 1')).toBeInTheDocument();
      expect(screen.getByText('Review 1 with some detailed content')).toBeInTheDocument();
    });
  });

  describe('Accessibility Integration', () => {
    test('maintains accessibility across multiple components', () => {
      const mockOnCreateForum = jest.fn();
      const mockOnCreateReview = jest.fn();
      const mockOnToggleReviewHelpful = jest.fn();

      render(
        <TestWrapper>
          <div>
            <ForumSection
              forums={[]}
              currentUser={mockUser}
              isVisible={true}
              onCreateForum={mockOnCreateForum}
            />
            <ReviewsSection
              reviews={[]}
              currentUser={mockUser}
              isVisible={true}
              onCreateReview={mockOnCreateReview}
              onToggleReviewHelpful={mockOnToggleReviewHelpful}
            />
          </div>
        </TestWrapper>
      );

      // Should have proper regions
      expect(screen.getByRole('region', { name: /forum discussion/i })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: /reviews & ratings/i })).toBeInTheDocument();

      // Should have proper form structure
      const forumForm = screen.getByTestId('forum-form');
      const reviewForm = screen.getByTestId('review-form');
      expect(forumForm).toBeInTheDocument();
      expect(reviewForm).toBeInTheDocument();

      // Should have proper labels
      expect(screen.getByLabelText('Write your forum message')).toBeInTheDocument();
      expect(screen.getByLabelText('Your Review')).toBeInTheDocument();
      expect(screen.getByLabelText('Select rating')).toBeInTheDocument();

      // Should have proper button labels
      expect(screen.getByRole('button', { name: /post message to forum/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit review/i })).toBeInTheDocument();
    });
  });
});