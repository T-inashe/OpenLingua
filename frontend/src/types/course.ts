export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface Word {
  title: string;
  content: string;
  type: string;
  duration?: string;
}

export interface CourseLesson {
  id: string;
  title: string;
  content: string | null;
  type: string;
  duration: number | null;
  position: number;
}

export interface CourseUnit {
  id: string;
  title: string;
  description?: string | null;
  position: number;
  lessons: CourseLesson[];
}

export interface Course {
  id: string;
  title: string;
  createdAt: string;
  description: string;
  level: string;
  words?: Word[];
  units?: CourseUnit[];
}

export interface Review {
  user: User;
  review: string;
  rating: number;
  helpfulCount: number;
  helpful: boolean;
  userMarkedHelpful: boolean;
  createdAt: string;
  id: string;
}

export interface Forum {
  content: string;
  author: User;
  createdAt: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  datetime: string;
  attendingCount: number;
  attending: boolean;
  capacity?: number;
  location?: string;
  type?: string;
}

export interface QuizOption {
  id: number;
  text: string;
}

export interface QuizQuestion {
  id: number;
  prompt: string;
  options: QuizOption[];
  correctOptionId: number;
  explanation?: string;
}

export interface QuizLessonContent {
  questions?: QuizQuestion[];
}

export interface QuizResponse {
  selectedOptionId: number;
  isCorrect: boolean;
}

export type QuizResponses = Record<string, Record<string, QuizResponse>>;