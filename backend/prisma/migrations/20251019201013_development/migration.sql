/*
  Warnings:

  - A unique constraint covering the columns `[userId,courseId]` on the table `CourseEnrollment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,courseId]` on the table `CourseReview` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "public"."events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."conversations" (
    "id" TEXT NOT NULL,
    "participant1Id" TEXT NOT NULL,
    "participant2Id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."messages" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CourseQuiz" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "externalQuizId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "difficulty" TEXT,
    "lessonId" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tags" TEXT[],
    "isCached" BOOLEAN NOT NULL DEFAULT false,
    "quizData" JSONB,
    "cachedData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseQuiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QuizResult" (
    "id" TEXT NOT NULL,
    "courseQuizId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "externalSessionId" TEXT,
    "score" DOUBLE PRECISION NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "correctAnswers" INTEGER NOT NULL,
    "timeSpent" INTEGER NOT NULL,
    "answers" JSONB NOT NULL,
    "result" JSONB NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "conversations_participant1Id_participant2Id_key" ON "public"."conversations"("participant1Id", "participant2Id");

-- CreateIndex
CREATE INDEX "CourseQuiz_courseId_idx" ON "public"."CourseQuiz"("courseId");

-- CreateIndex
CREATE INDEX "CourseQuiz_lessonId_idx" ON "public"."CourseQuiz"("lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseQuiz_courseId_externalQuizId_key" ON "public"."CourseQuiz"("courseId", "externalQuizId");

-- CreateIndex
CREATE INDEX "QuizResult_studentId_idx" ON "public"."QuizResult"("studentId");

-- CreateIndex
CREATE INDEX "QuizResult_courseQuizId_idx" ON "public"."QuizResult"("courseQuizId");

-- CreateIndex
CREATE INDEX "QuizResult_enrollmentId_idx" ON "public"."QuizResult"("enrollmentId");

-- CreateIndex
CREATE UNIQUE INDEX "QuizResult_courseQuizId_studentId_key" ON "public"."QuizResult"("courseQuizId", "studentId");

-- CreateIndex
CREATE INDEX "Course_instructorId_idx" ON "public"."Course"("instructorId");

-- CreateIndex
CREATE INDEX "Course_category_idx" ON "public"."Course"("category");

-- CreateIndex
CREATE INDEX "Course_language_idx" ON "public"."Course"("language");

-- CreateIndex
CREATE INDEX "Course_level_idx" ON "public"."Course"("level");

-- CreateIndex
CREATE INDEX "Course_createdAt_idx" ON "public"."Course"("createdAt");

-- CreateIndex
CREATE INDEX "CourseEnrollment_userId_idx" ON "public"."CourseEnrollment"("userId");

-- CreateIndex
CREATE INDEX "CourseEnrollment_courseId_idx" ON "public"."CourseEnrollment"("courseId");

-- CreateIndex
CREATE INDEX "CourseEnrollment_createdAt_idx" ON "public"."CourseEnrollment"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CourseEnrollment_userId_courseId_key" ON "public"."CourseEnrollment"("userId", "courseId");

-- CreateIndex
CREATE INDEX "CourseReview_courseId_idx" ON "public"."CourseReview"("courseId");

-- CreateIndex
CREATE INDEX "CourseReview_userId_idx" ON "public"."CourseReview"("userId");

-- CreateIndex
CREATE INDEX "CourseReview_rating_idx" ON "public"."CourseReview"("rating");

-- CreateIndex
CREATE UNIQUE INDEX "CourseReview_userId_courseId_key" ON "public"."CourseReview"("userId", "courseId");

-- CreateIndex
CREATE INDEX "ForumPost_courseId_idx" ON "public"."ForumPost"("courseId");

-- CreateIndex
CREATE INDEX "ForumPost_authorId_idx" ON "public"."ForumPost"("authorId");

-- CreateIndex
CREATE INDEX "ForumPost_createdAt_idx" ON "public"."ForumPost"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."conversations" ADD CONSTRAINT "conversations_participant1Id_fkey" FOREIGN KEY ("participant1Id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conversations" ADD CONSTRAINT "conversations_participant2Id_fkey" FOREIGN KEY ("participant2Id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."conversations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CourseQuiz" ADD CONSTRAINT "CourseQuiz_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuizResult" ADD CONSTRAINT "QuizResult_courseQuizId_fkey" FOREIGN KEY ("courseQuizId") REFERENCES "public"."CourseQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuizResult" ADD CONSTRAINT "QuizResult_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "public"."CourseEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuizResult" ADD CONSTRAINT "QuizResult_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
