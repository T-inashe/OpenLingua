# Quiz API Integration - TODO Checklist

## Overview
This document tracks the implementation progress for integrating an external Quiz API microservice into OpenLingua. The integration uses a proxy layer pattern where the backend acts as a gateway to the external API, providing caching, authorization, and resilience.

---

## ✅ DISCOVERY: Complete Quiz System Already Exists!

### Existing Implementation (Feature Complete)

The project **already has a fully implemented quiz system** with external API integration:

**Backend Services:**
- ✅ `backend/src/services/quizApiClient.js` - External API client with retry logic
- ✅ `backend/src/services/quizCacheService.js` - Caching service for offline support
- ✅ `backend/src/services/quizSharingService.js` - Quiz template sharing

**Backend Controllers:**
- ✅ `backend/src/controllers/quizProxyController.js` (447 lines) - Main proxy controller
- ✅ `backend/src/controllers/quizSessionController.js` - Quiz session management

**Routes:**
- ✅ `backend/src/routes/quizRoutes.js` (350 lines) - All routes configured and registered

**Middleware:**
- ✅ `backend/src/middleware/quizAuth.js` - Custom validation and rate limiting

**Features:**
- ✅ Create/Read/Update/Delete quizzes
- ✅ Quiz sessions with start/submit/results
- ✅ Quiz sharing and templates
- ✅ Quiz analytics for instructors
- ✅ Offline fallback mode
- ✅ Rate limiting
- ✅ Course ownership validation
- ✅ Enrollment validation

---

## 🗑️ Files to Remove (Redundant)

The following files were created during this TODO but are **redundant** with the existing system:

1. ❌ `backend/src/controllers/quizController.js` - **DELETE** (duplicate of quizProxyController.js)
2. ❌ `backend/src/services/quizService.js` - **DELETE** (duplicate of quizApiClient.js)

---

## ✅ Files to Keep

1. ✅ `backend/prisma/schema.prisma` - Schema updates are compatible (CourseQuiz, QuizAttempt)
2. ✅ `backend/.env.quiz.example` - Environment configuration template
3. ✅ `frontend/src/services/quizApi.ts` - Frontend API client (may need adjustments)
4. ✅ `docs/QUIZ_API_INTEGRATION_TODO.md` - This documentation

---

## 🔧 What Actually Needs To Be Done

### 1. Database Migration (HIGH Priority)
The schema updates need to be migrated:

```bash
cd backend
npx prisma migrate dev --name add_quiz_models
npx prisma generate
```

**Note**: Check if CourseQuiz and QuizAttempt models already exist in schema before migrating!

### 2. Environment Configuration (HIGH Priority)

Add to `backend/.env`:
```
QUIZ_API_URL=http://localhost:5000
```

**Note**: The existing system uses port 5000, not 3001!

### 3. Frontend Integration (MEDIUM Priority)

The frontend needs quiz UI components:
- Quiz creation interface
- Quiz taking interface  
- Results display
- Integration with CourseCreation/CourseDashboard

### 4. Testing (MEDIUM Priority)

Test the existing system:
- Verify external API connection
- Test quiz creation flow
- Test quiz taking flow
- Test offline mode

---

## 📋 Existing Routes Summary

All routes are already configured at `/api/*`:

**Quiz Management (Instructor):**
- `POST /api/courses/:courseId/quizzes` - Create quiz
- `GET /api/courses/:courseId/quizzes` - List quizzes
- `GET /api/courses/:courseId/quizzes/:quizId` - Get quiz details
- `PUT /api/courses/:courseId/quizzes/:quizId` - Update quiz
- `DELETE /api/courses/:courseId/quizzes/:quizId` - Delete quiz

**Quiz Sessions (Students):**
- `POST /api/quiz-sessions/:quizId/start` - Start quiz session
- `POST /api/quiz-sessions/:quizId/submit` - Submit answers
- `GET /api/quiz-sessions/:quizId/results` - Get results

**Quiz Templates:**
- `POST /api/courses/:courseId/quizzes/:quizId/share` - Share as template
- `POST /api/courses/:courseId/quizzes/copy-template` - Copy template
- `GET /api/quiz-templates` - List templates
- `GET /api/quiz-templates/:templateId` - Get template details
- `DELETE /api/quiz-templates/:templateId` - Unshare template
- `GET /api/quiz-sharing-stats` - Get sharing stats

**Analytics:**
- `GET /api/courses/:courseId/quiz-analytics` - Get quiz analytics

**Health:**
- `GET /api/quiz-health` - Check external API health

