import { BookOpen } from 'lucide-react';
import type { CourseUnit, QuizResponses } from '../../types/course';
import LessonContent from './LessonContent';

interface CourseLessonsProps {
  unitsToRender: CourseUnit[];
  completedLessons: Record<string, boolean>;
  quizResponses: QuizResponses;
  isVisible: boolean;
  onToggleLessonDone: (lessonId: string) => void;
  onQuizResponseUpdate: (lessonId: string, responses: Record<string, { selectedOptionId: number; isCorrect: boolean }>) => void;
}

export default function CourseLessons({ 
  unitsToRender, 
  completedLessons, 
  quizResponses, 
  isVisible, 
  onToggleLessonDone, 
  onQuizResponseUpdate 
}: CourseLessonsProps) {
  return (
    <section 
      className={`bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 mb-8 transition-all duration-1000 delay-400 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      }`} 
      role="region" 
      aria-labelledby="lessons-heading"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 id="lessons-heading" className="text-white font-semibold text-xl flex items-center gap-2">
          <BookOpen size={20} className="text-purple-400" aria-hidden="true" /> 
          Course Lessons
        </h2>
      </div>

      {unitsToRender.length === 0 ? (
        <p className="text-gray-400 text-sm">No lessons available yet.</p>
      ) : (
        <div className="space-y-4">
          {unitsToRender.map((unit) => (
            <div key={unit.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-white font-semibold text-lg">{unit.title}</h3>
                  {unit.description && (
                    <p className="text-gray-400 text-sm mt-1">{unit.description}</p>
                  )}
                </div>
                <span className="text-xs text-white/40 uppercase tracking-wide">
                  Unit {unit.position + 1}
                </span>
              </div>

              <ul className="mt-4 space-y-3">
                {unit.lessons.map((lesson) => {
                  const normalizedType = (lesson.type || "text").toLowerCase();
                  const isCompleted = !!completedLessons[lesson.id];

                  return (
                    <li
                      key={lesson.id}
                      className="bg-black/30 border border-white/10 rounded-lg p-4 text-white"
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                        <div>
                          <h4 className="font-semibold text-base md:text-lg">{lesson.title}</h4>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-white/60 mt-1">
                            <span className="px-2 py-0.5 rounded-full bg-white/10 uppercase tracking-wide">
                              {normalizedType}
                            </span>
                            {lesson.duration ? (
                              <span>{lesson.duration} min</span>
                            ) : null}
                          </div>
                        </div>
                        <button
                          onClick={() => onToggleLessonDone(lesson.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-200 ${
                            isCompleted ? "bg-green-600/80" : "bg-cyan-600/80"
                          }`}
                        >
                          {isCompleted ? "Completed" : "Mark as Done"}
                        </button>
                      </div>

                      <LessonContent 
                        lesson={lesson} 
                        quizResponses={quizResponses} 
                        onQuizResponseUpdate={onQuizResponseUpdate} 
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}