const { prisma } = require('../lib/prisma');

class QuizCacheService {
  
  // Cache quiz data locally for offline access
  async cacheQuizData(localQuizId, externalQuizData) {
    try {
      const cacheData = {
        questions: externalQuizData.questions || [],
        settings: {
          timeLimit: externalQuizData.time_limit,
          allowReview: externalQuizData.allow_review,
          showCorrectAnswers: externalQuizData.show_correct_answers
        },
        metadata: {
          totalQuestions: externalQuizData.questions?.length || 0,
          estimatedTime: externalQuizData.estimated_time,
          passingScore: externalQuizData.passing_score
        },
        cachedAt: new Date().toISOString(),
        version: externalQuizData.version || '1.0'
      };

      await prisma.courseQuiz.update({
        where: { id: localQuizId },
        data: {
          isCached: true,
          cachedData: cacheData
        }
      });

      console.log(`Quiz ${localQuizId} cached successfully`);
      return true;
    } catch (error) {
      console.error('Failed to cache quiz data:', error);
      return false;
    }
  }

  // Retrieve cached quiz data
  async getCachedQuiz(localQuizId) {
    try {
      const quiz = await prisma.courseQuiz.findUnique({
        where: { id: localQuizId },
        select: { 
          cachedData: true, 
          isCached: true,
          title: true,
          description: true,
          difficulty: true,
          category: true
        }
      });

      if (!quiz || !quiz.isCached) {
        return null;
      }

      return {
        ...quiz.cachedData,
        title: quiz.title,
        description: quiz.description,
        difficulty: quiz.difficulty,
        category: quiz.category,
        mode: 'offline'
      };
    } catch (error) {
      console.error('Failed to retrieve cached quiz:', error);
      return null;
    }
  }

  // Check if cached data is still valid
  async isCacheValid(localQuizId, maxAgeHours = 24) {
    try {
      const quiz = await prisma.courseQuiz.findUnique({
        where: { id: localQuizId },
        select: { cachedData: true, isCached: true }
      });

      if (!quiz || !quiz.isCached || !quiz.cachedData?.cachedAt) {
        return false;
      }

      const cachedAt = new Date(quiz.cachedData.cachedAt);
      const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert to milliseconds
      const isValid = (Date.now() - cachedAt.getTime()) < maxAge;

      return isValid;
    } catch (error) {
      console.error('Failed to check cache validity:', error);
      return false;
    }
  }

  // Update cache for specific quiz
  async refreshCache(localQuizId, externalQuizData) {
    try {
      // Check if external data has a newer version
      const currentCache = await prisma.courseQuiz.findUnique({
        where: { id: localQuizId },
        select: { cachedData: true }
      });

      const currentVersion = currentCache?.cachedData?.version || '0';
      const newVersion = externalQuizData.version || '1.0';

      if (newVersion <= currentVersion) {
        console.log(`Quiz ${localQuizId} cache is up to date`);
        return true;
      }

      return await this.cacheQuizData(localQuizId, externalQuizData);
    } catch (error) {
      console.error('Failed to refresh cache:', error);
      return false;
    }
  }

  // Get all cached quizzes for a course
  async getCachedQuizzesForCourse(courseId) {
    try {
      const quizzes = await prisma.courseQuiz.findMany({
        where: { 
          courseId, 
          isActive: true,
          isCached: true 
        },
        select: {
          id: true,
          title: true,
          description: true,
          difficulty: true,
          category: true,
          cachedData: true,
          createdAt: true
        }
      });

      return quizzes.map(quiz => ({
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        difficulty: quiz.difficulty,
        category: quiz.category,
        questionCount: quiz.cachedData?.metadata?.totalQuestions || 0,
        estimatedTime: quiz.cachedData?.metadata?.estimatedTime,
        createdAt: quiz.createdAt,
        mode: 'offline'
      }));
    } catch (error) {
      console.error('Failed to get cached quizzes for course:', error);
      return [];
    }
  }

  // Clean up old cache entries
  async cleanupOldCache(maxAgeHours = 72) {
    try {
      const cutoffDate = new Date(Date.now() - (maxAgeHours * 60 * 60 * 1000));
      
      const result = await prisma.courseQuiz.updateMany({
        where: {
          isCached: true,
          updatedAt: { lt: cutoffDate },
          // Don't clean up templates or recently accessed quizzes
          isTemplate: false
        },
        data: {
          isCached: false,
          cachedData: null
        }
      });

      console.log(`Cleaned up ${result.count} old cache entries`);
      return result.count;
    } catch (error) {
      console.error('Failed to cleanup old cache:', error);
      return 0;
    }
  }

  // Store quiz result locally
  async storeQuizResult(localQuizId, studentId, resultData, externalSessionId = null) {
    try {
      const result = await prisma.quizResult.upsert({
        where: {
          quizId_studentId: {
            quizId: localQuizId,
            studentId: studentId
          }
        },
        update: {
          score: resultData.score,
          totalQuestions: resultData.totalQuestions,
          timeSpent: resultData.timeSpent,
          answers: resultData.answers,
          externalSessionId: externalSessionId,
          completedAt: new Date()
        },
        create: {
          quizId: localQuizId,
          studentId: studentId,
          score: resultData.score,
          totalQuestions: resultData.totalQuestions,
          timeSpent: resultData.timeSpent,
          answers: resultData.answers,
          externalSessionId: externalSessionId,
          completedAt: new Date()
        }
      });

      console.log(`Quiz result stored for student ${studentId}, quiz ${localQuizId}`);
      return result;
    } catch (error) {
      console.error('Failed to store quiz result:', error);
      return null;
    }
  }

  // Get quiz results for analytics
  async getQuizResults(localQuizId, studentId = null) {
    try {
      const where = { quizId: localQuizId };
      if (studentId) {
        where.studentId = studentId;
      }

      const results = await prisma.quizResult.findMany({
        where,
        include: {
          student: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { completedAt: 'desc' }
      });

      return results;
    } catch (error) {
      console.error('Failed to get quiz results:', error);
      return [];
    }
  }
}

module.exports = { QuizCacheService };