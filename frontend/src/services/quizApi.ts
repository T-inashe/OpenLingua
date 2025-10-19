// Frontend API client for quiz operations — route requests through backend proxy
import config from '../config';
import type { QuizQuestion, QuizData, Quiz, QuizAttempt } from '../types/quiz';

const base = config.BACKEND_URL || '';

const quizFetch = async (path: string, options: RequestInit = {}): Promise<Response> => {
  const url = `${base}/api${path}`;
  return fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });
};

export type { QuizQuestion, QuizData, Quiz, QuizAttempt };

// Create a new quiz for a course
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

// Get all quizzes for a course — normalize backend shapes for the UI
export const getCourseQuizzes = async (courseId: string): Promise<any> => {
  const response = await quizFetch(`/courses/${courseId}/quizzes`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch quizzes');
  }

  const body = await response.json();

  // Backend usually returns { quizzes: [...] } or { quizzes: [...], mode }
  if (Array.isArray(body)) {
    return body;
  }

  if (body && body.quizzes) {
    return {
      mode: body.mode || 'online',
      data: body.quizzes,
    };
  }

  // Fallback: return as-is
  return body;
};

// Get a specific quiz with questions (cached or proxied from external API)
export const getQuiz = async (courseId: string, quizId: string): Promise<Quiz> => {
  const response = await quizFetch(`/courses/${courseId}/quizzes/${quizId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch quiz');
  }

  return response.json();
};

// Start a quiz session (server will attempt external API and fall back to cached data)
export const startQuizSession = async (quizId: string): Promise<any> => {
  const response = await quizFetch(`/quiz-sessions/${quizId}/start`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to start quiz session');
  }

  return response.json();
};

// Submit a quiz attempt using server session endpoint — include sessionId when available
export const submitQuizAttempt = async (
  quizId: string,
  answers: Record<string, string>,
  startedAt: string,
  completedAt: string,
  sessionId?: string | null,
  timeSpent?: number
): Promise<QuizAttempt> => {
  const payload: any = { answers, startedAt, completedAt };
  if (sessionId) payload.sessionId = sessionId;
  if (typeof timeSpent === 'number') payload.timeSpent = timeSpent;

  const response = await quizFetch(`/quiz-sessions/${quizId}/submit`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to submit quiz');
  }

  return response.json();
};

// Get quiz attempts / results
export const getQuizAttempts = async (
  quizId: string,
  userId?: string
): Promise<{ attempts: QuizAttempt[]; maxAttempts: number; attemptsRemaining: number }> => {
  const url = `/quiz-sessions/${quizId}/results${userId ? `?userId=${userId}` : ''}`;
  const response = await quizFetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch attempts');
  }

  return response.json();
};

// Update a quiz (instructor only)
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

// Delete a quiz (instructor only)
export const deleteQuiz = async (courseId: string, quizId: string): Promise<void> => {
  const response = await quizFetch(`/courses/${courseId}/quizzes/${quizId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete quiz');
  }
};
