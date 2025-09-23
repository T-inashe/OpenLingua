// Quiz types for the quiz service

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'fill-in-blank' | 'matching';
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  points: number;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  courseId: string;
  questions: QuizQuestion[];
  timeLimit?: number; // in minutes
  attempts: number;
  passingScore: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Additional properties for UI display
  questionCount?: number;
  category?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  mode?: 'online' | 'offline'; // For offline mode indication
}

export interface QuizData {
  title: string;
  description: string;
  questions: Omit<QuizQuestion, 'id'>[];
  timeLimit?: number;
  attempts: number;
  passingScore: number;
  isActive: boolean;
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