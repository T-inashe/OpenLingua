import QuizService from '../../src/services/quizService';
import config from '../../src/config';
import type { 
  Quiz, 
  QuizData, 
  QuizResult, 
  QuizSession, 
  QuizTemplate, 
  QuizAnalytics
} from '../../src/types/quiz';

// Mock config
jest.mock('../../src/config', () => ({
  __esModule: true,
  default: {
    BACKEND_URL: 'http://localhost:8080',
    BASE_API_URL: 'https://language-quiz-api.onrender.com/api'
  }
}));

// Mock localStorage and sessionStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true
});

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock console methods
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

describe('QuizService (Attached Version)', () => {
  const mockToken = 'test-token-123';
  const mockCourseId = 'course-123';
  const mockQuizId = 'quiz-123';
  const mockSessionId = 'session-123';
  const mockTemplateId = 'template-123';

  // Mock data
  const mockQuizData: QuizData = {
    title: 'Test Quiz',
    description: 'A comprehensive test quiz',
    questions: [
      {
        question: 'What is 2+2?',
        type: 'multiple-choice',
        options: ['3', '4', '5', '6'],
        correctAnswer: '4',
        explanation: 'Basic arithmetic',
        points: 1
      },
      {
        question: 'TypeScript is a superset of JavaScript',
        type: 'true-false',
        correctAnswer: 'true',
        points: 1
      }
    ],
    timeLimit: 30,
    attempts: 3,
    passingScore: 70,
    isActive: true
  };

  const mockQuiz: Quiz = {
    id: mockQuizId,
    courseId: mockCourseId,
    ...mockQuizData,
    questions: [
      {
        id: 'q1',
        question: 'What is 2+2?',
        type: 'multiple-choice',
        options: ['3', '4', '5', '6'],
        correctAnswer: '4',
        explanation: 'Basic arithmetic',
        points: 1
      },
      {
        id: 'q2',
        question: 'TypeScript is a superset of JavaScript',
        type: 'true-false',
        correctAnswer: 'true',
        points: 1
      }
    ],
    createdAt: '2025-09-30T00:00:00Z',
    updatedAt: '2025-09-30T00:00:00Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(mockToken);
    mockSessionStorage.getItem.mockReturnValue(null);
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
    mockConsoleWarn.mockRestore();
  });

  describe('Initialization and Configuration', () => {
    test('initializes with correct base URL from config', () => {
      expect(QuizService['baseURL']).toBe(config.BACKEND_URL);
    });
  });

  describe('Authentication Methods', () => {
    describe('getToken', () => {
      test('returns token from localStorage when available', () => {
        mockLocalStorage.getItem.mockReturnValue(mockToken);
        mockSessionStorage.getItem.mockReturnValue(null);

        const token = QuizService.getToken();
        
        expect(token).toBe(mockToken);
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('token');
      });

      test('returns token from sessionStorage when localStorage is empty', () => {
        mockLocalStorage.getItem.mockReturnValue(null);
        mockSessionStorage.getItem.mockReturnValue(mockToken);

        const token = QuizService.getToken();
        
        expect(token).toBe(mockToken);
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('token');
        expect(mockSessionStorage.getItem).toHaveBeenCalledWith('token');
      });

      test('returns null when no token exists', () => {
        mockLocalStorage.getItem.mockReturnValue(null);
        mockSessionStorage.getItem.mockReturnValue(null);

        const token = QuizService.getToken();
        
        expect(token).toBe(null);
      });
    });

    describe('getHeaders', () => {
      test('returns correct headers with authentication token', () => {
        mockLocalStorage.getItem.mockReturnValue(mockToken);

        const headers = QuizService.getHeaders();
        
        expect(headers).toEqual({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockToken}`
        });
      });

      test('includes Bearer prefix with null token', () => {
        mockLocalStorage.getItem.mockReturnValue(null);
        mockSessionStorage.getItem.mockReturnValue(null);

        const headers = QuizService.getHeaders();
        
        expect(headers).toEqual({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer null'
        });
      });
    });
  });

  describe('Response Handling', () => {
    describe('handleResponse', () => {
      test('returns parsed JSON for successful response', async () => {
        const mockData = { success: true, data: 'test' };
        const mockResponse = {
          ok: true,
          json: jest.fn().mockResolvedValue(mockData)
        } as any;

        const result = await QuizService.handleResponse(mockResponse);
        
        expect(result).toEqual(mockData);
        expect(mockResponse.json).toHaveBeenCalled();
      });

      test('throws error for failed response with JSON error message', async () => {
        const mockError = { error: 'Invalid request' };
        const mockResponse = {
          ok: false,
          status: 400,
          json: jest.fn().mockResolvedValue(mockError)
        } as any;

        await expect(QuizService.handleResponse(mockResponse)).rejects.toThrow('Invalid request');
      });

      test('throws network error when JSON parsing fails', async () => {
        const mockResponse = {
          ok: false,
          status: 500,
          json: jest.fn().mockRejectedValue(new Error('JSON parse error'))
        } as any;

        await expect(QuizService.handleResponse(mockResponse)).rejects.toThrow('Network error');
      });

      test('throws network error when response JSON parsing fails', async () => {
        const mockResponse = {
          ok: false,
          status: 404,
          json: jest.fn().mockRejectedValue(new Error('Network error'))
        } as any;

        await expect(QuizService.handleResponse(mockResponse)).rejects.toThrow('Network error');
      });
    });
  });

  describe('Quiz Management', () => {
    describe('createCourseQuiz', () => {
      test('creates quiz successfully', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: jest.fn().mockResolvedValue(mockQuiz)
        });

        const result = await QuizService.createCourseQuiz(mockCourseId, mockQuizData);

        expect(mockFetch).toHaveBeenCalledWith(
          `${config.BACKEND_URL}/api/courses/${mockCourseId}/quizzes`,
          {
            method: 'POST',
            headers: QuizService.getHeaders(),
            body: JSON.stringify(mockQuizData)
          }
        );
        expect(result).toEqual(mockQuiz);
      });

      test('handles and logs creation errors', async () => {
        const error = new Error('Creation failed');
        mockFetch.mockRejectedValue(error);

        await expect(QuizService.createCourseQuiz(mockCourseId, mockQuizData))
          .rejects.toThrow('Creation failed');
        
        expect(mockConsoleError).toHaveBeenCalledWith('Create quiz error:', error);
      });
    });

    describe('getCourseQuizzes', () => {
      test('retrieves course quizzes successfully', async () => {
        const mockQuizzes = [mockQuiz];
        mockFetch.mockResolvedValue({
          ok: true,
          json: jest.fn().mockResolvedValue(mockQuizzes)
        });

        const result = await QuizService.getCourseQuizzes(mockCourseId);

        expect(mockFetch).toHaveBeenCalledWith(
          `${config.BACKEND_URL}/api/courses/${mockCourseId}/quizzes`,
          {
            headers: QuizService.getHeaders()
          }
        );
        expect(result).toEqual(mockQuizzes);
      });

      test('handles and logs retrieval errors', async () => {
        const error = new Error('Retrieval failed');
        mockFetch.mockRejectedValue(error);

        await expect(QuizService.getCourseQuizzes(mockCourseId))
          .rejects.toThrow('Retrieval failed');
        
        expect(mockConsoleError).toHaveBeenCalledWith('Get quizzes error:', error);
      });
    });

    describe('getQuizDetails', () => {
      test('retrieves quiz details successfully', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: jest.fn().mockResolvedValue(mockQuiz)
        });

        const result = await QuizService.getQuizDetails(mockCourseId, mockQuizId);

        expect(mockFetch).toHaveBeenCalledWith(
          `${config.BACKEND_URL}/api/courses/${mockCourseId}/quizzes/${mockQuizId}`,
          {
            headers: QuizService.getHeaders()
          }
        );
        expect(result).toEqual(mockQuiz);
      });

      test('handles and logs detail retrieval errors', async () => {
        const error = new Error('Detail retrieval failed');
        mockFetch.mockRejectedValue(error);

        await expect(QuizService.getQuizDetails(mockCourseId, mockQuizId))
          .rejects.toThrow('Detail retrieval failed');
        
        expect(mockConsoleError).toHaveBeenCalledWith('Get quiz details error:', error);
      });
    });

    describe('updateQuiz', () => {
      test('updates quiz successfully', async () => {
        const updateData = { title: 'Updated Quiz Title' };
        const updatedQuiz = { ...mockQuiz, ...updateData };
        
        mockFetch.mockResolvedValue({
          ok: true,
          json: jest.fn().mockResolvedValue(updatedQuiz)
        });

        const result = await QuizService.updateQuiz(mockCourseId, mockQuizId, updateData);

        expect(mockFetch).toHaveBeenCalledWith(
          `${config.BACKEND_URL}/api/courses/${mockCourseId}/quizzes/${mockQuizId}`,
          {
            method: 'PUT',
            headers: QuizService.getHeaders(),
            body: JSON.stringify(updateData)
          }
        );
        expect(result).toEqual(updatedQuiz);
      });

      test('handles and logs update errors', async () => {
        const error = new Error('Update failed');
        mockFetch.mockRejectedValue(error);

        await expect(QuizService.updateQuiz(mockCourseId, mockQuizId, { title: 'New Title' }))
          .rejects.toThrow('Update failed');
        
        expect(mockConsoleError).toHaveBeenCalledWith('Update quiz error:', error);
      });
    });

    describe('deleteQuiz', () => {
      test('deletes quiz successfully', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: jest.fn().mockResolvedValue({})
        });

        await QuizService.deleteQuiz(mockCourseId, mockQuizId);

        expect(mockFetch).toHaveBeenCalledWith(
          `${config.BACKEND_URL}/api/courses/${mockCourseId}/quizzes/${mockQuizId}`,
          {
            method: 'DELETE',
            headers: QuizService.getHeaders()
          }
        );
      });

      test('handles and logs deletion errors', async () => {
        const error = new Error('Deletion failed');
        mockFetch.mockRejectedValue(error);

        await expect(QuizService.deleteQuiz(mockCourseId, mockQuizId))
          .rejects.toThrow('Deletion failed');
        
        expect(mockConsoleError).toHaveBeenCalledWith('Delete quiz error:', error);
      });
    });
  });

  describe('Quiz Sessions', () => {
    describe('startQuizSession', () => {
      test('starts quiz session successfully', async () => {
        const mockSession: QuizSession = {
          id: mockSessionId,
          quizId: mockQuizId,
          userId: 'user-123',
          startedAt: '2025-09-30T10:00:00Z',
          expiresAt: '2025-09-30T10:30:00Z',
          isActive: true
        };

        mockFetch.mockResolvedValue({
          ok: true,
          json: jest.fn().mockResolvedValue(mockSession)
        });

        const result = await QuizService.startQuizSession(mockQuizId);

        expect(mockFetch).toHaveBeenCalledWith(
          `${config.BACKEND_URL}/api/quiz-sessions/${mockQuizId}/start`,
          {
            method: 'POST',
            headers: QuizService.getHeaders()
          }
        );
        expect(result).toEqual(mockSession);
      });

      test('handles and logs session start errors', async () => {
        const error = new Error('Session start failed');
        mockFetch.mockRejectedValue(error);

        await expect(QuizService.startQuizSession(mockQuizId))
          .rejects.toThrow('Session start failed');
        
        expect(mockConsoleError).toHaveBeenCalledWith('Start quiz session error:', error);
      });
    });

    describe('submitQuizAnswers', () => {
      test('submits quiz answers successfully', async () => {
        const mockAnswers = { 'q1': '4', 'q2': 'true' };
        const mockTimeSpent = 1200; // 20 minutes in seconds
        const mockResult: QuizResult = {
          id: 'result-123',
          quizId: mockQuizId,
          userId: 'user-123',
          score: 85,
          totalPoints: 100,
          percentage: 85,
          answers: mockAnswers,
          timeSpent: mockTimeSpent,
          completedAt: '2025-09-30T10:20:00Z',
          passed: true,
          correctAnswers: 2,
          totalQuestions: 2
        };

        mockFetch.mockResolvedValue({
          ok: true,
          json: jest.fn().mockResolvedValue(mockResult)
        });

        const result = await QuizService.submitQuizAnswers(
          mockQuizId, 
          mockSessionId, 
          mockAnswers, 
          mockTimeSpent
        );

        expect(mockFetch).toHaveBeenCalledWith(
          `${config.BACKEND_URL}/api/quiz-sessions/${mockQuizId}/submit`,
          {
            method: 'POST',
            headers: QuizService.getHeaders(),
            body: JSON.stringify({
              sessionId: mockSessionId,
              answers: mockAnswers,
              timeSpent: mockTimeSpent
            })
          }
        );
        expect(result).toEqual(mockResult);
      });

      test('handles and logs answer submission errors', async () => {
        const error = new Error('Submission failed');
        mockFetch.mockRejectedValue(error);

        await expect(QuizService.submitQuizAnswers(
          mockQuizId, 
          mockSessionId, 
          { 'q1': '4' }, 
          600
        )).rejects.toThrow('Submission failed');
        
        expect(mockConsoleError).toHaveBeenCalledWith('Submit quiz error:', error);
      });
    });

    describe('getQuizResults', () => {
      test('retrieves quiz results successfully', async () => {
        const mockResults: QuizResult[] = [{
          id: 'result-123',
          quizId: mockQuizId,
          userId: 'user-123',
          score: 85,
          totalPoints: 100,
          percentage: 85,
          answers: { 'q1': '4', 'q2': 'true' },
          timeSpent: 1200,
          completedAt: '2025-09-30T10:20:00Z',
          passed: true,
          correctAnswers: 2,
          totalQuestions: 2
        }];

        mockFetch.mockResolvedValue({
          ok: true,
          json: jest.fn().mockResolvedValue(mockResults)
        });

        const result = await QuizService.getQuizResults(mockQuizId);

        expect(mockFetch).toHaveBeenCalledWith(
          `${config.BACKEND_URL}/api/quiz-sessions/${mockQuizId}/results`,
          {
            headers: QuizService.getHeaders()
          }
        );
        expect(result).toEqual(mockResults);
      });

      test('handles and logs result retrieval errors', async () => {
        const error = new Error('Result retrieval failed');
        mockFetch.mockRejectedValue(error);

        await expect(QuizService.getQuizResults(mockQuizId))
          .rejects.toThrow('Result retrieval failed');
        
        expect(mockConsoleError).toHaveBeenCalledWith('Get quiz results error:', error);
      });
    });
  });

  describe('Quiz Sharing & Templates', () => {
    describe('shareQuizAsTemplate', () => {
      test('shares quiz as template successfully', async () => {
        const shareOptions = { isPublic: true, category: 'Math' };
        const mockTemplate: QuizTemplate = {
          id: mockTemplateId,
          title: mockQuiz.title,
          description: mockQuiz.description,
          questions: mockQuiz.questions.map(q => ({ ...q, id: undefined })),
          category: 'Math',
          difficulty: 'beginner',
          estimatedTime: 30
        };

        mockFetch.mockResolvedValue({
          ok: true,
          json: jest.fn().mockResolvedValue(mockTemplate)
        });

        const result = await QuizService.shareQuizAsTemplate(
          mockCourseId, 
          mockQuizId, 
          shareOptions
        );

        expect(mockFetch).toHaveBeenCalledWith(
          `${config.BACKEND_URL}/api/courses/${mockCourseId}/quizzes/${mockQuizId}/share`,
          {
            method: 'POST',
            headers: QuizService.getHeaders(),
            body: JSON.stringify(shareOptions)
          }
        );
        expect(result).toEqual(mockTemplate);
      });

      test('handles and logs template sharing errors', async () => {
        const error = new Error('Sharing failed');
        mockFetch.mockRejectedValue(error);

        await expect(QuizService.shareQuizAsTemplate(mockCourseId, mockQuizId))
          .rejects.toThrow('Sharing failed');
        
        expect(mockConsoleError).toHaveBeenCalledWith('Share quiz error:', error);
      });
    });

    describe('getAvailableTemplates', () => {
      test('retrieves available templates successfully without filters', async () => {
        const mockTemplates: QuizTemplate[] = [{
          id: mockTemplateId,
          title: 'Template Quiz',
          description: 'A template quiz',
          questions: [],
          category: 'Math',
          difficulty: 'beginner',
          estimatedTime: 30
        }];

        mockFetch.mockResolvedValue({
          ok: true,
          json: jest.fn().mockResolvedValue(mockTemplates)
        });

        const result = await QuizService.getAvailableTemplates();

        expect(mockFetch).toHaveBeenCalledWith(
          `${config.BACKEND_URL}/api/quiz-templates?`,
          {
            headers: QuizService.getHeaders()
          }
        );
        expect(result).toEqual(mockTemplates);
      });

      test('retrieves available templates with filters', async () => {
        const filters = { category: 'Math', difficulty: 'beginner' };
        const mockTemplates: QuizTemplate[] = [];

        mockFetch.mockResolvedValue({
          ok: true,
          json: jest.fn().mockResolvedValue(mockTemplates)
        });

        const result = await QuizService.getAvailableTemplates(filters);

        expect(mockFetch).toHaveBeenCalledWith(
          `${config.BACKEND_URL}/api/quiz-templates?category=Math&difficulty=beginner`,
          {
            headers: QuizService.getHeaders()
          }
        );
        expect(result).toEqual(mockTemplates);
      });

      test('handles and logs template retrieval errors', async () => {
        const error = new Error('Template retrieval failed');
        mockFetch.mockRejectedValue(error);

        await expect(QuizService.getAvailableTemplates())
          .rejects.toThrow('Template retrieval failed');
        
        expect(mockConsoleError).toHaveBeenCalledWith('Get templates error:', error);
      });
    });

    describe('getTemplateDetails', () => {
      test('retrieves template details successfully', async () => {
        const mockTemplate: QuizTemplate = {
          id: mockTemplateId,
          title: 'Detailed Template',
          description: 'A detailed template quiz',
          questions: mockQuizData.questions,
          category: 'Science',
          difficulty: 'intermediate',
          estimatedTime: 45
        };

        mockFetch.mockResolvedValue({
          ok: true,
          json: jest.fn().mockResolvedValue(mockTemplate)
        });

        const result = await QuizService.getTemplateDetails(mockTemplateId);

        expect(mockFetch).toHaveBeenCalledWith(
          `${config.BACKEND_URL}/api/quiz-templates/${mockTemplateId}`,
          {
            headers: QuizService.getHeaders()
          }
        );
        expect(result).toEqual(mockTemplate);
      });

      test('handles and logs template detail errors', async () => {
        const error = new Error('Template detail failed');
        mockFetch.mockRejectedValue(error);

        await expect(QuizService.getTemplateDetails(mockTemplateId))
          .rejects.toThrow('Template detail failed');
        
        expect(mockConsoleError).toHaveBeenCalledWith('Get template details error:', error);
      });
    });

    describe('copyTemplateToCourse', () => {
      test('copies template to course successfully', async () => {
        const customizations = { title: 'Customized Quiz' };

        mockFetch.mockResolvedValue({
          ok: true,
          json: jest.fn().mockResolvedValue(mockQuiz)
        });

        const result = await QuizService.copyTemplateToCourse(
          mockCourseId, 
          mockTemplateId, 
          customizations
        );

        expect(mockFetch).toHaveBeenCalledWith(
          `${config.BACKEND_URL}/api/courses/${mockCourseId}/quizzes/copy-template`,
          {
            method: 'POST',
            headers: QuizService.getHeaders(),
            body: JSON.stringify({
              templateId: mockTemplateId,
              customizations
            })
          }
        );
        expect(result).toEqual(mockQuiz);
      });

      test('handles and logs template copying errors', async () => {
        const error = new Error('Template copy failed');
        mockFetch.mockRejectedValue(error);

        await expect(QuizService.copyTemplateToCourse(mockCourseId, mockTemplateId))
          .rejects.toThrow('Template copy failed');
        
        expect(mockConsoleError).toHaveBeenCalledWith('Copy template error:', error);
      });
    });

    describe('unshareTemplate', () => {
      test('unshares template successfully', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: jest.fn().mockResolvedValue({})
        });

        await QuizService.unshareTemplate(mockTemplateId);

        expect(mockFetch).toHaveBeenCalledWith(
          `${config.BACKEND_URL}/api/quiz-templates/${mockTemplateId}`,
          {
            method: 'DELETE',
            headers: QuizService.getHeaders()
          }
        );
      });

      test('handles and logs template unsharing errors', async () => {
        const error = new Error('Unshare failed');
        mockFetch.mockRejectedValue(error);

        await expect(QuizService.unshareTemplate(mockTemplateId))
          .rejects.toThrow('Unshare failed');
        
        expect(mockConsoleError).toHaveBeenCalledWith('Unshare template error:', error);
      });
    });
  });

  describe('Analytics', () => {
    describe('getQuizAnalytics', () => {
      test('retrieves quiz analytics successfully', async () => {
        const mockAnalytics: QuizAnalytics = {
          quizId: mockQuizId,
          totalAttempts: 50,
          averageScore: 78.5,
          passRate: 0.85,
          questionAnalytics: [
            {
              questionId: 'q1',
              correctAnswers: 42,
              totalAnswers: 50,
              difficulty: 0.84
            }
          ]
        };

        mockFetch.mockResolvedValue({
          ok: true,
          json: jest.fn().mockResolvedValue(mockAnalytics)
        });

        const result = await QuizService.getQuizAnalytics(mockCourseId);

        expect(mockFetch).toHaveBeenCalledWith(
          `${config.BACKEND_URL}/api/courses/${mockCourseId}/quiz-analytics`,
          {
            headers: QuizService.getHeaders()
          }
        );
        expect(result).toEqual(mockAnalytics);
      });

      test('handles and logs analytics retrieval errors', async () => {
        const error = new Error('Analytics failed');
        mockFetch.mockRejectedValue(error);

        await expect(QuizService.getQuizAnalytics(mockCourseId))
          .rejects.toThrow('Analytics failed');
        
        expect(mockConsoleError).toHaveBeenCalledWith('Get quiz analytics error:', error);
      });
    });

    describe('getSharingStats', () => {
      test('retrieves sharing statistics successfully', async () => {
        const mockStats = {
          totalTemplates: 25,
          totalShares: 100,
          popularCategories: ['Math', 'Science']
        };

        mockFetch.mockResolvedValue({
          ok: true,
          json: jest.fn().mockResolvedValue(mockStats)
        });

        const result = await QuizService.getSharingStats();

        expect(mockFetch).toHaveBeenCalledWith(
          `${config.BACKEND_URL}/api/quiz-sharing-stats`,
          {
            headers: QuizService.getHeaders()
          }
        );
        expect(result).toEqual(mockStats);
      });

      test('handles and logs sharing stats errors', async () => {
        const error = new Error('Sharing stats failed');
        mockFetch.mockRejectedValue(error);

        await expect(QuizService.getSharingStats())
          .rejects.toThrow('Sharing stats failed');
        
        expect(mockConsoleError).toHaveBeenCalledWith('Get sharing stats error:', error);
      });
    });
  });

  describe('Health Check', () => {
    describe('checkApiHealth', () => {
      test('returns healthy status when API is responsive', async () => {
        const mockHealthResponse = { status: 'healthy' };

        mockFetch.mockResolvedValue({
          ok: true,
          json: jest.fn().mockResolvedValue(mockHealthResponse)
        });

        const result = await QuizService.checkApiHealth();

        expect(mockFetch).toHaveBeenCalledWith(
          `${config.BACKEND_URL}/api/quiz-health`,
          {
            headers: QuizService.getHeaders()
          }
        );
        expect(result).toEqual(mockHealthResponse);
      });

      test('returns unhealthy status with error message when API fails', async () => {
        const error = new Error('Connection timeout');
        mockFetch.mockRejectedValue(error);

        const result = await QuizService.checkApiHealth();

        expect(result).toEqual({
          status: 'unhealthy',
          error: 'Connection timeout'
        });
        expect(mockConsoleError).toHaveBeenCalledWith('Health check error:', error);
      });

      test('handles unknown errors gracefully', async () => {
        mockFetch.mockRejectedValue('Unknown error string');

        const result = await QuizService.checkApiHealth();

        expect(result).toEqual({
          status: 'unhealthy',
          error: 'Unknown error'
        });
      });
    });
  });

  describe('Utility Methods', () => {
    describe('showOfflineNotification', () => {
      test('logs offline notification message', () => {
        const message = 'You are currently offline';

        QuizService.showOfflineNotification(message);

        expect(mockConsoleWarn).toHaveBeenCalledWith('Quiz Service - Offline Mode:', message);
      });
    });

    describe('validateQuizData', () => {
      test('validates quiz data successfully for valid data', () => {
        expect(() => QuizService.validateQuizData(mockQuizData)).not.toThrow();
      });

      test('throws error for missing quiz title', () => {
        const invalidData = { ...mockQuizData, title: '' };

        expect(() => QuizService.validateQuizData(invalidData))
          .toThrow('Quiz title is required');
      });

      test('throws error for missing questions', () => {
        const invalidData = { ...mockQuizData, questions: [] };

        expect(() => QuizService.validateQuizData(invalidData))
          .toThrow('At least one question is required');
      });

      test('throws error for missing question text', () => {
        const invalidData = {
          ...mockQuizData,
          questions: [{
            question: '',
            type: 'multiple-choice' as const,
            options: ['A', 'B'],
            correctAnswer: 'A',
            points: 1
          }]
        };

        expect(() => QuizService.validateQuizData(invalidData))
          .toThrow('Question 1: Question text is required');
      });

      test('throws error for invalid question type', () => {
        const invalidData = {
          ...mockQuizData,
          questions: [{
            question: 'Test question',
            type: 'invalid-type' as any,
            correctAnswer: 'A',
            points: 1
          }]
        };

        expect(() => QuizService.validateQuizData(invalidData))
          .toThrow('Question 1: Invalid question type');
      });

      test('throws error for multiple-choice with insufficient options', () => {
        const invalidData = {
          ...mockQuizData,
          questions: [{
            question: 'Test question',
            type: 'multiple-choice' as const,
            options: ['A'],
            correctAnswer: 'A',
            points: 1
          }]
        };

        expect(() => QuizService.validateQuizData(invalidData))
          .toThrow('Question 1: Multiple choice requires at least 2 options');
      });

      test('throws error for missing correct answer', () => {
        const invalidData = {
          ...mockQuizData,
          questions: [{
            question: 'Test question',
            type: 'multiple-choice' as const,
            options: ['A', 'B'],
            correctAnswer: '',
            points: 1
          }]
        };

        expect(() => QuizService.validateQuizData(invalidData))
          .toThrow('Question 1: Correct answer is required');
      });

      test('validates different question types correctly', () => {
        const validDataAllTypes = {
          ...mockQuizData,
          questions: [
            {
              question: 'Multiple choice question',
              type: 'multiple-choice' as const,
              options: ['A', 'B', 'C'],
              correctAnswer: 'A',
              points: 1
            },
            {
              question: 'True/false question',
              type: 'true-false' as const,
              correctAnswer: 'true',
              points: 1
            },
            {
              question: 'Fill in the blank',
              type: 'fill-in-blank' as const,
              correctAnswer: 'answer',
              points: 1
            },
            {
              question: 'Matching question',
              type: 'matching' as const,
              correctAnswer: 'match',
              points: 1
            }
          ]
        };

        expect(() => QuizService.validateQuizData(validDataAllTypes)).not.toThrow();
      });
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    test('handles malformed response JSON gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockRejectedValue(new Error('Unexpected token'))
      });

      await expect(QuizService.getCourseQuizzes(mockCourseId))
        .rejects.toThrow('Unexpected token');
    });

    test('handles network connectivity issues', async () => {
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

      await expect(QuizService.getCourseQuizzes(mockCourseId))
        .rejects.toThrow('Failed to fetch');
    });

    test('handles server errors with custom error messages', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
        json: jest.fn().mockResolvedValue({ error: 'Service temporarily unavailable' })
      });

      await expect(QuizService.getCourseQuizzes(mockCourseId))
        .rejects.toThrow('Service temporarily unavailable');
    });

    test('handles authentication timeout', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({ error: 'Token expired' })
      });

      await expect(QuizService.getCourseQuizzes(mockCourseId))
        .rejects.toThrow('Token expired');
    });

    test('handles rate limiting gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        json: jest.fn().mockResolvedValue({ error: 'Too many requests' })
      });

      await expect(QuizService.getCourseQuizzes(mockCourseId))
        .rejects.toThrow('Too many requests');
    });
  });
});