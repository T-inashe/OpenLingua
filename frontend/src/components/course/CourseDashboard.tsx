
import config from "../../config";


import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo, useRef } from "react";
import { Search, BookOpen, SendHorizonal, MessageSquare, Bell, Loader2, Star, Calendar, LogOut, Clock, Target } from "lucide-react";
import LoaderOverlay from "../ui/LoaderOverlay";
import ThemeToggle from "../layout/ThemeToggle";
import { useProAlert } from "../../context/ProAlertContext";
import { handleUnauthorized } from "../../utils/handleUnauthorized";
import { logoutRequest } from "../../utils/logout";
import { getCourseQuizzes } from "../../services/quizApi";
import type { Quiz } from "../../services/quizApi";

type Review = {
user: User;
review: string;
rating: number;
helpfulCount: number;
helpful: boolean;
userMarkedHelpFull: boolean,
createdAt : string
};
interface Word {
  title: string;
  content: string;
  type: string;
  duration?: string;
}
type CourseLesson = {
  id: string;
  title: string;
  content: string | null;
  type: string;
  duration: number | null;
  position: number;
};

interface CourseUnit {
  id: string;
  title: string;
  description?: string | null;
  position: number;
  lessons: CourseLesson[];
}
interface Course {
  id: string;
  title: string;
  createdAt: string;
  description: string;
  level: string;
  words?: Word[];
  units?: CourseUnit[];
  // Add other fields if needed (like avatar, googleId, etc.)
}
type Event = {
title: string;
description: string;
datetime: string;
attendingCount: number;
attending: boolean;
};
type QuizOption = {
  id: number;
  text: string;
};

type QuizQuestion = {
  id: number;
  prompt: string;
  options: QuizOption[];
  correctOptionId: number;
  explanation?: string;
};

type QuizLessonContent = {
  questions?: QuizQuestion[];
};
interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  // Add other fields if needed (like avatar, googleId, etc.)
}
type Forum = {
content: string;
author: User,
createdAt : string
};

export default function CourseDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [forums, setForums] = useState<Forum[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  const [input, setInput] = useState("");
  const proAlert = useProAlert();
  const [translation, setTranslation] = useState("");
  // const [forum, setForum] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("en");


const [reviews, setReviews] = useState<Review[]>([
]);
const [completedLessons, setCompletedLessons] = useState<Record<string, boolean>>({});
const [quizResponses, setQuizResponses] = useState<Record<string, Record<string, {
  selectedOptionId: number;
  isCorrect: boolean;
}>>>({});
const progressLoadedRef = useRef(false); // Track if we've loaded progress from storage
const [isSavingProgress, setIsSavingProgress] = useState(false); // Track saving state

  // Quiz state
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);

const resolveLessonContent = (content: string | null): string | null => {
  if (!content) return null;
  return content.startsWith('http') ? content : `${config.BACKEND_URL}${content}`;
};

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000); // in seconds

  const units = [
    { name: "year", seconds: 31536000 },
    { name: "month", seconds: 2592000 },
    { name: "week", seconds: 604800 },
    { name: "day", seconds: 86400 },
    { name: "hour", seconds: 3600 },
    { name: "minute", seconds: 60 },
    { name: "second", seconds: 1 },
  ];

  for (const unit of units) {
    const value = Math.floor(diff / unit.seconds);
    if (value > 0) {
      return `${value} ${unit.name}${value > 1 ? "s" : ""} ago`;
    }
  }

  return "just now";
}
const [newReview, setNewReview] = useState({ name: "", text: "", rating: 5 });
  // const [reviewText, setReviewText] = useState("");
  // const [reviewName, setReviewName] = useState("");
  // const [reviewRating, setReviewRating] = useState(5);
const [sidebarOpen, setSidebarOpen] = useState(false);
const [events, setEvents] = useState<Event[]>([
{ title: "Zulu Live Q&A", description: "Ask your questions live.", datetime: "2025-09-05 18:00", attendingCount: 10, attending: false },
{ title: "Cultural Workshop", description: "Learn about traditions.", datetime: "2025-09-10 17:00", attendingCount: 5, attending: false }
]);
  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
  }, []);
