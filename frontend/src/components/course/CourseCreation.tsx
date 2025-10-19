import { useState, useEffect, useRef } from "react";
import config from "../../config";
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
  LogOut,
  // Edit // Commented out - not needed after quiz tab removal
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import LoaderOverlay from "../ui/LoaderOverlay";
import { logoutRequest } from "../../utils/logout";
import ThemeToggle from "../layout/ThemeToggle";
import { useProAlert } from "../../context/ProAlertContext";
import { handleUnauthorized } from "../../utils/handleUnauthorized";
// import QuizEditor from "../quiz/QuizEditor"; // Commented out - quiz now part of lesson types
// import { getCourseQuizzes, deleteQuiz } from "../../services/quizApi"; // Commented out
// import type { Quiz } from "../../services/quizApi"; // Commented out

// Quiz question types for lesson-based quizzes
interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'fill-in-blank';
  question: string;
  options: QuizOption[];
  correctAnswer?: string; // For fill-in-blank
  explanation?: string;
}

interface QuizData {
  questions: QuizQuestion[];
  passingScore: number;
  timeLimit?: number;
}

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
 const searchParams = new URLSearchParams(window.location.search);
 const editCourseId = searchParams.get('edit');
 const isEditMode = !!editCourseId; // Derived value, no need for state
 const [isLoadingCourse, setIsLoadingCourse] = useState<boolean>(!!editCourseId);
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
  const [isPublishing, setIsPublishing] = useState(false);
  const pendingNavigation = useRef<(() => void | Promise<void>) | null>(null);

  // Quiz management state - COMMENTED OUT (Quiz now part of lesson types)
  // const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  // const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  // const [showQuizEditor, setShowQuizEditor] = useState(false);
  // const [editingQuizId, setEditingQuizId] = useState<string | null>(null);

  // Fetch course data if in edit mode
  useEffect(() => {
    const loadCourseForEditing = async () => {
      if (!editCourseId) return;

      try {
        setIsLoadingCourse(true);
        const res = await fetch(`${config.BACKEND_URL}/api/courses/${editCourseId}`, {
          method: "GET",
          credentials: 'include',
        });

        if (handleUnauthorized(res, navigate, proAlert)) {
          return;
        }

        if (!res.ok) {
          throw new Error("Failed to fetch course");
        }

        const data = await res.json();
        const course = data.course;

        // Populate course data
        setCourseData({
          title: course.title || "",
          description: course.description || "",
          language: course.language || "",
          difficulty: course.level || "",
          tags: [],
          category: course.category || "",
          estimatedHours: course.hours || "",
          targetAudience: ""
        });

        // Populate settings
        setPublic(course.public || "true");
        setCommunity(course.community || "true");
        setDiscussions(course.discussions || "true");
        setInfo(course.info || "");

        // Populate units and lessons
        if (course.units && course.units.length > 0) {
          const loadedUnits = course.units.map((unit: any) => ({
            id: Date.now() + Math.random(), // Generate new ID for UI
            title: unit.title,
            description: unit.description || "",
            position: unit.position,
            isExpanded: false,
            lessons: unit.lessons.map((lesson: any) => {
              const baseLesson: Lesson = {
                id: Date.now() + Math.random(),
                title: lesson.title,
                type: lesson.type,
                duration: lesson.duration || 5,
                unitId: unit.id,
                file: null,
                position: lesson.position,
                content: null
              };

              // Legacy: if type is quiz, we no longer maintain lesson-level quiz data
              if (lesson.type === "quiz") {
                baseLesson.content = ""; // managed at course-level quizzes (Step 5)
              } else {
                baseLesson.content = lesson.content || "";
              }

              return baseLesson;
            })
          }));
          setUnits(loadedUnits);
        }

        proAlert.success("Course loaded for editing");
      } catch (error) {
        console.error("Error loading course:", error);
        proAlert.error("Failed to load course for editing");
        navigate('/dashboard');
      } finally {
        setIsLoadingCourse(false);
      }
    };

    loadCourseForEditing();
  }, [editCourseId]);


  const generateId = () => Date.now() + Math.floor(Math.random() * 1000);

  const replaceLesson = (updatedLesson: Lesson) => {
    setSelectedLesson(updatedLesson);
    setUnits((prevUnits) =>
      prevUnits.map((unit) => ({
        ...unit,
        lessons: unit.lessons.map((lesson) =>
          lesson.id === updatedLesson.id ? updatedLesson : lesson
        ),
      }))
    );
  };

  useEffect(() => {
    setIsVisible(true);
    if (isEditMode && editCourseId) {
      // load course data for editing
      (async () => {
        try {
          const res = await fetch(`${config.BACKEND_URL}/api/courses/${editCourseId}`, {
            method: 'GET',
            credentials: 'include'
          });

          if (handleUnauthorized(res, navigate, proAlert)) return;

          if (!res.ok) return;
          const data = await res.json();
          const course = data.course;
          if (!course) return;
          setCourseData({
            title: course.title || '',
            description: course.description || '',
            language: course.language || '',
            difficulty: course.level || '',
            tags: [],
            category: course.category || '',
            estimatedHours: course.hours || '',
            targetAudience: ''
          });

          // Map units & lessons
          const loadedUnits: Unit[] = (course.units || []).map((u: any, ui: number) => ({
            id: generateId() + ui,
            title: u.title,
            description: u.description || '',
            lessons: (u.lessons || []).map((l: any, li: number) => ({
              id: generateId() + li,
              title: l.title,
              type: l.type,
              content: l.content,
              duration: l.duration || 0,
              unitId: ui,
              file: null,
              position: l.position
            })),
            isExpanded: true,
            position: u.position
          }));
          setUnits(loadedUnits);
        } catch (error) {
          console.error('Failed to load course for editing', error);
        }
      })();
    }
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
    { id: 4, title: "Settings", icon: Settings },
    // { id: 5, title: "Quizzes", icon: BookOpen } // Commented out - Quiz now part of lesson types
  ];

  // Validation function for each step
  const validateStep = (stepId: number): boolean => {
    switch (stepId) {
      case 1: // Course Info
        if (!courseData.title.trim()) {
          proAlert.error("Please enter a course title");
          return false;
        }
        if (!courseData.description.trim()) {
          proAlert.error("Please enter a course description");
          return false;
        }
        if (!courseData.language.trim()) {
          proAlert.error("Please select a language");
          return false;
        }
        if (!courseData.difficulty) {
          proAlert.error("Please select a difficulty level");
          return false;
        }
        if (!courseData.category) {
          proAlert.error("Please select a category");
          return false;
        }
        if (!courseData.estimatedHours.trim()) {
          proAlert.error("Please enter estimated hours");
          return false;
        }
        return true;

      case 2: // Structure
        if (units.length === 0) {
          proAlert.error("Please add at least one unit to your course");
          return false;
        }
        // Check if all units have titles
        const unitsWithoutTitles = units.filter(u => !u.title.trim());
        if (unitsWithoutTitles.length > 0) {
          proAlert.error("All units must have a title");
          return false;
        }
        // Check if at least one unit has lessons
        const unitsWithLessons = units.filter(u => u.lessons.length > 0);
        if (unitsWithLessons.length === 0) {
          proAlert.error("Please add at least one lesson to your course");
          return false;
        }
        return true;

      case 3: // Content
        // Check if all lessons have titles and content
        for (const unit of units) {
          for (const lesson of unit.lessons) {
            if (!lesson.title.trim()) {
              proAlert.error(`Please add a title to all lessons in "${unit.title}"`);
              return false;
            }
            // Check content based on lesson type
            if (lesson.type === "text" && !lesson.content?.trim()) {
              proAlert.error(`Please add content to the text lesson "${lesson.title}"`);
              return false;
            }
            if ((lesson.type === "audio" || lesson.type === "video") && !lesson.file && !lesson.content) {
              proAlert.error(`Please upload a file for the ${lesson.type} lesson "${lesson.title}"`);
              return false;
            }
            if (lesson.type === "quiz") {
              try {
                const quizData = lesson.content ? JSON.parse(lesson.content) : null;
                if (!quizData || !quizData.questions || quizData.questions.length === 0) {
                  proAlert.error(`Please add at least one question to the quiz "${lesson.title}"`);
                  return false;
                }
              } catch {
                proAlert.error(`Invalid quiz data in "${lesson.title}"`);
                return false;
              }
            }
          }
        }
        return true;

      case 4: // Settings - no required fields
        return true;

      default:
        return true;
    }
  };



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
    let newLesson: Lesson = {
      id: newLessonId,
      title: `${lessonType.charAt(0).toUpperCase() + lessonType.slice(1)} Lesson`,
      type: lessonType,
      content: lessonType === "quiz" ? null : "",
      duration: 5,
      unitId:unitId,
      file: null,
      position: units.find((unit) => unit.id === unitId)?.lessons.length ?? 0,
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
    if (!selectedLesson) {
      return;
    }

    let updatedLesson: Lesson = { ...selectedLesson };

    if (field === "type" && typeof value === "string") {
      updatedLesson = {
        ...updatedLesson,
        type: value,
        file: null,
        content: value === "quiz" ? JSON.stringify({ questions: [], passingScore: 70 }) : updatedLesson.content ?? "",
      };
    } else if (field === "content") {
      // Allow content updates for all lesson types, including quiz
      updatedLesson = {
        ...updatedLesson,
        content: typeof value === "string" ? value : updatedLesson.content,
      };
    } else if (field === "duration") {
      // Ensure duration is a non-negative integer
      let newDuration = updatedLesson.duration;
      if (typeof value === 'number') {
        newDuration = Math.max(0, Math.floor(value));
      } else if (typeof value === 'string') {
        const parsed = parseInt(value, 10);
        if (!isNaN(parsed)) {
          newDuration = Math.max(0, Math.floor(parsed));
        }
      }

      updatedLesson = {
        ...updatedLesson,
        duration: newDuration,
      };
    } else if (field === "file") {
      updatedLesson = {
        ...updatedLesson,
        file: (value as File | null) ?? null,
        content: updatedLesson.type === "quiz" ? null : updatedLesson.content,
      };
    } else {
      updatedLesson = {
        ...updatedLesson,
        [field]: value,
      } as Lesson;
    }

    // If it's a quiz lesson (legacy), ensure file is null; content is managed elsewhere
    if (updatedLesson.type === "quiz") {
      updatedLesson = { ...updatedLesson, file: null };
    }

    replaceLesson(updatedLesson);
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

  setIsPublishing(true);

  // Check if course title already exists (case-insensitive)
  try {
    const checkResponse = await fetch(`${config.BACKEND_URL}/api/courses/`, {
      method: 'GET',
      credentials: 'include'
    });

    if (checkResponse.ok) {
      const { courses } = await checkResponse.json();
      const normalizedTitle = courseData.title.toLowerCase().trim();
      
      const duplicateCourse = courses.find((course: any) => {
        // Skip checking against the current course when editing
        if (isEditMode && course.id === editCourseId) {
          return false;
        }
        return course.title.toLowerCase().trim() === normalizedTitle;
      });

      if (duplicateCourse) {
        proAlert.error(
          `A course titled "${duplicateCourse.title}" already exists. Please choose a different title.`
        );
        setIsPublishing(false);
        return;
      }
    }
  } catch (error) {
    console.warn("Could not check for duplicate titles:", error);
    // Continue with creation anyway - backend will catch it
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
    const url = isEditMode && editCourseId ? `${config.BACKEND_URL}/api/courses/${editCourseId}` : `${config.BACKEND_URL}/api/courses/`;
    const method = isEditMode && editCourseId ? 'PATCH' : 'POST';
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify(payload)
    });

    if (handleUnauthorized(response, navigate, proAlert)) {
      setIsPublishing(false);
      return;
    }

    if (response.ok) {
      proAlert.success(isEditMode ? "Course updated successfully!" : "Course created successfully!");
      setIsPublishing(false);
     navigate(`/dashboard`)
    } else {
      const errorData = await response.json();
      console.error(isEditMode ? "Failed to update course:" : "Failed to create course:", errorData);
      
      // Handle specific error cases
      if (response.status === 409) {
        // Duplicate course title
        const existingTitle = errorData.existingCourse?.title || courseData.title;
        const createdBy = errorData.existingCourse?.createdBy || "another instructor";
        proAlert.error(
          `A course titled "${existingTitle}" already exists (created by ${createdBy}). Please choose a different title.`
        );
      } else {
        proAlert.error(errorData.error || (isEditMode ? "Failed to update course." : "Failed to create course."));
      }
      setIsPublishing(false);
    }
  } catch (error) {
    console.error("Error saving course:", error);
    proAlert.error("Something went wrong while saving the course.");
    setIsPublishing(false);
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
const mediaRecorderRef = useRef<MediaRecorder | null>(null);
const [isRecording, setIsRecording] = useState(false);

// Get media duration
const getMediaDuration = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const media = file.type.startsWith('audio/') 
      ? new Audio(url) 
      : document.createElement('video');
    
    media.onloadedmetadata = () => {
      const durationMinutes = Math.ceil(media.duration / 60);
      URL.revokeObjectURL(url);
      resolve(durationMinutes);
    };
    
    media.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(5); // Default to 5 minutes if error
    };
    
    media.src = url;
  });
};

