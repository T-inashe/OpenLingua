import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CourseDashboard from '../src/components/courseDashboard';

// Mock config
jest.mock('../src/config', () => ({
  BACKEND_URL: 'http://localhost:3000'
}));

// Enhanced mock data
const mockCourse = {
  id: '123',
  title: 'Advanced Zulu',
  description: 'Advanced Zulu course',
  level: 'advanced',
  words: [
    { title: 'Ubuntu', content: 'Humanity towards others', type: 'philosophy' },
    { title: 'Indaba', content: 'Meeting or discussion', type: 'vocabulary' }
  ]
};

const mockForums = {
  posts: [
    {
      id: '1',
      content: 'This course helped me understand Ubuntu philosophy!',
      author: {
        id: '1',
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        avatar: 'https://example.com/avatar1.jpg'
      },
      createdAt: '2025-09-22T08:30:00Z'
    }
  ]
};

const mockReviews = {
  reviews: [
    {
      id: 'review-1',
      user: {
        id: '3',
        name: 'Emma Davis',
        email: 'emma@example.com',
        avatar: 'https://example.com/avatar3.jpg'
      },
      review: 'Outstanding course! Really helped me connect with my heritage.',
      rating: 5,
      helpfulCount: 12,
      userMarkedHelpful: false,
      createdAt: '2025-09-20T12:00:00Z'
    }
  ]
};

// Mock fetch responses for different scenarios
const mockSuccessfulFetch = () => {
  const mockFetch = jest.fn();
  global.fetch = mockFetch;
  
  mockFetch
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ course: mockCourse })
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => mockForums
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => mockReviews
    });
    
  return mockFetch;
};

const mockFailedFetch = () => {
  const mockFetch = jest.fn();
  global.fetch = mockFetch;
  
  mockFetch
    .mockRejectedValueOnce(new Error('Network error'))
    .mockRejectedValueOnce(new Error('Server error'))
    .mockRejectedValueOnce(new Error('Database error'));
    
  return mockFetch;
};

