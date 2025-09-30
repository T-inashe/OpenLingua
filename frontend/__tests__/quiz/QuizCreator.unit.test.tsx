import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';
import '@testing-library/jest-dom';
import QuizCreator from '../../src/components/quiz/QuizCreator';
import quizService from '../../src/services/quizService';
import type { Quiz } from '../../src/types/quiz';

// Mock quizService
jest.mock('../../src/services/quizService', () => ({
  __esModule: true,
  default: {
    createCourseQuiz: jest.fn(),
    updateQuiz: jest.fn(),
    getQuizDetails: jest.fn(),
    validateQuizData: jest.fn(),
  },
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Plus: () => <div data-testid="plus-icon">+</div>,
  Trash2: () => <div data-testid="trash-icon">×</div>,
  Save: () => <div data-testid="save-icon">💾</div>,
  X: () => <div data-testid="x-icon">×</div>,
  AlertCircle: () => <div data-testid="alert-icon">!</div>,
  HelpCircle: () => <div data-testid="help-icon">?</div>,
  BookOpen: () => <div data-testid="bookopen-icon">📚</div>,
}));

// Mock global alert
global.alert = jest.fn();

const mockQuizService = quizService as jest.Mocked<typeof quizService>;

describe('QuizCreator Component - Fixed Tests', () => {
  const mockProps = {
    courseId: 'test-course-123',
    onSuccess: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockQuizService.validateQuizData.mockImplementation(() => {});
  });

  describe('Basic Rendering', () => {
    test('renders create mode correctly', () => {
      render(<QuizCreator {...mockProps} />);
      
      expect(screen.getByText('Create New Quiz')).toBeInTheDocument();
      expect(screen.getAllByText('Quiz Details')).toHaveLength(2); // Sidebar and main content
      expect(screen.getByText('Questions (0)')).toBeInTheDocument();
    });

    test('renders form fields on step 1', () => {
      render(<QuizCreator {...mockProps} />);
      
      expect(screen.getByText('Quiz Title *')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter quiz title...')).toBeInTheDocument();
      expect(screen.getByText('Time Limit (minutes)')).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Difficulty')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
    });
  });

  describe('Step Navigation', () => {
    test('starts on step 1 by default', () => {
      render(<QuizCreator {...mockProps} />);
      
      // Check step 1 is active
      expect(screen.getByText('Quiz Title *')).toBeInTheDocument();
      expect(screen.getByText('Next: Add Questions')).toBeInTheDocument();
      
      // Check step 2 is not showing questions content
      expect(screen.queryByText('Add Question')).not.toBeInTheDocument();
    });

    test('navigates to step 2 when Next button is clicked', async () => {
      const user = userEvent.setup();
      render(<QuizCreator {...mockProps} />);
      
      const nextButton = screen.getByText('Next: Add Questions');
      await user.click(nextButton);
      
      // Should now show questions content
      expect(screen.getByText('Add Question')).toBeInTheDocument();
      expect(screen.getByText('No questions added yet')).toBeInTheDocument();
      expect(screen.getByText('Previous')).toBeInTheDocument();
    });

    test('navigates back to step 1 when Previous is clicked', async () => {
      const user = userEvent.setup();
      render(<QuizCreator {...mockProps} />);
      
      // Go to step 2
      await user.click(screen.getByText('Next: Add Questions'));
      
      // Go back to step 1
      await user.click(screen.getByText('Previous'));
      
      // Should show step 1 content again
      expect(screen.getByText('Quiz Title *')).toBeInTheDocument();
      expect(screen.getByText('Next: Add Questions')).toBeInTheDocument();
      expect(screen.queryByText('Add Question')).not.toBeInTheDocument();
    });

    test('allows clicking sidebar tabs to navigate', async () => {
      const user = userEvent.setup();
      render(<QuizCreator {...mockProps} />);
      
      // Click Questions tab
      const questionsTab = screen.getByText('Questions (0)');
      await user.click(questionsTab);
      
      // Should show step 2
      expect(screen.getByText('Add Question')).toBeInTheDocument();
      
      // Click Quiz Details tab
      const detailsTab = screen.getByText('Quiz Details');
      await user.click(detailsTab);
      
      // Should show step 1
      expect(screen.getByText('Quiz Title *')).toBeInTheDocument();
    });
  });

  describe('Form Input', () => {
    test('updates quiz title when typing', async () => {
      const user = userEvent.setup();
      render(<QuizCreator {...mockProps} />);
      
      const titleInput = screen.getByPlaceholderText('Enter quiz title...');
      await user.type(titleInput, 'My Test Quiz');
      
      expect(titleInput).toHaveValue('My Test Quiz');
    });

    test('time limit input accepts numeric values', async () => {
      const user = userEvent.setup();
      render(<QuizCreator {...mockProps} />);
      
      const timeLimitInput = screen.getByDisplayValue('30');
      expect(timeLimitInput).toBeInTheDocument();
      expect(timeLimitInput).toHaveAttribute('type', 'number');
      expect(timeLimitInput).toHaveAttribute('min', '5');
      expect(timeLimitInput).toHaveAttribute('max', '180');
      expect(timeLimitInput).toHaveValue(30);
    });

    test('updates category selection', async () => {
      const user = userEvent.setup();
      render(<QuizCreator {...mockProps} />);
      
      const categorySelect = screen.getByDisplayValue('General');
      await user.selectOptions(categorySelect, 'vocabulary');
      
      expect(categorySelect).toHaveValue('vocabulary');
    });

    test('updates description', async () => {
      const user = userEvent.setup();
      render(<QuizCreator {...mockProps} />);
      
      const descriptionTextarea = screen.getByPlaceholderText('Describe what this quiz covers...');
      await user.type(descriptionTextarea, 'This is a test description');
      
      expect(descriptionTextarea).toHaveValue('This is a test description');
    });
  });

  describe('Question Management', () => {
    test('shows empty state on step 2 initially', async () => {
      const user = userEvent.setup();
      render(<QuizCreator {...mockProps} />);
      
      await user.click(screen.getByText('Next: Add Questions'));
      
      expect(screen.getByText('No questions added yet')).toBeInTheDocument();
      expect(screen.getByText('Add First Question')).toBeInTheDocument();
    });

    test('adds a question when Add Question is clicked', async () => {
      const user = userEvent.setup();
      render(<QuizCreator {...mockProps} />);
      
      await user.click(screen.getByText('Next: Add Questions'));
      await user.click(screen.getByText('Add Question'));
      
      expect(screen.getByText('Question 1')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your question...')).toBeInTheDocument();
      expect(screen.getByText('Question Type')).toBeInTheDocument();
    });

    test('adds multiple questions', async () => {
      const user = userEvent.setup();
      render(<QuizCreator {...mockProps} />);
      
      await user.click(screen.getByText('Next: Add Questions'));
      await user.click(screen.getByText('Add Question'));
      await user.click(screen.getByText('Add Question'));
      
      expect(screen.getByText('Question 1')).toBeInTheDocument();
      expect(screen.getByText('Question 2')).toBeInTheDocument();
      expect(screen.getByText('Questions (2)')).toBeInTheDocument();
    });

    test('deletes a question when delete button is clicked', async () => {
      const user = userEvent.setup();
      render(<QuizCreator {...mockProps} />);
      
      await user.click(screen.getByText('Next: Add Questions'));
      await user.click(screen.getByText('Add Question'));
      await user.click(screen.getByText('Add Question'));
      
      // Delete the first question
      const deleteButtons = screen.getAllByTestId('trash-icon');
      await user.click(deleteButtons[0]);
      
      // Should now only have one question
      expect(screen.getByText('Question 1')).toBeInTheDocument();
      expect(screen.queryByText('Question 2')).not.toBeInTheDocument();
      expect(screen.getByText('Questions (1)')).toBeInTheDocument();
    });

    test('renders question text input correctly', async () => {
      const user = userEvent.setup();
      render(<QuizCreator {...mockProps} />);
      
      await user.click(screen.getByText('Next: Add Questions'));
      await user.click(screen.getByText('Add Question'));
      
      const questionInput = screen.getByPlaceholderText('Enter your question...');
      expect(questionInput).toBeInTheDocument();
      expect(questionInput.tagName).toBe('TEXTAREA');
      expect(questionInput).toHaveAttribute('rows', '3');
    });

    test('changes question type', async () => {
      const user = userEvent.setup();
      render(<QuizCreator {...mockProps} />);
      
      await user.click(screen.getByText('Next: Add Questions'));
      await user.click(screen.getByText('Add Question'));
      
      const typeSelect = screen.getByDisplayValue('☰ Multiple Choice');
      await user.selectOptions(typeSelect, 'true-false');
      
      expect(typeSelect).toHaveValue('true-false');
      expect(screen.getByText('True')).toBeInTheDocument();
      expect(screen.getByText('False')).toBeInTheDocument();
    });

    test('renders multiple choice options correctly', async () => {
      const user = userEvent.setup();
      render(<QuizCreator {...mockProps} />);
      
      await user.click(screen.getByText('Next: Add Questions'));
      await user.click(screen.getByText('Add Question'));
      
      // Check all four option inputs are present
      expect(screen.getByPlaceholderText('Option A')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Option B')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Option C')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Option D')).toBeInTheDocument();
      
      // Check radio buttons for correct answers are present
      const radioButtons = screen.getAllByRole('radio');
      expect(radioButtons).toHaveLength(4);
    });
  });

  describe('Quiz Submission', () => {
    test('calls createCourseQuiz when quiz is submitted with questions', async () => {
      const user = userEvent.setup();
      const mockQuizId = 'quiz-123';
      mockQuizService.createCourseQuiz.mockResolvedValue({ id: mockQuizId } as any);
      
      render(<QuizCreator {...mockProps} />);
      
      // Add a question (this enables the submit button)
      await user.click(screen.getByText('Next: Add Questions'));
      await user.click(screen.getByText('Add Question'));
      
      // Submit - should call the service even with empty question text
      await user.click(screen.getByText('Create Quiz'));
      
      await waitFor(() => {
        expect(mockQuizService.createCourseQuiz).toHaveBeenCalledWith(
          'test-course-123',
          expect.objectContaining({
            title: '',  // Empty title is fine for this test
            questions: expect.arrayContaining([
              expect.objectContaining({
                question: '',  // Empty question text is fine for this test
                type: 'multiple-choice',
                options: ['', '', '', '']
              })
            ])
          })
        );
      });
      
      expect(global.alert).toHaveBeenCalledWith('Quiz created successfully!');
      expect(mockProps.onSuccess).toHaveBeenCalled();
    });

    test('handles API errors', async () => {
      const user = userEvent.setup();
      mockQuizService.createCourseQuiz.mockRejectedValue(new Error('Network error'));
      
      render(<QuizCreator {...mockProps} />);
      
      // Fill in title
      await user.type(screen.getByPlaceholderText('Enter quiz title...'), 'Test Quiz');
      
      // Add a question
      await user.click(screen.getByText('Next: Add Questions'));
      await user.click(screen.getByText('Add Question'));
      await user.type(screen.getByPlaceholderText('Enter your question...'), 'Test question?');
      
      // Submit
      await user.click(screen.getByText('Create Quiz'));
      
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    test('disables create button when no questions', () => {
      render(<QuizCreator {...mockProps} />);
      
      const createButton = screen.getByText('Create Quiz');
      expect(createButton).toBeDisabled();
    });

    test('enables create button when questions exist', async () => {
      const user = userEvent.setup();
      render(<QuizCreator {...mockProps} />);
      
      await user.click(screen.getByText('Next: Add Questions'));
      await user.click(screen.getByText('Add Question'));
      
      const createButton = screen.getByText('Create Quiz');
      expect(createButton).not.toBeDisabled();
    });
  });

  describe('Edit Mode', () => {
    const mockExistingQuiz: Quiz = {
      id: 'quiz-123',
      title: 'Existing Quiz',
      description: 'Test description',
      category: 'vocabulary',
      difficulty: 'intermediate',
      timeLimit: 45,
      questions: [
        {
          id: 'q1',
          question: 'What is hello in Spanish?',
          type: 'multiple-choice',
          options: ['Hola', 'Bonjour', 'Guten Tag', 'Ciao'],
          correctAnswer: 'Hola',
          explanation: 'Hola is Spanish for hello',
          points: 1
        }
      ],
      courseId: 'test-course-123',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      attempts: 3,
      passingScore: 70,
      isActive: true
    };

    test('renders in edit mode', () => {
      render(<QuizCreator {...mockProps} existingQuiz={mockExistingQuiz} />);
      
      expect(screen.getByText('Edit Quiz')).toBeInTheDocument();
      expect(screen.getByText('Update Quiz')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Existing Quiz')).toBeInTheDocument();
    });

    test('loads existing quiz data', () => {
      render(<QuizCreator {...mockProps} existingQuiz={mockExistingQuiz} />);
      
      expect(screen.getByDisplayValue('Existing Quiz')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Vocabulary')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Intermediate')).toBeInTheDocument();
      expect(screen.getByDisplayValue('45')).toBeInTheDocument();
    });

    test('shows existing questions', async () => {
      const user = userEvent.setup();
      render(<QuizCreator {...mockProps} existingQuiz={mockExistingQuiz} />);
      
      await user.click(screen.getByText('Questions (1)'));
      
      expect(screen.getByDisplayValue('What is hello in Spanish?')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Hola')).toBeInTheDocument();
    });

    test('updates existing quiz', async () => {
      const user = userEvent.setup();
      mockQuizService.updateQuiz.mockResolvedValue({} as any);
      
      render(<QuizCreator {...mockProps} existingQuiz={mockExistingQuiz} />);
      
      // Modify title
      const titleInput = screen.getByDisplayValue('Existing Quiz');
      await user.clear(titleInput);
      await user.type(titleInput, 'Modified Quiz');
      
      // Submit
      await user.click(screen.getByText('Update Quiz'));
      
      await waitFor(() => {
        expect(mockQuizService.updateQuiz).toHaveBeenCalledWith(
          'test-course-123',
          'quiz-123',
          expect.objectContaining({
            title: 'Modified Quiz'
          })
        );
      });
      
      expect(global.alert).toHaveBeenCalledWith('Quiz updated successfully!');
      expect(mockProps.onSuccess).toHaveBeenCalled();
    });
  });

  describe('Cancel Functionality', () => {
    test('calls onCancel when Cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<QuizCreator {...mockProps} />);
      
      await user.click(screen.getByText('Cancel'));
      
      expect(mockProps.onCancel).toHaveBeenCalled();
    });

    test('calls onCancel when X button is clicked', async () => {
      const user = userEvent.setup();
      render(<QuizCreator {...mockProps} />);
      
      await user.click(screen.getByTestId('x-icon'));
      
      expect(mockProps.onCancel).toHaveBeenCalled();
    });
  });
});