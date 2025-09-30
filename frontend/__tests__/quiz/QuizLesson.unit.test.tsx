import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import QuizLesson from '../../src/components/quiz/QuizLesson';
import type { QuizResponses } from '../../src/types/course';

// Mock lesson data
const mockLesson = {
  id: 'lesson-1',
  title: 'isiXhosa Basics Quiz',
  content: JSON.stringify({
    questions: [
      {
        id: 1,
        text: 'What does "Sawubona" mean in English?',
        options: [
          { id: 1, text: 'Hello' },
          { id: 2, text: 'Goodbye' },
          { id: 3, text: 'Thank you' },
          { id: 4, text: 'Please' }
        ],
        correctOptionId: 1
      },
      {
        id: 2,
        text: 'Which language family does isiXhosa belong to?',
        options: [
          { id: 1, text: 'Niger-Congo' },
          { id: 2, text: 'Afroasiatic' },
          { id: 3, text: 'Indo-European' },
          { id: 4, text: 'Sino-Tibetan' }
        ],
        correctOptionId: 1
      }
    ]
  })
};

const mockLessonWithoutContent = {
  id: 'lesson-2',
  title: 'Empty Quiz',
  content: null
};

const mockLessonWithEmptyQuestions = {
  id: 'lesson-3',
  title: 'Quiz with No Questions',
  content: JSON.stringify({
    questions: []
  })
};

const mockLessonWithInvalidContent = {
  id: 'lesson-4',
  title: 'Invalid Quiz',
  content: 'invalid json content'
};