const handleUpload = async (accept: string, field: keyof Lesson) => {
  // Check if lesson type is text
  if (selectedLesson?.type === "text") {
    proAlert.error("Please select Audio or Video lesson type to upload media files");
    return;
  }

  if (!fileInputRef.current) return;
  fileInputRef.current.accept = accept;
  fileInputRef.current.onchange = async (e: any) => {
    const file = e.target.files?.[0];
    if (file && selectedLesson) {
      // Auto-calculate duration for audio/video files
      if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
        try {
          const duration = await getMediaDuration(file);
          updateSelectedLesson("duration", duration);
        } catch (error) {
          console.error("Error getting media duration:", error);
        }
      }
      updateSelectedLesson(field, file);
    }
  };
  fileInputRef.current.click();
};

// Start recording audio or video
const startRecording = async (type: 'audio' | 'video') => {
  // Check if lesson type matches
  if (selectedLesson?.type !== type) {
    proAlert.error(`Please select ${type.charAt(0).toUpperCase() + type.slice(1)} lesson type to record ${type}`);
    return;
  }

  try {
    const constraints = type === 'audio' 
      ? { audio: true } 
      : { audio: true, video: true };
    
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    
    const chunks: Blob[] = [];
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    
    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunks, { 
        type: type === 'audio' ? 'audio/webm' : 'video/webm' 
      });
      const file = new File([blob], `recorded-${type}.webm`, { 
        type: blob.type 
      });
      
      // Auto-calculate duration
      try {
        const duration = await getMediaDuration(file);
        updateSelectedLesson("duration", duration);
      } catch (error) {
        console.error("Error getting recorded media duration:", error);
      }
      
      updateSelectedLesson("file", file);
      
      // Stop all tracks
      stream.getTracks().forEach(track => track.stop());
    };
    
    mediaRecorder.start();
    setIsRecording(true);
    proAlert.success(`Recording ${type}...`);
  } catch (error) {
    console.error("Error starting recording:", error);
    proAlert.error(`Failed to start recording. Please check your ${type} permissions.`);
  }
};

