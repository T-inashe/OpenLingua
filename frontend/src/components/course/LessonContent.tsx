import type { CourseLesson, QuizResponses } from '../../types/course';
import { resolveLessonContent } from '../../utils/courseUtils';
import QuizLesson from '../quiz/QuizLesson';

interface LessonContentProps {
  lesson: CourseLesson;
  quizResponses: QuizResponses;
  onQuizResponseUpdate: (lessonId: string, responses: Record<string, { selectedOptionId: number; isCorrect: boolean }>) => void;
}

export default function LessonContent({ lesson, quizResponses, onQuizResponseUpdate }: LessonContentProps) {
  const normalizedType = (lesson.type || "text").toLowerCase();

  if (normalizedType === "quiz") {
    return (
      <QuizLesson 
        lesson={lesson} 
        quizResponses={quizResponses} 
        onQuizResponseUpdate={onQuizResponseUpdate} 
      />
    );
  }

  const resolvedContent = resolveLessonContent(lesson.content);

  if (!resolvedContent) {
    return <p className="text-gray-400 text-sm italic">No content provided.</p>;
  }

  if (normalizedType === "audio") {
    return (
      <audio controls className="w-full mt-3">
        <source src={resolvedContent} />
        Your browser does not support the audio element.
      </audio>
    );
  }

  if (normalizedType === "video") {
    return (
      <div className="mt-3">
        <video
          controls
          controlsList="nodownload"
          className="w-full rounded-lg shadow-lg"
          style={{ maxWidth: '960px', maxHeight: '540px', aspectRatio: '16 / 9' }}
        >
          <source src={resolvedContent} />
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  if (normalizedType === "image") {
    return (
      <img
        src={resolvedContent}
        alt={lesson.title}
        className="w-full rounded-lg mt-3 object-cover"
      />
    );
  }

  return <p className="text-gray-300 mt-2 leading-relaxed">{resolvedContent}</p>;
}