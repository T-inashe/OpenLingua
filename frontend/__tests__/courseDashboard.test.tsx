import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CourseDashboard from '../src/components/courseDashboard';

// Mock config
jest.mock('../src/config', () => ({
  BACKEND_URL: 'http://localhost:3000'
}));

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock data
const mockCourse = {
  id: '123',
  title: 'Zulu Basics',
  description: 'Learn basic Zulu',
  level: 'beginner',
  words: [
    { title: 'Hello', content: 'Sawubona', type: 'vocabulary' },
    { title: 'Thank you', content: 'Ngiyabonga', type: 'vocabulary' }
  ]
};

const mockForums = {
  posts: [
    {
      id: '1',
      content: 'Great course!',
      author: { id: '1', name: 'John', email: 'john@test.com', avatar: 'avatar1.jpg' },
      createdAt: '2025-09-20T10:00:00Z'
    }
  ]
};

const mockReviews = {
  reviews: [
    {
      id: '1',
      user: { id: '1', name: 'Jane', email: 'jane@test.com', avatar: 'avatar2.jpg' },
      review: 'Excellent course!',
      rating: 5,
      helpfulCount: 3,
      userMarkedHelpful: false,
      createdAt: '2025-09-19T15:00:00Z'
    }
  ]
};

describe('CourseDashboard', () => {
  const user = userEvent.setup();
  
  beforeEach(() => {
    // Reset all mocks
    mockFetch.mockClear();
    
    // Setup default fetch responses
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter initialEntries={["/course/123/456"]}>
        <Routes>
          <Route path="/course/:id/:uid" element={<CourseDashboard />} />
        </Routes>
      </MemoryRouter>
    );
  };

  describe('Initial Rendering', () => {
    it('renders course dashboard shell with loading state', async () => {
      renderComponent();
      
      // Should show loading initially
      expect(screen.getByText('Loading course content...')).toBeInTheDocument();
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Welcome To Zulu Basics')).toBeInTheDocument();
      });
    });

    it('renders all main sections', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Language Translator')).toBeInTheDocument();
        expect(screen.getByText('Course Lessons')).toBeInTheDocument();
        expect(screen.getByText('Forum Discussion')).toBeInTheDocument();
        expect(screen.getByText('Reviews & Ratings')).toBeInTheDocument();
      });
    });

    it('makes correct API calls on mount', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(3);
        expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/courses/123', expect.any(Object));
        expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/forum/123', expect.any(Object));
        expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/courses/reviews/123', expect.any(Object));
      });
    });
  });

  describe('Translation Feature', () => {
    it('allows user to enter text and translate', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ translatedText: 'Sawubona' })
      });

      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Welcome To Zulu Basics')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Enter text to translate');
      const translateButton = screen.getByRole('button', { name: /translate text/i });

      await user.type(input, 'Hello');
      await user.click(translateButton);

      await waitFor(() => {
        expect(screen.getByText('Sawubona')).toBeInTheDocument();
      });
    });

    it('disables translate button when input is empty', async () => {
      renderComponent();
      
      await waitFor(() => {
        const translateButton = screen.getByRole('button', { name: /translate text/i });
        expect(translateButton).toBeDisabled();
      });
    });

    it('shows loading state during translation', async () => {
      let resolveTranslation: (value: any) => void;
      const translationPromise = new Promise(resolve => {
        resolveTranslation = resolve;
      });
      
      mockFetch.mockReturnValueOnce(translationPromise as Promise<Response>);

      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Welcome To Zulu Basics')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Enter text to translate');
      const translateButton = screen.getByRole('button', { name: /translate text/i });

      await user.type(input, 'Hello');
      await user.click(translateButton);

      // Should show loading state
      expect(screen.getByText('Translate')).toBeInTheDocument();
      expect(translateButton).toBeDisabled();

      // Resolve the promise
      resolveTranslation!({
        ok: true,
        json: async () => ({ translatedText: 'Sawubona' })
      });

      await waitFor(() => {
        expect(screen.getByText('Sawubona')).toBeInTheDocument();
      });
    });
  });

  describe('Forum Feature', () => {
    it('displays existing forum posts', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Great course!')).toBeInTheDocument();
        expect(screen.getByText('John')).toBeInTheDocument();
      });
    });

    it('allows user to post new message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Welcome To Zulu Basics')).toBeInTheDocument();
      });

      const textarea = screen.getByLabelText('Write your forum message');
      const postButton = screen.getByRole('button', { name: /post message to forum/i });

      await user.type(textarea, 'This is a test message');
      await user.click(postButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/forum/123',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ content: 'This is a test message', userId: '456' })
          })
        );
      });
    });

    it('shows character count for forum message', async () => {
      renderComponent();
      
      await waitFor(async () => {
        const textarea = screen.getByLabelText('Write your forum message');
        expect(screen.getByText('0/500 characters')).toBeInTheDocument();
        
        await user.type(textarea, 'Test');
        expect(screen.getByText('4/500 characters')).toBeInTheDocument();
      });
    });

    it('disables post button when message is empty', async () => {
      renderComponent();
      
      await waitFor(() => {
        const postButton = screen.getByRole('button', { name: /post message to forum/i });
        expect(postButton).toBeDisabled();
      });
    });
  });

  describe('Review Feature', () => {
    it('displays existing reviews', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Excellent course!')).toBeInTheDocument();
        expect(screen.getByText('Jane')).toBeInTheDocument();
        expect(screen.getByLabelText('5 out of 5 stars')).toBeInTheDocument();
      });
    });

    it('allows user to submit new review', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Welcome To Zulu Basics')).toBeInTheDocument();
      });

      const textarea = screen.getByLabelText('Your Review');
      const ratingSelect = screen.getByLabelText('Select rating');
      const submitButton = screen.getByRole('button', { name: /submit review/i });

      await user.type(textarea, 'Great learning experience!');
      await user.selectOptions(ratingSelect, '4');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/courses/reviews',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              courseId: '123',
              review: 'Great learning experience!',
              rating: 4,
              userId: '456'
            })
          })
        );
      });
    });

    it('handles helpful voting on reviews', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

      renderComponent();
      
      await waitFor(async () => {
        const helpfulButton = screen.getByRole('button', { name: /mark review as helpful/i });
        expect(helpfulButton).toBeInTheDocument();
        
        await user.click(helpfulButton);
        
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/courses/reviews/1/helpful',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ helpful: true })
          })
        );
      });
    });
  });

  describe('Lesson Feature', () => {
    it('displays course vocabulary as lessons', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('📚 Vocabulary (2 words)')).toBeInTheDocument();
        expect(screen.getByText('Hello')).toBeInTheDocument();
        expect(screen.getByText('Thank you')).toBeInTheDocument();
        expect(screen.getByText('Sawubona')).toBeInTheDocument();
        expect(screen.getByText('Ngiyabonga')).toBeInTheDocument();
      });
    });

    it('allows marking lessons as learned', async () => {
      renderComponent();
      
      await waitFor(() => {
        const markButtons = screen.getAllByText('📖 Mark as Learned');
        expect(markButtons).toHaveLength(2);
        
        fireEvent.click(markButtons[0]);
        
        // Should update to learned state
        expect(screen.getByText('✓ Learned')).toBeInTheDocument();
      });
    });

    it('displays structured lessons with progress', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('🎯 Structured Lessons (0/3 completed)')).toBeInTheDocument();
        expect(screen.getByText('Lesson 1: Basic Greetings')).toBeInTheDocument();
        expect(screen.getByText('📊 beginner')).toBeInTheDocument();
        expect(screen.getByText('🏷️ vocabulary')).toBeInTheDocument();
        expect(screen.getByText('⏱️ 15 min')).toBeInTheDocument();
      });
    });
  });

  describe('Events Sidebar', () => {
    it('opens events sidebar when calendar button is clicked', async () => {
      renderComponent();
      
      await waitFor(() => {
        const calendarButton = screen.getByRole('button', { name: /open events calendar/i });
        fireEvent.click(calendarButton);
        
        expect(screen.getByText('Upcoming Events')).toBeInTheDocument();
        expect(screen.getByText('Zulu Live Q&A')).toBeInTheDocument();
        expect(screen.getByText('Cultural Workshop')).toBeInTheDocument();
      });
    });

    it('allows attending events', async () => {
      renderComponent();
      
      await waitFor(() => {
        const calendarButton = screen.getByRole('button', { name: /open events calendar/i });
        fireEvent.click(calendarButton);
        
        const attendButtons = screen.getAllByText('👋 Join Event');
        expect(attendButtons).toHaveLength(2);
        
        fireEvent.click(attendButtons[0]);
        
        // Should update to attending state
        expect(screen.getByText('✅ Attending')).toBeInTheDocument();
      });
    });

    it('closes sidebar when close button is clicked', async () => {
      renderComponent();
      
      await waitFor(() => {
        const calendarButton = screen.getByRole('button', { name: /open events calendar/i });
        fireEvent.click(calendarButton);
        
        const closeButton = screen.getByRole('button', { name: /close events sidebar/i });
        fireEvent.click(closeButton);
        
        // Sidebar should be hidden (aria-hidden=true)
        const sidebar = screen.getByRole('complementary');
        expect(sidebar).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      // Mock failed API calls
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'));

      renderComponent();
      
      await waitFor(() => {
        // Should still render the component shell
        expect(screen.getByText('OpenLingua')).toBeInTheDocument();
      });
    });

    it('handles translation API errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Translation failed'));

      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Welcome To Zulu Basics')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Enter text to translate');
      const translateButton = screen.getByRole('button', { name: /translate text/i });

      await user.type(input, 'Hello');
      await user.click(translateButton);

      await waitFor(() => {
        expect(screen.getByText('Error fetching translation')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByRole('banner')).toBeInTheDocument();
        expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
        expect(screen.getByRole('region', { name: /language translator/i })).toBeInTheDocument();
        expect(screen.getByRole('region', { name: /course lessons/i })).toBeInTheDocument();
        expect(screen.getByRole('region', { name: /forum discussion/i })).toBeInTheDocument();
        expect(screen.getByRole('region', { name: /reviews & ratings/i })).toBeInTheDocument();
      });
    });

    it('supports keyboard navigation', async () => {
      renderComponent();
      
      await waitFor(async () => {
        const translateInput = screen.getByPlaceholderText('Enter text to translate');
        translateInput.focus();
        
        // Tab should move to translate button
        await user.tab();
        expect(screen.getByRole('button', { name: /translate text/i })).toHaveFocus();
      });
    });
  });

  describe('Form Validation', () => {
    it('validates translation input', async () => {
      renderComponent();
      
      await waitFor(() => {
        const translateButton = screen.getByRole('button', { name: /translate text/i });
        expect(translateButton).toBeDisabled();
        
        const input = screen.getByPlaceholderText('Enter text to translate');
        fireEvent.change(input, { target: { value: 'Hello' } });
        
        expect(translateButton).not.toBeDisabled();
      });
    });

    it('validates forum message length', async () => {
      renderComponent();
      
      await waitFor(() => {
        const textarea = screen.getByLabelText('Write your forum message');
        const longMessage = 'a'.repeat(501);
        
        fireEvent.change(textarea, { target: { value: longMessage } });
        
        // Should be truncated to 500 characters
        expect(textarea).toHaveValue('a'.repeat(500));
      });
    });

    it('validates review input', async () => {
      renderComponent();
      
      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /submit review/i });
        expect(submitButton).toBeDisabled();
        
        const textarea = screen.getByLabelText('Your Review');
        fireEvent.change(textarea, { target: { value: 'Great course!' } });
        
        expect(submitButton).not.toBeDisabled();
      });
    });
  });
});