// Stop recording
const stopRecording = () => {
  if (mediaRecorderRef.current && isRecording) {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    proAlert.success("Recording stopped");
  }
};

  // Quiz management functions - COMMENTED OUT (Quiz now part of lesson types)
  /*
  const loadQuizzes = async () => {
    if (!editCourseId) return;
    
    try {
      setLoadingQuizzes(true);
      const data = await getCourseQuizzes(editCourseId);
      // Handle both array and object with quizzes property
      setQuizzes(Array.isArray(data) ? data : ((data as any).quizzes || []));
    } catch (error: any) {
      console.error('Failed to load quizzes:', error);
      // Don't show error for empty quiz list - just set to empty array
      setQuizzes([]);
    } finally {
      setLoadingQuizzes(false);
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!editCourseId) return;
    if (!confirm('Are you sure you want to delete this quiz?')) return;
    
    try {
      await deleteQuiz(editCourseId, quizId);
      proAlert.success('Quiz deleted successfully');
      loadQuizzes();
    } catch (error: any) {
      proAlert.error(error.message || 'Failed to delete quiz');
    }
  };

  const handleQuizSaved = () => {
    setShowQuizEditor(false);
    setEditingQuizId(null);
    loadQuizzes();
  };

  // Load quizzes when entering quiz step
  useEffect(() => {
    if (activeStep === 5 && editCourseId) {
      loadQuizzes();
    }
  }, [activeStep, editCourseId]);
  */


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
                <input
                  type="text"
                  placeholder="Enter language (e.g., isiXhosa, Swahili, Shona, etc.)"
                  value={courseData.language}
                  onChange={(e) => setCourseData({...courseData, language: e.target.value})}
                  className="w-full bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200"
                />
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
            className="bg-white/5 backdrop-blur-lg rounded-lg border-2 border-cyan-500/30"
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
          <div className="space-y-6">


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {
              selectedLesson ? (<div className="lg:col-span-1">
<button
onClick={() => setActiveStep(2)}
className="mb-4 flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition"
>
<ArrowLeft size={16} />
<span>Back to Structure</span>
</button>

<div className="bg-gradient-to-br from-cyan-500/5 to-purple-500/5 border-2 border-cyan-500/30 rounded-xl p-4 mb-4">
  <div className="flex items-center gap-2 mb-2">
    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Currently Editing</span>
  </div>
  <h4 className="text-gray-900 dark:text-white font-semibold">{selectedLesson.title}</h4>
  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
    Unit {units.findIndex(u => u.id === selectedLesson.unitId) + 1} • {selectedLesson.type.charAt(0).toUpperCase() + selectedLesson.type.slice(1)} Lesson
  </p>
</div>

<h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-4">Quick Actions</h3>
{/* Lesson type cards */}
{/* ... keep your lessonTypes rendering here ... */}


<div className="mt-6 p-4 bg-gradient-to-br from-white/10 to-white/5 dark:from-white/5 dark:to-white/5 backdrop-blur-lg rounded-lg border-2 border-cyan-500/30 shadow-lg">
<div className="flex items-center gap-2 mb-3">
  <Upload size={18} className="text-cyan-400" />
  <h4 className="text-gray-900 dark:text-white font-semibold">Upload Media</h4>
</div>
<p className="text-xs text-gray-600 dark:text-gray-400 mb-4">Add images, audio, or video files to your lesson</p>
<div className="space-y-2">
<button
onClick={() => handleUpload("audio/*", "file")}
className="w-full flex items-center justify-between space-x-2 text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all duration-200 p-3 hover:bg-cyan-500/10 rounded-lg border border-transparent hover:border-cyan-500/30 group"
>
<div className="flex items-center gap-2">
  <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:bg-purple-500/30 transition">
    <Play size={16} className="text-purple-400" />
  </div>
  <span className="text-sm font-medium">Audio File</span>
</div>
<span className="text-xs text-gray-500 dark:text-gray-500">.mp3, .wav</span>
</button>
<button
onClick={() => handleUpload("image/*", "file")}
className="w-full flex items-center justify-between space-x-2 text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all duration-200 p-3 hover:bg-cyan-500/10 rounded-lg border border-transparent hover:border-cyan-500/30 group"
>
<div className="flex items-center gap-2">
  <div className="w-8 h-8 bg-pink-500/20 rounded-lg flex items-center justify-center group-hover:bg-pink-500/30 transition">
    <Image size={16} className="text-pink-400" />
  </div>
  <span className="text-sm font-medium">Image File</span>
</div>
<span className="text-xs text-gray-500 dark:text-gray-500">.jpg, .png</span>
</button>
<button
onClick={() => handleUpload("video/*", "file")}
className="w-full flex items-center justify-between space-x-2 text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all duration-200 p-3 hover:bg-cyan-500/10 rounded-lg border border-transparent hover:border-cyan-500/30 group"
>
<div className="flex items-center gap-2">
  <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center group-hover:bg-cyan-500/30 transition">
    <Play size={16} className="text-cyan-400" />
  </div>
  <span className="text-sm font-medium">Video File</span>
</div>
<span className="text-xs text-gray-500 dark:text-gray-500">.mp4, .mov</span>
</button>
</div>
<input type="file" ref={fileInputRef} className="hidden" />
</div>
</div>):(null)
            }



