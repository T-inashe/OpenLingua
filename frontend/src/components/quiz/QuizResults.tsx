import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProAlert } from '../../context/ProAlertContext';
import { getQuizAttempts } from '../../services/quizApi';

interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  answers: Record<string, string>;
  timeSpent: number;
  passed: boolean;
  startedAt: string;
  completedAt: string;
  createdAt: string;
  correctAnswers?: number;
  totalQuestions?: number;
  attemptNumber?: number;
  attemptsRemaining?: number;
}

interface QuizResultsProps {
  courseId?: string;
  quizId?: string;
  attemptData?: QuizAttempt;
}

const QuizResults: React.FC<QuizResultsProps> = ({ 
  courseId: propCourseId, 
  quizId: propQuizId,
  attemptData
}) => {
  const navigate = useNavigate();
  const params = useParams();
  const { error } = useProAlert();

  const courseId = propCourseId || params.courseId;
  const quizId = propQuizId || params.quizId;

  const [loading, setLoading] = useState(!attemptData);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [selectedAttempt, setSelectedAttempt] = useState<QuizAttempt | null>(attemptData || null);
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [attemptsRemaining, setAttemptsRemaining] = useState(0);

  useEffect(() => {
    if (!attemptData && courseId && quizId) {
      loadAttempts();
    }
  }, [courseId, quizId, attemptData]);

  const loadAttempts = async () => {
    try {
      setLoading(true);
      const data = await getQuizAttempts(courseId!, quizId!);
      setAttempts(data.attempts);
      setMaxAttempts(data.maxAttempts);
      setAttemptsRemaining(data.attemptsRemaining);
      
      if (data.attempts.length > 0) {
        setSelectedAttempt(data.attempts[0]); // Show most recent
      }
    } catch (err: any) {
      error(err.message || 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-100';
    if (percentage >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!selectedAttempt) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <p className="text-gray-600">No quiz attempts found</p>
          <button
            onClick={() => navigate(`/courses/${courseId}`)}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Back to Course
          </button>
        </div>
      </div>
    );
  }

  const percentage = selectedAttempt.score || 0;
  const totalPoints = selectedAttempt.totalQuestions || 100;
  const earnedPoints = Math.round((percentage / 100) * totalPoints);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Results</h1>
          <p className="text-gray-600">
            {formatDate(selectedAttempt.completedAt)}
          </p>
        </div>

        {/* Score Card */}
        <div className={`${getScoreBgColor(percentage)} rounded-lg p-8 mb-8`}>
          <div className="text-center">
            <div className={`text-6xl font-bold ${getScoreColor(percentage)} mb-2`}>
              {percentage}%
            </div>
            <div className="text-xl text-gray-700 mb-4">
              {earnedPoints} / {totalPoints} points
            </div>
            <div className="flex items-center justify-center gap-2">
              {selectedAttempt.passed ? (
                <>
                  <span className="text-2xl">✓</span>
                  <span className="text-xl font-semibold text-green-700">Passed</span>
                </>
              ) : (
                <>
                  <span className="text-2xl">✗</span>
                  <span className="text-xl font-semibold text-red-700">Not Passed</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Correct Answers</div>
            <div className="text-2xl font-bold text-gray-900">
              {selectedAttempt.correctAnswers || earnedPoints} / {totalPoints}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Time Spent</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatTime(selectedAttempt.timeSpent)}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Attempts</div>
            <div className="text-2xl font-bold text-gray-900">
              {selectedAttempt.attemptNumber || attempts.indexOf(selectedAttempt) + 1} / {maxAttempts}
            </div>
          </div>
        </div>

        {/* Attempts Remaining */}
        {attemptsRemaining > 0 && !selectedAttempt.passed && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <p className="text-blue-800">
              <strong>You have {attemptsRemaining} {attemptsRemaining === 1 ? 'attempt' : 'attempts'} remaining.</strong>
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Review your answers and try again to improve your score.
            </p>
          </div>
        )}

        {/* No Attempts Remaining */}
        {attemptsRemaining === 0 && !selectedAttempt.passed && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-800">
              <strong>You have used all {maxAttempts} attempts.</strong>
            </p>
            <p className="text-sm text-red-700 mt-1">
              Please contact your instructor if you need additional attempts.
            </p>
          </div>
        )}

        {/* Pass Message */}
        {selectedAttempt.passed && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
            <p className="text-green-800">
              <strong>🎉 Congratulations! You passed the quiz!</strong>
            </p>
            <p className="text-sm text-green-700 mt-1">
              You've successfully demonstrated your understanding of the material.
            </p>
          </div>
        )}

        {/* Attempt History */}
        {attempts.length > 1 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Attempt History</h2>
            <div className="space-y-2">
              {attempts.map((attempt, index) => {
                const attemptPercentage = attempt.score || 0;
                const isSelected = attempt.id === selectedAttempt.id;
                
                return (
                  <button
                    key={attempt.id}
                    onClick={() => setSelectedAttempt(attempt)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-gray-900">
                          Attempt {index + 1}
                          {attempt.passed && <span className="ml-2 text-green-600">✓ Passed</span>}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatDate(attempt.completedAt)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getScoreColor(attemptPercentage)}`}>
                          {attemptPercentage}%
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatTime(attempt.timeSpent)}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Detailed Answer Review */}
        {selectedAttempt.answers && Object.keys(selectedAttempt.answers).length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Answers</h2>
            <div className="space-y-4">
              {Object.entries(selectedAttempt.answers).map(([questionId, answer], index) => (
                <div key={questionId} className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-gray-700">Q{index + 1}.</span>
                    <div className="flex-1">
                      <p className="text-gray-900 mb-2">Question {index + 1}</p>
                      <p className="text-sm text-gray-700">
                        <strong>Your answer:</strong> {answer || 'Not answered'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <button
            onClick={() => navigate(`/courses/${courseId}`)}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Back to Course
          </button>

          {attemptsRemaining > 0 && !selectedAttempt.passed && (
            <button
              onClick={() => navigate(`/courses/${courseId}/quiz/${quizId}/take`)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Try Again ({attemptsRemaining} {attemptsRemaining === 1 ? 'attempt' : 'attempts'} left)
            </button>
          )}
        </div>

        {/* Performance Insights */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Insights</h2>
          <div className="space-y-3">
            {percentage >= 90 && (
              <div className="flex items-start gap-2 text-green-700">
                <span className="text-xl">🌟</span>
                <p className="text-sm">
                  <strong>Excellent work!</strong> You've demonstrated exceptional understanding of the material.
                </p>
              </div>
            )}
            {percentage >= 70 && percentage < 90 && (
              <div className="flex items-start gap-2 text-blue-700">
                <span className="text-xl">👍</span>
                <p className="text-sm">
                  <strong>Good job!</strong> You have a solid grasp of the concepts. Review the areas where you lost points for mastery.
                </p>
              </div>
            )}
            {percentage >= 50 && percentage < 70 && (
              <div className="flex items-start gap-2 text-yellow-700">
                <span className="text-xl">💡</span>
                <p className="text-sm">
                  <strong>Keep learning!</strong> You're on the right track. Spend more time reviewing the material and try again.
                </p>
              </div>
            )}
            {percentage < 50 && (
              <div className="flex items-start gap-2 text-red-700">
                <span className="text-xl">📚</span>
                <p className="text-sm">
                  <strong>More practice needed.</strong> Consider reviewing the course materials and seeking help from your instructor.
                </p>
              </div>
            )}
            
            {selectedAttempt.timeSpent < 60 && (
              <div className="flex items-start gap-2 text-gray-700">
                <span className="text-xl">⚡</span>
                <p className="text-sm">
                  You completed this quiz very quickly. Take your time to read each question carefully on your next attempt.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizResults;
