import type { QuizQuestion, QuizLessonContent, QuizResponses } from '../../types/course';

interface QuizLessonProps {
  lesson: {
    id: string;
    title: string;
    content: string | null;
  };
  quizResponses: QuizResponses;
  onQuizResponseUpdate: (lessonId: string, responses: Record<string, { selectedOptionId: number; isCorrect: boolean }>) => void;
}

export default function QuizLesson({ lesson, quizResponses, onQuizResponseUpdate }: QuizLessonProps) {
  if (!lesson.content) {
    return <p className="text-gray-400 text-sm italic">No quiz configured yet.</p>;
  }

  let quizContent: QuizLessonContent | null = null;

  try {
    quizContent = JSON.parse(lesson.content) as QuizLessonContent;
  } catch (error) {
    console.error("Failed to parse quiz content", error);
    return (
      <p className="text-red-300 text-sm italic">
        Unable to load quiz content. Please contact your instructor.
      </p>
    );
  }

  const questions = quizContent?.questions ?? [];

  if (questions.length === 0) {
    return <p className="text-gray-400 text-sm italic">Quiz questions will appear here once added.</p>;
  }

  const lessonKey = lesson.id;
  const lessonResponses = quizResponses[lessonKey] ?? {};

  const handleOptionSelect = (question: QuizQuestion, optionId: number) => {
    const isCorrectSelection = optionId === question.correctOptionId;
    const updatedResponses = {
      ...lessonResponses,
      [String(question.id)]: {
        selectedOptionId: optionId,
        isCorrect: isCorrectSelection,
      },
    };
    onQuizResponseUpdate(lessonKey, updatedResponses);
  };

  return (
    <div className="mt-4 space-y-6">
      {questions.map((question, index) => {
        const response = lessonResponses[String(question.id)];
        const hasResponse = Boolean(response?.selectedOptionId);
        const isCorrect = response?.isCorrect ?? false;
        const selectedOptionId = response?.selectedOptionId ?? null;

        return (
          <div key={question.id} className="rounded-xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20">
            <div className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-sm font-semibold text-cyan-200">
                {index + 1}
              </span>
              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-base font-semibold text-white">{question.prompt || (question as any).text || 'Question text not available'}</p>
                  <p className="text-xs uppercase tracking-wide text-white/50">Choose one answer</p>
                </div>

                <div className="space-y-3">
                  {question.options?.map((option, optionIndex) => {
                    const optionIsSelected = selectedOptionId === option.id;
                    const optionIsCorrect = option.id === question.correctOptionId;
                    const showFeedback = hasResponse;

                    let borderClass = "border-white/10 hover:border-cyan-400/50";
                    let backgroundClass = "bg-slate-900/60 hover:bg-slate-900/80";
                    let textClass = "text-white";

                    if (showFeedback) {
                      if (optionIsCorrect) {
                        borderClass = "border-emerald-400/60";
                        backgroundClass = "bg-emerald-500/10";
                        textClass = "text-emerald-200";
                      } else if (optionIsSelected) {
                        borderClass = "border-rose-400/60";
                        backgroundClass = "bg-rose-500/10";
                        textClass = "text-rose-200";
                      } else {
                        borderClass = "border-white/10";
                        backgroundClass = "bg-slate-900/60";
                        textClass = "text-white/80";
                      }
                    } else if (optionIsSelected) {
                      borderClass = "border-cyan-400/60";
                      backgroundClass = "bg-cyan-500/10";
                    }

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleOptionSelect(question, option.id)}
                        className={`flex w-full items-center justify-between rounded-lg border ${borderClass} px-4 py-3 text-left transition-colors duration-200 ${backgroundClass}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/5 text-sm font-semibold text-white/80">
                            {String.fromCharCode(65 + optionIndex)}
                          </span>
                          <span className={`text-sm font-medium ${textClass}`}>
                            {option.text}
                          </span>
                        </div>
                        {showFeedback && optionIsCorrect && (
                          <span className="text-xs font-semibold uppercase tracking-wide text-emerald-300">Correct</span>
                        )}
                        {showFeedback && optionIsSelected && !optionIsCorrect && (
                          <span className="text-xs font-semibold uppercase tracking-wide text-rose-300">Incorrect</span>
                        )}
                      </button>
                    );
                  }) || (
                    <div className="text-gray-400 text-sm italic">
                      No options available for this question.
                    </div>
                  )}
                </div>

                {hasResponse && (
                  <div
                    className={`rounded-lg border px-4 py-3 text-sm ${
                      isCorrect
                        ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                        : "border-rose-400/40 bg-rose-500/10 text-rose-200"
                    }`}
                  >
                    <p className="font-medium">
                      {isCorrect
                        ? "Great job! That's the correct answer."
                        : "That isn't quite right yet. Try another option."}
                    </p>
                    {question.explanation && (
                      <p className="mt-2 text-xs text-white/80">
                        {question.explanation}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}