// TODO: [QUIZ-API] Frontend API client for quiz operations
// Communicates with backend proxy layer

import { apiFetch } from '../utils/api';

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  points: number;
}

export interface QuizData {
  title: string;
  description?: string;
  questions: Omit<QuizQuestion, 'id'>[];
  timeLimit?: number;
  passingScore: number;
  maxAttempts?: number;
}

export interface Quiz {
  id: string;
  externalQuizId: string;
  courseId: string;
  title: string;
  description?: string;
  category?: string;
  difficulty?: string;
  questions?: QuizQuestion[];
  questionCount?: number;
  timeLimit?: number;
  passingScore: number;
  maxAttempts: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  percentage?: number;
  answers: Record<string, string>;
  timeSpent: number;
  passed: boolean;
  startedAt: string;
  completedAt: string;
  createdAt: string;
  correctAnswers?: number;
  totalQuestions?: number;
  attemptNumber?: number;
  attemptsRemaining?: number;
}

// TODO: [QUIZ-API] Create a new quiz for a course
export const createQuiz = async (courseId: string, quizData: QuizData): Promise<Quiz> => {
  const response = await apiFetch(`/api/courses/${courseId}/quizzes`, {
    method: 'POST',
    body: JSON.stringify(quizData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create quiz');
  }

  return response.json();
};

// TODO: [QUIZ-API] Get all quizzes for a course
export const getCourseQuizzes = async (courseId: string): Promise<Quiz[]> => {
  const response = await apiFetch(`/api/courses/${courseId}/quizzes`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch quizzes');
  }

  return response.json();
};

// TODO: [QUIZ-API] Get a specific quiz with questions
export const getQuiz = async (courseId: string, quizId: string): Promise<Quiz> => {
  const response = await apiFetch(`/api/courses/${courseId}/quizzes/${quizId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch quiz');
  }

  return response.json();
};

// TODO: [QUIZ-API] Submit a quiz attempt
export const submitQuizAttempt = async (
  courseId: string,
  quizId: string,
  answers: Record<string, string>,
  startedAt: string,
  completedAt: string
): Promise<QuizAttempt> => {
  const response = await apiFetch(`/api/courses/${courseId}/quizzes/${quizId}/attempts`, {
    method: 'POST',
    body: JSON.stringify({
      answers,
      startedAt,
      completedAt,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to submit quiz');
  }

  return response.json();
};

// TODO: [QUIZ-API] Get student's quiz attempts
export const getQuizAttempts = async (
  courseId: string,
  quizId: string,
  userId?: string
): Promise<{ attempts: QuizAttempt[]; maxAttempts: number; attemptsRemaining: number }> => {
  const url = userId
    ? `/api/courses/${courseId}/quizzes/${quizId}/attempts?userId=${userId}`
    : `/api/courses/${courseId}/quizzes/${quizId}/attempts`;

  const response = await apiFetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch attempts');
  }

  return response.json();
};

// TODO: [QUIZ-API] Update a quiz (instructor only)
export const updateQuiz = async (
  courseId: string,
  quizId: string,
  updates: Partial<QuizData> & { isActive?: boolean }
): Promise<Quiz> => {
  const response = await apiFetch(`/api/courses/${courseId}/quizzes/${quizId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update quiz');
  }

  return response.json();
};

// TODO: [QUIZ-API] Delete a quiz (instructor only)
export const deleteQuiz = async (courseId: string, quizId: string): Promise<void> => {
  const response = await apiFetch(`/api/courses/${courseId}/quizzes/${quizId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete quiz');
  }
};
