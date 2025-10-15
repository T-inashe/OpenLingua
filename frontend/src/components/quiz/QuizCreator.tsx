import { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Save, 
  X, 
  AlertCircle,
  HelpCircle,
  BookOpen
} from 'lucide-react';
import quizService from '../../services/quizService';
import type { Quiz, QuizData } from '../../types/quiz';

// Component props interface
interface QuizCreatorProps {
  courseId: string;
  onSuccess: () => void;
  onCancel: () => void;
  existingQuiz?: Quiz | null;
}

// Internal quiz data structure for form
interface QuizFormData {
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  timeLimit: number;
  questions: QuizFormQuestion[];
}

// Form question structure (with temporary ID)
interface QuizFormQuestion {
  id: string;
  question: string; // Changed from 'text' to match our types
  type: 'multiple-choice' | 'true-false' | 'fill-in-blank' | 'matching';
  options: string[];
  correctAnswer: string | string[]; // Changed from 'correct_answer'
  explanation?: string;
  points: number;
}

const QuizCreator = ({ courseId, onSuccess, onCancel, existingQuiz = null }: QuizCreatorProps) => {
  // Convert existing quiz to form format
  const convertQuizToFormData = (quiz: Quiz | null): QuizFormData => {
    if (!quiz) {
      return {
        title: '',
        description: '',
        category: 'general',
        difficulty: 'beginner',
        timeLimit: 30,
        questions: []
      };
    }

    return {
      title: quiz.title,
      description: quiz.description,
      category: quiz.category || 'general',
      difficulty: quiz.difficulty || 'beginner',
      timeLimit: quiz.timeLimit || 30,
      questions: quiz.questions.map(q => ({
        id: q.id,
        question: q.question,
        type: q.type,
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        points: q.points
      }))
    };
  };

  const [quizData, setQuizData] = useState<QuizFormData>(convertQuizToFormData(existingQuiz));

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Add new question
  const addQuestion = (): void => {
    const newQuestion: QuizFormQuestion = {
      id: `q_${Date.now()}`,
      question: '', // Changed from 'text'
      type: 'multiple-choice', // Changed from 'multiple_choice'
      options: ['', '', '', ''],
      correctAnswer: '', // Changed from 'correct_answer'
      explanation: '',
      points: 1 // Added required points field
    };
    setQuizData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  // Update question
  const updateQuestion = (questionId: string, field: keyof QuizFormQuestion, value: any): void => {
    setQuizData(prev => ({
      ...prev,
      questions: prev.questions.map((q: QuizFormQuestion) => 
        q.id === questionId ? { ...q, [field]: value } : q
      )
    }));
  };

  // Update question option
  const updateQuestionOption = (questionId: string, optionIndex: number, value: string): void => {
    setQuizData(prev => ({
      ...prev,
      questions: prev.questions.map((q: QuizFormQuestion) => 
        q.id === questionId 
          ? { 
              ...q, 
              options: q.options.map((opt: string, idx: number) => idx === optionIndex ? value : opt)
            } 
          : q
      )
    }));
  };

  // Remove question
  const removeQuestion = (questionId: string): void => {
    setQuizData(prev => ({
      ...prev,
      questions: prev.questions.filter((q: QuizFormQuestion) => q.id !== questionId)
    }));
  };

  // Convert form data to QuizData format
  const convertToQuizData = (formData: QuizFormData): QuizData => {
    return {
      title: formData.title,
      description: formData.description,
      questions: formData.questions.map(q => ({
        question: q.question,
        type: q.type,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        points: q.points
      })),
      timeLimit: formData.timeLimit,
      attempts: 3, // Default values required by QuizData
      passingScore: 70,
      isActive: true
    };
  };

  // Save quiz
  const handleSave = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Convert form data to QuizData format
      const quizDataToSave = convertToQuizData(quizData);

      // Validate quiz data
      quizService.validateQuizData(quizDataToSave);

      let result;
      if (existingQuiz) {
        result = await quizService.updateQuiz(courseId, existingQuiz.id, quizDataToSave);
      } else {
        result = await quizService.createCourseQuiz(courseId, quizDataToSave);
      }

      // Handle response (assuming it might have a mode property for offline handling)
      if (result && typeof result === 'object' && 'mode' in result && result.mode === 'offline') {
        alert('Quiz saved locally - will sync when service is available');
      } else {
        alert(`Quiz ${existingQuiz ? 'updated' : 'created'} successfully!`);
      }

      onSuccess();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Question type options
  const questionTypes = [
    { value: 'multiple-choice' as const, label: 'Multiple Choice', icon: '☰' },
    { value: 'true-false' as const, label: 'True/False', icon: '✓/✗' },
    { value: 'fill-in-blank' as const, label: 'Fill in Blank', icon: '📝' }
  ];

  // Question Component
  const QuestionEditor = ({ question, index }: { question: QuizFormQuestion; index: number }) => (
    <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
      <div className="flex justify-between items-start">
        <h3 className="text-white font-medium">Question {index + 1}</h3>
        <button
          onClick={() => removeQuestion(question.id)}
          className="text-red-400 hover:text-red-300 p-1"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Question Text */}
      <div>
        <label className="block text-white text-sm font-medium mb-2">
          Question Text
        </label>
        <textarea
          value={question.question}
          onChange={(e) => updateQuestion(question.id, 'question', e.target.value)}
          placeholder="Enter your question..."
          className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 resize-none"
          rows={3}
        />
      </div>

      {/* Question Type */}
      <div>
        <label className="block text-white text-sm font-medium mb-2">
          Question Type
        </label>
        <select
          value={question.type}
          onChange={(e) => updateQuestion(question.id, 'type', e.target.value)}
          className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
        >
          {questionTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.icon} {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Question Options (Multiple Choice) */}
      {question.type === 'multiple-choice' && (
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            Answer Options
          </label>
          <div className="space-y-2">
            {question.options.map((option: string, idx: number) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-white text-sm font-medium">
                  {String.fromCharCode(65 + idx)}
                </div>
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateQuestionOption(question.id, idx, e.target.value)}
                  placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                  className="flex-1 bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
                />
                <input
                  type="radio"
                  name={`correct_${question.id}`}
                  checked={question.correctAnswer === option}
                  onChange={() => updateQuestion(question.id, 'correctAnswer', option)}
                  className="w-4 h-4 text-cyan-500"
                />
              </div>
            ))}
          </div>
          <p className="text-gray-400 text-xs mt-2">
            Select the radio button next to the correct answer
          </p>
        </div>
      )}

      {/* True/False Options */}
      {question.type === 'true-false' && (
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            Correct Answer
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={`tf_${question.id}`}
                value="true"
                checked={question.correctAnswer === 'true'}
                onChange={(e) => updateQuestion(question.id, 'correctAnswer', e.target.value)}
                className="w-4 h-4 text-cyan-500"
              />
              <span className="text-white">True</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={`tf_${question.id}`}
                value="false"
                checked={question.correctAnswer === 'false'}
                onChange={(e) => updateQuestion(question.id, 'correctAnswer', e.target.value)}
                className="w-4 h-4 text-cyan-500"
              />
              <span className="text-white">False</span>
            </label>
          </div>
        </div>
      )}

      {/* Fill in Blank */}
      {question.type === 'fill-in-blank' && (
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            Correct Answer
          </label>
          <input
            type="text"
            value={question.correctAnswer as string}
            onChange={(e) => updateQuestion(question.id, 'correctAnswer', e.target.value)}
            placeholder="Enter the correct answer..."
            className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
          />
          <p className="text-gray-400 text-xs mt-1">
            Student answers will be matched exactly (case-insensitive)
          </p>
        </div>
      )}

      {/* Explanation */}
      <div>
        <label className="block text-white text-sm font-medium mb-2">
          Explanation (Optional)
        </label>
        <textarea
          value={question.explanation}
          onChange={(e) => updateQuestion(question.id, 'explanation', e.target.value)}
          placeholder="Explain why this is the correct answer..."
          className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 resize-none"
          rows={2}
        />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex justify-between items-center">
            <h2 className="text-white text-xl font-bold">
              {existingQuiz ? 'Edit Quiz' : 'Create New Quiz'}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-80px)]">
          {/* Steps Sidebar */}
          <div className="w-64 bg-white/5 p-6 border-r border-white/10">
            <div className="space-y-4">
              <div className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                currentStep === 1 ? 'bg-cyan-600/20 text-cyan-400' : 'text-gray-400 hover:text-white'
              }`} onClick={() => setCurrentStep(1)}>
                <BookOpen className="w-5 h-5" />
                <span>Quiz Details</span>
              </div>
              <div className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                currentStep === 2 ? 'bg-cyan-600/20 text-cyan-400' : 'text-gray-400 hover:text-white'
              }`} onClick={() => setCurrentStep(2)}>
                <HelpCircle className="w-5 h-5" />
                <span>Questions ({quizData.questions.length})</span>
              </div>
            </div>

            <div className="mt-8 p-4 bg-white/5 rounded-lg">
              <h4 className="text-white font-medium mb-2">Progress</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Questions</span>
                  <span>{quizData.questions.length}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Time Limit</span>
                  <span>{quizData.timeLimit}min</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <span className="text-red-200">{error}</span>
              </div>
            )}

            {/* Step 1: Quiz Details */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h3 className="text-white text-lg font-semibold">Quiz Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Quiz Title *
                    </label>
                    <input
                      type="text"
                      value={quizData.title}
                      onChange={(e) => setQuizData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter quiz title..."
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Time Limit (minutes)
                    </label>
                    <input
                      type="number"
                      value={quizData.timeLimit}
                      onChange={(e) => setQuizData(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 30 }))}
                      min="5"
                      max="180"
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Category
                    </label>
                    <select
                      value={quizData.category}
                      onChange={(e) => setQuizData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="general">General</option>
                      <option value="vocabulary">Vocabulary</option>
                      <option value="grammar">Grammar</option>
                      <option value="conversation">Conversation</option>
                      <option value="culture">Culture</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Difficulty
                    </label>
                    <select
                      value={quizData.difficulty}
                      onChange={(e) => setQuizData(prev => ({ 
                        ...prev, 
                        difficulty: e.target.value as 'beginner' | 'intermediate' | 'advanced'
                      }))}
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    value={quizData.description}
                    onChange={(e) => setQuizData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what this quiz covers..."
                    rows={4}
                    className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 resize-none"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
                  >
                    Next: Add Questions
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Questions */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-white text-lg font-semibold">Questions</h3>
                  <button
                    onClick={addQuestion}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Question
                  </button>
                </div>

                {quizData.questions.length === 0 ? (
                  <div className="text-center py-12 bg-white/5 rounded-lg">
                    <HelpCircle className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-400 mb-4">No questions added yet</p>
                    <button
                      onClick={addQuestion}
                      className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
                    >
                      Add First Question
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {quizData.questions.map((question: QuizFormQuestion, index: number) => (
                      <QuestionEditor key={question.id} question={question} index={index} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-white/5">
          <div className="flex justify-between items-center">
            <button
              onClick={onCancel}
              className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            
            <div className="flex items-center gap-3">
              {currentStep > 1 && (
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Previous
                </button>
              )}
              
              <button
                onClick={handleSave}
                disabled={loading || quizData.questions.length === 0}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {existingQuiz ? 'Update Quiz' : 'Create Quiz'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizCreator;