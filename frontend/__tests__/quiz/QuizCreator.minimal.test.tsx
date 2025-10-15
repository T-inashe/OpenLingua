import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock lucide-react
jest.mock('lucide-react', () => ({
  Plus: () => <div data-testid="plus-icon">+</div>,
  Trash2: () => <div data-testid="trash-icon">×</div>,
  Save: () => <div data-testid="save-icon">💾</div>,
  X: () => <div data-testid="x-icon">×</div>,
  AlertCircle: () => <div data-testid="alert-icon">⚠</div>,
  HelpCircle: () => <div data-testid="help-icon">?</div>,
  BookOpen: () => <div data-testid="book-icon">📚</div>,
}));

// Mock the quiz service
jest.mock('../../src/services/quizService', () => ({
  __esModule: true,
  default: {
    createCourseQuiz: jest.fn(),
    updateQuiz: jest.fn(),
    getQuizDetails: jest.fn(),
  },
}));

import QuizCreator from '../../src/components/quiz/QuizCreator';

describe('QuizCreator Minimal Test', () => {
  const mockProps = {
    courseId: '123',
    onSuccess: jest.fn(),
    onCancel: jest.fn(),
  };

  test('renders without crashing', () => {
    render(<QuizCreator {...mockProps} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0); // Should have multiple buttons
  });

  test('displays title input', () => {
    render(<QuizCreator {...mockProps} />);
    expect(screen.getByPlaceholderText(/quiz title/i)).toBeInTheDocument();
  });
});