---

## 🚨 Important Notes
- ✅ Added `CourseQuiz` model to cache quiz metadata
- ✅ Added `QuizAttempt` model to track student attempts
- ✅ Added `quizzes` relation to `Course` model
- ✅ Added indexes for query optimization
- ✅ Added cascade delete for quiz attempts

**File**: `backend/prisma/schema.prisma`

---

### 4. Backend Quiz Service
- ✅ Created external API client with axios
- ✅ Implemented retry logic with exponential backoff (3 retries, 1s delay)
- ✅ Configured timeout and headers
- ✅ Implemented all CRUD operations for quizzes
- ✅ Added health check endpoint
- ✅ Error handling and graceful degradation

**File**: `backend/src/services/quizService.js`

**Functions**:
- `createQuiz(quizData)`
- `getQuizById(externalQuizId)`
- `getQuizzesByIds(externalQuizIds)` - batch fetch
- `updateQuiz(externalQuizId, updates)`
- `deleteQuiz(externalQuizId)`
- `submitQuizAttempt(externalQuizId, attemptData)`
- `getQuizAttempts(externalQuizId, userId)`
- `checkApiHealth()`

---

### 3. Backend Quiz Controller
- ✅ Created proxy layer controller
- ✅ Implemented course ownership verification
- ✅ Implemented enrollment verification
- ✅ Added dual storage (external API + local cache)
- ✅ Implemented attempt limit enforcement
- ✅ Added instructor vs student authorization logic
- ✅ Error handling with fallback to cached data

**File**: `backend/src/controllers/quizController.js`

**Endpoints**:
- `createCourseQuiz` - POST /api/courses/:courseId/quizzes
- `getCourseQuizzes` - GET /api/courses/:courseId/quizzes
- `getCourseQuiz` - GET /api/courses/:courseId/quizzes/:quizId
- `submitQuizAttempt` - POST /api/courses/:courseId/quizzes/:quizId/attempts
- `getStudentAttempts` - GET /api/courses/:courseId/quizzes/:quizId/attempts
- `updateCourseQuiz` - PUT /api/courses/:courseId/quizzes/:quizId
- `deleteCourseQuiz` - DELETE /api/courses/:courseId/quizzes/:quizId

---

### 4. Frontend Quiz API Client
- ✅ Created TypeScript service for quiz operations
- ✅ Defined TypeScript interfaces for Quiz, QuizQuestion, QuizAttempt
- ✅ Implemented all CRUD methods
- ✅ Error handling with descriptive messages
- ✅ Type-safe API calls

**File**: `frontend/src/services/quizApi.ts`

**Functions**:
- `createQuiz(courseId, quizData)`
- `getCourseQuizzes(courseId)`
- `getQuiz(courseId, quizId)`
- `submitQuizAttempt(courseId, quizId, answers, startedAt, completedAt)`
- `getQuizAttempts(courseId, quizId, userId?)`
- `updateQuiz(courseId, quizId, updates)`
- `deleteQuiz(courseId, quizId)`

---

### 5. Environment Configuration Template
- ✅ Created `.env.quiz.example` with required variables
- ✅ Documented QUIZ_API_URL and QUIZ_API_KEY

**File**: `backend/.env.quiz.example`

---

## 🔄 Pending Tasks

### 6. Database Migration
**Priority**: HIGH (blocking other tasks)

```bash
cd backend
npx prisma migrate dev --name add_quiz_proxy_tables
npx prisma generate
```

**Status**: ⏳ Not started
**Blocker**: Need to run migration to create tables

---

### 7. Backend Route Registration
**Priority**: HIGH

**Note**: Quiz routes already exist at `backend/src/routes/quizRoutes.js` but may need updates.

**Action Required**:
1. Review existing `backend/src/routes/quizRoutes.js`
2. Check if routes match new controller methods
3. Update or replace routes if needed
4. Routes are already registered in `app.js` with `app.use("/api", quizRoutes)`

**Files to check**:
- `backend/src/routes/quizRoutes.js` (existing, may need updates)
- `backend/src/app.js` (already imports quiz routes)

**Status**: ⏳ Needs review and potential updates

---

### 8. Environment Variables Setup
**Priority**: HIGH

**Action Required**:
1. Add to `backend/.env`:
   ```
   QUIZ_API_URL=http://localhost:3001/api
   ```
2. Update production environment variables in Azure/deployment platform
3. Get actual Quiz API URL from instructor/system admin

**Status**: ⏳ Not configured

---