describe('CourseDashboard Integration Tests', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    // Reset console.error to avoid noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter initialEntries={["/course/123/789"]}>
        <Routes>
          <Route path="/course/:id/:uid" element={<CourseDashboard />} />
        </Routes>
      </MemoryRouter>
    );
  };

  describe('Successful Data Loading', () => {
    it('loads and displays all course data correctly', async () => {
      const mockFetch = mockSuccessfulFetch();
      renderComponent();

      // Should show loading first
      expect(screen.getByText('Loading course content...')).toBeInTheDocument();

      // Wait for course data to load
      await waitFor(() => {
        expect(screen.getByText('Welcome To Advanced Zulu')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Verify API calls were made
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/courses/123', expect.any(Object));
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/forum/123', expect.any(Object));
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/courses/reviews/123', expect.any(Object));

      // Check vocabulary section
      expect(screen.getByText('📚 Vocabulary (2 words)')).toBeInTheDocument();
      expect(screen.getByText('Ubuntu')).toBeInTheDocument();
      expect(screen.getByText('Humanity towards others')).toBeInTheDocument();

      // Check forum posts
      expect(screen.getByText('This course helped me understand Ubuntu philosophy!')).toBeInTheDocument();
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();

      // Check reviews
      expect(screen.getByText('Outstanding course! Really helped me connect with my heritage.')).toBeInTheDocument();
      expect(screen.getByText('Emma Davis')).toBeInTheDocument();
    });

    it('handles translation workflow end-to-end', async () => {
      const mockFetch = mockSuccessfulFetch();
      // Add translation response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ translatedText: 'Sawubona' })
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Welcome To Advanced Zulu')).toBeInTheDocument();
      });

      const translationInput = screen.getByPlaceholderText('Enter text to translate');
      const translateButton = screen.getByRole('button', { name: /translate text/i });

      // Initially disabled
      expect(translateButton).toBeDisabled();

      // Type text
      await user.type(translationInput, 'Hello');
      expect(translateButton).not.toBeDisabled();

      // Submit translation
      await user.click(translateButton);

      // Check loading state
      expect(translateButton).toBeDisabled();

      // Wait for result
      await waitFor(() => {
        expect(screen.getByText('Translation:')).toBeInTheDocument();
        expect(screen.getByText('Sawubona')).toBeInTheDocument();
      });
    });

    it('handles forum posting workflow', async () => {
      const mockFetch = mockSuccessfulFetch();
      // Add forum post response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      // Mock alert
      window.alert = jest.fn();

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Welcome To Advanced Zulu')).toBeInTheDocument();
      });

      const forumTextarea = screen.getByLabelText('Write your forum message');
      const postButton = screen.getByRole('button', { name: /post message to forum/i });

      // Initially disabled
      expect(postButton).toBeDisabled();

      // Type message
      const testMessage = 'Great discussion about Ubuntu philosophy!';
      await user.type(forumTextarea, testMessage);

      // Character count updates
      expect(screen.getByText('42/500 characters')).toBeInTheDocument();

      // Button enabled
      expect(postButton).not.toBeDisabled();

      // Submit
      await user.click(postButton);

      // Verify API call
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/forum/123',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ content: testMessage, userId: '789' })
          })
        );
      });
    });

    it('handles review submission workflow', async () => {
      const mockFetch = mockSuccessfulFetch();
      // Add review response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      window.alert = jest.fn();

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Welcome To Advanced Zulu')).toBeInTheDocument();
      });

      const reviewTextarea = screen.getByLabelText('Your Review');
      const ratingSelect = screen.getByLabelText('Select rating');
      const submitButton = screen.getByRole('button', { name: /submit review/i });

      // Initially disabled
      expect(submitButton).toBeDisabled();

      // Fill form
      const reviewText = 'Amazing course with deep cultural insights!';
      await user.type(reviewTextarea, reviewText);
      await user.selectOptions(ratingSelect, '5');

      // Button enabled
      expect(submitButton).not.toBeDisabled();

      // Submit
      await user.click(submitButton);

      // Verify API call
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/courses/reviews',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              courseId: '123',
              review: reviewText,
              rating: 5,
              userId: '789'
            })
          })
        );
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('gracefully handles API failures', async () => {
      const mockFetch = mockFailedFetch();
      renderComponent();

      // Should still render basic structure
      expect(screen.getByText('OpenLingua')).toBeInTheDocument();

      // Wait for error handling
      await waitFor(() => {
        expect(screen.getByText('Language Translator')).toBeInTheDocument();
      });

      // Verify error logs (mocked)
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('handles translation errors', async () => {
      const mockFetch = mockSuccessfulFetch();
      // Add failed translation
      mockFetch.mockRejectedValueOnce(new Error('Translation service unavailable'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Welcome To Advanced Zulu')).toBeInTheDocument();
      });

      const translationInput = screen.getByPlaceholderText('Enter text to translate');
      const translateButton = screen.getByRole('button', { name: /translate text/i });

      await user.type(translationInput, 'Hello');
      await user.click(translateButton);

      await waitFor(() => {
        expect(screen.getByText('Error fetching translation')).toBeInTheDocument();
      });
    });

    it('handles form submission errors', async () => {
      const mockFetch = mockSuccessfulFetch();
      // Add failed forum post
      mockFetch.mockRejectedValueOnce(new Error('Server error'));

      window.alert = jest.fn();

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Welcome To Advanced Zulu')).toBeInTheDocument();
      });

      const forumTextarea = screen.getByLabelText('Write your forum message');
      const postButton = screen.getByRole('button', { name: /post message to forum/i });

      await user.type(forumTextarea, 'Test message');
      await user.click(postButton);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Something went wrong while creating the forum post.');
      });
    });
  });

  describe('User Experience Integration', () => {
    it('provides comprehensive form validation feedback', async () => {
      mockSuccessfulFetch();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Welcome To Advanced Zulu')).toBeInTheDocument();
      });

      // Test all form validations work together
      const translationInput = screen.getByPlaceholderText('Enter text to translate');
      const forumTextarea = screen.getByLabelText('Write your forum message');
      const reviewTextarea = screen.getByLabelText('Your Review');

      // All buttons start disabled
      expect(screen.getByRole('button', { name: /translate text/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /post message to forum/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /submit review/i })).toBeDisabled();

      // Fill forms progressively
      await user.type(translationInput, 'Test');
      expect(screen.getByRole('button', { name: /translate text/i })).not.toBeDisabled();

      await user.type(forumTextarea, 'Forum message');
      expect(screen.getByText('13/500 characters')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /post message to forum/i })).not.toBeDisabled();

      await user.type(reviewTextarea, 'Review text');
      expect(screen.getByText('11/500 characters')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit review/i })).not.toBeDisabled();
    });

    it('handles events sidebar complete workflow', async () => {
      mockSuccessfulFetch();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Welcome To Advanced Zulu')).toBeInTheDocument();
      });

      // Open sidebar
      const calendarButton = screen.getByRole('button', { name: /open events calendar/i });
      await user.click(calendarButton);

      // Verify events are shown
      expect(screen.getByText('Upcoming Events')).toBeInTheDocument();
      expect(screen.getByText('Zulu Live Q&A')).toBeInTheDocument();

      // Join event (local state update)
      const joinButtons = screen.getAllByText('👋 Join Event');
      await user.click(joinButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('✅ Attending')).toBeInTheDocument();
      });

      // Close sidebar
      const closeButton = screen.getByRole('button', { name: /close events sidebar/i });
      await user.click(closeButton);

      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toHaveAttribute('aria-hidden', 'true');
    });

    it('handles lesson progression workflow', async () => {
      mockSuccessfulFetch();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Welcome To Advanced Zulu')).toBeInTheDocument();
      });

      // Mark vocabulary as learned
      const learnButtons = screen.getAllByText('📖 Mark as Learned');
      expect(learnButtons).toHaveLength(2);

      await user.click(learnButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('✓ Learned')).toBeInTheDocument();
      });

      // Start structured lesson
      const startButtons = screen.getAllByText('▶️ Start Lesson');
      await user.click(startButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('✓ Completed')).toBeInTheDocument();
        expect(screen.getByText('🔄 Review')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility Integration', () => {
    it('maintains proper accessibility throughout user interactions', async () => {
      mockSuccessfulFetch();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Welcome To Advanced Zulu')).toBeInTheDocument();
      });

      // Verify ARIA structure is maintained
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: /language translator/i })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: /course lessons/i })).toBeInTheDocument();

      // Test keyboard navigation flow
      const firstInput = screen.getByPlaceholderText('Enter text to translate');
      firstInput.focus();
      expect(firstInput).toHaveFocus();

      // Tab navigation should work
      await user.tab();
      expect(screen.getByLabelText('Source language')).toHaveFocus();
    });

    it('provides proper screen reader feedback for state changes', async () => {
      mockSuccessfulFetch();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Welcome To Advanced Zulu')).toBeInTheDocument();
      });

      // Check aria-live regions exist
      const forumSection = screen.getByRole('feed', { name: /forum messages/i });
      expect(forumSection).toHaveAttribute('aria-live', 'polite');

      // Check button states have proper ARIA
      const markButtons = screen.getAllByText('📖 Mark as Learned');
      await user.click(markButtons[0]);

      const completedButton = screen.getByText('✓ Learned');
      expect(completedButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Performance Integration', () => {
    it('handles concurrent user actions without conflicts', async () => {
      const mockFetch = mockSuccessfulFetch();
      // Add multiple async responses
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ translatedText: 'Response' })
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Welcome To Advanced Zulu')).toBeInTheDocument();
      });

      // Perform multiple actions simultaneously
      const translationInput = screen.getByPlaceholderText('Enter text to translate');
      const forumTextarea = screen.getByLabelText('Write your forum message');
      
      // Fill forms simultaneously
      await Promise.all([
        user.type(translationInput, 'Test translation'),
        user.type(forumTextarea, 'Test forum message')
      ]);

      // Both should be valid
      expect(screen.getByRole('button', { name: /translate text/i })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: /post message to forum/i })).not.toBeDisabled();
    });

    it('maintains responsive UI during data loading', async () => {
      // Simulate slow loading
      const mockFetch = jest.fn();
      global.fetch = mockFetch;
      
      let resolvePromises: Array<(value: any) => void> = [];
      const createDelayedPromise = () => {
        return new Promise(resolve => {
          resolvePromises.push(resolve);
        });
      };

      mockFetch
        .mockReturnValueOnce(createDelayedPromise())
        .mockReturnValueOnce(createDelayedPromise())
        .mockReturnValueOnce(createDelayedPromise());

      renderComponent();

      // Should show loading immediately
      expect(screen.getByText('Loading course content...')).toBeInTheDocument();

      // UI should still be responsive
      expect(screen.getByText('OpenLingua')).toBeInTheDocument();
      expect(screen.getByText('Language Translator')).toBeInTheDocument();

      // Resolve promises to complete test
      resolvePromises.forEach(resolve => {
        resolve({
          ok: true,
          json: async () => ({ course: mockCourse, posts: [], reviews: [] })
        });
      });

      await waitFor(() => {
        expect(screen.queryByText('Loading course content...')).not.toBeInTheDocument();
      });
    });
  });
});