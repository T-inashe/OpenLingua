import config from '../config';
import type { 
  Quiz, 
  QuizData, 
  QuizResult, 
  QuizSession, 
  QuizTemplate, 
  QuizAnalytics,
  QuizQuestion
} from '../types/quiz.ts';

class QuizService {
  private baseURL: string;

  constructor() {
    this.baseURL = config.BACKEND_URL;
  }

  // Get auth token from localStorage
  getToken(): string | null {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }

  // Get headers with auth
  getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getToken()}`
    };
  }

  // Handle API responses
  async handleResponse(response: Response): Promise<any> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    return response.json();
  }

  // ==================== QUIZ MANAGEMENT ====================

  // Create a new quiz for a course
  async createCourseQuiz(courseId: string, quizData: QuizData): Promise<Quiz> {
    try {
      const response = await fetch(`${this.baseURL}/api/courses/${courseId}/quizzes`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(quizData)
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Create quiz error:', error);
      throw error;
    }
  }

  // Get all quizzes for a course
  async getCourseQuizzes(courseId: string): Promise<Quiz[]> {
    try {
      const response = await fetch(`${this.baseURL}/api/courses/${courseId}/quizzes`, {
        headers: this.getHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get quizzes error:', error);
      throw error;
    }
  }

  // Get specific quiz details
  async getQuizDetails(courseId: string, quizId: string): Promise<Quiz> {
    try {
      const response = await fetch(`${this.baseURL}/api/courses/${courseId}/quizzes/${quizId}`, {
        headers: this.getHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get quiz details error:', error);
      throw error;
    }
  }

  // Update a quiz
  async updateQuiz(courseId: string, quizId: string, updateData: Partial<QuizData>): Promise<Quiz> {
    try {
      const response = await fetch(`${this.baseURL}/api/courses/${courseId}/quizzes/${quizId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(updateData)
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Update quiz error:', error);
      throw error;
    }
  }

  // Delete a quiz
  async deleteQuiz(courseId: string, quizId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/api/courses/${courseId}/quizzes/${quizId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Delete quiz error:', error);
      throw error;
    }
  }

  // ==================== QUIZ SESSIONS ====================

  // Start a quiz session
  async startQuizSession(quizId: string): Promise<QuizSession> {
    try {
      const response = await fetch(`${this.baseURL}/api/quiz-sessions/${quizId}/start`, {
        method: 'POST',
        headers: this.getHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Start quiz session error:', error);
      throw error;
    }
  }

  // Submit quiz answers
  async submitQuizAnswers(
    quizId: string, 
    sessionId: string, 
    answers: Record<string, string>, 
    timeSpent: number
  ): Promise<QuizResult> {
    try {
      const response = await fetch(`${this.baseURL}/api/quiz-sessions/${quizId}/submit`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          sessionId,
          answers,
          timeSpent
        })
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Submit quiz error:', error);
      throw error;
    }
  }

  // Get quiz results
  async getQuizResults(quizId: string): Promise<QuizResult[]> {
    try {
      const response = await fetch(`${this.baseURL}/api/quiz-sessions/${quizId}/results`, {
        headers: this.getHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get quiz results error:', error);
      throw error;
    }
  }

  // ==================== QUIZ SHARING & TEMPLATES ====================

  // Share quiz as template
  async shareQuizAsTemplate(
    courseId: string, 
    quizId: string, 
    shareOptions: Record<string, any> = {}
  ): Promise<QuizTemplate> {
    try {
      const response = await fetch(`${this.baseURL}/api/courses/${courseId}/quizzes/${quizId}/share`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(shareOptions)
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Share quiz error:', error);
      throw error;
    }
  }

  // Get available templates
  async getAvailableTemplates(filters: Record<string, string> = {}): Promise<QuizTemplate[]> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(`${this.baseURL}/api/quiz-templates?${queryParams}`, {
        headers: this.getHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get templates error:', error);
      throw error;
    }
  }

  // Get template details
  async getTemplateDetails(templateId: string): Promise<QuizTemplate> {
    try {
      const response = await fetch(`${this.baseURL}/api/quiz-templates/${templateId}`, {
        headers: this.getHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get template details error:', error);
      throw error;
    }
  }

  // Copy template to course
  async copyTemplateToCourse(
    courseId: string, 
    templateId: string, 
    customizations: Record<string, any> = {}
  ): Promise<Quiz> {
    try {
      const response = await fetch(`${this.baseURL}/api/courses/${courseId}/quizzes/copy-template`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          templateId,
          customizations
        })
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Copy template error:', error);
      throw error;
    }
  }

  // Unshare template
  async unshareTemplate(templateId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/api/quiz-templates/${templateId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Unshare template error:', error);
      throw error;
    }
  }

  // ==================== ANALYTICS ====================

  // Get course quiz analytics
  async getQuizAnalytics(courseId: string): Promise<QuizAnalytics> {
    try {
      const response = await fetch(`${this.baseURL}/api/courses/${courseId}/quiz-analytics`, {
        headers: this.getHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get quiz analytics error:', error);
      throw error;
    }
  }

  // Get sharing statistics
  async getSharingStats(): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/api/quiz-sharing-stats`, {
        headers: this.getHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get sharing stats error:', error);
      throw error;
    }
  }

  // Check API health
  async checkApiHealth(): Promise<{ status: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseURL}/api/quiz-health`, {
        headers: this.getHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Health check error:', error);
      return { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // ==================== UTILITY METHODS ====================

  // Show notification for offline mode
  showOfflineNotification(message: string): void {
    // You can integrate with your notification system here
    console.warn('Quiz Service - Offline Mode:', message);
  }

  // Validate quiz data before submission
  validateQuizData(quizData: QuizData): void {
    if (!quizData.title?.trim()) {
      throw new Error('Quiz title is required');
    }

    if (!quizData.questions?.length) {
      throw new Error('At least one question is required');
    }

    quizData.questions.forEach((question: Omit<QuizQuestion, 'id'>, index: number) => {
      if (!question.question?.trim()) {
        throw new Error(`Question ${index + 1}: Question text is required`);
      }

      if (!['multiple-choice', 'true-false', 'fill-in-blank', 'matching'].includes(question.type)) {
        throw new Error(`Question ${index + 1}: Invalid question type`);
      }

      if (question.type === 'multiple-choice' && (!question.options?.length || question.options.length < 2)) {
        throw new Error(`Question ${index + 1}: Multiple choice requires at least 2 options`);
      }

      if (!question.correctAnswer) {
        throw new Error(`Question ${index + 1}: Correct answer is required`);
      }
    });
  }
}

export default new QuizService();