### 9. Frontend Quiz Editor Component
**Priority**: MEDIUM

**Action Required**:
Create `frontend/src/components/quiz/QuizEditor.tsx` with:
- Form for quiz title, description, time limit, passing score
- Question builder (add/edit/delete questions)
- Support for multiple question types (multiple-choice, true-false, short-answer)
- Quiz preview functionality
- Save to external API via backend proxy

**Features needed**:
- Add question button
- Question type selector
- Options editor for multiple-choice
- Correct answer marking
- Points per question
- Explanation field (optional)
- Drag-and-drop question reordering (nice to have)

**Status**: ⏳ Not created

---

### 10. Quiz Taking Component
**Priority**: MEDIUM

**Action Required**:
Create `frontend/src/components/quiz/QuizTaker.tsx` with:
- Timer display (if time limit set)
- Question navigation
- Answer submission
- Auto-submit when time expires
- Results display after submission
- Attempt history view

**Features needed**:
- Progress indicator (e.g., "Question 3 of 10")
- Answer selection UI for each question type
- Review answers before submission
- Confirmation dialog on submit
- Score breakdown (correct/incorrect/total)
- Feedback on each answer (if available)

**Status**: ⏳ Not created

---

### 11. Update CourseCreation Component
**Priority**: MEDIUM

**Action Required**:
Update `frontend/src/components/course/CourseCreation.tsx`:
- Remove or comment out inline quiz builder
- Add button to open QuizEditor modal/page
- Integrate with new quiz API endpoints
- Show list of quizzes created for course
- Allow editing/deleting existing quizzes

**Current state**: Has inline quiz builder that should be replaced

**Status**: ⏳ Not updated

---

### 12. Update CourseDashboard Component
**Priority**: LOW

**Action Required**:
Update course dashboard to:
- Display quizzes for enrolled students
- Show quiz completion status
- Show quiz scores and attempts
- Link to quiz taking interface

**Status**: ⏳ Not updated

---

### 13. Testing
**Priority**: MEDIUM

**Action Required**:
1. Test external API connection and authentication
2. Test quiz creation flow (frontend → backend → external API)
3. Test quiz taking flow (fetch → display → submit → grade)
4. Test authorization (instructor vs student permissions)
5. Test attempt limits enforcement
6. Test error handling when external API is down (fallback to cache)
7. Test retry logic with network issues

**Test scenarios**:
- ✅ Instructor creates quiz
- ✅ Student takes quiz
- ✅ Student reaches attempt limit
- ✅ External API unavailable (should use cache)
- ✅ Network timeout (should retry 3 times)
- ✅ Invalid quiz data
- ✅ Unauthorized access attempts

**Status**: ⏳ Not tested

---

### 14. Documentation
**Priority**: LOW

**Action Required**:
1. Update API documentation with quiz endpoints
2. Document quiz data structure expected by external API
3. Add setup instructions for external Quiz API
4. Document retry logic and caching behavior
5. Create user guide for quiz creation/taking

**Status**: ⏳ Not documented

---

## 📝 Architecture Summary

```
┌─────────────────┐
│  React Frontend │
│   (TypeScript)  │
└────────┬────────┘
         │ quizApi.ts
         ▼
┌─────────────────────────┐
│  Express Backend (Proxy)│
│                         │
│  ┌──────────────────┐  │
│  │ quizController.js│  │
│  └────────┬─────────┘  │
│           │             │
│  ┌────────▼─────────┐  │
│  │ quizService.js   │  │
│  │ (axios client)   │  │
│  └────────┬─────────┘  │
│           │             │
│  ┌────────▼─────────┐  │
│  │ Prisma ORM       │  │
│  │ (Local Cache)    │  │
│  └──────────────────┘  │
└───────────┬─────────────┘
            │
     ┌──────▼───────┐
     │ External Quiz│
     │     API      │
     │ (Microservice)│
     └──────────────┘
```

### Data Flow

**Create Quiz**:
1. Frontend calls `quizApi.createQuiz()`
2. Backend controller receives request
3. Controller validates course ownership
4. Service sends quiz to external API
5. External API returns quiz with ID
6. Controller caches metadata in local DB
7. Response sent back to frontend

**Take Quiz**:
1. Frontend calls `quizApi.getQuiz()`
2. Backend verifies enrollment
3. Backend checks attempt limit
4. Service fetches quiz from external API
5. Quiz returned to frontend for display
6. Student completes quiz
7. Frontend submits answers via `quizApi.submitQuizAttempt()`
8. Backend sends to external API for grading
9. External API returns score and results
10. Backend caches attempt in local DB
11. Results returned to student

