import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import QuizCreator from '../../src/components/quiz/QuizCreator';

// Simple test to check if component renders
test('QuizCreator component renders without crashing', () => {
  const mockProps = {
    courseId: 'test-course',
    onSuccess: jest.fn(),
    onCancel: jest.fn()
  };

  const { container } = render(<QuizCreator {...mockProps} />);
  
  // Just check if something renders
  expect(container).toBeTruthy();
});