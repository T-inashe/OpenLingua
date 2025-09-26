import { useState, useEffect, useRef } from "react";
import config from "../config";
import {
  Plus,
  Trash2,
  Upload,
  Play,
  Image,
  FileText,
  Settings,
  ChevronDown,
  ChevronRight,
  GripVertical,
  BookOpen,
  Clock,
  Target,
  Globe,
  ArrowLeft,
  LogOut
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import LoaderOverlay from "./Loader";
import { logoutRequest } from "../utils/logout";
import ThemeToggle from "./ThemeToggle";
import { useProAlert } from "../context/ProAlertContext";
import { handleUnauthorized } from "../utils/handleUnauthorized";
interface Lesson {
  id: number;
  title: string;
  type: string;
  content: string | null;
  duration: number;
  unitId:number;
  file: File | null;
  position?: number;
}

interface Unit {
  id: number;
  title: string;
  description: string;
  lessons: Lesson[];
  isExpanded: boolean;
  position?: number;
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
  const { id } = useParams();
 const navigate = useNavigate()
  const proAlert = useProAlert();
  const [isVisible, setIsVisible] = useState(false);
   const [publicc, setPublic] = useState("true");
   const [community, setCommunity] = useState("true");
   const [discussions, setDiscussions] = useState("true");
   const [info, setInfo] = useState("");
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
    
  ]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const pendingNavigation = useRef<(() => void | Promise<void>) | null>(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const hasUnsavedChanges = Boolean(
    courseData.title ||
    courseData.description ||
    courseData.language ||
    courseData.category ||
    courseData.estimatedHours ||
    courseData.targetAudience ||
    info ||
    units.length > 0
  );

  useEffect(() => {
    const beforeUnloadHandler = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', beforeUnloadHandler);
    return () => window.removeEventListener('beforeunload', beforeUnloadHandler);
  }, [hasUnsavedChanges]);

  const requestNavigation = (navigateFn: () => void | Promise<void>) => {
    if (hasUnsavedChanges) {
      pendingNavigation.current = navigateFn;
      setShowLeaveModal(true);
    } else {
      navigateFn();
    }
  };

  const confirmNavigation = () => {
    const nav = pendingNavigation.current;
    pendingNavigation.current = null;
    setShowLeaveModal(false);
    if (nav) {
      Promise.resolve(nav()).catch((error) => {
        console.error('Navigation action failed', error);
      });
    }
  };

  const cancelNavigation = () => {
    pendingNavigation.current = null;
    setShowLeaveModal(false);
  };

  const handleLogoClick = () => {
    requestNavigation(() => navigate('/dashboard'));
  };

  const handleLogoutClick = () => {
    requestNavigation(async () => {
      setLoggingOut(true);
      const success = await logoutRequest();
      setLoggingOut(false);

      if (success) {
        navigate('/signIn');
      } else {
        proAlert.error('Unable to log out. Please try again.');
      }
    });
  };

  const steps = [
    { id: 1, title: "Course Info", icon: BookOpen },
    { id: 2, title: "Structure", icon: Target },
    { id: 3, title: "Content", icon: FileText },
    { id: 4, title: "Settings", icon: Settings }
  ];



  const addUnit = () => {
    const newUnit: Unit = {
      id: units.length + 1,
      title: `Unit ${units.length + 1}`,
      description: "",
      lessons: [],
      isExpanded: true,
      position: units.length
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
      duration: 5,
      unitId:unitId,
      file: null,
      position: units.find((unit) => unit.id === unitId)?.lessons.length ?? 0
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

  const updateSelectedLesson = (field: keyof Lesson, value: string | number | File | null) => {
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
   const [progress, setProgress] = useState<number>(0);

  const uploadLessonFile = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(`${config.BACKEND_URL}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event) => {
          if (event.total) {
            const percent = Math.round((event.loaded * 100) / event.total);
            setProgress(percent);
          }
        },
      });

      const fileUrl: string = res.data.fileUrl;
      if (!fileUrl) return null;
      return fileUrl.startsWith('http') ? fileUrl : `${config.BACKEND_URL}${fileUrl}`;
    } catch (err) {
      console.error("Upload failed:", err);
      return null;
    }
  };
  const createCourse = async () => {
  // Basic validation
  if (!courseData.title || !courseData.description || !courseData.language) {
    proAlert.info("Please fill in all required fields.");
    return;
  }
// upload files first
  await Promise.all(
    units.map(async (unit) => {
      await Promise.all(
        unit.lessons.map(async (lesson) => {
          if (lesson.file) {
            const fileUrl = await uploadLessonFile(lesson.file);
            lesson.content = fileUrl; // <--- update lesson content directly
          }
        })
      );
      return unit; // return updated unit with modified lessons
    })
  );
  // Transform your state into the format expected by your backend
  const payload = {
    title: courseData.title,
    description: courseData.description,
    language: courseData.language,
    level: courseData.difficulty,
    category: courseData.category,
    hours: courseData.estimatedHours,
    public: publicc, // Or use a toggle if you have one
    community: community,
    discussions: discussions, // Set default or get from user
    info: info,
    instructorId: id || "some-default-id", // Set default or get from user
    units: units.map((unit, unitIndex) => ({
      title: unit.title,
      description: unit.description,
      position: typeof unit.position === "number" ? unit.position : unitIndex,
      lessons: unit.lessons.map((lesson, lessonIndex) => ({
        title: lesson.title,
        type: lesson.type,
        duration: Number(lesson.duration ?? 0),
        content: lesson.content,
        position: typeof lesson.position === "number" ? lesson.position : lessonIndex
      }))
    }))

  };
 

  try {
    const response = await fetch(`${config.BACKEND_URL}/api/courses/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify(payload)
    });

    if (handleUnauthorized(response, navigate, proAlert)) {
      return;
    }

    if (response.ok) {
      proAlert.success("Course created successfully!");
     navigate(`/dashboard`)
    } else {
      const errorData = await response.json();
      console.error("Failed to create course:", errorData);
      proAlert.error("Failed to create course.");
    }
  } catch (error) {
    console.error("Error creating course:", error);
    proAlert.error("Something went wrong while creating the course.");
  }
};

const deleteUnit = (unitId: number) => {
  setUnits(units.filter((u) => u.id !== unitId));
  if (selectedLesson && selectedLesson.unitId === unitId) {
    setSelectedLesson(null);
  }
};

const deleteLesson = (unitId:number, lessonId:number) => {
  setUnits(units.map((u) =>
    u.id === unitId
      ? { ...u, lessons: u.lessons.filter((l) => l.id !== lessonId) }
      : u
  ));
  if (selectedLesson?.id === lessonId) {
    setSelectedLesson(null);
  }
};
const fileInputRef = useRef<HTMLInputElement | null>(null);


const handleUpload = (accept: string, field: keyof Lesson) => {
if (!fileInputRef.current) return;
fileInputRef.current.accept = accept;
fileInputRef.current.onchange = (e: any) => {
const file = e.target.files?.[0];
if (file && selectedLesson) {
updateSelectedLesson(field, file); // store filename, or replace with upload logic
}
};
fileInputRef.current.click();
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
                {unit.isExpanded ? (
                  <ChevronDown size={20} className="text-gray-400" />
                ) : (
                  <ChevronRight size={20} className="text-gray-400" />
                )}
                <div>
                  <h4 className="text-white font-medium">{unit.title}</h4>
                  <p className="text-gray-400 text-sm">{unit.lessons.length} lessons</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addLesson(unit.id, "text", false);
                  }}
                  className="p-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-lg transition-all duration-200"
                >
                  <Plus size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteUnit(unit.id);
                  }}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {unit.isExpanded && (
              <div className="border-t border-white/10 p-4 space-y-3">
                <div className="text-xs text-gray-500 mb-2">
                  Drop lesson types here or click + to add
                </div>
                {unit.lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                      selectedLesson?.id === lesson.id
                        ? "bg-cyan-500/20 border-cyan-500/50 shadow-lg shadow-cyan-500/20"
                        : "bg-white/5 border-white/5 hover:border-white/10"
                    }`}
                    onClick={() => setSelectedLesson({ ...lesson, unitId: unit.id })}
                  >
                    <div className="flex items-center space-x-3">
                      <GripVertical size={16} className="text-gray-500" />
                      <div>
                        <h5
                          className={`text-sm font-medium ${
                            selectedLesson?.id === lesson.id
                              ? "text-cyan-200"
                              : "text-white"
                          }`}
                        >
                          {lesson.title}
                        </h5>
                        <p className="text-gray-400 text-xs capitalize">
                          {lesson.type} • {lesson.duration} min
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLesson({ ...lesson, unitId: unit.id });
                          setActiveStep(3); // open editor
                        }}
                        className="p-1 text-gray-400 hover:text-cyan-400 transition-colors duration-200"
                      >
                        <Settings size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteLesson(unit.id, lesson.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-400 transition-colors duration-200"
                      >
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
            {
              selectedLesson ? (<div className="lg:col-span-1">
<button
onClick={() => setActiveStep(2)}
className="mb-4 flex items-center space-x-2 text-gray-400 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition"
>
<ArrowLeft size={16} />
<span>Back to Structure</span>
</button>


<h3 className="text-white font-semibold text-lg mb-4">Lesson Types</h3>
{/* Lesson type cards */}
{/* ... keep your lessonTypes rendering here ... */}


<div className="mt-6 p-4 bg-white/5 backdrop-blur-lg rounded-lg border border-white/10">
<h4 className="text-white font-medium mb-3">Media Library</h4>
<div className="space-y-2">
<button
onClick={() => handleUpload("audio/*", "file")}
className="w-full flex items-center space-x-2 text-gray-400 hover:text-white transition-colors duration-200 p-2 hover:bg-white/5 rounded"
>
<Upload size={16} />
<span className="text-sm">Upload Audio</span>
</button>
<button
onClick={() => handleUpload("image/*", "file")}
className="w-full flex items-center space-x-2 text-gray-400 hover:text-white transition-colors duration-200 p-2 hover:bg-white/5 rounded"
>
<Image size={16} />
<span className="text-sm">Upload Images</span>
</button>
<button
onClick={() => handleUpload("video/*", "file")}
className="w-full flex items-center space-x-2 text-gray-400 hover:text-white transition-colors duration-200 p-2 hover:bg-white/5 rounded"
>
<Play size={16} />
<span className="text-sm">Upload Video</span>
</button>
</div>
<input type="file" ref={fileInputRef} className="hidden" />
</div>
</div>):(null)
            }



<div className="lg:col-span-2">
<div className="bg-white/5 backdrop-blur-lg rounded-lg border border-white/10 p-6">
<div className="flex items-center justify-between mb-6">
<h3 className="text-white font-semibold text-lg">Content Editor</h3>

</div>
{selectedLesson ? (
<div className="space-y-4">
{/* Title + Type */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
<div>
<label className="block text-white font-medium mb-2">Lesson Title</label>
<input
type="text"
value={selectedLesson.title}
onChange={(e) => updateSelectedLesson("title", e.target.value)}
className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
/>
</div>
<div>
<label className="block text-white font-medium mb-2">Lesson Type</label>
<select
value={selectedLesson.type}
onChange={(e) => updateSelectedLesson("type", e.target.value)}
className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
>
<option value="text">Text Lesson</option>
<option value="quiz">Quiz</option>
<option value="audio">Audio Lesson</option>
<option value="video">Video Lesson</option>
</select>
</div>
</div>


{/* Duration */}
<div>
<label className="block text-white font-medium mb-2">Duration (minutes)</label>
<input
type="number"
value={selectedLesson.duration}
onChange={(e) => updateSelectedLesson("duration", parseInt(e.target.value) || 0)}
className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
/>
</div>


{/* Content */}
<div>
<label className="block text-white font-medium mb-2">Lesson Content</label>
{selectedLesson.file === null ? (
  <textarea
    rows={12}
    placeholder="Enter your lesson content here..."
    value={selectedLesson.content ? selectedLesson.content:""}
    onChange={(e) => updateSelectedLesson("content", e.target.value)}
    className="w-full bg-slate-800/50 border border-white/10 rounded-lg p-4 text-white resize-none"
  />
) : (
  <div className="w-full">

    {selectedLesson?.file?.type.startsWith("image/") ? (
      <img
        src={URL.createObjectURL(selectedLesson.file)}
        alt="Preview"
        className="max-w-full max-h-[400px] rounded-lg"
      />
    ) : selectedLesson?.file?.type.startsWith("audio/") ? (
      <audio
        controls
        className="w-full"
        src={URL.createObjectURL(selectedLesson.file)}
      />
    ) : selectedLesson?.file?.type.startsWith("video/") ? (
      <video
        controls
        className="w-full max-h-[400px] rounded-lg"
        src={URL.createObjectURL(selectedLesson.file)}
      />
    ) : (
      <p className="text-white">Unsupported file type: {selectedLesson.file.type}</p>
    )}
  </div>
)}


</div>


{/* Quiz handling (if type === quiz) */}
{selectedLesson.type === "quiz" && (
<div className="space-y-4">
<h4 className="text-white font-medium">Quiz Questions</h4>
{/* TODO: Add proper quiz state handling */}
<button className="flex items-center space-x-2 text-cyan-400 hover:text-cyan-300">
<Plus size={16} />
<span className="text-sm">Add Question</span>
</button>
</div>
)}
</div>
) : (
<div className="text-center py-12">
<FileText size={48} className="text-gray-500 mx-auto mb-4" />
<p className="text-gray-400">Go back to select a lesson from the structure panel to start editing</p>
<button
onClick={() => setActiveStep(2)}
className="mb-4 flex items-center space-x-2 text-gray-400 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition"
>
<ArrowLeft size={16} />
<span>Back to Structure</span>
</button>
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
                    <input onChange={e => setPublic(e.target.checked ? "true" : "false")} type="checkbox" className="w-4 h-4 text-cyan-500 bg-white/5 border-white/20 rounded focus:ring-cyan-500/50" />
                    <span className="text-white">Make course public</span>
                  </label>
                  
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input onChange={e => setCommunity(e.target.checked ? "true" : "false")} type="checkbox" className="w-4 h-4 text-cyan-500 bg-white/5 border-white/20 rounded focus:ring-cyan-500/50" />
                    <span className="text-white">Allow community contributions</span>
                  </label>
                  
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input onChange={e => setDiscussions(e.target.checked ? "true" : "false")} type="checkbox" className="w-4 h-4 text-cyan-500 bg-white/5 border-white/20 rounded focus:ring-cyan-500/50" />
                    <span className="text-white">Enable course discussions</span>
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-white font-semibold text-lg">Prerequisites</h3>
                <textarea
                  rows={4}
                  onChange={e=>setInfo(e.target.value)}
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
            {progress > 0 && (
            <div className="bg-white/5 backdrop-blur-lg rounded-lg border border-white/10 p-6">
              <h3 className="text-white font-semibold text-lg mb-4">Upload Progress</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
                
        <div className="w-full bg-gray-200 rounded-full h-4 mt-2">
          <div
            className="bg-blue-500 h-4 rounded-full transition-all duration-200"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
    
      <p>{progress > 0 && `${progress}% uploaded`}</p>
              </div>
            </div>
              )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative">
      {loggingOut && <LoaderOverlay message="Logging out..." />}
      <header className={`bg-slate-900/80 backdrop-blur-lg border-b border-white/10 transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLogoClick}
                type="button"
                className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
              >
                OpenLingua
              </button>
             
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button
                type="button"
                onClick={handleLogoutClick}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white bg-white/10 border border-white/15 hover:bg-white/15 transition-all"
              >
                <LogOut size={16} />
                Log out
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
          
            {activeStep === 4 ? (
              <button onClick={createCourse} className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-200 hover:scale-105">
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

      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-slate-900/90 border border-white/15 rounded-2xl px-8 py-6 max-w-md w-full text-center shadow-xl">
            <h3 className="text-xl font-semibold text-white mb-3">Leave this page?</h3>
            <p className="text-sm text-gray-300 mb-6">
              You have unsaved changes. Navigating away now might cause you to lose your progress.
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={cancelNavigation}
                className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/10 rounded-lg hover:bg-white/15 transition-colors"
              >
                Stay here
              </button>
              <button
                onClick={confirmNavigation}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg hover:opacity-90 transition-opacity"
              >
                Leave page
              </button>
            </div>
          </div>
        </div>
      )}
  </div>
  );
};

export default CourseCreation;