<div className="lg:col-span-2">
<div className="bg-white/10 dark:bg-white/5 backdrop-blur-lg rounded-lg border-2 border-cyan-500/30 p-6">
<div className="flex items-center justify-between mb-6">
<div>
  <h3 className="text-gray-900 dark:text-white font-semibold text-lg">Content Editor</h3>
  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Edit your lesson details and content below</p>
</div>
</div>
{selectedLesson ? (
<div className="space-y-6">
{/* Title + Type */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
<div>
<label className="block text-gray-900 dark:text-white font-medium mb-2">
  Lesson Title
  <span className="text-xs text-gray-500 dark:text-gray-400 font-normal ml-2">(Required)</span>
</label>
<input
type="text"
value={selectedLesson.title}
onChange={(e) => updateSelectedLesson("title", e.target.value)}
placeholder="e.g., Introduction to Spanish Verbs"
className="w-full bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
/>
</div>
<div>
<label className="block text-gray-900 dark:text-white font-medium mb-2">
  Lesson Type
  <span className="text-xs text-gray-500 dark:text-gray-400 font-normal ml-2">(Choose one)</span>
</label>
<select
value={selectedLesson.type}
onChange={(e) => updateSelectedLesson("type", e.target.value)}
className="w-full bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
>
<option value="text">📝 Text Lesson</option>
<option value="audio">🎵 Audio Lesson</option>
<option value="video">🎥 Video Lesson</option>
<option value="quiz">✏️ Quiz</option>
</select>
</div>
</div>


{/* Duration - Only show for text lessons */}
{selectedLesson.type === "text" && (
<div>
<label className="block text-gray-900 dark:text-white font-medium mb-2">
  Duration (minutes)
  <span className="text-xs text-gray-500 dark:text-gray-400 font-normal ml-2">(How long will this lesson take?)</span>
</label>
<input
  type="number"
  min="0"
  value={selectedLesson.duration}
  onChange={(e) => updateSelectedLesson("duration", e.target.value)}
  placeholder="e.g., 15"
  className="w-full bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
/>
</div>
)}

{/* Duration display for audio/video - auto-calculated */}
{(selectedLesson.type === "audio" || selectedLesson.type === "video") && selectedLesson.duration > 0 && (
  <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
    <div className="flex items-center gap-2">
      <Clock size={16} className="text-cyan-400" />
      <span className="text-sm text-gray-700 dark:text-gray-300">
        Duration: <strong className="text-cyan-600 dark:text-cyan-400">{selectedLesson.duration} minutes</strong> (auto-calculated from media file)
      </span>
    </div>
  </div>
)}

{/* Content */}
<div>
<label className="block text-gray-900 dark:text-white font-medium mb-2">
  Lesson Content
  {selectedLesson.type === "text" && (
    <span className="text-xs text-gray-500 dark:text-gray-400 font-normal ml-2">(Write your lesson content here)</span>
  )}
  {selectedLesson.type === "audio" && (
    <span className="text-xs text-gray-500 dark:text-gray-400 font-normal ml-2">(Upload or record audio)</span>
  )}
  {selectedLesson.type === "video" && (
    <span className="text-xs text-gray-500 dark:text-gray-400 font-normal ml-2">(Upload or record video)</span>
  )}
</label>
{selectedLesson.type === "quiz" ? (
  // Quiz Builder Interface
  <div className="space-y-6">
    {(() => {
      // Parse quiz data from lesson content
      let quizData: QuizData;
      try {
        quizData = selectedLesson.content ? JSON.parse(selectedLesson.content) : { questions: [], passingScore: 70 };
      } catch {
        quizData = { questions: [], passingScore: 70 };
      }

      const addQuestion = (type: QuizQuestion['type']) => {
        const newQuestion: QuizQuestion = {
          id: `q-${Date.now()}`,
          type,
          question: '',
          options: type === 'true-false' 
            ? [
                { id: 'true', text: 'True', isCorrect: false },
                { id: 'false', text: 'False', isCorrect: false }
              ]
            : type === 'multiple-choice'
              ? [
                  { id: `opt-${Date.now()}-1`, text: '', isCorrect: false },
                  { id: `opt-${Date.now()}-2`, text: '', isCorrect: false }
                ]
              : [],
          correctAnswer: type === 'fill-in-blank' ? '' : undefined,
          explanation: ''
        };
        quizData.questions.push(newQuestion);
        updateSelectedLesson('content', JSON.stringify(quizData));
      };

      const updateQuestion = (questionId: string, field: keyof QuizQuestion, value: any) => {
        const question = quizData.questions.find(q => q.id === questionId);
        if (question) {
          (question as any)[field] = value;
          updateSelectedLesson('content', JSON.stringify(quizData));
        }
      };

      const deleteQuestion = (questionId: string) => {
        quizData.questions = quizData.questions.filter(q => q.id !== questionId);
        updateSelectedLesson('content', JSON.stringify(quizData));
      };

      const addOption = (questionId: string) => {
        const question = quizData.questions.find(q => q.id === questionId);
        if (question && question.type === 'multiple-choice') {
          question.options.push({
            id: `opt-${Date.now()}`,
            text: '',
            isCorrect: false
          });
          updateSelectedLesson('content', JSON.stringify(quizData));
        }
      };

      const updateOption = (questionId: string, optionId: string, field: keyof QuizOption, value: any) => {
        const question = quizData.questions.find(q => q.id === questionId);
        if (question) {
          const option = question.options.find(o => o.id === optionId);
          if (option) {
            if (field === 'isCorrect' && value === true) {
              // For multiple choice, only one answer can be correct
              question.options.forEach(o => o.isCorrect = false);
            }
            (option as any)[field] = value;
            updateSelectedLesson('content', JSON.stringify(quizData));
          }
        }
      };

      const deleteOption = (questionId: string, optionId: string) => {
        const question = quizData.questions.find(q => q.id === questionId);
        if (question) {
          question.options = question.options.filter(o => o.id !== optionId);
          updateSelectedLesson('content', JSON.stringify(quizData));
        }
      };

      return (
        <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-white/10 rounded-lg p-6">

          {/* Questions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                Questions ({quizData.questions.length})
              </h4>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addQuestion('multiple-choice');
                  }}
                  className="px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
                >
                  + Multiple Choice
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addQuestion('true-false');
                  }}
                  className="px-3 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium"
                >
                  + True/False
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addQuestion('fill-in-blank');
                  }}
                  className="px-3 py-2 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition font-medium"
                >
                  + Fill in Blank
                </button>
              </div>
            </div>

            {quizData.questions.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                <p className="text-gray-500 dark:text-gray-400">
                  No questions yet. Click a button above to add your first question.
                </p>
              </div>
            ) : (
              quizData.questions.map((question, qIndex) => (
                <div
                  key={question.id}
                  className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-white/10 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-white">Q{qIndex + 1}.</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        question.type === 'multiple-choice' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                        question.type === 'true-false' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                        'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                      }`}>
                        {question.type === 'multiple-choice' ? 'Multiple Choice' :
                         question.type === 'true-false' ? 'True/False' : 'Fill in Blank'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteQuestion(question.id)}
                      className="text-red-500 hover:text-red-600 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Question
                      </label>
                      <input
                        type="text"
                        value={question.question}
                        onChange={(e) => updateQuestion(question.id, 'question', e.target.value)}
                        placeholder="Enter your question..."
                        className="w-full bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                      />
                    </div>

                    {/* Options for multiple choice and true/false */}
                    {(question.type === 'multiple-choice' || question.type === 'true-false') && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Options {question.type === 'multiple-choice' && '(select the correct one)'}
                          </label>
                          {question.type === 'multiple-choice' && (
                            <button
                              type="button"
                              onClick={() => addOption(question.id)}
                              className="text-sm text-blue-500 hover:text-blue-600"
                            >
                              + Add Option
                            </button>
                          )}
                        </div>
                        <div className="space-y-2">
                          {question.options.map((option) => (
                            <div key={option.id} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`correct-${question.id}`}
                                checked={option.isCorrect}
                                onChange={(e) => updateOption(question.id, option.id, 'isCorrect', e.target.checked)}
                                className="w-4 h-4 text-green-500"
                              />
                              <input
                                type="text"
                                value={option.text}
                                onChange={(e) => updateOption(question.id, option.id, 'text', e.target.value)}
                                placeholder="Option text..."
                                className="flex-1 bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded px-3 py-1.5 text-sm text-gray-900 dark:text-white"
                                disabled={question.type === 'true-false'}
                              />
                              {question.type === 'multiple-choice' && question.options.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => deleteOption(question.id, option.id)}
                                  className="text-red-500 hover:text-red-600 p-1"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Fill in blank answer */}
                    {question.type === 'fill-in-blank' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Correct Answer
                        </label>
                        <input
                          type="text"
                          value={question.correctAnswer || ''}
                          onChange={(e) => updateQuestion(question.id, 'correctAnswer', e.target.value)}
                          placeholder="Enter the correct answer..."
                          className="w-full bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                        />
                      </div>
                    )}

                    {/* Explanation */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Explanation (optional)
                      </label>
                      <textarea
                        value={question.explanation || ''}
                        onChange={(e) => updateQuestion(question.id, 'explanation', e.target.value)}
                        placeholder="Provide an explanation for the answer..."
                        rows={2}
                        className="w-full bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white resize-none"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      );
    })()}
  </div>
) : selectedLesson.type === "audio" ? (
  // Audio lesson interface
  selectedLesson.file === null ? (
    <div className="space-y-4">
      {/* Upload or Record options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upload Audio */}
        <div
          onClick={() => handleUpload("audio/*", "file")}
          className="cursor-pointer group border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-purple-500 dark:hover:border-purple-500 rounded-xl p-8 transition-all duration-300 hover:bg-purple-500/5"
        >
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center group-hover:bg-purple-500/30 transition">
              <Upload size={32} className="text-purple-500" />
            </div>
            <h4 className="text-gray-900 dark:text-white font-semibold">Upload Audio File</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Click to browse and upload<br />MP3, WAV, or other audio files
            </p>
          </div>
        </div>

        {/* Record Audio */}
        <div
          onClick={() => !isRecording && startRecording('audio')}
          className={`cursor-pointer group border-2 border-dashed rounded-xl p-8 transition-all duration-300 ${
            isRecording 
              ? 'border-red-500 bg-red-500/10' 
              : 'border-gray-300 dark:border-gray-600 hover:border-pink-500 dark:hover:border-pink-500 hover:bg-pink-500/5'
          }`}
        >
          <div className="flex flex-col items-center text-center space-y-3">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition ${
              isRecording 
                ? 'bg-red-500/30 animate-pulse' 
                : 'bg-pink-500/20 group-hover:bg-pink-500/30'
            }`}>
              {isRecording ? (
                <div className="w-4 h-4 bg-red-500 rounded-sm" />
              ) : (
                <Play size={32} className="text-pink-500" />
              )}
            </div>
            <h4 className="text-gray-900 dark:text-white font-semibold">
              {isRecording ? 'Recording...' : 'Record Audio'}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isRecording ? 'Click below to stop' : 'Click to start recording audio'}
            </p>
            {isRecording && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  stopRecording();
                }}
                className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                Stop Recording
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  ) : (
    // Audio file preview with remove option
    <div className="space-y-4">
      <div className="bg-purple-500/10 border-2 border-purple-500/30 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-gray-900 dark:text-white font-semibold flex items-center gap-2">
            <Play size={20} className="text-purple-500" />
            Audio File Uploaded
          </h4>
          <button
            onClick={() => updateSelectedLesson("file", null)}
            className="p-2 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition"
          >
            <Trash2 size={18} />
          </button>
        </div>
        <audio
          controls
          className="w-full"
          src={URL.createObjectURL(selectedLesson.file)}
        />
      </div>
    </div>
  )
) : selectedLesson.type === "video" ? (
  // Video lesson interface
  selectedLesson.file === null ? (
    <div className="space-y-4">
      {/* Upload or Record options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upload Video */}
        <div
          onClick={() => handleUpload("video/*", "file")}
          className="cursor-pointer group border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-cyan-500 dark:hover:border-cyan-500 rounded-xl p-8 transition-all duration-300 hover:bg-cyan-500/5"
        >
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center group-hover:bg-cyan-500/30 transition">
              <Upload size={32} className="text-cyan-500" />
            </div>
            <h4 className="text-gray-900 dark:text-white font-semibold">Upload Video File</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Click to browse and upload<br />MP4, MOV, or other video files
            </p>
          </div>
        </div>

        {/* Record Video */}
        <div
          onClick={() => !isRecording && startRecording('video')}
          className={`cursor-pointer group border-2 border-dashed rounded-xl p-8 transition-all duration-300 ${
            isRecording 
              ? 'border-red-500 bg-red-500/10' 
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-500/5'
          }`}
        >
          <div className="flex flex-col items-center text-center space-y-3">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition ${
              isRecording 
                ? 'bg-red-500/30 animate-pulse' 
                : 'bg-blue-500/20 group-hover:bg-blue-500/30'
            }`}>
              {isRecording ? (
                <div className="w-4 h-4 bg-red-500 rounded-sm" />
              ) : (
                <Play size={32} className="text-blue-500" />
              )}
            </div>
            <h4 className="text-gray-900 dark:text-white font-semibold">
              {isRecording ? 'Recording...' : 'Record Video'}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isRecording ? 'Click below to stop' : 'Click to start recording video'}
            </p>
            {isRecording && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  stopRecording();
                }}
                className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                Stop Recording
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  ) : (
    // Video file preview with remove option
    <div className="space-y-4">
      <div className="bg-cyan-500/10 border-2 border-cyan-500/30 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-gray-900 dark:text-white font-semibold flex items-center gap-2">
            <Play size={20} className="text-cyan-500" />
            Video File Uploaded
          </h4>
          <button
            onClick={() => updateSelectedLesson("file", null)}
            className="p-2 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition"
          >
            <Trash2 size={18} />
          </button>
        </div>
        <video
          controls
          className="w-full max-h-[400px] rounded-lg"
          src={URL.createObjectURL(selectedLesson.file)}
        />
      </div>
    </div>
  )
) : selectedLesson.file === null ? (
  // Text lesson interface
  <textarea
    rows={12}
    placeholder="Enter your lesson content here..."
    value={selectedLesson.content ? selectedLesson.content : ""}
    onChange={(e) => updateSelectedLesson("content", e.target.value)}
    className="w-full bg-white dark:bg-slate-800/50 border border-gray-300 dark:border-white/10 rounded-lg p-4 text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
  />
) : (
  // Other file types (like images)
  <div className="w-full">
    {selectedLesson?.file?.type.startsWith("image/") ? (
      <div className="space-y-4">
        <div className="bg-pink-500/10 border-2 border-pink-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-gray-900 dark:text-white font-semibold flex items-center gap-2">
              <Image size={20} className="text-pink-500" />
              Image File Uploaded
            </h4>
            <button
              onClick={() => updateSelectedLesson("file", null)}
              className="p-2 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition"
            >
              <Trash2 size={18} />
            </button>
          </div>
          <img
            src={URL.createObjectURL(selectedLesson.file)}
            alt="Preview"
            className="max-w-full max-h-[400px] rounded-lg mx-auto"
          />
        </div>
      </div>
    ) : (
      <p className="text-gray-900 dark:text-white">Unsupported file type: {selectedLesson.file.type}</p>
    )}
  </div>
)}


</div>
</div>
) : (
<div className="flex items-center justify-center min-h-[400px]">
  <div className="max-w-2xl text-center">
    <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-2 border-cyan-500/30 rounded-2xl p-8 shadow-xl">
      <FileText size={64} className="text-cyan-400 mx-auto mb-6 animate-pulse" />
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Ready to Add Content?</h3>
      <p className="text-gray-700 dark:text-cyan-100 text-base mb-6">
        You haven't selected a lesson yet. Here's what to do:
      </p>
      
      <div className="bg-white/5 dark:bg-black/20 rounded-lg p-6 mb-6 text-left space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-cyan-500 text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
          <div className="flex-1">
            <h4 className="text-gray-900 dark:text-white font-semibold mb-1">Create Your Structure</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Go to the Structure tab and organize your course into units and lessons</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
          <div className="flex-1">
            <h4 className="text-gray-900 dark:text-white font-semibold mb-1">Select a Lesson</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Click on any lesson from your structure to start editing its content</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-pink-500 text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
          <div className="flex-1">
            <h4 className="text-gray-900 dark:text-white font-semibold mb-1">Add Content</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Fill in lesson details, add text, or upload media files</p>
          </div>
        </div>
      </div>
      
      <button
        onClick={() => setActiveStep(2)}
        className="flex items-center space-x-2 mx-auto bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-6 py-3 rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 transform hover:scale-105 font-medium"
      >
        <ArrowLeft size={20} />
        <span>Go to Structure Tab</span>
      </button>
    </div>
  </div>
</div>
)}
</div>
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

            <div className="bg-white/5 backdrop-blur-lg rounded-lg border-2 border-cyan-500/30 p-6">
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
            <div className="bg-white/5 backdrop-blur-lg rounded-lg border-2 border-cyan-500/30 p-6">
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

      // COMMENTED OUT - Quiz now part of lesson types (not a separate step)
      /*
      case 5:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold text-xl">Course Quizzes</h3>
                <p className="text-gray-400 text-sm mt-1">Create quizzes to test your students' knowledge</p>
              </div>
              <button
                onClick={() => {
                  setEditingQuizId(null);
                  setShowQuizEditor(true);
                }}
                className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200 hover:scale-105"
              >
                <Plus size={16} />
                <span>Create Quiz</span>
              </button>
            </div>

            {!editCourseId ? (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6 text-center">
                <p className="text-yellow-700 dark:text-yellow-300">Please save your course first before adding quizzes</p>
              </div>
            ) : loadingQuizzes ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
              </div>
            ) : quizzes.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-lg rounded-lg border-2 border-cyan-500/30 p-12 text-center">
                <BookOpen size={48} className="text-cyan-400 mx-auto mb-4" />
                <h4 className="text-white font-semibold text-lg mb-2">No Quizzes Yet</h4>
                <p className="text-gray-400 mb-6">Create your first quiz to assess student learning</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {quizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-6 hover:border-cyan-500/30 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-white font-semibold text-lg">{quiz.title}</h4>
                          {!quiz.isActive && (
                            <span className="px-2 py-1 text-xs rounded-full bg-gray-500/20 text-gray-400">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm mb-4">{quiz.description}</p>
                        <div className="flex items-center gap-6 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <FileText size={14} />
                            {quiz.questionCount || 0} questions
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {quiz.timeLimit || 'No'} min limit
                          </span>
                          <span className="flex items-center gap-1">
                            <Target size={14} />
                            {quiz.passingScore}% to pass
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingQuizId(quiz.id);
                            setShowQuizEditor(true);
                          }}
                          className="p-2 text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-all"
                          title="Edit quiz"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteQuiz(quiz.id)}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Delete quiz"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showQuizEditor && editCourseId && (
              <div
                className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4"
                onClick={() => {
                  setShowQuizEditor(false);
                  setEditingQuizId(null);
                }}
              >
                <div
                  className="bg-slate-900 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <QuizEditor
                    courseId={editCourseId}
                    quizId={editingQuizId || undefined}
                    onSave={handleQuizSaved}
                    onCancel={() => {
                      setShowQuizEditor(false);
                      setEditingQuizId(null);
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        );
      */

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative">
      {loggingOut && <LoaderOverlay message="Logging out..." />}
      {isLoadingCourse && <LoaderOverlay message="Loading course..." />}
      <header className={`bg-slate-900/80 backdrop-blur-lg border-b border-white/10 transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                type="button"
                className="flex items-center justify-center w-10 h-10 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 border border-gray-200 dark:border-white/15 transition-all"
                title="Back to Dashboard"
              >
                <ArrowLeft size={20} />
              </button>
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
                    onClick={() => {
                      // Only validate if moving forward
                      if (step.id > activeStep) {
                        if (validateStep(activeStep)) {
                          setActiveStep(step.id);
                        }
                      } else {
                        // Allow backward navigation without validation
                        setActiveStep(step.id);
                      }
                    }}
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
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className={`transition-all duration-1000 delay-400 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          {renderStepContent()}
        </div>

        <div className={`flex items-center justify-between mt-8 pt-6 border-t border-white/10 transition-all duration-1000 delay-600 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'} ${showLeaveModal ? 'pointer-events-none' : ''}`}>
          <button
            onClick={() => setActiveStep(Math.max(1, activeStep - 1))}
            disabled={activeStep === 1}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors duration-200 px-6 py-3 hover:bg-white/5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Previous</span>
          </button>

          <div className="flex space-x-3">
            {activeStep === 4 ? (
              <button
                onClick={createCourse}
                disabled={isPublishing}
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
              >
                {isPublishing ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{isEditMode ? 'Updating...' : 'Publishing...'}</span>
                  </>
                ) : (
                  <span>{isEditMode ? 'Update Course' : 'Publish Course'}</span>
                )}
              </button>
            ) : (
              <button
                onClick={() => {
                  if (validateStep(activeStep)) {
                    setActiveStep(Math.min(4, activeStep + 1));
                  }
                }}
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
