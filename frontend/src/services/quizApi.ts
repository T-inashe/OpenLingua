// Frontend API client for quiz operations hitting the external quiz API (BASE_API_URL)
import config from '../config';
import type { QuizQuestion, QuizData, Quiz, QuizAttempt } from '../types/quiz';

const quizFetch = async (path: string, options: RequestInit = {}): Promise<Response> => {
  const url = `${config.BASE_API_URL}${path}`;
  return fetch(url, {
    credentials: 'omit',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });
};

// Re-export types for convenience to not break existing imports
export type { QuizQuestion, QuizData, Quiz, QuizAttempt };

// TODO: [QUIZ-API] Create a new quiz for a course
export const createQuiz = async (courseId: string, quizData: QuizData): Promise<Quiz> => {
  const response = await quizFetch(`/courses/${courseId}/quizzes`, {
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
  const response = await quizFetch(`/courses/${courseId}/quizzes`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch quizzes');
  }

  return response.json();
};

// TODO: [QUIZ-API] Get a specific quiz with questions
export const getQuiz = async (courseId: string, quizId: string): Promise<Quiz> => {
  const response = await quizFetch(`/courses/${courseId}/quizzes/${quizId}`);

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
  const response = await quizFetch(`/courses/${courseId}/quizzes/${quizId}/attempts`, {
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
    ? `/courses/${courseId}/quizzes/${quizId}/attempts?userId=${userId}`
    : `/courses/${courseId}/quizzes/${quizId}/attempts`;

  const response = await quizFetch(url);

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
  const response = await quizFetch(`/courses/${courseId}/quizzes/${quizId}`, {
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
  const response = await quizFetch(`/courses/${courseId}/quizzes/${quizId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete quiz');
  }
};
