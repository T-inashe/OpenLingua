const { prisma } = require('../lib/prisma');
const { QuizApiClient, QuizApiError } = require('../services/quizApiClient');
const { QuizCacheService } = require('../services/quizCacheService');

const quizApiClient = new QuizApiClient();
const quizCacheService = new QuizCacheService();

class QuizSessionController {

  // Start a quiz session
  async startQuizSession(req, res) {
    try {
      const { quizId } = req.params;
      const studentId = req.user.id;

      // Get quiz and validate access
      const quiz = await prisma.courseQuiz.findFirst({
        where: { 
          id: quizId,
          isActive: true,
          course: {
            OR: [
              { instructorId: studentId }, // Allow instructor to test
              { enrollments: { some: { userId: studentId } } } // Enrolled students
            ]
          }
        },
        include: {
          course: { select: { id: true, title: true } }
        }
      });

      if (!quiz) {
        return res.status(403).json({ 
          error: "Quiz not found or access denied" 
        });
      }

      // Check if student already completed this quiz
      const existingResult = await prisma.quizResult.findFirst({
        where: { 
          quizId: quizId,
          studentId: studentId
        }
      });

      if (existingResult) {
        return res.status(409).json({
          error: "Quiz already completed",
          result: {
            score: existingResult.score,
            completedAt: existingResult.completedAt
          }
        });
      }

      try {
        // Try external API first
        const sessionData = await quizApiClient.startQuizSession(
          quiz.externalQuizId,
          studentId,
          quiz.courseId
        );

        // Cache the quiz data from session
        if (sessionData.data.quiz) {
          await quizCacheService.cacheQuizData(quizId, sessionData.data.quiz);
        }

        res.json({
          success: true,
          session: {
            id: sessionData.data.session_id,
            quizId: quizId,
            quiz: {
              title: quiz.title,
              description: quiz.description,
              questions: sessionData.data.quiz.questions,
              timeLimit: sessionData.data.time_limit,
              totalQuestions: sessionData.data.quiz.questions?.length || 0
            },
            mode: 'online',
            startTime: new Date().toISOString()
          }
        });

      } catch (apiError) {
        console.warn('External API unavailable, using cached data:', apiError.message);
        
        // Fallback to cached quiz
        const cachedQuiz = await quizCacheService.getCachedQuiz(quizId);
        
        if (!cachedQuiz || !cachedQuiz.questions) {
          return res.status(503).json({
            error: "Quiz unavailable - service down and no cached data"
          });
        }

        // Generate offline session ID
        const offlineSessionId = `offline_${quizId}_${studentId}_${Date.now()}`;

        res.json({
          success: true,
          session: {
            id: offlineSessionId,
            quizId: quizId,
            quiz: {
              title: quiz.title,
              description: quiz.description,
              questions: cachedQuiz.questions,
              timeLimit: cachedQuiz.settings?.timeLimit || 30,
              totalQuestions: cachedQuiz.questions.length
            },
            mode: 'offline',
            message: 'Taking quiz offline - results will sync later',
            startTime: new Date().toISOString()
          }
        });
      }

    } catch (error) {
      console.error('Start quiz session error:', error);
      res.status(500).json({ error: "Failed to start quiz session" });
    }
  }

