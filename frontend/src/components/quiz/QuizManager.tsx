import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  Share2, 
  Copy, 
  Users, 
  CheckCircle, 
  AlertCircle,
  Wifi,
  WifiOff,
  BookOpen,
  Target,
  Zap
} from 'lucide-react';
import quizService from '../../services/quizService';
import type { Quiz, QuizTemplate } from '../../types/quiz';

// Define component props interface
interface QuizManagerProps {
  courseId: string;
  isInstructor?: boolean;
}

// Define API response interfaces
interface QuizResponse {
  mode: 'online' | 'offline';
  data: Quiz[];
}

interface TemplateResponse {
  mode: 'online' | 'offline';
  data: QuizTemplate[];
}

const QuizManager = ({ courseId, isInstructor = false }: QuizManagerProps) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<'unknown' | 'online' | 'offline' | 'error'>('unknown');
  const [_showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [_selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [templates, setTemplates] = useState<QuizTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState<boolean>(false);

  useEffect(() => {
    if (courseId) {
      loadQuizzes();
      checkApiHealth();
    }
  }, [courseId]);

  // Load quizzes for the course
  const loadQuizzes = async (): Promise<void> => {
    try {
      setLoading(true);
      const result = await quizService.getCourseQuizzes(courseId);
      
      // Handle different response formats
      if (result && typeof result === 'object' && 'mode' in result && 'data' in result) {
        // Response with mode and data structure
        const response = result as unknown as QuizResponse;
        setApiStatus(response.mode === 'offline' ? 'offline' : 'online');
        setQuizzes(response.data || []);
      } else if (Array.isArray(result)) {
        // Direct array response
        setQuizzes(result);
        setApiStatus('online');
      } else {
        // Fallback
        setQuizzes([]);
        setApiStatus('online');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError('Failed to load quizzes: ' + errorMessage);
      setApiStatus('error');
    } finally {
      setLoading(false);
    }
  };

  // Check external API health
  const checkApiHealth = async (): Promise<void> => {
    try {
      const health = await quizService.checkApiHealth();
      setApiStatus(health.status === 'healthy' ? 'online' : 'offline');
    } catch (err) {
      setApiStatus('offline');
    }
  };

  // Delete quiz
  const handleDeleteQuiz = async (quizId: string): Promise<void> => {
    if (!window.confirm('Are you sure you want to delete this quiz?')) {
      return;
    }

    try {
      await quizService.deleteQuiz(courseId, quizId);
      await loadQuizzes();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError('Failed to delete quiz: ' + errorMessage);
    }
  };

  // Share quiz as template
  const handleShareQuiz = async (quizId: string): Promise<void> => {
    try {
      const shareOptions = {
        allowModification: true,
        attribution: true,
        visibility: 'public'
      };
      
      await quizService.shareQuizAsTemplate(courseId, quizId, shareOptions);
      alert('Quiz shared as template successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError('Failed to share quiz: ' + errorMessage);
    }
  };

  // Load templates
  const loadTemplates = async (): Promise<void> => {
    try {
      const result = await quizService.getAvailableTemplates();
      
      // Handle different response formats
      if (result && typeof result === 'object' && 'mode' in result && 'data' in result) {
        // Response with mode and data structure
        const response = result as unknown as TemplateResponse;
        setTemplates(response.data || []);
      } else if (Array.isArray(result)) {
        // Direct array response
        setTemplates(result);
      } else {
        // Fallback
        setTemplates([]);
      }
      
      setShowTemplates(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError('Failed to load templates: ' + errorMessage);
    }
  };

  // Copy template to course
  const handleCopyTemplate = async (templateId: string, customizations: Record<string, any> = {}): Promise<void> => {
    try {
      await quizService.copyTemplateToCourse(courseId, templateId, customizations);
      await loadQuizzes();
      setShowTemplates(false);
      alert('Template copied successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError('Failed to copy template: ' + errorMessage);
    }
  };

  // API Status indicator
  const ApiStatusIndicator = () => (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
      apiStatus === 'online' ? 'bg-green-100 text-green-700' :
      apiStatus === 'offline' ? 'bg-yellow-100 text-yellow-700' :
      'bg-red-100 text-red-700'
    }`}>
      {apiStatus === 'online' ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
      <span>
        {apiStatus === 'online' ? 'Online' : 
         apiStatus === 'offline' ? 'Offline Mode' : 'Connection Error'}
      </span>
    </div>
  );

  // Quiz Card Component
  const QuizCard = ({ quiz }: { quiz: Quiz }) => (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-200">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-white font-semibold text-lg mb-2">{quiz.title}</h3>
          <p className="text-gray-400 text-sm mb-3 line-clamp-2">{quiz.description}</p>
          
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              <span>{quiz.questionCount || 0} questions</span>
            </div>
            <div className="flex items-center gap-1">
              <Target className="w-4 h-4" />
              <span className="capitalize">{quiz.difficulty}</span>
            </div>
            {quiz.mode === 'offline' && (
              <div className="flex items-center gap-1">
                <WifiOff className="w-4 h-4" />
                <span>Cached</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isInstructor ? (
            <>
              <button
                onClick={() => setSelectedQuiz(quiz)}
                className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-400/20 rounded-lg transition-colors"
                title="Edit Quiz"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleShareQuiz(quiz.id)}
                className="p-2 text-green-400 hover:text-green-300 hover:bg-green-400/20 rounded-lg transition-colors"
                title="Share as Template"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteQuiz(quiz.id)}
                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/20 rounded-lg transition-colors"
                title="Delete Quiz"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setSelectedQuiz(quiz)}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
            >
              <Play className="w-4 h-4" />
              Take Quiz
            </button>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-white/10">
        <span className="text-gray-500 text-sm">
          {quiz.category} • Created {new Date(quiz.createdAt).toLocaleDateString()}
        </span>
        {isInstructor && (
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>0 attempts</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              <span>0% pass rate</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Template Card Component
  const TemplateCard = ({ template }: { template: QuizTemplate }) => (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-white font-semibold text-lg mb-2">{template.title}</h3>
          <p className="text-gray-400 text-sm mb-3">{template.description}</p>
          
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>{template.questionCount} questions</span>
            <span className="capitalize">{template.difficulty}</span>
            <span>{template.category}</span>
          </div>
        </div>

        <button
          onClick={() => handleCopyTemplate(template.id)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          <Copy className="w-4 h-4" />
          Copy
        </button>
      </div>

      <div className="pt-4 border-t border-white/10">
        <span className="text-gray-500 text-sm">
          {template.isOwn ? 'Your template' : `Shared by ${template.sharedBy}`}
          {template.originalCourse && ` • From "${template.originalCourse}"`}
        </span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
        <span className="ml-2 text-white">Loading quizzes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-white text-2xl font-bold">
            {isInstructor ? 'Quiz Management' : 'Course Quizzes'}
          </h2>
          <ApiStatusIndicator />
        </div>

        {isInstructor && (
          <div className="flex items-center gap-3">
            <button
              onClick={loadTemplates}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Browse Templates
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Quiz
            </button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span className="text-red-200">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-300"
          >
            ×
          </button>
        </div>
      )}

      {/* Quiz List */}
      {quizzes.length === 0 ? (
        <div className="text-center py-12">
          <Zap className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-white text-xl font-semibold mb-2">
            {isInstructor ? 'No quizzes created yet' : 'No quizzes available'}
          </h3>
          <p className="text-gray-400 mb-6">
            {isInstructor 
              ? 'Create your first quiz or browse templates to get started'
              : 'Your instructor hasn\'t added any quizzes to this course yet'
            }
          </p>
          {isInstructor && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create First Quiz
              </button>
              <button
                onClick={loadTemplates}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <BookOpen className="w-5 h-5" />
                Browse Templates
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {quizzes.map(quiz => (
            <QuizCard key={quiz.id} quiz={quiz} />
          ))}
        </div>
      )}

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <div className="flex justify-between items-center">
                <h3 className="text-white text-xl font-bold">Quiz Templates</h3>
                <button
                  onClick={() => setShowTemplates(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              {templates.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400">No templates available</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {templates.map(template => (
                    <TemplateCard key={template.id} template={template} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizManager;