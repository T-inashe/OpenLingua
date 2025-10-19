const { Router } = require("express");
const { authenticate } = require("../middleware/auth");
const { 
  validateCourseOwnership, 
  validateQuizAccess, 
  quizRateLimit,
  validateQuizData,
  validateQuizSubmission,
  logQuizOperation
} = require("../middleware/quizAuth");
const { QuizProxyController } = require("../controllers/quizProxyController");
const { QuizSessionController } = require("../controllers/quizSessionController");
const { QuizSharingService } = require("../services/quizSharingService");

const router = Router();

// Initialize controllers
const quizProxyController = new QuizProxyController();
const quizSessionController = new QuizSessionController();
const quizSharingService = new QuizSharingService();

// Apply authentication and rate limiting to all routes
router.use(authenticate);
router.use(quizRateLimit);

// ==================== COURSE QUIZ MANAGEMENT ROUTES ====================
// (Instructor Only)

// Create a new quiz for a course
router.post(
  "/courses/:courseId/quizzes", 
  logQuizOperation('create_quiz'),
  validateCourseOwnership,
  validateQuizData,
  quizProxyController.createCourseQuiz.bind(quizProxyController)
);

// Get all quizzes for a course
router.get(
  "/courses/:courseId/quizzes",
  logQuizOperation('get_course_quizzes'),
  validateQuizAccess,
  quizProxyController.getCourseQuizzes.bind(quizProxyController)
);

// Get specific quiz details
router.get(
  "/courses/:courseId/quizzes/:quizId",
  logQuizOperation('get_quiz_details'),
  validateQuizAccess,
  quizProxyController.getQuizDetails.bind(quizProxyController)
);

// Update a quiz (Instructor only)
router.put(
  "/courses/:courseId/quizzes/:quizId",
  logQuizOperation('update_quiz'),
  validateCourseOwnership,
  validateQuizData,
  quizProxyController.updateQuiz.bind(quizProxyController)
);

// Delete a quiz (Instructor only)
router.delete(
  "/courses/:courseId/quizzes/:quizId",
  logQuizOperation('delete_quiz'),
  validateCourseOwnership,
  quizProxyController.deleteQuiz.bind(quizProxyController)
);

// ==================== QUIZ SESSION ROUTES ====================
// (Students and Instructors)

// Start a quiz session
router.post(
  "/quiz-sessions/:quizId/start",
  logQuizOperation('start_quiz_session'),
  async (req, res, next) => {
    // Get courseId from quizId for validation
    const { prisma } = require('../lib/prisma');
    try {
      const quiz = await prisma.courseQuiz.findUnique({
        where: { id: req.params.quizId },
        select: { courseId: true }
      });
      
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      
      req.params.courseId = quiz.courseId;
      next();
    } catch (error) {
      res.status(500).json({ error: "Failed to validate quiz" });
    }
  },
  validateQuizAccess,
  quizSessionController.startQuizSession.bind(quizSessionController)
);

// Submit quiz answers
router.post(
  "/quiz-sessions/:quizId/submit",
  logQuizOperation('submit_quiz'),
  validateQuizSubmission,
  async (req, res, next) => {
    // Get courseId from quizId for validation
    const { prisma } = require('../lib/prisma');
    try {
      const quiz = await prisma.courseQuiz.findUnique({
        where: { id: req.params.quizId },
        select: { courseId: true }
      });
      
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      
      req.params.courseId = quiz.courseId;
      next();
    } catch (error) {
      res.status(500).json({ error: "Failed to validate quiz" });
    }
  },
  validateQuizAccess,
  quizSessionController.submitQuizAnswers.bind(quizSessionController)
);

// Get quiz results
router.get(
  "/quiz-sessions/:quizId/results",
  logQuizOperation('get_quiz_results'),
  async (req, res, next) => {
    // Get courseId from quizId for validation
    const { prisma } = require('../lib/prisma');
    try {
      const quiz = await prisma.courseQuiz.findUnique({
        where: { id: req.params.quizId },
        select: { courseId: true }
      });
      
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      
      req.params.courseId = quiz.courseId;
      next();
    } catch (error) {
      res.status(500).json({ error: "Failed to validate quiz" });
    }
  },
  validateQuizAccess,
  quizSessionController.getQuizResults.bind(quizSessionController)
);

// ==================== SYSTEM HEALTH ROUTES ====================

// Check external quiz API health
router.get(
  "/quiz-health",
  logQuizOperation('health_check'),
  quizProxyController.checkApiHealth.bind(quizProxyController)
);

