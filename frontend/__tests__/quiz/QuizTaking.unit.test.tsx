import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import QuizTaking from '../../src/components/quiz/QuizTaking';
import type { Quiz } from '../../src/types/quiz';

// Mock timers
jest.useFakeTimers();

// Mock the entire config module
jest.mock('../../src/config', () => ({
  API_BASE_URL: 'http://localhost:3000/api'
}));

// Mock fetch globally
global.fetch = jest.fn();

const mockQuiz: Quiz = {
  id: 'quiz-1',
  title: 'isiXhosa Basics Quiz',
  description: 'Test your knowledge of basic isiXhosa vocabulary',
  courseId: 'course-1',
  timeLimit: 5, // 5 minutes for testing
  questions: [
    {
      id: '1',
      question: 'What does "Sawubona" mean in English?',
      type: 'multiple-choice',
      options: ['Hello', 'Goodbye', 'Thank you', 'Please'],
      correctAnswer: 'Hello',
      points: 1,
    },
    {
      id: '2',
      question: 'Which language family does isiXhosa belong to?',
      type: 'multiple-choice',
      options: ['Niger-Congo', 'Afroasiatic', 'Indo-European', 'Sino-Tibetan'],
      correctAnswer: 'Niger-Congo',
      points: 1,
    },
  ],
  attempts: 3,
  passingScore: 80,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockQuizWithoutTimeLimit: Quiz = {
  ...mockQuiz,
  timeLimit: undefined,
};

const mockQuizWithSingleQuestion: Quiz = {
  ...mockQuiz,
  questions: [mockQuiz.questions[0]],
};

describe('QuizTaking Component', () => {
  const mockOnComplete = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
    jest.clearAllTimers();
    
    // Default mock for quiz data
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockQuiz
    });
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
  });

  describe('Quiz Initialization', () => {
    test('renders quiz title', async () => {
      render(<QuizTaking courseId="course-1" quizId="quiz-1" onComplete={mockOnComplete} onCancel={mockOnCancel} />);
      
      await waitFor(() => {
        expect(screen.getByText('isiXhosa Basics Quiz')).toBeInTheDocument();
      });
    });

    test('displays timer when time limit is set', async () => {
      render(<QuizTaking courseId="course-1" quizId="quiz-1" onComplete={mockOnComplete} onCancel={mockOnCancel} />);
      
      await waitFor(() => {
        expect(screen.getByText('5:00')).toBeInTheDocument();
      });
    });

    test('does not display timer when no time limit is set', async () => {
      // Mock quiz without time limit
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockQuizWithoutTimeLimit
      });
      
      render(<QuizTaking courseId="course-1" quizId="quiz-1" onComplete={mockOnComplete} onCancel={mockOnCancel} />);
      
      await waitFor(() => {
        expect(screen.queryByText(/Time Remaining/)).not.toBeInTheDocument();
      });
    });

    test('displays first question initially', async () => {
      render(<QuizTaking courseId="course-1" quizId="quiz-1" onComplete={mockOnComplete} onCancel={mockOnCancel} />);
      
      await waitFor(() => {
        expect(screen.getByText('Question 1 of 2')).toBeInTheDocument();
        expect(screen.getByText('What does "Sawubona" mean in English?')).toBeInTheDocument();
      });
    });

    test('displays all answer options for current question', async () => {
      render(<QuizTaking courseId="course-1" quizId="quiz-1" onComplete={mockOnComplete} onCancel={mockOnCancel} />);
      
      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
        expect(screen.getByText('Goodbye')).toBeInTheDocument();
        expect(screen.getByText('Thank you')).toBeInTheDocument();
        expect(screen.getByText('Please')).toBeInTheDocument();
      });
    });
  });

  describe('Timer Functionality', () => {
    test('timer counts down correctly', async () => {
      render(<QuizTaking courseId="course-1" quizId="quiz-1" onComplete={mockOnComplete} onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(screen.getByText('5:00')).toBeInTheDocument();
      });

      act(() => {
        jest.advanceTimersByTime(60000); // Advance by 1 minute
      });

      await waitFor(() => {
        expect(screen.getByText('4:00')).toBeInTheDocument();
      });
    });

    test('timer shows warning when time is low', () => {
      render(<QuizTaking quiz={mockQuiz} onComplete={mockOnComplete} onCancel={mockOnCancel} />);

      act(() => {
        jest.advanceTimersByTime(240000); // Advance to 1 minute remaining
      });

      const timerElement = screen.getByText('1:00');
      expect(timerElement).toBeInTheDocument();
      expect(timerElement.closest('div')).toHaveClass('text-red-400');
    });

    test('automatically submits quiz when time runs out', () => {
      render(<QuizTaking quiz={mockQuiz} onComplete={mockOnComplete} onCancel={mockOnCancel} />);

      act(() => {
        jest.advanceTimersByTime(300000); // Advance by 5 minutes (full time)
      });

      expect(mockOnComplete).toHaveBeenCalledWith(expect.any(Object));
    });

    test('clears timer when quiz is completed manually', () => {
      render(<QuizTaking quiz={mockQuiz} onComplete={mockOnComplete} onCancel={mockOnCancel} />);

      // Answer both questions
      fireEvent.click(screen.getByText('Hello'));
      fireEvent.click(screen.getByText('Next'));
      fireEvent.click(screen.getByText('Niger-Congo'));
      
      // Click the submit button at the bottom of the quiz (not in sidebar)
      const submitButtons = screen.getAllByText('Submit Quiz');
      fireEvent.click(submitButtons[1]); // Bottom button

      // Timer should be cleared
      act(() => {
        jest.advanceTimersByTime(60000);
      });

      // Quiz should already be completed, timer shouldn't trigger another completion
      expect(mockOnComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('Question Navigation', () => {
    test('can navigate to next question after selecting answer', () => {
      render(<QuizTaking quiz={mockQuiz} onComplete={mockOnComplete} onCancel={mockOnCancel} />);

      fireEvent.click(screen.getByText('Hello'));
      fireEvent.click(screen.getByText('Next'));

      expect(screen.getByText('Question 2 of 2')).toBeInTheDocument();
      expect(screen.getByText('Which language family does isiXhosa belong to?')).toBeInTheDocument();
    });

    test('next button is available when no answer is selected', () => {
      render(<QuizTaking quiz={mockQuiz} onComplete={mockOnComplete} onCancel={mockOnCancel} />);

      const nextButton = screen.getByText('Next');
      expect(nextButton).not.toBeDisabled();
    });

    test('next button is enabled after selecting answer', () => {
      render(<QuizTaking quiz={mockQuiz} onComplete={mockOnComplete} onCancel={mockOnCancel} />);

      fireEvent.click(screen.getByText('Hello'));
      
      const nextButton = screen.getByText('Next');
      expect(nextButton).not.toBeDisabled();
    });

    test('can navigate back to previous question', () => {
      render(<QuizTaking quiz={mockQuiz} onComplete={mockOnComplete} onCancel={mockOnCancel} />);

      // Go to second question
      fireEvent.click(screen.getByText('Hello'));
      fireEvent.click(screen.getByText('Next'));

      // Go back to first question
      fireEvent.click(screen.getByText('Previous'));

      expect(screen.getByText('Question 1 of 2')).toBeInTheDocument();
      expect(screen.getByText('What does "Sawubona" mean in English?')).toBeInTheDocument();
    });

    test('previous button is hidden on first question', () => {
      render(<QuizTaking quiz={mockQuiz} onComplete={mockOnComplete} onCancel={mockOnCancel} />);

      expect(screen.queryByText('Previous')).not.toBeInTheDocument();
    });

    test('shows submit button on last question', () => {
      render(<QuizTaking quiz={mockQuiz} onComplete={mockOnComplete} onCancel={mockOnCancel} />);

      // Navigate to last question
      fireEvent.click(screen.getByText('Hello'));
      fireEvent.click(screen.getByText('Next'));

      expect(screen.getAllByText('Submit Quiz')).toHaveLength(2);
    });
  });

  describe('Answer Selection', () => {
    test('can select an answer option', () => {
      render(<QuizTaking quiz={mockQuiz} onComplete={mockOnComplete} onCancel={mockOnCancel} />);

      const helloOption = screen.getByText('Hello');
      fireEvent.click(helloOption);

      // Check that the radio input is selected
      const helloRadio = screen.getByRole('radio', { name: /Hello/ });
      expect(helloRadio).toBeChecked();
    });

    test('can change selected answer', () => {
      render(<QuizTaking quiz={mockQuiz} onComplete={mockOnComplete} onCancel={mockOnCancel} />);

      // Select first option
      fireEvent.click(screen.getByText('Hello'));
      let helloRadio = screen.getByRole('radio', { name: /Hello/ });
      expect(helloRadio).toBeChecked();

      // Select different option
      fireEvent.click(screen.getByText('Goodbye'));
      let goodbyeRadio = screen.getByRole('radio', { name: /Goodbye/ });
      expect(goodbyeRadio).toBeChecked();
      
      // First option should no longer be selected
      helloRadio = screen.getByRole('radio', { name: /Hello/ });
      expect(helloRadio).not.toBeChecked();
    });

    test('preserves answers when navigating between questions', () => {
      render(<QuizTaking quiz={mockQuiz} onComplete={mockOnComplete} onCancel={mockOnCancel} />);

      // Answer first question
      fireEvent.click(screen.getByText('Hello'));
      fireEvent.click(screen.getByText('Next'));

      // Answer second question
      fireEvent.click(screen.getByText('Niger-Congo'));
      fireEvent.click(screen.getByText('Previous'));

      // First question answer should be preserved
      const helloRadio = screen.getByRole('radio', { name: /Hello/ });
      expect(helloRadio).toBeChecked();
    });
  });

  describe('Quiz Completion', () => {
    test('submits quiz with correct answers and score', () => {
      render(<QuizTaking quiz={mockQuiz} onComplete={mockOnComplete} onCancel={mockOnCancel} />);

      // Answer first question correctly
      fireEvent.click(screen.getByText('Hello'));
      fireEvent.click(screen.getByText('Next'));

      // Answer second question correctly
      fireEvent.click(screen.getByText('Niger-Congo'));
      
      // Click the submit button at the bottom of the quiz (not in sidebar)
      const submitButtons = screen.getAllByText('Submit Quiz');
      fireEvent.click(submitButtons[1]); // Bottom button

      expect(mockOnComplete).toHaveBeenCalledWith(expect.objectContaining({
        quizId: 'quiz-1',
        score: 100,
        totalQuestions: 2,
      }));
    });

    test('calculates score correctly with mixed answers', () => {
      render(<QuizTaking quiz={mockQuiz} onComplete={mockOnComplete} onCancel={mockOnCancel} />);

      // Answer first question correctly
      fireEvent.click(screen.getByText('Hello'));
      fireEvent.click(screen.getByText('Next'));

      // Answer second question incorrectly
      fireEvent.click(screen.getByText('Afroasiatic'));
      
      // Click the submit button at the bottom of the quiz (not in sidebar)
      const submitButtons = screen.getAllByText('Submit Quiz');
      fireEvent.click(submitButtons[1]); // Bottom button

      expect(mockOnComplete).toHaveBeenCalledWith(expect.objectContaining({
        quizId: 'quiz-1',
        score: 50,
        totalQuestions: 2,
      }));
    });

    test('handles quiz with unanswered questions', () => {
      render(<QuizTaking quiz={mockQuiz} onComplete={mockOnComplete} onCancel={mockOnCancel} />);

      // Answer only first question
      fireEvent.click(screen.getByText('Hello'));
      fireEvent.click(screen.getByText('Next'));
      
      // Submit without answering second question
      const submitButtons = screen.getAllByText('Submit Quiz');
      fireEvent.click(submitButtons[1]); // Bottom button

      expect(mockOnComplete).toHaveBeenCalledWith(expect.objectContaining({
        quizId: 'quiz-1',
        score: 50,
        totalQuestions: 2,
      }));
    });
  });

  describe('Progress Tracking', () => {
    test('displays progress bar', () => {
      render(<QuizTaking quiz={mockQuiz} onComplete={mockOnComplete} onCancel={mockOnCancel} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '2');
    });

    test('updates progress as questions are answered', () => {
      render(<QuizTaking quiz={mockQuiz} onComplete={mockOnComplete} onCancel={mockOnCancel} />);

      // Answer first question
      fireEvent.click(screen.getByText('Hello'));

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '1');
    });

    test('shows completion percentage', () => {
      render(<QuizTaking quiz={mockQuiz} onComplete={mockOnComplete} onCancel={mockOnCancel} />);

      expect(screen.getByText('0% Complete')).toBeInTheDocument();

      // Answer first question
      fireEvent.click(screen.getByText('Hello'));
      expect(screen.getByText('50% Complete')).toBeInTheDocument();
    });
  });

  describe('Single Question Quiz', () => {
    test('shows submit button immediately for single question quiz', () => {
      render(<QuizTaking quiz={mockQuizWithSingleQuestion} onComplete={mockOnComplete} onCancel={mockOnCancel} />);

      expect(screen.getByText('Submit Quiz')).toBeInTheDocument();
      expect(screen.queryByText('Next')).not.toBeInTheDocument();
    });

    test('handles single question completion', () => {
      render(<QuizTaking quiz={mockQuizWithSingleQuestion} onComplete={mockOnComplete} onCancel={mockOnCancel} />);

      fireEvent.click(screen.getByText('Hello'));
      
      // Click the submit button (only one for single question quiz)
      fireEvent.click(screen.getByText('Submit Quiz'));

      expect(mockOnComplete).toHaveBeenCalledWith(expect.objectContaining({
        quizId: 'quiz-1',
        score: 100,
        totalQuestions: 1,
      }));
    });
  });

  describe('Accessibility', () => {
    test('has proper heading structure', async () => {
      render(<QuizTaking quiz={mockQuiz} onComplete={mockOnComplete} onCancel={mockOnCancel} />);

      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('isiXhosa Basics Quiz');

      const questionHeading = screen.getByRole('heading', { level: 2 });
      expect(questionHeading).toHaveTextContent('What does "Sawubona" mean in English?');
    });

    test('option radio inputs have proper accessibility attributes', () => {
      render(<QuizTaking quiz={mockQuiz} onComplete={mockOnComplete} onCancel={mockOnCancel} />);

      const optionInputs = screen.getAllByRole('radio');
      expect(optionInputs).toHaveLength(4);

      // Check that each radio input has proper labeling
      const helloInput = screen.getByRole('radio', { name: /Hello/ });
      const goodbyeInput = screen.getByRole('radio', { name: /Goodbye/ });
      const thankYouInput = screen.getByRole('radio', { name: /Thank you/ });
      const pleaseInput = screen.getByRole('radio', { name: /Please/ });

      [helloInput, goodbyeInput, thankYouInput, pleaseInput].forEach(input => {
        expect(input).toBeVisible();
        expect(input).not.toBeDisabled();
        expect(input).toHaveAttribute('name', 'question_1');
      });
    });

    test('navigation buttons have accessible names', () => {
      render(<QuizTaking quiz={mockQuiz} onComplete={mockOnComplete} onCancel={mockOnCancel} />);

      fireEvent.click(screen.getByText('Hello'));
      
      const nextButton = screen.getByRole('button', { name: 'Next' });
      expect(nextButton).toBeInTheDocument();
    });

    test('progress bar has proper ARIA attributes', () => {
      render(<QuizTaking quiz={mockQuiz} onComplete={mockOnComplete} onCancel={mockOnCancel} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-label', 'Quiz progress');
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '2');
    });
  });

  describe('Edge Cases', () => {
    test('handles quiz with no questions', () => {
      const emptyQuiz: Quiz = { ...mockQuiz, questions: [] };

      render(<QuizTaking quiz={emptyQuiz} onComplete={mockOnComplete} onCancel={mockOnCancel} />);

      expect(screen.getByText('This quiz has no questions.')).toBeInTheDocument();
    });

    test('handles quiz with malformed questions', () => {
      const malformedQuiz: Quiz = {
        ...mockQuiz,
        questions: [
          {
            id: '1',
            question: 'Question without options?',
            type: 'multiple-choice',
            correctAnswer: 'A',
            points: 1,
            // Missing options
          }
        ]
      };

      expect(() => 
        render(<QuizTaking quiz={malformedQuiz} onComplete={mockOnComplete} onCancel={mockOnCancel} />)
      ).not.toThrow();
    });

    test('handles extremely long question text', () => {
      const longQuestionQuiz: Quiz = {
        ...mockQuiz,
        questions: [
          {
            ...mockQuiz.questions[0],
            question: 'This is an extremely long question text that should test how the component handles very lengthy content without breaking the layout or causing any accessibility issues. '.repeat(5)
          }
        ]
      };

      render(<QuizTaking quiz={longQuestionQuiz} onComplete={mockOnComplete} onCancel={mockOnCancel} />);

      expect(screen.getByText(/This is an extremely long question/)).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    test('renders efficiently with many questions', () => {
      const manyQuestionsQuiz: Quiz = {
        ...mockQuiz,
        questions: Array.from({ length: 100 }, (_, i) => ({
          id: `${i + 1}`,
          question: `Question ${i + 1}?`,
          type: 'multiple-choice',
          options: [
            `Option A${i + 1}`,
            `Option B${i + 1}`
          ],
          correctAnswer: `Option A${i + 1}`,
          points: 1,
        }))
      };

      const start = performance.now();
      render(<QuizTaking quiz={manyQuestionsQuiz} onComplete={mockOnComplete} onCancel={mockOnCancel} />);
      const end = performance.now();

      expect(end - start).toBeLessThan(2000); // Should render in less than 2000ms
      expect(screen.getByText('Question 1 of 100')).toBeInTheDocument();
    });
  });
});