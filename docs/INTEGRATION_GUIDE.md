# Language Learning Quiz API Integration Guide

This guide explains how to integrate the Language Learning Quiz API into your main language learning platform.

## 📋 Overview

The Quiz API is a standalone microservice that provides comprehensive quiz functionality for your language learning platform. It's designed as an external service that your main application can communicate with via HTTP requests.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                Main Language Learning Platform              │
│  ┌─────────────────────────────┐  ┌─────────────────────────┐│
│  │    Frontend (React)         │  │   Course Database       ││
│  │                             │  │   (Prisma/PostgreSQL)   ││
│  └─────────────┬───────────────┘  └─────────────┬───────────┘│
│                │                                │            │
│  ┌─────────────▼───────────────┐  ┌─────────────▼───────────┐│
│  │    Quiz Proxy Layer         │  │   Quiz References       ││
│  │    - Authorization          │◄─┤   - CourseQuiz          ││
│  │    - Course Isolation       │  │   - QuizResult          ││
│  │    - Caching & Fallbacks    │  │   - Cached Quiz Data    ││
│  └─────────────┬───────────────┘  └─────────────────────────┘│
└─────────────────┼─────────────────────────────────────────────┘
                  │ Controlled HTTP API Calls
                  │ (with Course Context)
┌─────────────────▼─────────────────┐
│        External Quiz API          │
│  ┌─────────────────────────────┐  │
│  │    Flask API Server         │  │
│  │    (Python)                 │  │
│  └─────────────────────────────┘  │
│  ┌─────────────────────────────┐  │
│  │    Supabase PostgreSQL      │  │
│  │    Database                 │  │
│  └─────────────────────────────┘  │
└───────────────────────────────────┘
```

## 🔌 API Endpoints

### Base URL
```
https://your-main-platform.com/api  # Your proxy layer
```

### Quiz Management Endpoints (via Proxy)
```http
# Course Quiz Management (Instructors Only)
GET    /api/courses/{courseId}/quizzes           # List course quizzes
POST   /api/courses/{courseId}/quizzes           # Create new quiz
GET    /api/courses/{courseId}/quizzes/{quizId}  # Get specific quiz
PUT    /api/courses/{courseId}/quizzes/{quizId}  # Update quiz
DELETE /api/courses/{courseId}/quizzes/{quizId}  # Delete quiz

# Quiz Sharing & Templates
POST   /api/courses/{courseId}/quizzes/{quizId}/share  # Share with others
POST   /api/courses/{courseId}/quizzes/{quizId}/copy   # Copy to course
GET    /api/quiz-templates                            # Browse shared templates

# Quiz Sessions (Students & Instructors)
POST /api/quiz-sessions/{quizId}/start           # Start quiz session
POST /api/quiz-sessions/{quizId}/submit          # Submit answers
GET  /api/quiz-sessions/{sessionId}/results      # Get session results
GET  /api/courses/{courseId}/quiz-results        # Get course quiz analytics

# System Health
GET  /api/quiz-health                           # Check external API status
```

### Authorization Headers
```http
Authorization: Bearer {jwt_token}    # Your existing auth system
```

## 💻 Integration Examples

### Proxy Layer Architecture

#### 1. Quiz Proxy Controller Structure
```javascript
// backend/src/controllers/quizProxyController.js
class QuizProxyController {
  
  // Create quiz with course isolation
  async createCourseQuiz(req, res) {
    const { courseId } = req.params;
    const instructorId = req.user.id;
    
    // 1. Validate course ownership
    const course = await prisma.course.findFirst({
      where: { id: courseId, instructorId }
    });
    
    if (!course) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    
    // 2. Add course context
    const quizData = {
      ...req.body,
      course_id: courseId,
      course_title: course.title,
      instructor_id: instructorId
    };
    
    try {
      // 3. Call external API
      const externalResult = await quizApiClient.createQuiz(quizData);
      
      // 4. Store local reference
      const localQuiz = await prisma.courseQuiz.create({
        data: {
          courseId,
          externalQuizId: externalResult.data.quiz_id,
          title: quizData.title,
          description: quizData.description,
          category: quizData.category,
          difficulty: quizData.difficulty
        }
      });
      
      // 5. Cache quiz data for offline access
      await this.cacheQuizData(localQuiz.id, externalResult.data);
      
      res.json({ success: true, quiz: localQuiz });
      
    } catch (error) {
      // Fallback handling
      if (error.code === 'EXTERNAL_API_DOWN') {
        return res.status(503).json({
          error: "Quiz service temporarily unavailable",
          fallback: "offline_mode_available"
        });
      }
      throw error;
    }
  }

  // Get course quizzes with fallback
  async getCourseQuizzes(req, res) {
    const { courseId } = req.params;
    
    try {
      // Get local references
      const localQuizzes = await prisma.courseQuiz.findMany({
        where: { courseId, isActive: true }
      });
      
      // Try to sync with external API
      const externalQuizzes = await quizApiClient.getQuizzesByCourse(courseId);
      
      res.json({ quizzes: this.mergeQuizData(localQuizzes, externalQuizzes) });
      
    } catch (error) {
      // Fallback to cached data
      const cachedQuizzes = await prisma.courseQuiz.findMany({
        where: { courseId, isActive: true, isCached: true }
      });
      
      res.json({ 
        quizzes: cachedQuizzes,
        mode: 'offline',
        message: 'Using cached quiz data'
      });
    }
  }
}
```

#### 2. Authorization Middleware
```javascript
// backend/src/middleware/quizAuth.js
const validateCourseOwnership = async (req, res, next) => {
  const { courseId } = req.params;
  const userId = req.user.id;
  
  const course = await prisma.course.findFirst({
    where: { id: courseId, instructorId: userId }
  });
  
  if (!course) {
    return res.status(403).json({ error: "Course access denied" });
  }
  
  req.course = course;
  next();
};

const validateQuizAccess = async (req, res, next) => {
  const { courseId } = req.params;
  const userId = req.user.id;
  
  // Check instructor ownership OR student enrollment
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
    return res.status(403).json({ error: "Quiz access denied" });
  }
  
  next();
};
```

#### 3. Frontend Integration with Proxy
```javascript
// frontend/src/services/quizService.js
class QuizService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL; // Your main API
  }

  async createCourseQuiz(courseId, quizData) {
    const response = await fetch(`${this.baseURL}/api/courses/${courseId}/quizzes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`
      },
      body: JSON.stringify(quizData)
    });
    
    const result = await response.json();
    
    if (result.fallback) {
      // Handle offline mode
      this.showOfflineNotification();
    }
    
    return result;
  }

  async getCourseQuizzes(courseId) {
    try {
      const response = await fetch(`${this.baseURL}/api/courses/${courseId}/quizzes`, {
        headers: { 'Authorization': `Bearer ${this.getToken()}` }
      });
      
      const result = await response.json();
      
      if (result.mode === 'offline') {
        this.showOfflineMode(result.message);
      }
      
      return result.quizzes;
    } catch (error) {
      throw new Error('Failed to load quizzes');
    }
  }

  async shareQuiz(courseId, quizId, shareWith) {
    const response = await fetch(`${this.baseURL}/api/courses/${courseId}/quizzes/${quizId}/share`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`
      },
      body: JSON.stringify({ shareWith })
    });
    
    return response.json();
  }
}

export default new QuizService();
```

## 📊 Data Flow Examples

### Quiz Creation Flow
1. **Educator** creates quiz in your main platform
2. **Main platform** validates user permissions
3. **Main platform** calls Quiz API to create quiz
4. **Quiz API** stores quiz data in Supabase
5. **Main platform** receives quiz ID and stores reference
6. **Main platform** shows success message to educator

### Quiz Taking Flow
1. **Student** selects quiz from main platform
2. **Main platform** calls Quiz API to start session
3. **Quiz API** returns quiz data and session ID
4. **Student** answers questions in main platform UI
5. **Main platform** submits answers to Quiz API
6. **Quiz API** calculates score and returns results
7. **Main platform** displays results and updates student progress

## 🔐 Authentication & Security

### Optional Headers
The Quiz API accepts optional headers for tracking and analytics:

```http
X-User-ID: educator_123        # For educator actions
X-Student-ID: student_456      # For student actions
```

### Rate Limiting (Recommended)
Implement rate limiting in your main application:

```javascript
// In your main backend
const rateLimit = require('express-rate-limit');

const quizApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each user to 100 quiz API requests per windowMs
  message: 'Too many quiz requests, please try again later.'
});

app.use('/api/quiz', quizApiLimiter);
```

## 🌐 Environment Configuration

### Environment Variables
```bash
# In your main application
QUIZ_API_URL=https://your-quiz-api-domain.com
QUIZ_API_TIMEOUT=10000

# Frontend environment
REACT_APP_QUIZ_API_URL=https://your-quiz-api-domain.com
```

### Configuration Management
```javascript
// config/quiz.js
module.exports = {
  apiUrl: process.env.QUIZ_API_URL || 'http://localhost:5000',
  timeout: parseInt(process.env.QUIZ_API_TIMEOUT) || 10000,
  retries: 3,
  retryDelay: 1000
};
```

## 📈 Monitoring & Analytics

### Integration Points for Analytics
```javascript
// Track quiz events in your main analytics system
const analytics = require('../services/analytics');

// After quiz creation
analytics.track('quiz_created', {
  educator_id: educatorId,
  quiz_id: result.data.quiz_id,
  category: quizData.category,
  difficulty: quizData.difficulty
});

// After quiz completion
analytics.track('quiz_completed', {
  student_id: studentId,
  quiz_id: quizId,
  score: result.data.score,
  time_taken: result.data.time_taken
});
```

### Health Check Integration
```javascript
// Add Quiz API health check to your main app's health endpoint
app.get('/health', async (req, res) => {
  try {
    const quizApiHealth = await axios.get(`${QUIZ_API_URL}/health`, { timeout: 5000 });
    
    res.json({
      status: 'healthy',
      services: {
        main_app: 'healthy',
        quiz_api: quizApiHealth.data.status === 'healthy' ? 'healthy' : 'unhealthy'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      services: {
        main_app: 'healthy',
        quiz_api: 'unhealthy'
      }
    });
  }
});
```

## 🚀 Deployment Considerations

### CORS Configuration
The Quiz API includes CORS support. Ensure your main domain is allowed:

```python
# In the Quiz API (when hosting)
CORS(app, origins=[
    "https://your-main-platform.com",
    "https://staging.your-main-platform.com",
    "http://localhost:3000"  # For local development
])
```

### API Versioning
The API uses `/api/v1/` prefix for versioning. When upgrading:
- Maintain backward compatibility
- Add new versions as `/api/v2/` if breaking changes needed
- Update your integration code gradually

## 🔄 Error Handling

### Standardized Error Responses
```javascript
// Handle Quiz API errors in your main application
const handleQuizApiError = (error) => {
  if (error.response) {
    // Quiz API returned error response
    const { status, data } = error.response;
    switch (status) {
      case 404:
        return 'Quiz not found';
      case 400:
        return data.message || 'Invalid request';
      case 500:
        return 'Quiz service temporarily unavailable';
      default:
        return 'Quiz operation failed';
    }
  } else if (error.request) {
    // Quiz API not responding
    return 'Quiz service is not responding';
  } else {
    return 'Unexpected error occurred';
  }
};
```

## 📝 Testing Integration

### Mock Quiz API for Development
```javascript
// For local development/testing
const mockQuizApi = {
  createQuiz: async (data) => ({
    success: true,
    data: { quiz_id: 'mock_123', ...data }
  }),
  
  startQuizSession: async (quizId) => ({
    success: true,
    data: {
      session_id: 'session_456',
      quiz: { id: quizId, title: 'Mock Quiz', questions: [] }
    }
  })
};

// Use mock in development
const quizService = process.env.NODE_ENV === 'development' 
  ? mockQuizApi 
  : quizApiClient;
```

## 🎯 Best Practices

1. **Async Operations**: Always handle Quiz API calls asynchronously
2. **Error Boundaries**: Implement error boundaries in React components
3. **Loading States**: Show loading indicators during API calls
4. **Caching**: Cache quiz data where appropriate to reduce API calls
5. **Fallbacks**: Provide graceful degradation if Quiz API is unavailable
6. **Logging**: Log all Quiz API interactions for debugging
7. **Timeouts**: Set appropriate timeouts for API calls
8. **Retries**: Implement retry logic for failed requests

This integration approach allows your main platform to leverage the Quiz API's capabilities while maintaining clean separation of concerns and scalability.