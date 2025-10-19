// Centralized Quiz Types used across UI and API client

export type QuestionType =
  | 'multiple-choice'
  | 'true-false'
  | 'short-answer'
  | 'fill-in-blank'
  | 'matching';

export interface QuizQuestion {
  id: string;
  question: string;
  type: QuestionType;
  options?: string[];
  // Transport/persisted representation uses a single string
  correctAnswer: string;
  explanation?: string;
  points: number;
}

export interface QuizData {
  title: string;
  description?: string;
  questions: Omit<QuizQuestion, 'id'>[];
  timeLimit?: number; // minutes
  passingScore: number;
  maxAttempts?: number;
  // Optional metadata used by UI
  category?: string;
  difficulty?: string;
  // Optional activation flag
  isActive?: boolean;
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
  timeLimit?: number; // minutes
  passingScore: number;
  maxAttempts: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // For offline mode indication
  mode?: 'online' | 'offline';
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

export interface QuizResult {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  totalPoints: number;
  percentage: number;
  answers: Record<string, string>;
  timeSpent: number;
  completedAt: string;
  passed: boolean;
  correctAnswers: number;
  totalQuestions: number;
  questionResults?: Record<string, { correct: boolean; userAnswer: string; correctAnswer: string; }>;
}

export interface QuizSession {
  id: string;
  quizId: string;
  userId: string;
  startedAt: string;
  expiresAt?: string;
  isActive: boolean;
}

export interface QuizTemplate {
  id: string;
  title: string; // Changed from name to match UI usage
  description: string;
  questions: Omit<QuizQuestion, 'id'>[];
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  questionCount?: number; // Added for UI display
  isOwn?: boolean; // Added for ownership display
  sharedBy?: string; // Added for attribution
  originalCourse?: string; // Added for course reference
}

export interface QuizAnalytics {
  quizId: string;
  totalAttempts: number;
  averageScore: number;
  passRate: number;
  questionAnalytics: {
    questionId: string;
    correctAnswers: number;
    totalAnswers: number;
    difficulty: number;
  }[];
}