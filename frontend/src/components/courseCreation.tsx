import { useState, useEffect } from "react";
import { 
  Save, 
  Eye, 
  Plus, 
  Trash2, 
  Upload, 
  Play, 
  Mic, 
  Image, 
  FileText, 
  Settings,
  ChevronDown,
  ChevronRight,
  GripVertical,
  BookOpen,
  Users,
  Clock,
  Target,
  Globe
} from "lucide-react";

interface Lesson {
  id: number;
  title: string;
  type: string;
  content: string;
  duration: number;
}

interface Unit {
  id: number;
  title: string;
  description: string;
  lessons: Lesson[];
  isExpanded: boolean;
}

interface CourseData {
  title: string;
  description: string;
  language: string;
  difficulty: string;
  tags: string[];
  category: string;
  estimatedHours: string;
  targetAudience: string;
}

const CourseCreation = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [courseData, setCourseData] = useState<CourseData>({
    title: "",
    description: "",
    language: "",
    difficulty: "",
    tags: [],
    category: "",
    estimatedHours: "",
    targetAudience: ""
  });
  const [units, setUnits] = useState<Unit[]>([
    {
      id: 1,
      title: "Getting Started",
      description: "Introduction to basic concepts",
      lessons: [
        {
          id: 1,
          title: "Hello World",
          type: "text",
          content: "",
          duration: 5
        }
      ],
      isExpanded: true
    }
  ]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const steps = [
    { id: 1, title: "Course Info", icon: BookOpen },
    { id: 2, title: "Structure", icon: Target },
    { id: 3, title: "Content", icon: FileText },
    { id: 4, title: "Settings", icon: Settings }
  ];

  const lessonTypes = [
    { type: "text", label: "Text Lesson", icon: FileText, color: "from-blue-500 to-cyan-500" },
    { type: "quiz", label: "Quiz", icon: Target, color: "from-green-500 to-emerald-500" },
    { type: "audio", label: "Audio Lesson", icon: Mic, color: "from-purple-500 to-pink-500" },
    { type: "video", label: "Video Lesson", icon: Play, color: "from-orange-500 to-red-500" },
    { type: "interactive", label: "Interactive", icon: Users, color: "from-cyan-500 to-purple-500" }
  ];

  const addUnit = () => {
    const newUnit: Unit = {
      id: units.length + 1,
      title: `Unit ${units.length + 1}`,
      description: "",
      lessons: [],
      isExpanded: true
    };
    setUnits([...units, newUnit]);
  };

  const addLesson = (unitId: number, lessonType: string = "text", autoSelect: boolean = false) => {
    const newLessonId = Date.now(); // Use timestamp for unique ID
    const newLesson: Lesson = {
      id: newLessonId,
      title: `${lessonType.charAt(0).toUpperCase() + lessonType.slice(1)} Lesson`,
      type: lessonType,
      content: "",
      duration: 5
    };

    setUnits(units.map(unit => 
      unit.id === unitId 
        ? {
            ...unit,
            lessons: [...unit.lessons, newLesson]
          }
        : unit
    ));

    // If this is from drag & drop, auto-select and navigate
    if (autoSelect) {
      setSelectedLesson(newLesson);
      setActiveStep(3); // Navigate to Content step
    }
  };

  const handleDragStart = (e: React.DragEvent, lessonType: string) => {
    e.dataTransfer.setData("text/plain", lessonType);
  };

  const handleDrop = (e: React.DragEvent, unitId: number) => {
    e.preventDefault();
    const lessonType = e.dataTransfer.getData("text/plain");
    if (lessonType) {
      addLesson(unitId, lessonType, true); // true = autoSelect and navigate
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const toggleUnit = (unitId: number) => {
    setUnits(units.map(unit =>
      unit.id === unitId ? { ...unit, isExpanded: !unit.isExpanded } : unit
    ));
  };

  const updateSelectedLesson = (field: keyof Lesson, value: string | number) => {
    if (selectedLesson) {
      const updatedLesson = { ...selectedLesson, [field]: value };
      setSelectedLesson(updatedLesson);
      
      // Update the lesson in the units array
      setUnits(units.map(unit => ({
        ...unit,
        lessons: unit.lessons.map(lesson => 
          lesson.id === selectedLesson.id ? updatedLesson : lesson
        )
      })));
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white font-medium mb-2">Course Title</label>
                <input
                  type="text"
                  placeholder="e.g., Beginner isiXhosa Conversations"
                  value={courseData.title}
                  onChange={(e) => setCourseData({...courseData, title: e.target.value})}
                  className="w-full bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200"
                />
              </div>
              
              <div>
                <label className="block text-white font-medium mb-2">Language</label>
                <select
                  value={courseData.language}
                  onChange={(e) => setCourseData({...courseData, language: e.target.value})}
                  className="w-full bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-all duration-200"
                >
                  <option value="">Select Language</option>
                  <option value="isixhosa">isiXhosa</option>
                  <option value="swahili">Swahili</option>
                  <option value="shona">Shona</option>
                  <option value="xitsonga">Xitsonga</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Course Description</label>
              <textarea
                rows={4}
                placeholder="Describe what students will learn and achieve..."
                value={courseData.description}
                onChange={(e) => setCourseData({...courseData, description: e.target.value})}
                className="w-full bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-white font-medium mb-2">Difficulty Level</label>
                <select
                  value={courseData.difficulty}
                  onChange={(e) => setCourseData({...courseData, difficulty: e.target.value})}
                  className="w-full bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-all duration-200"
                >
                  <option value="">Select Level</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Category</label>
                <select
                  value={courseData.category}
                  onChange={(e) => setCourseData({...courseData, category: e.target.value})}
                  className="w-full bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-all duration-200"
                >
                  <option value="">Select Category</option>
                  <option value="conversation">Conversation</option>
                  <option value="grammar">Grammar</option>
                  <option value="business">Business</option>
                  <option value="literature">Literature</option>
                  <option value="culture">Culture</option>
                </select>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Estimated Hours</label>
                <input
                  type="number"
                  placeholder="e.g., 20"
                  value={courseData.estimatedHours}
                  onChange={(e) => setCourseData({...courseData, estimatedHours: e.target.value})}
                  className="w-full bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold text-xl">Course Structure</h3>
              <button
                onClick={addUnit}
                className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200 hover:scale-105"
              >
                <Plus size={16} />
                <span>Add Unit</span>
              </button>
            </div>

            <div className="space-y-4">
              {units.map((unit) => (
                <div 
                  key={unit.id} 
                  className="bg-white/5 backdrop-blur-lg rounded-lg border border-white/10"
                  onDrop={(e) => handleDrop(e, unit.id)}
                  onDragOver={handleDragOver}
                >
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-all duration-200"
                    onClick={() => toggleUnit(unit.id)}
                  >
                    <div className="flex items-center space-x-3">
                      {unit.isExpanded ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400" />}
                      <div>
                        <h4 className="text-white font-medium">{unit.title}</h4>
                        <p className="text-gray-400 text-sm">{unit.lessons.length} lessons</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addLesson(unit.id, "text", false); // false = don't auto-select
                        }}
                        className="p-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-lg transition-all duration-200"
                      >
                        <Plus size={16} />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {unit.isExpanded && (
                    <div className="border-t border-white/10 p-4 space-y-3">
                      <div className="text-xs text-gray-500 mb-2">Drop lesson types here or click + to add</div>
                      {unit.lessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                            selectedLesson?.id === lesson.id 
                              ? 'bg-cyan-500/20 border-cyan-500/50 shadow-lg shadow-cyan-500/20' 
                              : 'bg-white/5 border-white/5 hover:border-white/10'
                          }`}
                          onClick={() => setSelectedLesson(lesson)}
                        >
                          <div className="flex items-center space-x-3">
                            <GripVertical size={16} className="text-gray-500" />
                            <div>
                              <h5 className={`text-sm font-medium ${
                                selectedLesson?.id === lesson.id ? 'text-cyan-200' : 'text-white'
                              }`}>{lesson.title}</h5>
                              <p className="text-gray-400 text-xs capitalize">{lesson.type} • {lesson.duration} min</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button className="p-1 text-gray-400 hover:text-cyan-400 transition-colors duration-200">
                              <Settings size={14} />
                            </button>
                            <button className="p-1 text-gray-400 hover:text-red-400 transition-colors duration-200">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <h3 className="text-white font-semibold text-lg mb-4">Lesson Types</h3>
              <div className="space-y-3">
                {lessonTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <div
                      key={type.type}
                      className="group p-4 bg-white/5 backdrop-blur-lg rounded-lg border border-white/10 hover:border-cyan-500/30 transition-all duration-200"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 bg-gradient-to-r ${type.color} rounded-lg flex items-center justify-center`}>
                          <Icon size={18} className="text-white" />
                        </div>
                        <div>
                          <h4 className="text-white font-medium text-sm">{type.label}</h4>
                          <p className="text-gray-400 text-xs">Reference guide</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 p-4 bg-white/5 backdrop-blur-lg rounded-lg border border-white/10">
                <h4 className="text-white font-medium mb-3">Media Library</h4>
                <div className="space-y-2">
                  <button className="w-full flex items-center space-x-2 text-gray-400 hover:text-white transition-colors duration-200 p-2 hover:bg-white/5 rounded">
                    <Upload size={16} />
                    <span className="text-sm">Upload Audio</span>
                  </button>
                  <button className="w-full flex items-center space-x-2 text-gray-400 hover:text-white transition-colors duration-200 p-2 hover:bg-white/5 rounded">
                    <Image size={16} />
                    <span className="text-sm">Upload Images</span>
                  </button>
                  <button className="w-full flex items-center space-x-2 text-gray-400 hover:text-white transition-colors duration-200 p-2 hover:bg-white/5 rounded">
                    <Play size={16} />
                    <span className="text-sm">Upload Video</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white/5 backdrop-blur-lg rounded-lg border border-white/10 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white font-semibold text-lg">Content Editor</h3>
                  <div className="flex space-x-2">
                    <button className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors duration-200 px-3 py-2 hover:bg-white/5 rounded">
                      <Eye size={16} />
                      <span className="text-sm">Preview</span>
                    </button>
                    <button className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-3 py-2 rounded-lg hover:shadow-lg transition-all duration-200">
                      <Save size={16} />
                      <span className="text-sm">Save</span>
                    </button>
                  </div>
                </div>

                {selectedLesson ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-white font-medium mb-2">Lesson Title</label>
                        <input
                          type="text"
                          value={selectedLesson.title}
                          onChange={(e) => updateSelectedLesson('title', e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500/50 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-white font-medium mb-2">Lesson Type</label>
                        <select
                          value={selectedLesson.type}
                          onChange={(e) => updateSelectedLesson('type', e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500/50 transition-all duration-200"
                        >
                          <option value="text">Text Lesson</option>
                          <option value="quiz">Quiz</option>
                          <option value="audio">Audio Lesson</option>
                          <option value="video">Video Lesson</option>
                          <option value="interactive">Interactive</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-white font-medium mb-2">Duration (minutes)</label>
                      <input
                        type="number"
                        value={selectedLesson.duration}
                        onChange={(e) => updateSelectedLesson('duration', parseInt(e.target.value) || 0)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500/50 transition-all duration-200"
                      />
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-2">Lesson Content</label>
                      <div className="bg-slate-800/50 border border-white/10 rounded-lg">
                        <div className="border-b border-white/10 p-3">
                          <div className="flex space-x-2">
                            <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-all duration-200">
                              <FileText size={16} />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-all duration-200">
                              <Image size={16} />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-all duration-200">
                              <Mic size={16} />
                            </button>
                          </div>
                        </div>
                        <textarea
                          rows={12}
                          placeholder="Enter your lesson content here... You can use markdown formatting."
                          value={selectedLesson.content}
                          onChange={(e) => updateSelectedLesson('content', e.target.value)}
                          className="w-full bg-transparent border-none p-4 text-white placeholder-gray-400 focus:outline-none resize-none"
                        />
                      </div>
                    </div>

                    {selectedLesson.type === 'quiz' && (
                      <div className="space-y-4">
                        <h4 className="text-white font-medium">Quiz Questions</h4>
                        <div className="space-y-3">
                          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                            <input
                              type="text"
                              placeholder="Question text..."
                              className="w-full bg-transparent text-white placeholder-gray-400 focus:outline-none mb-3"
                            />
                            <div className="space-y-2">
                              {['A', 'B', 'C', 'D'].map(option => (
                                <div key={option} className="flex items-center space-x-2">
                                  <input type="radio" name="correct" className="text-cyan-500" />
                                  <input
                                    type="text"
                                    placeholder={`Option ${option}...`}
                                    className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500/50 transition-all duration-200"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                          <button className="flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 transition-colors duration-200">
                            <Plus size={16} />
                            <span className="text-sm">Add Question</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText size={48} className="text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">Select a lesson from the structure panel to start editing</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-white font-semibold text-lg">Publishing Settings</h3>
                
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-cyan-500 bg-white/5 border-white/20 rounded focus:ring-cyan-500/50" />
                    <span className="text-white">Make course public</span>
                  </label>
                  
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-cyan-500 bg-white/5 border-white/20 rounded focus:ring-cyan-500/50" />
                    <span className="text-white">Allow community contributions</span>
                  </label>
                  
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-cyan-500 bg-white/5 border-white/20 rounded focus:ring-cyan-500/50" />
                    <span className="text-white">Enable course discussions</span>
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-white font-semibold text-lg">Prerequisites</h3>
                <textarea
                  rows={4}
                  placeholder="What should students know before taking this course?"
                  className="w-full bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200 resize-none"
                />
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-lg rounded-lg border border-white/10 p-6">
              <h3 className="text-white font-semibold text-lg mb-4">Course Preview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-cyan-300 font-medium mb-2">{courseData.title || "Course Title"}</h4>
                  <p className="text-gray-300 text-sm mb-4">{courseData.description || "Course description will appear here..."}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span className="flex items-center space-x-1">
                      <Clock size={14} />
                      <span>{courseData.estimatedHours || "0"} hours</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Globe size={14} />
                      <span>{courseData.language || "Language"}</span>
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-white font-medium">Course Structure:</p>
                  {units.map(unit => (
                    <div key={unit.id} className="text-gray-400 text-sm">
                      • {unit.title} ({unit.lessons.length} lessons)
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className={`bg-slate-900/80 backdrop-blur-lg border-b border-white/10 transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                OpenLingua
              </div>
              <span className="text-gray-400">/ Create Course</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors duration-200 px-4 py-2 hover:bg-white/5 rounded-lg">
                <Eye size={16} />
                <span>Preview</span>
              </button>
              <button className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-200 hover:scale-105">
                <Save size={16} />
                <span>Save Draft</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className={`flex items-center justify-center mb-8 transition-all duration-1000 delay-200 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = activeStep === step.id;
              const isCompleted = activeStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => setActiveStep(step.id)}
                    className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-300 ${
                      isActive 
                        ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg' 
                        : isCompleted 
                          ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                          : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="font-medium">{step.title}</span>
                  </button>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-0.5 mx-2 transition-colors duration-300 ${
                      isCompleted ? 'bg-green-500' : 'bg-white/20'
                    }`}></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className={`transition-all duration-1000 delay-400 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          {renderStepContent()}
        </div>

        <div className={`flex items-center justify-between mt-8 pt-6 border-t border-white/10 transition-all duration-1000 delay-600 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <button
            onClick={() => setActiveStep(Math.max(1, activeStep - 1))}
            disabled={activeStep === 1}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors duration-200 px-6 py-3 hover:bg-white/5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Previous</span>
          </button>
          
          <div className="flex space-x-3">
            <button className="text-gray-400 hover:text-white transition-colors duration-200 px-6 py-3 hover:bg-white/5 rounded-lg">
              Save as Draft
            </button>
            {activeStep === 4 ? (
              <button className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-200 hover:scale-105">
                Publish Course
              </button>
            ) : (
              <button
                onClick={() => setActiveStep(Math.min(4, activeStep + 1))}
                className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-200 hover:scale-105"
              >
                Next Step
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCreation;