const { QuizApiClient } = require('./quizApiClient');
const { QuizCacheService } = require('./quizCacheService');
const { prisma } = require('../lib/prisma');

class QuizFallbackManager {
  constructor() {
    this.apiClient = new QuizApiClient();
    this.cacheService = new QuizCacheService();
    this.healthCache = {
      status: 'unknown',
      lastCheck: null,
      consecutiveFailures: 0
    };
    
    // Health check interval (every 5 minutes)
    this.healthCheckInterval = setInterval(() => {
      this.checkApiHealth();
    }, 5 * 60 * 1000);
    // Allow process/tests to exit even if the interval is still scheduled
    if (this.healthCheckInterval && typeof this.healthCheckInterval.unref === 'function') {
      this.healthCheckInterval.unref();
    }
  }

  // Check if external API is available
  async isApiAvailable() {
    const now = Date.now();
    const cacheAge = now - (this.healthCache.lastCheck || 0);
    
    // Use cached status if checked within last 30 seconds
    if (cacheAge < 30000 && this.healthCache.lastCheck) {
      return this.healthCache.status === 'healthy';
    }

    return await this.checkApiHealth();
  }

  // Perform health check on external API
  async checkApiHealth() {
    try {
      const health = await this.apiClient.healthCheck();
      
      if (health.status === 'healthy') {
        this.healthCache = {
          status: 'healthy',
          lastCheck: Date.now(),
          consecutiveFailures: 0
        };
        
        // If API is back online, sync any pending data
        if (this.healthCache.consecutiveFailures > 0) {
          this.syncPendingData();
        }
        
        return true;
      } else {
        this.markApiUnhealthy();
        return false;
      }
    } catch (error) {
      console.error('API health check failed:', error.message);
      this.markApiUnhealthy();
      return false;
    }
  }

  // Mark API as unhealthy
  markApiUnhealthy() {
    this.healthCache.consecutiveFailures++;
    this.healthCache.status = 'unhealthy';
    this.healthCache.lastCheck = Date.now();

    // Log escalating issues
    if (this.healthCache.consecutiveFailures === 1) {
      console.warn('Quiz API became unavailable - switching to offline mode');
    } else if (this.healthCache.consecutiveFailures === 10) {
      console.error('Quiz API has been down for extended period');
    }
  }

  // Execute operation with automatic fallback
  async executeWithFallback(operation, fallbackOperation, context = {}) {
    const isApiAvailable = await this.isApiAvailable();
    
    if (isApiAvailable) {
      try {
        const result = await operation();
        
        // Cache successful result if applicable
        if (context.cacheKey && context.cacheData) {
          await this.cacheService.cacheQuizData(context.cacheKey, context.cacheData);
        }
        
        return {
          success: true,
          data: result,
          mode: 'online'
        };
      } catch (error) {
        console.warn('Primary operation failed, using fallback:', error.message);
        this.markApiUnhealthy();
        
        // Execute fallback
        const fallbackResult = await fallbackOperation();
        return {
          success: true,
          data: fallbackResult,
          mode: 'offline',
          message: 'Service temporarily unavailable - using cached data'
        };
      }
    } else {
      // API is known to be down, go straight to fallback
      const fallbackResult = await fallbackOperation();
      return {
        success: true,
        data: fallbackResult,
        mode: 'offline',
        message: 'Service unavailable - using offline mode'
      };
    }
  }

  // Create quiz with fallback
  async createQuizWithFallback(quizData, courseId, instructorId) {
    const primaryOperation = async () => {
      return await this.apiClient.createQuiz(quizData, courseId, instructorId);
    };

    const fallbackOperation = async () => {
      // Create local-only quiz
      const localQuiz = await prisma.courseQuiz.create({
        data: {
          courseId: courseId,
          externalQuizId: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: quizData.title,
          description: quizData.description || '',
          category: quizData.category || 'general',
          difficulty: quizData.difficulty || 'beginner',
          tags: quizData.tags || [],
          isActive: true,
          isCached: true,
          cachedData: {
            questions: quizData.questions,
            settings: {
              timeLimit: quizData.timeLimit || 30,
              allowReview: true
            },
            metadata: {
              totalQuestions: quizData.questions.length,
              createdOffline: true,
              needsSync: true
            },
            cachedAt: new Date().toISOString()
          }
        }
      });

      return {
        data: {
          quiz_id: localQuiz.externalQuizId,
          quiz: localQuiz
        }
      };
    };

    return await this.executeWithFallback(
      primaryOperation,
      fallbackOperation,
      { 
        cacheKey: null, // Will be set after creation
        operation: 'create_quiz'
      }
    );
  }

  // Get quiz with fallback
  async getQuizWithFallback(localQuizId, externalQuizId, courseId) {
    const primaryOperation = async () => {
      return await this.apiClient.getQuiz(externalQuizId, courseId);
    };

    const fallbackOperation = async () => {
      const cachedQuiz = await this.cacheService.getCachedQuiz(localQuizId);
      if (!cachedQuiz) {
        throw new Error('Quiz not available offline');
      }
      return { data: cachedQuiz };
    };

    return await this.executeWithFallback(
      primaryOperation,
      fallbackOperation,
      {
        cacheKey: localQuizId,
        operation: 'get_quiz'
      }
    );
  }

  // Submit quiz with fallback
  async submitQuizWithFallback(localQuizId, externalQuizId, answers, sessionId, studentId) {
    const primaryOperation = async () => {
      return await this.apiClient.submitQuizAnswers(externalQuizId, answers, sessionId, studentId);
    };

    const fallbackOperation = async () => {
      // Calculate score locally
      const score = await this.calculateLocalScore(localQuizId, answers);
      
      // Store result locally
      await this.cacheService.storeQuizResult(localQuizId, studentId, {
        ...score,
        timeSpent: 0,
        answers: answers
      });

      return {
        data: {
          score: score.score,
          total_questions: score.totalQuestions,
          session_id: sessionId,
          needs_sync: true
        }
      };
    };

    return await this.executeWithFallback(
      primaryOperation,
      fallbackOperation,
      {
        operation: 'submit_quiz'
      }
    );
  }

  // Calculate score locally using cached quiz data
  async calculateLocalScore(localQuizId, userAnswers) {
    try {
      const cachedQuiz = await this.cacheService.getCachedQuiz(localQuizId);
      
      if (!cachedQuiz || !cachedQuiz.questions) {
        return { score: 0, totalQuestions: 1 };
      }

      let correctAnswers = 0;
      const totalQuestions = cachedQuiz.questions.length;

      cachedQuiz.questions.forEach(question => {
        const userAnswer = userAnswers[question.id];
        const correctAnswer = question.correct_answer;

        if (userAnswer && this.isAnswerCorrect(question.type, userAnswer, correctAnswer)) {
          correctAnswers++;
        }
      });

      return {
        score: correctAnswers,
        totalQuestions: totalQuestions
      };

    } catch (error) {
      console.error('Local score calculation error:', error);
      return { score: 0, totalQuestions: 1 };
    }
  }

  // Check if answer is correct based on question type
  isAnswerCorrect(questionType, userAnswer, correctAnswer) {
    switch (questionType) {
      case 'multiple_choice':
      case 'true_false':
        return userAnswer === correctAnswer;
      
      case 'short_answer':
        return userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
      
      default:
        return false;
    }
  }

  // Sync offline data when API comes back online
  async syncPendingData() {
    try {
      console.log('API is back online - syncing offline data...');

      // Find quizzes that need syncing
      const pendingQuizzes = await prisma.courseQuiz.findMany({
        where: {
          cachedData: {
            path: ['metadata', 'needsSync'],
            equals: true
          }
        },
        include: {
          course: { select: { instructorId: true } }
        }
      });

      for (const quiz of pendingQuizzes) {
        try {
          if (quiz.externalQuizId.startsWith('offline_')) {
            // This was created offline, sync to external API
            await this.syncOfflineQuiz(quiz);
          } else {
            // This was updated offline, sync changes
            await this.syncQuizChanges(quiz);
          }
        } catch (syncError) {
          console.error(`Failed to sync quiz ${quiz.id}:`, syncError.message);
        }
      }

      // Sync offline quiz results
      await this.syncOfflineResults();

      console.log('Data sync completed');
    } catch (error) {
      console.error('Data sync failed:', error);
    }
  }

  // Sync quiz that was created offline
  async syncOfflineQuiz(quiz) {
    try {
      const quizData = quiz.cachedData;
      
      const externalResult = await this.apiClient.createQuiz({
        title: quiz.title,
        description: quiz.description,
        category: quiz.category,
        difficulty: quiz.difficulty,
        questions: quizData.questions,
        timeLimit: quizData.settings.timeLimit
      }, quiz.courseId, quiz.course.instructorId);

      // Update local record with real external ID
      await prisma.courseQuiz.update({
        where: { id: quiz.id },
        data: {
          externalQuizId: externalResult.data.quiz_id,
          cachedData: {
            ...quizData,
            metadata: {
              ...quizData.metadata,
              needsSync: false,
              syncedAt: new Date().toISOString()
            }
          }
        }
      });

      console.log(`Successfully synced offline quiz: ${quiz.title}`);
    } catch (error) {
      console.error(`Failed to sync offline quiz ${quiz.id}:`, error);
    }
  }

  // Sync offline quiz results
  async syncOfflineResults() {
    try {
      const offlineResults = await prisma.quizResult.findMany({
        where: {
          externalSessionId: null
        },
        include: {
          quiz: true
        }
      });

      for (const result of offlineResults) {
        try {
          // Skip if quiz still doesn't have external ID
          if (result.quiz.externalQuizId.startsWith('offline_')) {
            continue;
          }

          // Submit to external API
          const externalResult = await this.apiClient.submitQuizAnswers(
            result.quiz.externalQuizId,
            result.answers,
            `sync_${result.id}`,
            result.studentId
          );

          // Update local record
          await prisma.quizResult.update({
            where: { id: result.id },
            data: {
              externalSessionId: externalResult.data.session_id || `synced_${result.id}`
            }
          });

          console.log(`Synced quiz result for student ${result.studentId}`);
        } catch (syncError) {
          console.error(`Failed to sync result ${result.id}:`, syncError.message);
        }
      }
    } catch (error) {
      console.error('Failed to sync offline results:', error);
    }
  }

  // Get fallback status for monitoring
  getFallbackStatus() {
    return {
      apiStatus: this.healthCache.status,
      lastChecked: this.healthCache.lastCheck,
      consecutiveFailures: this.healthCache.consecutiveFailures,
      fallbackActive: this.healthCache.status !== 'healthy'
    };
  }

  // Cleanup
  destroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }
}

module.exports = { QuizFallbackManager };