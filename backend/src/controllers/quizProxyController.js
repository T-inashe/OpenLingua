const { prisma } = require('../lib/prisma');
const { QuizApiClient, QuizApiError } = require('../services/quizApiClient');
const { QuizCacheService } = require('../services/quizCacheService');

const quizApiClient = new QuizApiClient();
const quizCacheService = new QuizCacheService();

class QuizProxyController {

  // Create a new quiz for a course
  async createCourseQuiz(req, res) {
    try {
      const { courseId } = req.params;
      const instructorId = req.user.id;
      const quizData = req.body;

      // 1. Validate course ownership
      const course = await prisma.course.findFirst({
        where: { 
          id: courseId, 
          instructorId: instructorId 
        }
      });

      if (!course) {
        return res.status(403).json({ 
          error: "Unauthorized: You don't own this course" 
        });
      }

      // 2. Validate quiz data
      if (!quizData.title || !quizData.questions || quizData.questions.length === 0) {
        return res.status(400).json({ 
          error: "Title and questions are required" 
        });
      }

      try {
        // 3. Create quiz in external API
        const externalResult = await quizApiClient.withRetry(() =>
          quizApiClient.createQuiz(quizData, courseId, instructorId)
        );

        // 4. Store local reference
        const localQuiz = await prisma.courseQuiz.create({
          data: {
            courseId: courseId,
            externalQuizId: externalResult.data.quiz_id,
            title: quizData.title,
            description: quizData.description || '',
            category: quizData.category || 'general',
            difficulty: quizData.difficulty || 'beginner',
            tags: quizData.tags || [],
            isActive: true
          }
        });

        // 5. Cache quiz data for offline access
        await quizCacheService.cacheQuizData(localQuiz.id, externalResult.data);

        res.status(201).json({
          success: true,
          quiz: {
            id: localQuiz.id,
            externalId: localQuiz.externalQuizId,
            title: localQuiz.title,
            description: localQuiz.description,
            category: localQuiz.category,
            difficulty: localQuiz.difficulty,
            createdAt: localQuiz.createdAt
          }
        });

      } catch (apiError) {
        console.error('External API failed, creating offline quiz:', apiError.message);
        
        // Fallback: Create local-only quiz
        const fallbackQuiz = await prisma.courseQuiz.create({
          data: {
            courseId: courseId,
            externalQuizId: `offline_${Date.now()}`,
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
              mode: 'offline_created'
            }
          }
        });

        res.status(201).json({
          success: true,
          mode: 'offline',
          message: 'Quiz created locally - will sync when service is available',
          quiz: {
            id: fallbackQuiz.id,
            title: fallbackQuiz.title,
            description: fallbackQuiz.description,
            category: fallbackQuiz.category,
            difficulty: fallbackQuiz.difficulty,
            createdAt: fallbackQuiz.createdAt
          }
        });
      }

    } catch (error) {
      console.error('Quiz creation error:', error);
      res.status(500).json({ 
        error: "Failed to create quiz",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get all quizzes for a course
  async getCourseQuizzes(req, res) {
    try {
      const { courseId } = req.params;
      const userId = req.user.id;

      // Validate access (instructor or enrolled student)
      const hasAccess = await prisma.course.findFirst({
        where: {
          id: courseId,
          OR: [
            { instructorId: userId },
            { enrollments: { some: { userId } } }
          ]
        }
      });

      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied to this course" });
      }

      // Get local quiz references
      const localQuizzes = await prisma.courseQuiz.findMany({
        where: { 
          courseId: courseId,
          isActive: true
        },
        orderBy: { createdAt: 'desc' }
      });

      if (localQuizzes.length === 0) {
        return res.json({ quizzes: [] });
      }

      try {
        // Try to get fresh data from external API
        const enrichedQuizzes = await Promise.all(
          localQuizzes.map(async (localQuiz) => {
            try {
              const externalData = await quizApiClient.getQuiz(
                localQuiz.externalQuizId, 
                courseId
              );
              
              // Update cache with fresh data
              await quizCacheService.refreshCache(localQuiz.id, externalData.data);
              
              return {
                id: localQuiz.id,
                title: localQuiz.title,
                description: localQuiz.description,
                category: localQuiz.category,
                difficulty: localQuiz.difficulty,
                tags: localQuiz.tags,
                questionCount: externalData.data.questions?.length || 0,
                createdAt: localQuiz.createdAt,
                mode: 'online'
              };
            } catch (apiError) {
              // Fallback to cached data
              const cachedData = await quizCacheService.getCachedQuiz(localQuiz.id);
              
              return {
                id: localQuiz.id,
                title: localQuiz.title,
                description: localQuiz.description,
                category: localQuiz.category,
                difficulty: localQuiz.difficulty,
                tags: localQuiz.tags,
                questionCount: cachedData?.metadata?.totalQuestions || 0,
                createdAt: localQuiz.createdAt,
                mode: 'offline'
              };
            }
          })
        );

        res.json({ quizzes: enrichedQuizzes });

      } catch (error) {
        // Complete fallback to cached data
        const cachedQuizzes = await quizCacheService.getCachedQuizzesForCourse(courseId);
        
        res.json({
          quizzes: cachedQuizzes,
          mode: 'offline',
          message: 'Using cached quiz data - service unavailable'
        });
      }

    } catch (error) {
      console.error('Get quizzes error:', error);
      res.status(500).json({ error: "Failed to fetch quizzes" });
    }
  }

  // Get specific quiz details
  async getQuizDetails(req, res) {
    try {
      const { courseId, quizId } = req.params;
      const userId = req.user.id;

      // Validate access
      const hasAccess = await prisma.course.findFirst({
        where: {
          id: courseId,
          OR: [
            { instructorId: userId },
            { enrollments: { some: { userId } } }
          ]
        }
      });

      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Get local quiz reference
      const localQuiz = await prisma.courseQuiz.findFirst({
        where: { 
          id: quizId, 
          courseId: courseId,
          isActive: true
        }
      });

      if (!localQuiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }

      try {
        // Try external API first
        const externalData = await quizApiClient.getQuiz(
          localQuiz.externalQuizId, 
          courseId
        );

        // Update cache
        await quizCacheService.refreshCache(localQuiz.id, externalData.data);

        res.json({
          ...externalData.data,
          id: localQuiz.id,
          mode: 'online'
        });

      } catch (apiError) {
        // Fallback to cached data
        const cachedData = await quizCacheService.getCachedQuiz(localQuiz.id);
        
        if (!cachedData) {
          return res.status(503).json({ 
            error: "Quiz unavailable - no cached data" 
          });
        }

        res.json({
          ...cachedData,
          id: localQuiz.id,
          mode: 'offline'
        });
      }

    } catch (error) {
      console.error('Get quiz details error:', error);
      res.status(500).json({ error: "Failed to fetch quiz details" });
    }
  }

  // Update a quiz
  async updateQuiz(req, res) {
    try {
      const { courseId, quizId } = req.params;
      const instructorId = req.user.id;
      const updateData = req.body;

      // Validate ownership
      const quiz = await prisma.courseQuiz.findFirst({
        where: { 
          id: quizId,
          course: { 
            id: courseId, 
            instructorId: instructorId 
          }
        }
      });

      if (!quiz) {
        return res.status(403).json({ error: "Quiz not found or unauthorized" });
      }

      try {
        // Update in external API
        const externalResult = await quizApiClient.updateQuiz(
          quiz.externalQuizId,
          updateData,
          courseId,
          instructorId
        );

        // Update local record
        const updatedQuiz = await prisma.courseQuiz.update({
          where: { id: quizId },
          data: {
            title: updateData.title || quiz.title,
            description: updateData.description || quiz.description,
            category: updateData.category || quiz.category,
            difficulty: updateData.difficulty || quiz.difficulty,
            tags: updateData.tags || quiz.tags
          }
        });

        // Update cache
        await quizCacheService.cacheQuizData(quizId, externalResult.data);

        res.json({ 
          success: true, 
          quiz: updatedQuiz,
          mode: 'online'
        });

      } catch (apiError) {
        // Update locally and mark for sync
        const updatedQuiz = await prisma.courseQuiz.update({
          where: { id: quizId },
          data: {
            title: updateData.title || quiz.title,
            description: updateData.description || quiz.description,
            category: updateData.category || quiz.category,
            difficulty: updateData.difficulty || quiz.difficulty,
            tags: updateData.tags || quiz.tags,
            // Mark as needing sync
            cachedData: {
              ...quiz.cachedData,
              needsSync: true,
              lastModified: new Date().toISOString()
            }
          }
        });

        res.json({ 
          success: true, 
          quiz: updatedQuiz,
          mode: 'offline',
          message: 'Updated locally - will sync when service is available'
        });
      }

    } catch (error) {
      console.error('Update quiz error:', error);
      res.status(500).json({ error: "Failed to update quiz" });
    }
  }

  // Delete a quiz
  async deleteQuiz(req, res) {
    try {
      const { courseId, quizId } = req.params;
      const instructorId = req.user.id;

      // Validate ownership
      const quiz = await prisma.courseQuiz.findFirst({
        where: { 
          id: quizId,
          course: { 
            id: courseId, 
            instructorId: instructorId 
          }
        }
      });

      if (!quiz) {
        return res.status(403).json({ error: "Quiz not found or unauthorized" });
      }

      try {
        // Delete from external API
        await quizApiClient.deleteQuiz(
          quiz.externalQuizId,
          courseId,
          instructorId
        );
      } catch (apiError) {
        console.warn('Failed to delete from external API:', apiError.message);
        // Continue with local deletion
      }

      // Mark as inactive locally (soft delete)
      await prisma.courseQuiz.update({
        where: { id: quizId },
        data: { 
          isActive: false,
          cachedData: null,
          isCached: false
        }
      });

      res.json({ 
        success: true, 
        message: "Quiz deleted successfully" 
      });

    } catch (error) {
      console.error('Delete quiz error:', error);
      res.status(500).json({ error: "Failed to delete quiz" });
    }
  }

  // Check external API health
  async checkApiHealth(req, res) {
    try {
      const health = await quizApiClient.healthCheck();
      res.json(health);
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      });
    }
  }
}

module.exports = { QuizProxyController };