// ==================== QUIZ SHARING & TEMPLATES ROUTES ====================

// Share a quiz as template
router.post(
  "/courses/:courseId/quizzes/:quizId/share",
  logQuizOperation('share_quiz'),
  validateCourseOwnership,
  async (req, res) => {
    try {
      const { courseId, quizId } = req.params;
      const instructorId = req.user.id;
      const shareOptions = req.body;

      const result = await quizSharingService.shareQuizAsTemplate(quizId, instructorId, shareOptions);
      res.json(result);
    } catch (error) {
      console.error('Share quiz error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Copy template to course
router.post(
  "/courses/:courseId/quizzes/copy-template",
  logQuizOperation('copy_template'),
  validateCourseOwnership,
  async (req, res) => {
    try {
      const { courseId } = req.params;
      const { templateId, customizations } = req.body;
      const instructorId = req.user.id;

      if (!templateId) {
        return res.status(400).json({ error: "Template ID is required" });
      }

      const result = await quizSharingService.copyTemplateToourse(templateId, courseId, instructorId, customizations);
      res.json(result);
    } catch (error) {
      console.error('Copy template error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Get available templates
router.get(
  "/quiz-templates",
  logQuizOperation('get_templates'),
  async (req, res) => {
    try {
      const instructorId = req.user.id;
      const filters = {
        category: req.query.category,
        difficulty: req.query.difficulty,
        search: req.query.search
      };

      const result = await quizSharingService.getAvailableTemplates(instructorId, filters);
      res.json(result);
    } catch (error) {
      console.error('Get templates error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Get template details
router.get(
  "/quiz-templates/:templateId",
  logQuizOperation('get_template_details'),
  async (req, res) => {
    try {
      const { templateId } = req.params;
      const instructorId = req.user.id;

      const result = await quizSharingService.getTemplateDetails(templateId, instructorId);
      res.json(result);
    } catch (error) {
      console.error('Get template details error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Unshare template
router.delete(
  "/quiz-templates/:templateId",
  logQuizOperation('unshare_template'),
  async (req, res) => {
    try {
      const { templateId } = req.params;
      const instructorId = req.user.id;

      const result = await quizSharingService.unshareTemplate(templateId, instructorId);
      res.json(result);
    } catch (error) {
      console.error('Unshare template error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Get sharing statistics
router.get(
  "/quiz-sharing-stats",
  logQuizOperation('get_sharing_stats'),
  async (req, res) => {
    try {
      const instructorId = req.user.id;
      const result = await quizSharingService.getSharingStats(instructorId);
      res.json(result);
    } catch (error) {
      console.error('Get sharing stats error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// ==================== QUIZ ANALYTICS ROUTES ====================
// (Instructor Only)

// Get course quiz analytics
router.get(
  "/courses/:courseId/quiz-analytics",
  logQuizOperation('get_quiz_analytics'),
  validateCourseOwnership,
  async (req, res) => {
    try {
      const { courseId } = req.params;
      const { prisma } = require('../lib/prisma');

      // Get quiz statistics for the course
      const quizStats = await prisma.courseQuiz.findMany({
        where: { 
          courseId: courseId,
          isActive: true 
        },
        include: {
          results: {
            include: {
              student: { select: { id: true, name: true } }
            }
          },
          _count: { select: { results: true } }
        }
      });

      const analytics = quizStats.map(quiz => ({
        quizId: quiz.id,
        title: quiz.title,
        difficulty: quiz.difficulty,
        totalAttempts: quiz._count.results,
        averageScore: quiz.results.length > 0 
          ? quiz.results.reduce((sum, r) => sum + r.score, 0) / quiz.results.length
          : 0,
        averageTime: quiz.results.length > 0
          ? quiz.results.reduce((sum, r) => sum + r.timeSpent, 0) / quiz.results.length
          : 0,
        passRate: quiz.results.length > 0
          ? (quiz.results.filter(r => r.score >= (r.totalQuestions * 0.6)).length / quiz.results.length) * 100
          : 0,
        createdAt: quiz.createdAt
      }));

      res.json({ 
        success: true, 
        analytics,
        summary: {
          totalQuizzes: quizStats.length,
          totalAttempts: quizStats.reduce((sum, quiz) => sum + quiz._count.results, 0),
          overallPassRate: analytics.length > 0 
            ? analytics.reduce((sum, quiz) => sum + quiz.passRate, 0) / analytics.length
            : 0
        }
      });

    } catch (error) {
      console.error('Quiz analytics error:', error);
      res.status(500).json({ error: "Failed to get quiz analytics" });
    }
  }
);

module.exports = router;