  // Submit quiz answers
  async submitQuizAnswers(req, res) {
    try {
      const { quizId } = req.params;
      const { sessionId, answers, timeSpent } = req.body;
      const studentId = req.user.id;

      // Validate quiz access
      const quiz = await prisma.courseQuiz.findFirst({
        where: { 
          id: quizId,
          isActive: true,
          course: {
            OR: [
              { instructorId: studentId },
              { enrollments: { some: { userId: studentId } } }
            ]
          }
        }
      });

      if (!quiz) {
        return res.status(403).json({ error: "Quiz access denied" });
      }

      if (!answers || Object.keys(answers).length === 0) {
        return res.status(400).json({ error: "No answers provided" });
      }

      const isOfflineSession = sessionId.startsWith('offline_');

      try {
        let externalResult = null;
        
        // Try external API if not offline session
        if (!isOfflineSession) {
          externalResult = await quizApiClient.submitQuizAnswers(
            quiz.externalQuizId,
            answers,
            sessionId,
            studentId
          );
        }

        // Calculate score locally as backup
        const localScore = await this.calculateQuizScore(quizId, answers);
        
        const resultData = {
          score: externalResult?.data.score || localScore.score,
          totalQuestions: externalResult?.data.total_questions || localScore.totalQuestions,
          timeSpent: timeSpent || 0,
          answers: answers
        };

        // Store result locally
        const localResult = await quizCacheService.storeQuizResult(
          quizId,
          studentId,
          resultData,
          isOfflineSession ? null : sessionId
        );

        res.json({
          success: true,
          result: {
            score: resultData.score,
            totalQuestions: resultData.totalQuestions,
            percentage: Math.round((resultData.score / resultData.totalQuestions) * 100),
            timeSpent: resultData.timeSpent,
            passed: resultData.score >= (resultData.totalQuestions * 0.6), // 60% passing
            mode: isOfflineSession ? 'offline' : 'online',
            completedAt: new Date().toISOString()
          }
        });

      } catch (apiError) {
        console.warn('External API submission failed, storing locally:', apiError.message);
        
        // Calculate and store locally
        const localScore = await this.calculateQuizScore(quizId, answers);
        
        const resultData = {
          score: localScore.score,
          totalQuestions: localScore.totalQuestions,
          timeSpent: timeSpent || 0,
          answers: answers
        };

        await quizCacheService.storeQuizResult(
          quizId,
          studentId,
          resultData,
          null // No external session ID
        );

        res.json({
          success: true,
          result: {
            score: resultData.score,
            totalQuestions: resultData.totalQuestions,
            percentage: Math.round((resultData.score / resultData.totalQuestions) * 100),
            timeSpent: resultData.timeSpent,
            passed: resultData.score >= (resultData.totalQuestions * 0.6),
            mode: 'offline',
            message: 'Results saved locally - will sync when service is available',
            completedAt: new Date().toISOString()
          }
        });
      }

    } catch (error) {
      console.error('Submit quiz answers error:', error);
      res.status(500).json({ error: "Failed to submit quiz answers" });
    }
  }

  // Get quiz results for a student or instructor
  async getQuizResults(req, res) {
    try {
      const { quizId } = req.params;
      const userId = req.user.id;

      // Get quiz and check permissions
      const quiz = await prisma.courseQuiz.findFirst({
        where: { 
          id: quizId,
          course: {
            OR: [
              { instructorId: userId }, // Instructor can see all results
              { enrollments: { some: { userId } } } // Student can see own result
            ]
          }
        },
        include: {
          course: { 
            select: { instructorId: true } 
          }
        }
      });

      if (!quiz) {
        return res.status(403).json({ error: "Quiz access denied" });
      }

      const isInstructor = quiz.course.instructorId === userId;

      // Get results based on permissions
      const results = await quizCacheService.getQuizResults(
        quizId,
        isInstructor ? null : userId // null = all results for instructor
      );

      // Format results
      const formattedResults = results.map(result => ({
        studentId: result.studentId,
        studentName: result.student.name,
        studentEmail: isInstructor ? result.student.email : undefined,
        score: result.score,
        totalQuestions: result.totalQuestions,
        percentage: Math.round((result.score / result.totalQuestions) * 100),
        timeSpent: result.timeSpent,
        passed: result.score >= (result.totalQuestions * 0.6),
        completedAt: result.completedAt,
        hasExternalSession: !!result.externalSessionId
      }));

      res.json({
        success: true,
        results: formattedResults,
        summary: {
          totalAttempts: results.length,
          averageScore: results.length > 0 
            ? results.reduce((sum, r) => sum + r.score, 0) / results.length 
            : 0,
          passRate: results.length > 0 
            ? (results.filter(r => r.score >= (r.totalQuestions * 0.6)).length / results.length) * 100
            : 0
        }
      });

    } catch (error) {
      console.error('Get quiz results error:', error);
      res.status(500).json({ error: "Failed to fetch quiz results" });
    }
  }

  // Helper method to calculate quiz score locally
  async calculateQuizScore(quizId, userAnswers) {
    try {
      const cachedQuiz = await quizCacheService.getCachedQuiz(quizId);
      
      if (!cachedQuiz || !cachedQuiz.questions) {
        throw new Error('Quiz data not available for scoring');
      }

      let correctAnswers = 0;
      const totalQuestions = cachedQuiz.questions.length;

      cachedQuiz.questions.forEach(question => {
        const userAnswer = userAnswers[question.id];
        const correctAnswer = question.correct_answer;

        if (question.type === 'multiple_choice') {
          if (userAnswer === correctAnswer) {
            correctAnswers++;
          }
        } else if (question.type === 'true_false') {
          if (userAnswer === correctAnswer) {
            correctAnswers++;
          }
        } else if (question.type === 'short_answer') {
          // Simple string comparison (could be enhanced with fuzzy matching)
          if (userAnswer && userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()) {
            correctAnswers++;
          }
        }
      });

      return {
        score: correctAnswers,
        totalQuestions: totalQuestions
      };

    } catch (error) {
      console.error('Score calculation error:', error);
      return {
        score: 0,
        totalQuestions: 1 // Avoid division by zero
      };
    }
  }
}

module.exports = { QuizSessionController };