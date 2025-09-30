import { useState, useEffect } from 'react';
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  AlertCircle,
  Flag,
  BookOpen,
  Trophy
} from 'lucide-react';
import quizService from '../../services/quizService';
import type { Quiz, QuizResult, QuizQuestion } from '../../types/quiz';

// Component props interface
interface QuizTakingProps {
  courseId?: string;
  quizId?: string;
  quiz?: Quiz;
  onComplete: (result: QuizResult) => void;
  onCancel: () => void;
}

// Answer mapping type
type AnswerMap = Record<string, string>;

const QuizTaking = ({ courseId, quizId, quiz: initialQuiz, onComplete, onCancel }: QuizTakingProps) => {
  const [quiz, setQuiz] = useState<Quiz | null>(initialQuiz || null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [results, setResults] = useState<QuizResult | null>(null);
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [showResults, setShowResults] = useState<boolean>(false);

  useEffect(() => {
    if (!initialQuiz && courseId && quizId) {
      loadQuiz();
    } else if (initialQuiz) {
      setQuiz(initialQuiz);
      setTimeRemaining((initialQuiz.timeLimit || 30) * 60);
      setLoading(false);
    }
  }, [courseId, quizId, initialQuiz]);

  // Timer effect
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0 || submitted) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, submitted]);

  const loadQuiz = async (): Promise<void> => {
    if (!courseId || !quizId) {
      setError("Course ID and Quiz ID are required to load the quiz.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      
      const quizData = await quizService.getQuizDetails(courseId, quizId);
      setQuiz(quizData);
      setTimeRemaining((quizData.timeLimit || 30) * 60); // Convert minutes to seconds
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string): void => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleFlag = (questionId: string): void => {
    setFlagged(prev => {
      const newFlagged = new Set(prev);
      if (newFlagged.has(questionId)) {
        newFlagged.delete(questionId);
      } else {
        newFlagged.add(questionId);
      }
      return newFlagged;
    });
  };

  const handleSubmit = async (): Promise<void> => {
    try {
      setSubmitted(true);
      
      if (!quiz) {
        throw new Error('Quiz not loaded properly');
      }

      // Calculate score based on answers
      let correctAnswers = 0;
      quiz.questions.forEach(question => {
        const userAnswer = answers[question.id];
        if (userAnswer === question.correctAnswer) {
          correctAnswers++;
        }
      });

      const score = Math.round((correctAnswers / quiz.questions.length) * 100);
      const timeSpent = timeRemaining !== null ? ((quiz.timeLimit || 30) * 60) - timeRemaining : 0;
      
      const result = {
        id: `result_${Date.now()}`,
        quizId: quiz.id,
        userId: 'user_1',
        score,
        totalPoints: quiz.questions.length,
        percentage: score,
        answers,
        timeSpent,
        correctAnswers,
        totalQuestions: quiz.questions.length,
        completedAt: new Date().toISOString(),
        passed: score >= (quiz.passingScore || 80),
        questionResults: {} as Record<string, { correct: boolean; userAnswer: string; correctAnswer: string }>
      };

      // Fill in question results
      quiz.questions.forEach(question => {
        const userAnswer = answers[question.id] || '';
        const isCorrect = userAnswer === question.correctAnswer;
        result.questionResults[question.id] = {
          correct: isCorrect,
          userAnswer,
          correctAnswer: question.correctAnswer as string
        };
      });

      setResults(result);
      onComplete(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAnsweredQuestions = (): string[] => {
    return Object.keys(answers).filter(qId => {
      const answer = answers[qId];
      return answer !== null && answer !== undefined && answer !== '';
    });
  };

  const getQuestionStatus = (question: QuizQuestion): 'answered-flagged' | 'answered' | 'flagged' | 'unanswered' => {
    const questionId = question.id.toString();
    const isAnswered = answers[questionId] !== undefined && answers[questionId] !== '';
    const isFlagged = flagged.has(questionId);
    
    if (isAnswered && isFlagged) return 'answered-flagged';
    if (isAnswered) return 'answered';
    if (isFlagged) return 'flagged';
    return 'unanswered';
  };

  if (loading && !quiz) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-white">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6 max-w-md">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
          <h3 className="text-white text-lg font-semibold mb-2 text-center">Error</h3>
          <p className="text-red-200 text-center mb-4">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={loadQuiz}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showResults && results && quiz) {
    return (
      <div className="min-h-screen bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Results Header */}
          <div className="bg-white/10 rounded-xl p-8 mb-6 text-center">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-white text-3xl font-bold mb-2">Quiz Complete!</h1>
            <p className="text-gray-300 mb-6">You've finished "{quiz.title}"</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-2xl font-bold text-cyan-400 mb-1">
                  {results.score}%
                </div>
                <div className="text-gray-400 text-sm">Final Score</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-400 mb-1">
                  {results.correctAnswers}/{results.totalQuestions}
                </div>
                <div className="text-gray-400 text-sm">Correct Answers</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-400 mb-1">
                  {formatTime(results.timeSpent)}
                </div>
                <div className="text-gray-400 text-sm">Time Spent</div>
              </div>
            </div>
          </div>

          {/* Question Review */}
          <div className="bg-white/10 rounded-xl p-6 mb-6">
            <h2 className="text-white text-xl font-semibold mb-4">Question Review</h2>
            <div className="space-y-4">
              {quiz.questions.map((question, index) => {
                const questionId = question.id.toString();
                const userAnswer = answers[questionId];
                const isCorrect = results.questionResults?.[questionId]?.correct;
                
                return (
                  <div key={question.id} className={`border rounded-lg p-4 ${
                    isCorrect ? 'border-green-500/50 bg-green-500/10' : 'border-red-500/50 bg-red-500/10'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-medium mb-2">{question.question}</h3>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400">Your answer:</span>
                            <span className={isCorrect ? 'text-green-400' : 'text-red-400'}>
                              {userAnswer || 'No answer'}
                            </span>
                          </div>
                          
                          {!isCorrect && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400">Correct answer:</span>
                              <span className="text-green-400">{question.correctAnswer}</span>
                            </div>
                          )}
                          
                          {question.explanation && (
                            <div className="mt-2 p-3 bg-white/5 rounded-lg">
                              <span className="text-gray-400 text-xs font-medium">EXPLANATION:</span>
                              <p className="text-gray-300 text-sm mt-1">{question.explanation}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-4">
            <button
              onClick={() => onComplete(results)}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
            >
              Back to Course
            </button>
            <button
              onClick={() => window.print()}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              Print Results
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Null safety check for quiz
  if (!quiz) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white">Loading quiz...</p>
        </div>
      </div>
    );
  }

  // Check for empty quiz
  if (!quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white">This quiz has no questions.</p>
          <button
            onClick={onCancel}
            className="mt-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white">Question not found.</p>
          <button
            onClick={onCancel}
            className="mt-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const answeredCount = getAnsweredQuestions().length;
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-white/10 border-b border-white/10 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-white"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-white font-semibold">{quiz.title}</h1>
              <p className="text-gray-400 text-sm">
                Question {currentQuestionIndex + 1} of {quiz.questions.length}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Progress */}
            <div className="hidden md:flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-gray-400" />
              <span className="text-gray-400 text-sm">
                {answeredCount}/{quiz.questions.length} answered
              </span>
            </div>
            
            {/* Timer */}
            <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${
              (timeRemaining !== null && timeRemaining < 300) ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-gray-300'
            }`}>
              <Clock className="w-4 h-4" />
              <span className="font-mono">{formatTime(timeRemaining || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 rounded-xl p-4 sticky top-4">
              <h3 className="text-white font-medium mb-4">Questions</h3>
              <div className="grid grid-cols-5 lg:grid-cols-4 gap-2">
                {quiz.questions.map((question, index) => {
                  const status = getQuestionStatus(question);
                  const isCurrent = index === currentQuestionIndex;
                  
                  return (
                    <button
                      key={question.id}
                      onClick={() => setCurrentQuestionIndex(index)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors relative ${
                        isCurrent 
                          ? 'bg-cyan-600 text-white ring-2 ring-cyan-400' 
                          : status === 'answered' 
                            ? 'bg-green-600/50 text-green-200 hover:bg-green-600/70'
                            : status === 'flagged'
                              ? 'bg-yellow-600/50 text-yellow-200 hover:bg-yellow-600/70'
                              : status === 'answered-flagged'
                                ? 'bg-green-600/50 text-green-200 hover:bg-green-600/70'
                                : 'bg-white/10 text-gray-400 hover:bg-white/20'
                      }`}
                    >
                      {index + 1}
                      {status.includes('flagged') && (
                        <Flag className="w-2 h-2 absolute -top-1 -right-1 text-yellow-400" />
                      )}
                    </button>
                  );
                })}
              </div>
              
              {/* Legend */}
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-600/50 rounded"></div>
                  <span className="text-gray-400">Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-600/50 rounded"></div>
                  <span className="text-gray-400">Flagged</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-white/10 rounded"></div>
                  <span className="text-gray-400">Unanswered</span>
                </div>
              </div>

              {quiz.questions.length > 1 && (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full mt-6 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  {loading ? 'Submitting...' : 'Submit Quiz'}
                </button>
              )}
            </div>
          </div>

          {/* Main Question Area */}
          <div className="lg:col-span-3">
            <div className="bg-white/10 rounded-xl p-6">
              {/* Progress Bar */}
              <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                <div 
                  className="bg-cyan-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                  role="progressbar"
                  aria-label="Quiz progress"
                  aria-valuenow={answeredCount}
                  aria-valuemin={0}
                  aria-valuemax={quiz.questions.length}
                />
              </div>
              <div className="text-center text-gray-400 text-sm mb-4">
                {Math.round((answeredCount / quiz.questions.length) * 100)}% Complete
              </div>

              {/* Question */}
              <div className="mb-6">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-white text-xl font-medium leading-relaxed">
                    {currentQuestion.question}
                  </h2>
                  <button
                    onClick={() => handleFlag(currentQuestion.id.toString())}
                    className={`p-2 rounded-lg transition-colors ${
                      flagged.has(currentQuestion.id.toString()) 
                        ? 'bg-yellow-600/20 text-yellow-400' 
                        : 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-600/10'
                    }`}
                  >
                    <Flag className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Answer Options */}
              <div className="space-y-4 mb-8">
                {currentQuestion.type === 'multiple-choice' && currentQuestion.options?.map((option, index) => (
                  <label
                    key={index}
                    className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
                  >
                    <input
                      type="radio"
                      name={`question_${currentQuestion.id}`}
                      value={option}
                      checked={answers[currentQuestion.id.toString()] === option}
                      onChange={(e) => handleAnswerChange(currentQuestion.id.toString(), e.target.value)}
                      className="w-4 h-4 text-cyan-600"
                    />
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-white text-sm font-medium">
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="text-white">{option}</span>
                  </label>
                ))}

                {currentQuestion.type === 'true-false' && (
                  <div className="flex gap-4">
                    <label className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors flex-1">
                      <input
                        type="radio"
                        name={`question_${currentQuestion.id}`}
                        value="true"
                        checked={answers[currentQuestion.id.toString()] === 'true'}
                        onChange={(e) => handleAnswerChange(currentQuestion.id.toString(), e.target.value)}
                        className="w-4 h-4 text-cyan-600"
                      />
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-white">True</span>
                    </label>
                    <label className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors flex-1">
                      <input
                        type="radio"
                        name={`question_${currentQuestion.id}`}
                        value="false"
                        checked={answers[currentQuestion.id.toString()] === 'false'}
                        onChange={(e) => handleAnswerChange(currentQuestion.id.toString(), e.target.value)}
                        className="w-4 h-4 text-cyan-600"
                      />
                      <div className="w-5 h-5 rounded-full border-2 border-red-500 flex items-center justify-center">
                        <div className="w-2 h-0.5 bg-red-500 rotate-45"></div>
                        <div className="w-2 h-0.5 bg-red-500 -rotate-45 absolute"></div>
                      </div>
                      <span className="text-white">False</span>
                    </label>
                  </div>
                )}

                {currentQuestion.type === 'fill-in-blank' && (
                  <textarea
                    value={answers[currentQuestion.id.toString()] || ''}
                    onChange={(e) => handleAnswerChange(currentQuestion.id.toString(), e.target.value)}
                    placeholder="Enter your answer here..."
                    rows={4}
                    className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 resize-none"
                  />
                )}
              </div>

              {/* Navigation */}
              <div className="flex justify-between items-center">
                {currentQuestionIndex > 0 && (
                  <button
                    onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                    className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                )}

                <div className="flex-1" />

                {currentQuestionIndex < quiz.questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQuestionIndex(Math.min(quiz.questions.length - 1, currentQuestionIndex + 1))}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    {loading ? 'Submitting...' : 'Submit Quiz'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizTaking;