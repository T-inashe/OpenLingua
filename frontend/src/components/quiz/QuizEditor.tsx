import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProAlert } from '../../context/ProAlertContext';
import { createQuiz, updateQuiz, getQuiz } from '../../services/quizApi';

interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  points: number;
}

interface QuizEditorProps {
  courseId: string;
  quizId?: string;
  onSave?: () => void;
  onCancel?: () => void;
}

const QuizEditor: React.FC<QuizEditorProps> = ({ courseId, quizId, onSave, onCancel }) => {
  const navigate = useNavigate();
  const { success, error } = useProAlert();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Quiz metadata
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [difficulty, setDifficulty] = useState('beginner');
  const [timeLimit, setTimeLimit] = useState<number | undefined>(undefined);
  const [passingScore, setPassingScore] = useState(60);
  const [maxAttempts, setMaxAttempts] = useState(3);

  // Questions
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);

  // Load existing quiz if editing
  useEffect(() => {
    if (quizId) {
      loadQuiz();
    }
  }, [quizId]);

  const loadQuiz = async () => {
    try {
      setLoading(true);
      const quiz = await getQuiz(courseId, quizId!);
      setTitle(quiz.title);
      setDescription(quiz.description || '');
      setCategory(quiz.category || 'general');
      setDifficulty(quiz.difficulty || 'beginner');
      setTimeLimit(quiz.timeLimit);
      setPassingScore(quiz.passingScore);
      setMaxAttempts(quiz.maxAttempts);
      setQuestions(quiz.questions || []);
    } catch (err: any) {
      error(err.message || 'Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuiz = async () => {
    // Validation
    if (!title.trim()) {
      error('Please enter a quiz title');
      return;
    }

    if (questions.length === 0) {
      error('Please add at least one question');
      return;
    }

    try {
      setSaving(true);

      const quizData = {
        title: title.trim(),
        description: description.trim(),
        category,
        difficulty,
        timeLimit,
        passingScore,
        maxAttempts,
        questions: questions.map(q => ({
          question: q.question,
          type: q.type,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          points: q.points,
        })),
      };

      if (quizId) {
        await updateQuiz(courseId, quizId, quizData);
        success('Quiz updated successfully');
      } else {
        await createQuiz(courseId, quizData);
        success('Quiz created successfully');
      }

      if (onSave) {
        onSave();
      } else {
        navigate(`/courses/${courseId}`);
      }
    } catch (err: any) {
      error(err.message || 'Failed to save quiz');
    } finally {
      setSaving(false);
    }
  };

  const handleAddQuestion = () => {
    setEditingQuestion({
      id: `temp-${Date.now()}`,
      question: '',
      type: 'multiple-choice',
      options: ['', '', '', ''],
      correctAnswer: '',
      explanation: '',
      points: 1,
    });
    setShowQuestionForm(true);
  };

  const handleEditQuestion = (question: QuizQuestion) => {
    setEditingQuestion({ ...question });
    setShowQuestionForm(true);
  };

  const handleSaveQuestion = () => {
    if (!editingQuestion) return;

    // Validation
    if (!editingQuestion.question.trim()) {
      error('Please enter a question');
      return;
    }

    if (!editingQuestion.correctAnswer.trim()) {
      error('Please specify the correct answer');
      return;
    }

    if (editingQuestion.type === 'multiple-choice') {
      const validOptions = editingQuestion.options?.filter(o => o.trim()) || [];
      if (validOptions.length < 2) {
        error('Multiple choice questions need at least 2 options');
        return;
      }
    }

    const existingIndex = questions.findIndex(q => q.id === editingQuestion.id);
    if (existingIndex >= 0) {
      // Update existing question
      const updated = [...questions];
      updated[existingIndex] = editingQuestion;
      setQuestions(updated);
    } else {
      // Add new question
      setQuestions([...questions, { ...editingQuestion, id: `q-${Date.now()}` }]);
    }

    setShowQuestionForm(false);
    setEditingQuestion(null);
  };

  const handleDeleteQuestion = (questionId: string) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      setQuestions(questions.filter(q => q.id !== questionId));
    }
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= questions.length) return;

    const updated = [...questions];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setQuestions(updated);
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

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {quizId ? 'Edit Quiz' : 'Create New Quiz'}
          </h1>
          <p className="text-gray-600 mt-2">
            Design a quiz to test your students' knowledge
          </p>
        </div>

        {/* Quiz Metadata Form */}
        <div className="space-y-6 mb-8">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quiz Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Module 1 Assessment"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Brief description of what this quiz covers..."
            />
          </div>

          {/* Category and Difficulty */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="general">General</option>
                <option value="vocabulary">Vocabulary</option>
                <option value="grammar">Grammar</option>
                <option value="listening">Listening</option>
                <option value="reading">Reading</option>
                <option value="writing">Writing</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          {/* Quiz Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Limit (minutes)
              </label>
              <input
                type="number"
                value={timeLimit || ''}
                onChange={(e) => setTimeLimit(e.target.value ? parseInt(e.target.value) : undefined)}
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="No limit"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Passing Score (%)
              </label>
              <input
                type="number"
                value={passingScore}
                onChange={(e) => setPassingScore(parseInt(e.target.value))}
                min="0"
                max="100"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Attempts
              </label>
              <input
                type="number"
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(parseInt(e.target.value))}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Questions Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Questions ({questions.length})
            </h2>
            <button
              onClick={handleAddQuestion}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <span>+</span>
              Add Question
            </button>
          </div>

          {/* Questions List */}
          {questions.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No questions added yet</p>
              <p className="text-sm text-gray-400 mt-2">Click "Add Question" to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div
                  key={question.id}
                  className="border border-gray-300 rounded-lg p-4 bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-700">Q{index + 1}.</span>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          {question.type}
                        </span>
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                          {question.points} {question.points === 1 ? 'point' : 'points'}
                        </span>
                      </div>
                      <p className="text-gray-900 mb-2">{question.question}</p>
                      {question.type === 'multiple-choice' && question.options && (
                        <ul className="ml-4 space-y-1">
                          {question.options.filter(o => o.trim()).map((option, i) => (
                            <li
                              key={i}
                              className={`text-sm ${
                                option === question.correctAnswer
                                  ? 'text-green-600 font-medium'
                                  : 'text-gray-600'
                              }`}
                            >
                              {String.fromCharCode(65 + i)}. {option}
                              {option === question.correctAnswer && ' ✓'}
                            </li>
                          ))}
                        </ul>
                      )}
                      {question.type === 'true-false' && (
                        <p className="text-sm text-green-600 font-medium ml-4">
                          Correct: {question.correctAnswer}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {index > 0 && (
                        <button
                          onClick={() => handleMoveQuestion(index, 'up')}
                          className="p-2 text-gray-600 hover:bg-gray-200 rounded"
                          title="Move up"
                        >
                          ↑
                        </button>
                      )}
                      {index < questions.length - 1 && (
                        <button
                          onClick={() => handleMoveQuestion(index, 'down')}
                          className="p-2 text-gray-600 hover:bg-gray-200 rounded"
                          title="Move down"
                        >
                          ↓
                        </button>
                      )}
                      <button
                        onClick={() => handleEditQuestion(question)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                        title="Edit"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(question.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded"
                        title="Delete"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <button
            onClick={onCancel || (() => navigate(-1))}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSaveQuiz}
            disabled={saving || questions.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : quizId ? 'Update Quiz' : 'Create Quiz'}
          </button>
        </div>
      </div>

      {/* Question Form Modal */}
      {showQuestionForm && editingQuestion && (
        <QuestionForm
          question={editingQuestion}
          onChange={setEditingQuestion}
          onSave={handleSaveQuestion}
          onCancel={() => {
            setShowQuestionForm(false);
            setEditingQuestion(null);
          }}
        />
      )}
    </div>
  );
};

// Question Form Component
interface QuestionFormProps {
  question: QuizQuestion;
  onChange: (question: QuizQuestion) => void;
  onSave: () => void;
  onCancel: () => void;
}

const QuestionForm: React.FC<QuestionFormProps> = ({ question, onChange, onSave, onCancel }) => {
  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...(question.options || ['', '', '', ''])];
    newOptions[index] = value;
    onChange({ ...question, options: newOptions });
  };

  const handleAddOption = () => {
    const newOptions = [...(question.options || []), ''];
    onChange({ ...question, options: newOptions });
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = question.options?.filter((_, i) => i !== index) || [];
    onChange({ ...question, options: newOptions });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            {question.id.startsWith('temp-') ? 'Add Question' : 'Edit Question'}
          </h3>

          <div className="space-y-6">
            {/* Question Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question Type
              </label>
              <select
                value={question.type}
                onChange={(e) => onChange({ ...question, type: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="multiple-choice">Multiple Choice</option>
                <option value="true-false">True/False</option>
                <option value="short-answer">Short Answer</option>
              </select>
            </div>

            {/* Question Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question *
              </label>
              <textarea
                value={question.question}
                onChange={(e) => onChange({ ...question, question: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your question here..."
              />
            </div>

            {/* Multiple Choice Options */}
            {question.type === 'multiple-choice' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Answer Options
                </label>
                <div className="space-y-2">
                  {question.options?.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={`Option ${String.fromCharCode(65 + index)}`}
                      />
                      {(question.options?.length || 0) > 2 && (
                        <button
                          onClick={() => handleRemoveOption(index)}
                          className="px-3 py-2 text-red-600 hover:bg-red-100 rounded-lg"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={handleAddOption}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Add Option
                  </button>
                </div>
              </div>
            )}

            {/* Correct Answer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correct Answer *
              </label>
              {question.type === 'multiple-choice' ? (
                <select
                  value={question.correctAnswer}
                  onChange={(e) => onChange({ ...question, correctAnswer: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select correct answer...</option>
                  {question.options?.filter(o => o.trim()).map((option, index) => (
                    <option key={index} value={option}>
                      {String.fromCharCode(65 + index)}. {option}
                    </option>
                  ))}
                </select>
              ) : question.type === 'true-false' ? (
                <select
                  value={question.correctAnswer}
                  onChange={(e) => onChange({ ...question, correctAnswer: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select...</option>
                  <option value="True">True</option>
                  <option value="False">False</option>
                </select>
              ) : (
                <input
                  type="text"
                  value={question.correctAnswer}
                  onChange={(e) => onChange({ ...question, correctAnswer: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter the correct answer..."
                />
              )}
            </div>

            {/* Points */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Points
              </label>
              <input
                type="number"
                value={question.points}
                onChange={(e) => onChange({ ...question, points: parseInt(e.target.value) || 1 })}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Explanation (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Explanation (Optional)
              </label>
              <textarea
                value={question.explanation || ''}
                onChange={(e) => onChange({ ...question, explanation: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Explain why this is the correct answer..."
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end gap-4 mt-6">
            <button
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Save Question
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizEditor;