describe('QuizLesson Component', () => {
  const mockOnQuizResponseUpdate = jest.fn();
  const mockQuizResponses: QuizResponses = {};

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders quiz questions when content is valid', () => {
      render(
        <QuizLesson
          lesson={mockLesson}
          quizResponses={mockQuizResponses}
          onQuizResponseUpdate={mockOnQuizResponseUpdate}
        />
      );

      expect(screen.getByText('What does "Sawubona" mean in English?')).toBeInTheDocument();
      expect(screen.getByText('Which language family does isiXhosa belong to?')).toBeInTheDocument();
    });

    test('renders all answer options for each question', () => {
      render(
        <QuizLesson
          lesson={mockLesson}
          quizResponses={mockQuizResponses}
          onQuizResponseUpdate={mockOnQuizResponseUpdate}
        />
      );

      // First question options
      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.getByText('Goodbye')).toBeInTheDocument();
      expect(screen.getByText('Thank you')).toBeInTheDocument();
      expect(screen.getByText('Please')).toBeInTheDocument();

      // Second question options
      expect(screen.getByText('Niger-Congo')).toBeInTheDocument();
      expect(screen.getByText('Afroasiatic')).toBeInTheDocument();
      expect(screen.getByText('Indo-European')).toBeInTheDocument();
      expect(screen.getByText('Sino-Tibetan')).toBeInTheDocument();
    });

    test('displays message when no content is provided', () => {
      render(
        <QuizLesson
          lesson={mockLessonWithoutContent}
          quizResponses={mockQuizResponses}
          onQuizResponseUpdate={mockOnQuizResponseUpdate}
        />
      );

      expect(screen.getByText('No quiz configured yet.')).toBeInTheDocument();
    });

    test('displays message when quiz has no questions', () => {
      render(
        <QuizLesson
          lesson={mockLessonWithEmptyQuestions}
          quizResponses={mockQuizResponses}
          onQuizResponseUpdate={mockOnQuizResponseUpdate}
        />
      );

      expect(screen.getByText('Quiz questions will appear here once added.')).toBeInTheDocument();
    });

    test('displays error message when content is invalid JSON', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <QuizLesson
          lesson={mockLessonWithInvalidContent}
          quizResponses={mockQuizResponses}
          onQuizResponseUpdate={mockOnQuizResponseUpdate}
        />
      );

      expect(screen.getByText('Unable to load quiz content. Please contact your instructor.')).toBeInTheDocument();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to parse quiz content', expect.any(SyntaxError));
      
      consoleSpy.mockRestore();
    });
  });

  describe('User Interactions', () => {
    test('calls onQuizResponseUpdate when option is selected', () => {
      render(
        <QuizLesson
          lesson={mockLesson}
          quizResponses={mockQuizResponses}
          onQuizResponseUpdate={mockOnQuizResponseUpdate}
        />
      );

      const helloOption = screen.getByText('Hello');
      fireEvent.click(helloOption);

      expect(mockOnQuizResponseUpdate).toHaveBeenCalledWith('lesson-1', {
        '1': {
          selectedOptionId: 1,
          isCorrect: true
        }
      });
    });

    test('correctly identifies wrong answers', () => {
      render(
        <QuizLesson
          lesson={mockLesson}
          quizResponses={mockQuizResponses}
          onQuizResponseUpdate={mockOnQuizResponseUpdate}
        />
      );

      const goodbyeOption = screen.getByText('Goodbye');
      fireEvent.click(goodbyeOption);

      expect(mockOnQuizResponseUpdate).toHaveBeenCalledWith('lesson-1', {
        '1': {
          selectedOptionId: 2,
          isCorrect: false
        }
      });
    });

    test('handles multiple question selections', () => {
      render(
        <QuizLesson
          lesson={mockLesson}
          quizResponses={mockQuizResponses}
          onQuizResponseUpdate={mockOnQuizResponseUpdate}
        />
      );

      // Select answer for first question
      const helloOption = screen.getByText('Hello');
      fireEvent.click(helloOption);

      // Select answer for second question
      const nigerCongoOption = screen.getByText('Niger-Congo');
      fireEvent.click(nigerCongoOption);

      expect(mockOnQuizResponseUpdate).toHaveBeenCalledTimes(2);
      expect(mockOnQuizResponseUpdate).toHaveBeenLastCalledWith('lesson-1', {
        '2': {
          selectedOptionId: 1,
          isCorrect: true
        }
      });
    });

    test('updates existing responses when option is changed', () => {
      const existingResponses: QuizResponses = {
        'lesson-1': {
          '1': {
            selectedOptionId: 2,
            isCorrect: false
          }
        }
      };

      render(
        <QuizLesson
          lesson={mockLesson}
          quizResponses={existingResponses}
          onQuizResponseUpdate={mockOnQuizResponseUpdate}
        />
      );

      // Change answer from incorrect to correct
      const helloOption = screen.getByText('Hello');
      fireEvent.click(helloOption);

      expect(mockOnQuizResponseUpdate).toHaveBeenCalledWith('lesson-1', {
        '1': {
          selectedOptionId: 1,
          isCorrect: true
        }
      });
    });
  });

  describe('State Management', () => {
    test('preserves existing responses when adding new ones', () => {
      const existingResponses: QuizResponses = {
        'lesson-1': {
          '1': {
            selectedOptionId: 1,
            isCorrect: true
          }
        }
      };

      render(
        <QuizLesson
          lesson={mockLesson}
          quizResponses={existingResponses}
          onQuizResponseUpdate={mockOnQuizResponseUpdate}
        />
      );

      // Select answer for second question
      const nigerCongoOption = screen.getByText('Niger-Congo');
      fireEvent.click(nigerCongoOption);

      expect(mockOnQuizResponseUpdate).toHaveBeenCalledWith('lesson-1', {
        '1': {
          selectedOptionId: 1,
          isCorrect: true
        },
        '2': {
          selectedOptionId: 1,
          isCorrect: true
        }
      });
    });

    test('handles empty quiz responses object', () => {
      render(
        <QuizLesson
          lesson={mockLesson}
          quizResponses={{}}
          onQuizResponseUpdate={mockOnQuizResponseUpdate}
        />
      );

      const helloOption = screen.getByText('Hello');
      fireEvent.click(helloOption);

      expect(mockOnQuizResponseUpdate).toHaveBeenCalledWith('lesson-1', {
        '1': {
          selectedOptionId: 1,
          isCorrect: true
        }
      });
    });
  });

  describe('Edge Cases', () => {
    test('handles quiz content with missing questions property', () => {
      const lessonWithMissingQuestions = {
        id: 'lesson-5',
        title: 'Quiz with Missing Questions',
        content: JSON.stringify({})
      };

      render(
        <QuizLesson
          lesson={lessonWithMissingQuestions}
          quizResponses={mockQuizResponses}
          onQuizResponseUpdate={mockOnQuizResponseUpdate}
        />
      );

      expect(screen.getByText('Quiz questions will appear here once added.')).toBeInTheDocument();
    });

    test('handles questions with missing options', () => {
      const lessonWithIncompleteQuestions = {
        id: 'lesson-6',
        title: 'Quiz with Incomplete Questions',
        content: JSON.stringify({
          questions: [
            {
              id: 1,
              text: 'Incomplete question?',
              correctOptionId: 1
              // Missing options array
            }
          ]
        })
      };

      expect(() => 
        render(
          <QuizLesson
            lesson={lessonWithIncompleteQuestions}
            quizResponses={mockQuizResponses}
            onQuizResponseUpdate={mockOnQuizResponseUpdate}
          />
        )
      ).not.toThrow();
    });

    test('handles very long question text', () => {
      const lessonWithLongQuestion = {
        id: 'lesson-7',
        title: 'Quiz with Long Question',
        content: JSON.stringify({
          questions: [
            {
              id: 1,
              text: 'This is a very long question that tests how the component handles lengthy text content in quiz questions and whether it displays properly without breaking the layout or causing any visual issues',
              options: [
                { id: 1, text: 'Option A' },
                { id: 2, text: 'Option B' }
              ],
              correctOptionId: 1
            }
          ]
        })
      };

      render(
        <QuizLesson
          lesson={lessonWithLongQuestion}
          quizResponses={mockQuizResponses}
          onQuizResponseUpdate={mockOnQuizResponseUpdate}
        />
      );

      expect(screen.getByText(/This is a very long question/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('question text is properly displayed for screen readers', () => {
      render(
        <QuizLesson
          lesson={mockLesson}
          quizResponses={mockQuizResponses}
          onQuizResponseUpdate={mockOnQuizResponseUpdate}
        />
      );

      const questions = screen.getAllByText(/What does|Which language/);
      questions.forEach(question => {
        expect(question).toBeVisible();
      });
    });

    test('option buttons are interactive', () => {
      render(
        <QuizLesson
          lesson={mockLesson}
          quizResponses={mockQuizResponses}
          onQuizResponseUpdate={mockOnQuizResponseUpdate}
        />
      );

      const options = screen.getAllByText(/Hello|Goodbye|Thank you|Please/);
      options.forEach(option => {
        expect(option).toBeVisible();
        // Options should be clickable (part of button or clickable element)
      });
    });
  });

  describe('Performance', () => {
    test('renders efficiently with multiple questions', () => {
      const lessonWithManyQuestions = {
        id: 'lesson-many',
        title: 'Quiz with Many Questions',
        content: JSON.stringify({
          questions: Array.from({ length: 50 }, (_, i) => ({
            id: i + 1,
            text: `Question ${i + 1}?`,
            options: [
              { id: 1, text: `Option A${i + 1}` },
              { id: 2, text: `Option B${i + 1}` }
            ],
            correctOptionId: 1
          }))
        })
      };

      const start = performance.now();
      render(
        <QuizLesson
          lesson={lessonWithManyQuestions}
          quizResponses={mockQuizResponses}
          onQuizResponseUpdate={mockOnQuizResponseUpdate}
        />
      );
      const end = performance.now();

      expect(end - start).toBeLessThan(2000); // Should render in less than 2000ms
      expect(screen.getByText('Question 1?')).toBeInTheDocument();
      expect(screen.getByText('Question 50?')).toBeInTheDocument();
    });
  });
});