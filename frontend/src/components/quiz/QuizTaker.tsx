import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProAlert } from '../../context/ProAlertContext';
import { getQuiz, submitQuizAttempt } from '../../services/quizApi';
import type { Quiz as QuizApiType, QuizQuestion as QuizQuestionType } from '../../types/quiz';

// Local interface with required questions array
interface Quiz extends Omit<QuizApiType, 'questions'> {
  questions: QuizQuestionType[];
}

interface QuizTakerProps {
  courseId?: string;
  quizId?: string;
  onComplete?: (result: any) => void;
}

const QuizTaker: React.FC<QuizTakerProps> = ({ courseId: propCourseId, quizId: propQuizId, onComplete }) => {
  const navigate = useNavigate();
  const params = useParams();
  const { show, success, error } = useProAlert();

  const courseId = propCourseId || params.courseId!;
  const quizId = propQuizId || params.quizId!;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [startTime] = useState(new Date().toISOString());
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  // Load quiz
  useEffect(() => {
    loadQuiz();
  }, [courseId, quizId]);

  // Timer effect
  useEffect(() => {
    if (!quiz?.timeLimit || timeRemaining === null) return;

    if (timeRemaining <= 0) {
      handleAutoSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [quiz, timeRemaining]);

  const loadQuiz = async () => {
    try {
      setLoading(true);
      const quizData = await getQuiz(courseId, quizId);
      
      // Ensure questions array exists
      if (!quizData.questions || quizData.questions.length === 0) {
        throw new Error('This quiz has no questions');
      }
      
      setQuiz(quizData as Quiz);
      
      // Initialize timer if time limit is set
      if (quizData.timeLimit) {
        setTimeRemaining(quizData.timeLimit * 60); // Convert minutes to seconds
      }
    } catch (err: any) {
      error(err.message || 'Failed to load quiz');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers({
      ...answers,
      [questionId]: answer,
    });
  };

  const handleNext = () => {
    if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleReview = () => {
    setShowReview(true);
  };

  const handleAutoSubmit = useCallback(async () => {
    show('Time is up! Submitting your quiz...', 'info');
    await handleSubmit();
  }, [answers, startTime]);

  const handleSubmit = async () => {
    if (!quiz) return;

    try {
      setSubmitting(true);
      const completedAt = new Date().toISOString();
      
      const result = await submitQuizAttempt(
        courseId,
        quizId,
        answers,
        startTime,
        completedAt
      );

      const percentage = result.percentage || result.score;
      if (result.passed) {
        success(`Congratulations! You passed with ${percentage}%`);
      } else {
        show(`Quiz completed. Score: ${percentage}%`, 'info');
      }

      if (onComplete) {
        onComplete(result);
      } else {
        navigate(`/courses/${courseId}/quiz/${quizId}/results`);
      }
    } catch (err: any) {
      error(err.message || 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
      setShowConfirmSubmit(false);
    }
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-600">Quiz not found</p>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  // Review mode
  if (showReview) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Review Your Answers</h2>

          <div className="space-y-6 mb-8">
            {quiz.questions.map((question, index) => (
              <div key={question.id} className="border border-gray-300 rounded-lg p-4">
                <div className="flex items-start gap-2 mb-2">
                  <span className="font-semibold text-gray-700">Q{index + 1}.</span>
                  <div className="flex-1">
                    <p className="text-gray-900">{question.question}</p>
                    {question.type === 'multiple-choice' && question.options && (
                      <ul className="mt-2 space-y-1">
                        {question.options.map((option, i) => (
                          <li
                            key={i}
                            className={`text-sm ${
                              answers[question.id] === option
                                ? 'text-blue-600 font-medium'
                                : 'text-gray-600'
                            }`}
                          >
                            {String.fromCharCode(65 + i)}. {option}
                            {answers[question.id] === option && ' ← Your answer'}
                          </li>
                        ))}
                      </ul>
                    )}
                    {question.type === 'true-false' && (
                      <p className="mt-2 text-sm">
                        <span className="text-gray-600">Your answer: </span>
                        <span className="text-blue-600 font-medium">
                          {answers[question.id] || 'Not answered'}
                        </span>
                      </p>
                    )}
                    {question.type === 'short-answer' && (
                      <p className="mt-2 text-sm">
                        <span className="text-gray-600">Your answer: </span>
                        <span className="text-blue-600 font-medium">
                          {answers[question.id] || 'Not answered'}
                        </span>
                      </p>
                    )}
                    {!answers[question.id] && (
                      <p className="mt-2 text-sm text-red-600">⚠️ Not answered</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <strong>Summary:</strong> {getAnsweredCount()} of {quiz.questions.length} questions answered
            </p>
            {getAnsweredCount() < quiz.questions.length && (
              <p className="text-sm text-yellow-800 mt-1">
                ⚠️ You have unanswered questions. Are you sure you want to submit?
              </p>
            )}
          </div>

          <div className="flex justify-end gap-4">
            <button
              onClick={() => setShowReview(false)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Continue Quiz
            </button>
            <button
              onClick={() => setShowConfirmSubmit(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Submit Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
              {quiz.description && (
                <p className="text-gray-600 mt-1">{quiz.description}</p>
              )}
            </div>
            {timeRemaining !== null && (
              <div className={`text-right ${timeRemaining < 60 ? 'text-red-600' : 'text-gray-700'}`}>
                <div className="text-sm font-medium">Time Remaining</div>
                <div className="text-2xl font-bold">{formatTime(timeRemaining)}</div>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-2">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Question {currentQuestionIndex + 1} of {quiz.questions.length}</span>
              <span>{getAnsweredCount()} answered</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="mb-8">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg font-semibold text-gray-900">
                Question {currentQuestionIndex + 1}
              </span>
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                {currentQuestion.type}
              </span>
              <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                {currentQuestion.points} {currentQuestion.points === 1 ? 'point' : 'points'}
              </span>
            </div>
            <p className="text-lg text-gray-900">{currentQuestion.question}</p>
          </div>

          {/* Answer Options */}
          <div className="space-y-3">
            {currentQuestion.type === 'multiple-choice' && currentQuestion.options && (
              <div className="space-y-2">
                {currentQuestion.options.map((option, index) => (
                  <label
                    key={index}
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
                      answers[currentQuestion.id] === option
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name={currentQuestion.id}
                      value={option}
                      checked={answers[currentQuestion.id] === option}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                      className="mr-3 h-4 w-4 text-blue-600"
                    />
                    <span className="text-gray-900">
                      <strong>{String.fromCharCode(65 + index)}.</strong> {option}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {currentQuestion.type === 'true-false' && (
              <div className="space-y-2">
                {['True', 'False'].map((option) => (
                  <label
                    key={option}
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
                      answers[currentQuestion.id] === option
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name={currentQuestion.id}
                      value={option}
                      checked={answers[currentQuestion.id] === option}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                      className="mr-3 h-4 w-4 text-blue-600"
                    />
                    <span className="text-gray-900">{option}</span>
                  </label>
                ))}
              </div>
            )}

            {currentQuestion.type === 'short-answer' && (
              <textarea
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Type your answer here..."
              />
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>

          <button
            onClick={handleReview}
            className="px-6 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition"
          >
            Review Answers
          </button>

          {currentQuestionIndex < quiz.questions.length - 1 ? (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={() => setShowConfirmSubmit(true)}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Submit Quiz
            </button>
          )}
        </div>

        {/* Question Navigator */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-3">Jump to question:</p>
          <div className="flex flex-wrap gap-2">
            {quiz.questions.map((question, index) => (
              <button
                key={question.id}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-10 h-10 rounded-lg font-medium transition ${
                  index === currentQuestionIndex
                    ? 'bg-blue-600 text-white'
                    : answers[question.id]
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-300'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Confirm Submit Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Submit Quiz?</h3>
            <p className="text-gray-600 mb-2">
              You have answered {getAnsweredCount()} of {quiz.questions.length} questions.
            </p>
            {getAnsweredCount() < quiz.questions.length && (
              <p className="text-yellow-600 mb-4">
                ⚠️ Some questions are not answered yet.
              </p>
            )}
            <p className="text-gray-600 mb-6">
              Are you sure you want to submit? You cannot change your answers after submission.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                disabled={submitting}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
              >
                {submitting ? 'Submitting...' : 'Yes, Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizTaker;
