# Quiz Proxy Layer Architecture

## 🎯 **Design Goals**
- **Course Isolation**: All quizzes belong to specific courses
- **Authorization**: Only course creators manage quizzes, enrolled students take them
- **Resilience**: Works offline with cached data
- **Quiz Sharing**: Instructors can share templates across courses
- **Dual Storage**: External API + local references for reliability

## 📋 **Data Flow**

### Quiz Creation Flow
```
1. Instructor → POST /api/courses/:courseId/quizzes
2. Validate course ownership
3. Call external Quiz API with course context
4. Store local reference in CourseQuiz table
5. Cache quiz data for offline access
6. Return success response
```

### Quiz Taking Flow
```
1. Student → POST /api/quiz-sessions/:quizId/start
2. Validate course enrollment
3. Try external API for latest quiz data
4. Fallback to cached data if API unavailable  
5. Create local QuizResult record
6. Return quiz questions to student
```

### Result Storage Flow
```
1. Student submits answers
2. Store in external API (primary)
3. Store in local QuizResult (backup + analytics)
4. Update course progress
5. Return results to student
```

## 🗃️ **Database Schema Extensions**

```prisma
model CourseQuiz {
  id               String @id @default(cuid())
  course           Course @relation(fields: [courseId], references: [id])
  courseId         String
  externalQuizId   String  // Reference to external Quiz API
  title            String
  description      String?
  category         String
  difficulty       String
  isActive         Boolean @default(true)
  isCached         Boolean @default(false)
  cachedData       Json?   // Offline quiz questions/settings
  sharedByUserId   String? // Original creator for templates
  isTemplate       Boolean @default(false)
  tags             String[]
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  
  results          QuizResult[]
  
  @@unique([courseId, externalQuizId])
}

model QuizResult {
  id                String @id @default(cuid())
  quiz              CourseQuiz @relation(fields: [quizId], references: [id])
  quizId            String
  student           User @relation(fields: [studentId], references: [id])
  studentId         String
  externalSessionId String? // External API session reference
  score             Float
  totalQuestions    Int
  timeSpent         Int     // in seconds
  answers           Json    // student answers for review
  completedAt       DateTime @default(now())
  
  @@unique([quizId, studentId]) // One result per student per quiz
}

// Update Course model to include quizzes
model Course {
  // ... existing fields
  quizzes           CourseQuiz[]
}

// Update User model for quiz results
model User {
  // ... existing fields  
  quizResults       QuizResult[]
}
```

## 🛡️ **Authorization Matrix**

| Action | Course Creator | Enrolled Student | Other User |
|--------|---------------|------------------|------------|
| Create Quiz | ✅ | ❌ | ❌ |
| Edit Quiz | ✅ | ❌ | ❌ |
| Delete Quiz | ✅ | ❌ | ❌ |
| View Quiz | ✅ | ✅ | ❌ |
| Take Quiz | ✅ | ✅ | ❌ |
| View Results | ✅ (all) | ✅ (own) | ❌ |
| Share Quiz | ✅ | ❌ | ❌ |

## 🔧 **API Endpoints**

```
/api/courses/:courseId/quizzes/
├── GET /                    # List course quizzes (+ templates for instructors)
├── POST /                   # Create new quiz
├── GET /:quizId            # Get quiz details
├── PUT /:quizId            # Update quiz
├── DELETE /:quizId         # Delete quiz
├── POST /:quizId/share     # Share quiz as template
└── POST /:quizId/copy      # Copy template to course

/api/quiz-sessions/
├── POST /:quizId/start     # Start quiz session
├── POST /:quizId/submit    # Submit answers
└── GET /:sessionId/results # Get detailed results

/api/quiz-templates/
├── GET /                   # Browse shared templates
└── POST /:templateId/copy  # Copy template to course
```

## ⚡ **Error Handling & Fallbacks**

### External API Failure Scenarios
1. **API Down**: Use cached quiz data, show "offline mode" indicator
2. **Timeout**: Retry with exponential backoff, fallback to cache
3. **Invalid Response**: Log error, return cached data with warning
4. **Rate Limited**: Queue requests, inform user of delay

### Cache Strategy
- **Cache on Creation**: Store full quiz data when created
- **Cache on Update**: Update cached data when quiz modified
- **Cache Expiry**: 24 hours for question data, never for structure
- **Cache Validation**: Compare external API version with cached version

## 📊 **Monitoring & Logging**

### Key Metrics
- External API response times
- Cache hit/miss rates  
- Quiz completion rates per course
- Fallback activation frequency

### Log Events
```javascript
// Quiz operations
logger.info('quiz.created', { courseId, quizId, instructorId })
logger.info('quiz.started', { quizId, studentId, mode: 'online|offline' })
logger.info('quiz.completed', { quizId, studentId, score, timeSpent })

// System health
logger.warn('external.api.timeout', { endpoint, duration })
logger.error('external.api.failure', { endpoint, error })
logger.info('cache.hit', { quizId, requestType })
```

## 🚀 **Implementation Phases**

### Phase 1: Core Proxy Layer
- Database schema updates
- Basic CRUD operations
- Course authorization
- External API client

### Phase 2: Caching & Fallbacks  
- Quiz data caching
- Offline mode detection
- Graceful degradation
- Error handling

### Phase 3: Advanced Features
- Quiz sharing/templates
- Analytics dashboard
- Performance optimization
- Monitoring setup

## 🔐 **Security Considerations**

### Authentication
- Use existing JWT tokens
- Validate user sessions before external API calls
- Log all quiz access attempts

### Authorization
- Course ownership validation on all instructor actions
- Enrollment validation on all student actions  
- Rate limiting on quiz creation/sharing

### Data Protection
- Encrypt cached quiz data at rest
- Sanitize user inputs before external API calls
- Audit trail for quiz modifications

This architecture ensures robust, secure, and resilient quiz integration while maintaining clean separation of concerns.