const getCourses = async () => {
  // Fetch all course data in a single optimized call
  try {
    const res = await fetch(`${config.BACKEND_URL}/api/courses/${id}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
    });

    if (handleUnauthorized(res, navigate, proAlert)) {
      return;
    }

    if (!res.ok) {
      throw new Error("Failed to fetch course");
    }

    const data = await res.json();
    
    // Set all data from single response
    setCourse(data.course);
    setForums(data.forums || []);
    setReviews(data.reviews || []);
    setCurrentUser(data.user);
 
  } catch (error) {
    console.error("Error loading course:", error);
    proAlert.error("Something went wrong while loading the course.");
  }
};

// Refresh just the forum posts
const refreshForums = async () => {
  try {
    const res = await fetch(`${config.BACKEND_URL}/api/forum/${id}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
    });

    if (res.ok) {
      const data = await res.json();
      setForums(data.posts || []);
    }
  } catch (error) {
    console.error("Error refreshing forums:", error);
  }
};

// Refresh just the reviews
const refreshReviews = async () => {
  try {
    const res = await fetch(`${config.BACKEND_URL}/api/courses/reviews/${id}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
    });

    if (res.ok) {
      const data = await res.json();
      setReviews(data.reviews || []);
    }
  } catch (error) {
    console.error("Error refreshing reviews:", error);
  }
};

// Load quizzes
const loadQuizzes = async () => {
  if (!id) return;
  
  try {
    setLoadingQuizzes(true);
    const data = await getCourseQuizzes(id);
    setQuizzes(data.filter(q => q.isActive)); // Only show active quizzes to students
  } catch (error: any) {
    console.error("Error loading quizzes:", error);
  } finally {
    setLoadingQuizzes(false);
  }
};

useEffect(() => {
  const load = async () => {
    try {
      setPageLoading(true);
      // Single optimized API call instead of 4 separate calls
      await getCourses();
      await loadQuizzes();
    } finally {
      setPageLoading(false);
    }
  };

  load();
}, [id]);

const unitsToRender = course
  ? course.units && course.units.length > 0
    ? course.units
    : course.words
    ? [
        {
          id: "legacy",
          title: "Course Content",
          description: "",
          position: 0,
          lessons: course.words.map((word, index) => ({
            id: `${word.title}-${index}`,
            title: word.title,
            content: word.content,
            type: (word.type || "text").toLowerCase(),
            duration: word.duration ? Number(word.duration) || null : null,
            position: index
          }))
        }
      ]
    : []
  : [];

const lessonIds = useMemo(() => {
  return unitsToRender.flatMap((unit) => unit.lessons.map((lesson) => lesson.id));
}, [unitsToRender]);

const storageKey = useMemo(() => {
  if (!currentUser || !course) return null;
  return `course-progress-${currentUser.id}-${course.id}`;
}, [currentUser, course]);

const calculateProgress = (state: Record<string, boolean>) => {
  if (lessonIds.length === 0) return 0;
  const completedCount = lessonIds.filter((id) => state[id]).length;
  return Math.round((completedCount / lessonIds.length) * 100);
};

const updateProgressOnServer = async (progressValue: number): Promise<boolean> => {
  if (!id || !currentUser) {
    console.warn('⚠️ Skipping server update: Course not fully loaded yet');
    return false; // Return false to indicate no update happened
  }
  
  try {
    const response = await fetch(`${config.BACKEND_URL}/api/courses/${id}/progress`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ progress: progressValue }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update progress');
    }

    const data = await response.json();
    console.log('✅ Server response:', data);
    return true; // Return true to indicate success
  } catch (error) {
    console.error('❌ Failed to update course progress:', error);
    proAlert.error('Failed to save progress to server. Your progress is saved locally.');
    return false; // Return false to indicate failure
  }
};

useEffect(() => {
  // Only load progress when we have lesson IDs and storage key
  if (!storageKey || lessonIds.length === 0) {
    return;
  }

  // Prevent loading multiple times
  if (progressLoadedRef.current) {
    return;
  }

  console.log('📚 Loading progress from localStorage:', storageKey);
  const stored = localStorage.getItem(storageKey);
  
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as Record<string, boolean>;
      const filtered: Record<string, boolean> = {};
      lessonIds.forEach((lessonId) => {
        if (parsed[lessonId]) {
          filtered[lessonId] = true;
        }
      });
      
      console.log('✅ Loaded progress:', Object.keys(filtered).length, 'lessons completed');
      setCompletedLessons(filtered);
      
      const initialProgress = calculateProgress(filtered);
      console.log('📊 Initial progress:', initialProgress + '%');
      
      // Try to sync with server, but don't block on failure
      updateProgressOnServer(initialProgress).then(success => {
        if (success) {
          console.log('✅ Initial sync with server successful');
        } else {
          console.log('ℹ️ Initial sync skipped (will retry when course fully loads)');
        }
      });
      
      progressLoadedRef.current = true; // Mark as loaded
    } catch (error) {
      console.error('❌ Failed to parse stored progress', error);
      setCompletedLessons({});
      progressLoadedRef.current = true;
    }
  } else {
    // No stored progress, initialize with empty
    console.log('ℹ️ No stored progress found, starting fresh');
    setCompletedLessons({});
    
    // Try to sync 0% with server
    updateProgressOnServer(0).then(success => {
      if (success) {
        console.log('✅ Initialized progress on server');
      }
    });
    
    progressLoadedRef.current = true;
  }
}, [storageKey, lessonIds.length]); // Only re-run when storage key changes or lesson count changes

const renderLessonContent = (lesson: CourseLesson) => {
  const normalizedType = (lesson.type || "text").toLowerCase();

  if (normalizedType === "quiz") {
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
      setQuizResponses((prev) => ({
        ...prev,
        [lessonKey]: {
          ...(prev[lessonKey] ?? {}),
          [String(question.id)]: {
            selectedOptionId: optionId,
            isCorrect: isCorrectSelection,
          },
        },
      }));
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
                    <p className="text-base font-semibold text-white">{question.prompt}</p>
                    <p className="text-xs uppercase tracking-wide text-white/50">Choose one answer</p>
                  </div>

                  <div className="space-y-3">
                    {question.options.map((option, optionIndex) => {
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
                    })}
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

  const resolvedContent = resolveLessonContent(lesson.content);

  if (!resolvedContent) {
    return <p className="text-gray-400 text-sm italic">No content provided.</p>;
  }

  if (normalizedType === "audio") {
    return (
      <audio controls className="w-full mt-3">
        <source src={resolvedContent} />
        Your browser does not support the audio element.
      </audio>
    );
  }

  if (normalizedType === "video") {
    return (
      <div className="mt-3">
        <video
          controls
          controlsList="nodownload"
          className="w-full rounded-lg shadow-lg"
          style={{ maxWidth: '960px', maxHeight: '540px', aspectRatio: '16 / 9' }}
        >
          <source src={resolvedContent} />
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  if (normalizedType === "image") {
    return (
      <img
        src={resolvedContent}
        alt={lesson.title}
        className="w-full rounded-lg mt-3 object-cover"
      />
    );
  }

  return <p className="text-gray-300 mt-2 leading-relaxed">{resolvedContent}</p>;
};
  const translate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setTranslation("");

  try {
    const res = await fetch(`${config.BACKEND_URL}/api/courses/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: input,
        source: sourceLang,
        target: targetLang,
      })
    });

    if (handleUnauthorized(res, navigate, proAlert)) {
      return;
    }

      const data = await res.json();
      setTranslation(data.translatedText);
    } catch (err) {
      console.error("Translation error:", err);
      setTranslation("Error fetching translation");
    } finally {
      setLoading(false);
    }
  };

 const createForum = async () => {
   if (!currentUser) {
     proAlert.info("Please sign in before posting to the forum.");
     return;
   }
   // Basic validation
 
   // Transform your state into the format expected by your backend
   const payload = {
     content: message,
     userId: currentUser.id,
 
   };
  
 
   try {
    const response = await fetch(`${config.BACKEND_URL}/api/forum/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify(payload)
    });

    if (handleUnauthorized(response, navigate, proAlert)) {
      return;
    }

    if (response.ok) {
      proAlert.success("Forum post created successfully!");
      refreshForums();
    } else {
      const errorData = await response.json();
      console.error("Failed to create forum:", errorData);
      proAlert.error("Failed to create forum.");
    }
  } catch (error) {
    console.error("Error creating forum:", error);
    proAlert.error("Something went wrong while creating the forum.");
  }
};

 const createReview = async () => {
   if (!currentUser) {
     proAlert.info("Please sign in before posting a review.");
     return;
   }
   // Basic validation
 
   // Transform your state into the format expected by your backend
   const payload = {
    courseId:id,
     review: newReview.text,
     rating: newReview.rating,
     userId: currentUser.id,
 
   };
  
 
   try {
    const response = await fetch(`${config.BACKEND_URL}/api/courses/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify(payload)
    });

    if (handleUnauthorized(response, navigate, proAlert)) {
      return;
    }

    if (response.ok) {
      proAlert.success("Review submitted successfully!");
      refreshReviews();
    } else {
      const errorData = await response.json();
      console.error("Failed to create forum:", errorData);
      proAlert.error("Failed to create review.");
    }
  } catch (error) {
    console.error("Error creating forum:", error);
    proAlert.error("Something went wrong while submitting the review.");
  }
};

  // const markAsDone = (index: number) => {
  //   setLessons(prev => prev.map((lesson, i) => i === index ? { ...lesson, done: true } : lesson));
  // };



  
  const toggleAttend = (index: number) => {
setEvents(prev => prev.map((e, i) => {
if (i === index) {
const newAttending = !e.attending;
return {
...e,
attending: newAttending,
attendingCount: e.attendingCount + (newAttending ? 1 : -1)
};
}
return e;
}));
};
const toggleLessonDone = async (lessonId: string) => {
  // Prevent multiple clicks while saving
  if (isSavingProgress) {
    console.log('⏳ Already saving progress, please wait...');
    return;
  }

  setIsSavingProgress(true);
  
  try {
    // Calculate new state immediately
    const newState = {
      ...completedLessons,
      [lessonId]: !completedLessons[lessonId]
    };
    
    // Update state immediately
    setCompletedLessons(newState);
    
    // Save to localStorage immediately (synchronous)
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(newState));
        console.log('✅ Saved to localStorage:', storageKey);
      } catch (error) {
        console.error('❌ Failed to save to localStorage:', error);
        proAlert.error('Failed to save locally');
      }
    }
    
    // Calculate and update progress on server
    const newProgress = calculateProgress(newState);
    console.log('📊 Updating progress to:', newProgress + '%');
    
    const serverSaved = await updateProgressOnServer(newProgress);
    
    if (serverSaved) {
      console.log('✅ Progress saved to server');
      proAlert.success('Progress saved!');
    } else {
      console.log('ℹ️ Progress saved locally only (will sync when course loads)');
      proAlert.info('Progress saved locally');
    }
  } catch (error) {
    console.error('❌ Failed to update progress:', error);
    proAlert.error('Failed to save progress');
  } finally {
    setIsSavingProgress(false);
  }
};

  const handleLogout = async () => {
    setPageLoading(true);
    const success = await logoutRequest();
    setPageLoading(false);

    if (success) {
      navigate('/signIn');
    } else {
      proAlert.error('Unable to log out. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 relative overflow-hidden">
      {pageLoading && <LoaderOverlay message="Loading course..." />}
      {/* Header */}
      <header className={`sticky top-0 z-50 bg-slate-900/60 backdrop-blur-lg border-b border-white/10 transition-all duration-1000 ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}`}>
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <button
            className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
            type="button"
            onClick={() => navigate('/dashboard')}
          >
            OpenLingua
          </button>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-400 hover:text-white transition-colors duration-200">
              <Calendar size={20} />
            </button>
            <button className="relative p-2 text-gray-400 hover:text-white transition-colors duration-200">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-500 rounded-full"></span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white bg-white/10 border border-white/15 hover:bg-white/15 transition-all"
            >
              <LogOut size={16} />
              Log out
            </button>
          </div>
        </div>
      </header>


<div className="p-6">
<h1 className={`text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-8 transition-all duration-1000 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
Welcome To {course?.title}
</h1>

{/* Course Progress Indicator */}
<div className={`bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 mb-8 transition-all duration-1000 delay-100 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
  <div className="flex items-center justify-between mb-3">
    <h2 className="text-white font-semibold text-lg">Your Progress</h2>
    <span className="text-cyan-300 font-bold text-xl">{calculateProgress(completedLessons)}%</span>
  </div>
  <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
    <div
      className="bg-gradient-to-r from-cyan-500 to-purple-500 h-full rounded-full transition-all duration-500 ease-out"
      style={{ width: `${calculateProgress(completedLessons)}%` }}
    />
  </div>
  <div className="flex items-center justify-between mt-2 text-sm text-gray-400">
    <span>{lessonIds.filter(id => completedLessons[id]).length} of {lessonIds.length} lessons completed</span>
    {calculateProgress(completedLessons) === 100 && (
      <span className="text-green-400 font-semibold flex items-center gap-1">
        <Star size={16} className="fill-green-400" />
        Course Complete!
      </span>
    )}
  </div>
</div>


{/* Translator */}
<section className={`bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 mb-8 transition-all duration-1000 delay-200 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
<h2 className="text-white font-semibold text-xl mb-4 flex items-center gap-2">
<Search size={20} className="text-cyan-400" /> Language Translator
</h2>
<div className="flex flex-col gap-3 md:flex-row md:items-center">
<input type="text" value={input} placeholder="Enter text to translate" onChange={(e) => setInput(e.target.value)} className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none" />
<div className="flex gap-2">
<select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)} className="bg-white/5 text-white border border-white/10 rounded-lg px-2 py-2">
<option value="auto">Auto</option>
<option value="en">English</option>
<option value="zu">Zulu</option>
<option value="es">Spanish</option>
<option value="fr">French</option>
</select>
<select value={targetLang} onChange={(e) => setTargetLang(e.target.value)} className="bg-white/5 text-white border border-white/10 rounded-lg px-2 py-2">
<option value="en">English</option>
<option value="zu">Zulu</option>
<option value="es">Spanish</option>
<option value="fr">French</option>
</select>
</div>
<button onClick={translate} disabled={loading} className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-4 py-2 rounded-lg flex items-center gap-2">
{loading ? <Loader2 size={18} className="animate-spin" /> : "Translate"}
</button>
</div>
{translation && !loading && <p className="mt-4 text-cyan-300 font-medium">{translation}</p>}
</section>


{/* Lessons */}
<section className={`bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 mb-8 transition-all duration-1000 delay-400 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
<h2 className="text-white font-semibold text-xl mb-4 flex items-center gap-2">
<BookOpen size={20} className="text-purple-400" /> Lessons
</h2>
{unitsToRender.length === 0 ? (
  <p className="text-gray-400 text-sm">No lessons available yet.</p>
) : (
  <div className="space-y-4">
    {unitsToRender.map((unit) => (
      <div key={unit.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-white font-semibold text-lg">{unit.title}</h3>
            {unit.description && (
              <p className="text-gray-400 text-sm mt-1">{unit.description}</p>
            )}
          </div>
          <span className="text-xs text-white/40 uppercase tracking-wide">Unit {unit.position + 1}</span>
        </div>

        <ul className="mt-4 space-y-3">
          {unit.lessons.map((lesson) => {
            const normalizedType = (lesson.type || "text").toLowerCase();
            const isCompleted = !!completedLessons[lesson.id];

            return (
              <li
                key={lesson.id}
                className="bg-black/30 border border-white/10 rounded-lg p-4 text-white"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-base md:text-lg">{lesson.title}</h4>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-white/60 mt-1">
                      <span className="px-2 py-0.5 rounded-full bg-white/10 uppercase tracking-wide">
                        {normalizedType}
                      </span>
                      {lesson.duration ? (
                        <span>{lesson.duration} min</span>
                      ) : null}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleLessonDone(lesson.id)}
                    disabled={isSavingProgress}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-200 flex items-center gap-1 ${
                      isCompleted ? "bg-green-600/80" : "bg-cyan-600/80"
                    } ${isSavingProgress ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {isSavingProgress ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>{isCompleted ? "Completed" : "Mark as Done"}</>
                    )}
                  </button>
                </div>

                {renderLessonContent(lesson)}
              </li>
            );
          })}
        </ul>
      </div>
    ))}
  </div>
)}
</section>


{/* Forum */}
<section className={`bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 mb-8 transition-all duration-1000 delay-600 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
<h2 className="text-white font-semibold text-xl mb-4 flex items-center gap-2">
<MessageSquare size={20} className="text-green-400" /> Forum Discussion
</h2>
<textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write your message..." className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400" />
<button onClick={createForum} className="mt-3 flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-4 py-2 rounded-lg">
<SendHorizonal size={16} /> Post
</button>
<div className="mt-6 space-y-3">

{forums.length === 0 && <p className="text-gray-400 text-sm">No messages yet. Start the conversation!</p>}

{forums.map((msg, i) => (
  <div key={i} className="flex items-start gap-4 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 p-4 rounded-lg border border-white/10 text-white">
    {/* Avatar */}
    <img
      src={msg.author.avatar}
      alt={msg.author.name}
      className="w-10 h-10 rounded-full object-cover"
    />

    {/* Message Content */}
    <div className="flex-1">
      {/* Header with name and time */}
      <div className="flex justify-between items-center mb-1">
        <span className="font-semibold">{msg.author.name}</span>
        <span className="text-sm text-white/50">
          {getRelativeTime(msg.createdAt)}
        </span>
      </div>

      {/* Message Body */}
      <p className="text-white">{msg.content}</p>
    </div>
  </div>
))}
</div>
</section>


{/* Quizzes Section */}
<section className={`bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 transition-all duration-1000 delay-700 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
  <h2 className="text-white font-semibold text-xl mb-4 flex items-center gap-2">
    <BookOpen size={24} className="text-cyan-400" />
    Course Quizzes
  </h2>
  
  {loadingQuizzes ? (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="animate-spin text-cyan-400" size={32} />
    </div>
  ) : quizzes.length === 0 ? (
    <div className="text-center py-8 text-gray-400">
      <BookOpen size={48} className="mx-auto mb-3 opacity-50" />
      <p>No quizzes available yet</p>
    </div>
  ) : (
    <div className="grid gap-4">
      {quizzes.map((quiz) => (
        <div
          key={quiz.id}
          className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-cyan-500/30 transition-all duration-200"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-white font-semibold text-lg mb-1">{quiz.title}</h3>
              <p className="text-gray-400 text-sm">{quiz.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
            <span className="flex items-center gap-1">
              <BookOpen size={14} />
              {quiz.questionCount || 0} questions
            </span>
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {quiz.timeLimit ? `${quiz.timeLimit} min` : 'No limit'}
            </span>
            <span className="flex items-center gap-1">
              <Target size={14} />
              {quiz.passingScore}% to pass
            </span>
          </div>
          
          <button
            onClick={() => navigate(`/courses/${id}/quiz/${quiz.id}/take`)}
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2"
          >
            <BookOpen size={18} />
            Take Quiz
          </button>
        </div>
      ))}
    </div>
  )}
</section>


{/* Reviews */}
<section className={`bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 transition-all duration-1000 delay-800 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
<h2 className="text-white font-semibold text-xl mb-4">Reviews & Ratings</h2>
<div className="space-y-4">
{reviews.map((r, i) => (
<div key={i} className="bg-white/5 p-4 rounded-lg border border-white/10">
<div className="flex items-start gap-4 p-4 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-lg">
  {/* Avatar */}
  <img
    src={r.user.avatar}
    alt={r.user.name}
    className="w-10 h-10 rounded-full object-cover"
  />

  {/* Content */}
  <div className="flex-1">
    {/* Header with name and time */}
    <div className="flex justify-between items-center mb-1">
      <span className="font-semibold text-white">{r.user.name}</span>
      <span className="text-sm text-white/50">
        {/* Replace with formatted date if available */}
        {getRelativeTime(r.createdAt)}
      </span>
    </div>

    {/* Star Rating */}
    <div className="flex text-yellow-400 mb-1">
      {[...Array(r.rating)].map((_, idx) => (
        <Star key={idx} size={16} fill="currentColor" />
      ))}
    </div>

    {/* Optional: Message or comment body */}
    <p className="text-white text-sm">{r.review}</p>
  </div>
</div>


</div>
))}
</div>
<div className="mt-6">
<textarea rows={3} value={newReview.text} placeholder="Write your review..." onChange={(e) => setNewReview({ ...newReview, text: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white mb-2" />
<select value={newReview.rating} onChange={(e) => setNewReview({ ...newReview, rating: Number(e.target.value) })} className="bg-white/5 text-white border border-white/10 rounded-lg px-2 py-2 mb-2">
{[1, 2, 3, 4, 5].map(r => <option key={r} value={r}>{r} Stars</option>)}
</select>
<button onClick={createReview} className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-4 py-2 rounded-lg">Submit Review</button>
</div>
</section>
</div>


{/* Sidebar */}
<div className={`fixed top-0 right-0 h-full w-80 bg-slate-900/95 backdrop-blur-lg border-l border-white/10 p-6 transform transition-transform duration-500 z-50 ${sidebarOpen ? "translate-x-0" : "translate-x-full"}`}>
<button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-white mb-6">Close ✕</button>
<h2 className="text-white font-semibold text-xl mb-4">Upcoming Events</h2>
<div className="space-y-4">
{events.map((e, i) => (
<div key={i} className="bg-white/5 p-4 rounded-lg border border-white/10">
<strong className="text-white">{e.title}</strong>
<p className="text-gray-300 text-sm">{e.description}</p>
<p className="text-gray-400 text-xs mt-1">{e.datetime}</p>
<p className="text-gray-300 mt-1">Attending: {e.attendingCount}</p>
<button onClick={() => toggleAttend(i)} className={`mt-2 w-full px-3 py-1 rounded-lg text-sm ${e.attending ? "bg-green-600" : "bg-cyan-600"} text-white`}>
{e.attending ? "Attending ✅" : "I'm Attending"}
</button>
</div>
))}
</div>
</div>
</div>
);
}