**Offline Resilience**:
- If external API fails, backend returns cached quiz metadata
- Warning shown to user: "Could not fetch questions from external API"
- Attempts are still recorded locally even if external API is down
- Retry logic automatically retries failed requests 3 times

---

## 🚨 Important Notes

1. **Existing Quiz System**: There is already a complete quiz system in place:
   - `backend/src/routes/quizRoutes.js` (350 lines) - Already registered in app.js
   - `backend/src/controllers/quizProxyController.js` (447 lines) - Class-based proxy controller
   - `backend/src/controllers/quizSessionController.js` - Quiz session management
   - `backend/src/services/quizSharingService.js` - Quiz template sharing
   - `backend/src/middleware/quizAuth.js` - Custom authentication/validation middleware
   
   **The existing system already implements the proxy pattern and is feature-complete.**
   
   **Decision needed**: 
   - **Option A (Recommended)**: Use the existing quiz system, just ensure environment variables are configured
   - **Option B**: Replace existing system with the new simpler implementation created in this TODO
   
   The new files created (`quizController.js`, `quizService.js`) can either:
   - Be deleted if using existing system (Option A)
   - Replace existing files if simplifying (Option B)

2. **External API Requirement**: This integration is required for academic marks. The external Quiz API must be:
   - Running and accessible at QUIZ_API_URL
   - Compatible with the expected data structure
   - No authentication required (open API)

3. **Database Migration**: The Prisma migration MUST be run before testing any quiz functionality.

4. **Backward Compatibility**: The current CourseCreation component has an inline quiz builder. This should be preserved (or migrated) during the transition to external API.

5. **Rate Limiting**: Consider adding rate limiting to quiz submission endpoints to prevent abuse.

6. **Security**: Ensure quiz answers and correct answers are not exposed to students before they submit.

---

## 📊 Progress Tracking

| Task | Status | Priority | Blocker |
|------|--------|----------|---------|
| Database Schema | ✅ Complete | HIGH | None |
| Backend Service | ✅ Complete | HIGH | None |
| Backend Controller | ✅ Complete | HIGH | None |
| Frontend API Client | ✅ Complete | HIGH | None |
| Environment Template | ✅ Complete | MEDIUM | None |
| Database Migration | ⏳ Pending | HIGH | Need to run command |
| Route Registration | ⏳ Pending | HIGH | Need to review existing routes |
| Environment Setup | ⏳ Pending | HIGH | Need actual API URL/key |
| Quiz Editor Component | ⏳ Pending | MEDIUM | None |
| Quiz Taker Component | ⏳ Pending | MEDIUM | None |
| Update CourseCreation | ⏳ Pending | MEDIUM | QuizEditor component |
| Update CourseDashboard | ⏳ Pending | LOW | QuizTaker component |
| Testing | ⏳ Pending | MEDIUM | Migration, env setup |
| Documentation | ⏳ Pending | LOW | None |

**Overall Progress**: 5/14 tasks complete (36%)

---

## 🔧 Next Immediate Steps

1. **Run Prisma Migration** (5 minutes)
   ```bash
   cd backend
   npx prisma migrate dev --name add_quiz_proxy_tables
   npx prisma generate
   ```

2. **Configure Environment Variables** (5 minutes)
   - Add QUIZ_API_URL and QUIZ_API_KEY to backend/.env
   - Get actual values from instructor/system admin

3. **Review Existing Quiz Routes** (15 minutes)
   - Check `backend/src/routes/quizRoutes.js`
   - Determine if routes need updating or replacement
   - Ensure compatibility with new controller

4. **Test Backend API** (30 minutes)
   - Use Postman/Thunder Client to test quiz creation
   - Verify external API connection
   - Test error handling and retry logic

5. **Create QuizEditor Component** (2-3 hours)
   - Start with basic form
   - Add question builder
   - Integrate with quiz API

---

## 📞 Support & Questions

If you encounter issues:
1. Check external Quiz API is running and accessible
2. Verify QUIZ_API_URL environment variable is set correctly
3. Check Prisma migration was successful
4. Review backend logs for detailed error messages
5. Ensure user has proper authorization (course instructor for creation)

**Common Issues**:
- "Failed to create quiz in external API" → Check QUIZ_API_URL is correct and API is running
- "Quiz not found" → Verify courseId and quizId are correct
- "Maximum attempts reached" → Student has used all attempts, check maxAttempts setting
- "Access denied" → User not enrolled in course or not course instructor
