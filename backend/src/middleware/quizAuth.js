const { prisma } = require('../lib/prisma');

// Validate course ownership for instructors
const validateCourseOwnership = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    if (!courseId) {
      return res.status(400).json({ error: "Course ID is required" });
    }

    const course = await prisma.course.findFirst({
      where: { 
        id: courseId, 
        instructorId: userId 
      }
    });

    if (!course) {
      return res.status(403).json({ 
        error: "Unauthorized: You don't own this course" 
      });
    }

    req.course = course;
    next();
  } catch (error) {
    console.error('Course ownership validation error:', error);
    res.status(500).json({ error: "Authorization check failed" });
  }
};

// Validate quiz access for both instructors and students
const validateQuizAccess = async (req, res, next) => {
  try {
    const { courseId, quizId } = req.params;
    const userId = req.user.id;

    if (!courseId) {
      return res.status(400).json({ error: "Course ID is required" });
    }

    // Check if user is instructor OR enrolled student
    const hasAccess = await prisma.course.findFirst({
      where: {
        id: courseId,
        OR: [
          { instructorId: userId }, // Instructor access
          { 
            enrollments: { 
              some: { userId: userId } 
            } 
          } // Student enrollment
        ]
      },
      include: {
        enrollments: {
          where: { userId: userId },
          select: { progress: true, createdAt: true }
        }
      }
    });

    if (!hasAccess) {
      return res.status(403).json({ 
        error: "Access denied: You're not enrolled in this course" 
      });
    }

    // If quizId is provided, validate it exists and is active
    if (quizId) {
      const quiz = await prisma.courseQuiz.findFirst({
        where: {
          id: quizId,
          courseId: courseId,
          isActive: true
        }
      });

      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found or inactive" });
      }

      req.quiz = quiz;
    }

    req.course = hasAccess;
    req.userRole = hasAccess.instructorId === userId ? 'instructor' : 'student';
    
    next();
  } catch (error) {
    console.error('Quiz access validation error:', error);
    res.status(500).json({ error: "Access validation failed" });
  }
};

// Rate limiting for quiz operations
const quizRateLimit = (req, res, next) => {
  // Simple in-memory rate limiting (in production, use Redis)
  const rateLimitStore = new Map();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 50; // Max requests per window per user

  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const now = Date.now();
  const windowStart = now - windowMs;
  
  if (!rateLimitStore.has(userId)) {
    rateLimitStore.set(userId, []);
  }

  const userRequests = rateLimitStore.get(userId);
  
  // Remove old requests outside the window
  const recentRequests = userRequests.filter(timestamp => timestamp > windowStart);
  rateLimitStore.set(userId, recentRequests);

  if (recentRequests.length >= maxRequests) {
    return res.status(429).json({ 
      error: "Too many requests",
      retryAfter: Math.ceil((recentRequests[0] + windowMs - now) / 1000)
    });
  }

  // Add current request
  recentRequests.push(now);
  
  next();
};

// Validate quiz data for creation/updates
const validateQuizData = (req, res, next) => {
  const { title, questions } = req.body;

  if (!title || title.trim().length === 0) {
    return res.status(400).json({ 
      error: "Quiz title is required" 
    });
  }

  if (title.length > 200) {
    return res.status(400).json({ 
      error: "Quiz title must be less than 200 characters" 
    });
  }

  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ 
      error: "At least one question is required" 
    });
  }

  if (questions.length > 100) {
    return res.status(400).json({ 
      error: "Maximum 100 questions allowed per quiz" 
    });
  }

  // Validate each question
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    
    if (!question.text || question.text.trim().length === 0) {
      return res.status(400).json({ 
        error: `Question ${i + 1}: Question text is required` 
      });
    }

    if (!question.type || !['multiple_choice', 'true_false', 'short_answer'].includes(question.type)) {
      return res.status(400).json({ 
        error: `Question ${i + 1}: Invalid question type` 
      });
    }

    if (question.type === 'multiple_choice') {
      if (!question.options || !Array.isArray(question.options) || question.options.length < 2) {
        return res.status(400).json({ 
          error: `Question ${i + 1}: Multiple choice requires at least 2 options` 
        });
      }

      if (!question.correct_answer || !question.options.includes(question.correct_answer)) {
        return res.status(400).json({ 
          error: `Question ${i + 1}: Correct answer must be one of the options` 
        });
      }
    }

    if (question.type === 'true_false') {
      if (!question.correct_answer || !['true', 'false'].includes(question.correct_answer)) {
        return res.status(400).json({ 
          error: `Question ${i + 1}: True/false question requires 'true' or 'false' as correct answer` 
        });
      }
    }

    if (question.type === 'short_answer') {
      if (!question.correct_answer || question.correct_answer.trim().length === 0) {
        return res.status(400).json({ 
          error: `Question ${i + 1}: Short answer question requires a correct answer` 
        });
      }
    }
  }

  next();
};

// Validate quiz submission data
const validateQuizSubmission = (req, res, next) => {
  const { sessionId, answers, timeSpent } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: "Session ID is required" });
  }

  if (!answers || typeof answers !== 'object' || Object.keys(answers).length === 0) {
    return res.status(400).json({ error: "Quiz answers are required" });
  }

  if (timeSpent !== undefined && (typeof timeSpent !== 'number' || timeSpent < 0)) {
    return res.status(400).json({ error: "Time spent must be a positive number" });
  }

  // Validate answer format
  for (const [questionId, answer] of Object.entries(answers)) {
    if (!questionId || answer === undefined || answer === null) {
      return res.status(400).json({ 
        error: `Invalid answer for question: ${questionId}` 
      });
    }
  }

  next();
};

// Log quiz operations for audit trail
const logQuizOperation = (operation) => {
  return (req, res, next) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const logData = {
        operation,
        userId: req.user?.id,
        courseId: req.params.courseId,
        quizId: req.params.quizId,
        method: req.method,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
        userAgent: req.get('User-Agent'),
        ip: req.ip
      };

      if (res.statusCode >= 400) {
        console.error('Quiz operation failed:', logData);
      } else {
        console.log('Quiz operation:', logData);
      }
    });

    next();
  };
};

module.exports = {
  validateCourseOwnership,
  validateQuizAccess,
  quizRateLimit,
  validateQuizData,
  validateQuizSubmission,
  logQuizOperation
};