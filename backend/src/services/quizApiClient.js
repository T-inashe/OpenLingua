const axios = require('axios');

class QuizApiClient {
  constructor() {
    this.client = axios.create({
      baseURL: process.env.QUIZ_API_URL || 'http://localhost:5000',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => {
        if (error.code === 'ECONNABORTED') {
          throw new QuizApiError('Quiz service timeout', 'TIMEOUT', 503);
        }
        if (error.response?.status >= 500) {
          throw new QuizApiError('Quiz service unavailable', 'SERVER_ERROR', 503);
        }
        if (error.response?.status === 404) {
          throw new QuizApiError('Quiz not found', 'NOT_FOUND', 404);
        }
        throw new QuizApiError(
          error.response?.data?.message || 'Quiz operation failed',
          'EXTERNAL_API_ERROR',
          error.response?.status || 500
        );
      }
    );
  }

  async createQuiz(quizData, courseId, instructorId) {
    try {
      const payload = {
        ...quizData,
        course_id: courseId,
        instructor_id: instructorId,
        created_via: 'openlingua_proxy'
      };

      const response = await this.client.post('/api/v1/quizzes', payload, {
        headers: {
          'X-Course-ID': courseId,
          'X-User-ID': instructorId
        }
      });

      return response.data;
    } catch (error) {
      console.error('Quiz creation failed:', error.message);
      throw error;
    }
  }

  async getQuiz(externalQuizId, courseId) {
    try {
      const response = await this.client.get(`/api/v1/quizzes/${externalQuizId}`, {
        headers: { 'X-Course-ID': courseId }
      });

      return response.data;
    } catch (error) {
      console.error('Quiz fetch failed:', error.message);
      throw error;
    }
  }

  async updateQuiz(externalQuizId, quizData, courseId, instructorId) {
    try {
      const payload = {
        ...quizData,
        course_id: courseId,
        instructor_id: instructorId
      };

      const response = await this.client.put(`/api/v1/quizzes/${externalQuizId}`, payload, {
        headers: {
          'X-Course-ID': courseId,
          'X-User-ID': instructorId
        }
      });

      return response.data;
    } catch (error) {
      console.error('Quiz update failed:', error.message);
      throw error;
    }
  }

  async deleteQuiz(externalQuizId, courseId, instructorId) {
    try {
      const response = await this.client.delete(`/api/v1/quizzes/${externalQuizId}`, {
        headers: {
          'X-Course-ID': courseId,
          'X-User-ID': instructorId
        }
      });

      return response.data;
    } catch (error) {
      console.error('Quiz deletion failed:', error.message);
      throw error;
    }
  }

  async startQuizSession(externalQuizId, studentId, courseId) {
    try {
      const response = await this.client.post(`/api/v1/quiz-sessions/start/${externalQuizId}`, {
        student_id: studentId,
        course_id: courseId
      }, {
        headers: {
          'X-Course-ID': courseId,
          'X-Student-ID': studentId
        }
      });

      return response.data;
    } catch (error) {
      console.error('Quiz session start failed:', error.message);
      throw error;
    }
  }

  async submitQuizAnswers(externalQuizId, answers, sessionId, studentId) {
    try {
      const response = await this.client.post(`/api/v1/quiz-sessions/submit/${externalQuizId}`, {
        session_id: sessionId,
        answers: answers,
        student_id: studentId
      });

      return response.data;
    } catch (error) {
      console.error('Quiz submission failed:', error.message);
      throw error;
    }
  }

  async getQuizStats(externalQuizId, courseId) {
    try {
      const response = await this.client.get(`/api/v1/quiz-sessions/stats/${externalQuizId}`, {
        params: { course_id: courseId },
        headers: { 'X-Course-ID': courseId }
      });

      return response.data;
    } catch (error) {
      console.error('Quiz stats fetch failed:', error.message);
      throw error;
    }
  }

  async healthCheck() {
    try {
      const response = await this.client.get('/health', { timeout: 5000 });
      return { 
        status: 'healthy', 
        data: response.data,
        responseTime: response.headers['x-response-time'] 
      };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Retry wrapper for critical operations
  async withRetry(operation, maxRetries = 3, delay = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Don't retry on client errors (400-499)
        if (error.statusCode >= 400 && error.statusCode < 500) {
          throw error;
        }
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
      }
    }
    
    throw lastError;
  }
}

class QuizApiError extends Error {
  constructor(message, type, statusCode = 500) {
    super(message);
    this.name = 'QuizApiError';
    this.type = type;
    this.statusCode = statusCode;
  }
}

module.exports = { QuizApiClient, QuizApiError };