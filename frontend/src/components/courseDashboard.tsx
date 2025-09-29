
import config from "../config";


import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { Search, BookOpen, SendHorizonal, MessageSquare, Bell, Loader2, Star, Calendar, LogOut } from "lucide-react";
import LoaderOverlay from "./Loader";
import ThemeToggle from "./ThemeToggle";
import { useProAlert } from "../context/ProAlertContext";
import { handleUnauthorized } from "../utils/handleUnauthorized";
import { logoutRequest } from "../utils/logout";

type Review = {
user: User;
review: string;
rating: number;
helpfulCount: number;
helpful: boolean;
userMarkedHelpful: boolean;
createdAt: string;
id: string;
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
id: string;
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
  const [message, setMessage] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [forumSubmitting, setForumSubmitting] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("en");


const [reviews, setReviews] = useState<Review[]>([
]);
const [completedLessons, setCompletedLessons] = useState<Record<string, boolean>>({});
const [quizResponses, setQuizResponses] = useState<Record<string, Record<string, {
  selectedOptionId: number;
  isCorrect: boolean;
}>>>({});

const resolveLessonContent = (content: string | null): string | null => {
  if (!content) return null;
  return content.startsWith('http') ? content : `${config.BACKEND_URL}${content}`;
};

const fetchCurrentUser = async () => {
  try {
    const res = await fetch(`${config.BACKEND_URL}/api/auth/me/`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include"
    });

    if (handleUnauthorized(res, navigate, proAlert)) {
      return;
    }

    if (!res.ok) {
      throw new Error("Failed to fetch current user");
    }

    const data = await res.json();
    setCurrentUser(data.user);
  } catch (error) {
    console.error("Error fetching current user:", error);
  }
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
const [sidebarOpen, setSidebarOpen] = useState(false);
const [events, setEvents] = useState<Event[]>([
{ 
  id: '1',
  title: "Zulu Live Q&A", 
  description: "Ask your questions live with native speakers.", 
  datetime: "2025-09-25T18:00:00", 
  attendingCount: 10, 
  attending: false,
  capacity: 50,
  location: "Online",
  type: 'qa'
},
{ 
  id: '2',
  title: "Cultural Workshop", 
  description: "Explore Zulu traditions and customs.", 
  datetime: "2025-09-28T17:00:00", 
  attendingCount: 5, 
  attending: false,
  capacity: 25,
  location: "Virtual Room B",
  type: 'cultural'
}
]);
  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
  }, []);
const getCourses = async () => {
  // Basic validation


  // Transform your state into the format expected by your backend
 
 

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
   //console.log(JSON.stringify(data.course))

  setCourse(data.course);  // Use the courses array
 
  } catch (error) {
    console.error("Error creating course:", error);
    proAlert.error("Something went wrong while loading the course.");
  }
};
const getForum = async () => {
  // Basic validation

  // Transform your state into the format expected by your backend

  try {
    const res = await fetch(`${config.BACKEND_URL}/api/forum/${id}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
    });

    if (handleUnauthorized(res, navigate, proAlert)) {
      return;
    }

      if (!res.ok) {
        throw new Error("Failed to fetch forum");
      }

    const data = await res.json();

  setForums(data.posts);  // Use the courses array
 
  } catch (error) {
    console.error("Error creating course:", error);
    proAlert.error("Something went wrong while loading the forum posts.");
  }
};

const getReview = async () => {
  // Basic validation

  // Transform your state into the format expected by your backend

  try {
    const res = await fetch(`${config.BACKEND_URL}/api/courses/reviews/${id}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
    });

    if (handleUnauthorized(res, navigate, proAlert)) {
      return;
    }

      if (!res.ok) {
        throw new Error("Failed to fetch reviews");
      }

    const data = await res.json();

  setReviews(data.reviews);  // Use the courses array
 
  } catch (error) {
    console.error("Error creating course:", error);
    proAlert.error("Something went wrong while loading the course reviews.");
  }
};

useEffect(() => {
  const load = async () => {
    try {
      setPageLoading(true);
      await Promise.all([
        fetchCurrentUser(),
        getCourses(),
        getForum(),
        getReview()
      ]);
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

const updateProgressOnServer = async (progressValue: number) => {
  if (!id || !currentUser) return;
  try {
    await fetch(`${config.BACKEND_URL}/api/courses/${id}/progress`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ progress: progressValue }),
    });
  } catch (error) {
    console.error('Failed to update course progress', error);
  }
};

useEffect(() => {
  if (!storageKey) {
    setCompletedLessons({});
    return;
  }

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
      setCompletedLessons(filtered);
      const initialProgress = calculateProgress(filtered);
      updateProgressOnServer(initialProgress);
    } catch (error) {
      console.error('Failed to parse stored progress', error);
      setCompletedLessons({});
      updateProgressOnServer(0);
    }
  } else {
    setCompletedLessons({});
    updateProgressOnServer(0);
  }
}, [storageKey, lessonIds]);

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
      getForum()
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
      getReview()
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
const toggleLessonDone = (lessonId: string) => {
setCompletedLessons(prev => ({
  ...prev,
  [lessonId]: !prev[lessonId]
}));
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

{/* Main Loading State */}
{dataLoading ? (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="text-center">
      <Loader2 size={48} className="animate-spin text-cyan-400 mx-auto mb-4" />
      <p className="text-white/70">Loading course content...</p>
    </div>
  </div>
) : (
<div className="p-6">
<h1 className={`text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-8 transition-all duration-1000 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
Welcome To {course?.title}
</h1>


{/* Translator */}
<section className={`bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 mb-8 transition-all duration-1000 delay-200 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`} role="region" aria-labelledby="translator-heading">
<h2 id="translator-heading" className="text-white font-semibold text-xl mb-4 flex items-center gap-2">
<Search size={20} className="text-cyan-400" aria-hidden="true" /> Language Translator
</h2>
<form onSubmit={(e) => { e.preventDefault(); translate(); }} className="space-y-4">
<div className="flex flex-col gap-3 md:flex-row md:items-center">
<div className="flex-1 relative">
<input 
  type="text" 
  value={input} 
  placeholder="Enter text to translate" 
  onChange={(e) => setInput(e.target.value)} 
  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-200"
  aria-label="Text to translate"
  aria-describedby={!isFormValid.translation ? "translation-error" : undefined}
/>
{!isFormValid.translation && input.length > 0 && (
  <p id="translation-error" className="text-red-400 text-sm mt-1" role="alert">
    Please enter text to translate
  </p>
)}
</div>
<div className="flex gap-2 flex-wrap">
<div className="flex flex-col">
<label htmlFor="source-lang" className="text-white text-sm mb-1">From:</label>
<select 
  id="source-lang"
  value={sourceLang} 
  onChange={(e) => setSourceLang(e.target.value)} 
  className="bg-white/5 text-white border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-400 min-w-[100px]"
  aria-label="Source language"
>
<option value="auto">Auto</option>
<option value="en">English</option>
<option value="zu">Zulu</option>
<option value="es">Spanish</option>
<option value="fr">French</option>
</select>
</div>
<div className="flex flex-col">
<label htmlFor="target-lang" className="text-white text-sm mb-1">To:</label>
<select 
  id="target-lang"
  value={targetLang} 
  onChange={(e) => setTargetLang(e.target.value)} 
  className="bg-white/5 text-white border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-400 min-w-[100px]"
  aria-label="Target language"
>
<option value="en">English</option>
<option value="zu">Zulu</option>
<option value="es">Spanish</option>
<option value="fr">French</option>
</select>
</div>
</div>
<button 
  type="submit"
  disabled={loading || !isFormValid.translation} 
  className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-6 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:from-cyan-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all duration-200 min-w-[120px]"
  aria-label="Translate text"
>
{loading ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : "Translate"}
</button>
</div>
</form>
{translation && !loading && (
  <div className="mt-4 p-4 bg-white/5 rounded-lg border border-cyan-500/30" role="region" aria-live="polite">
    <h3 className="text-cyan-300 font-medium text-sm mb-2">Translation:</h3>
    <p className="text-cyan-300 font-medium">{translation}</p>
  </div>
)}
</section>


{/* Lessons */}
<section className={`bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 mb-8 transition-all duration-1000 delay-400 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`} role="region" aria-labelledby="lessons-heading">
<div className="flex justify-between items-center mb-6">
<h2 id="lessons-heading" className="text-white font-semibold text-xl flex items-center gap-2">
<BookOpen size={20} className="text-purple-400" aria-hidden="true" /> Course Lessons
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-200 ${
                      isCompleted ? "bg-green-600/80" : "bg-cyan-600/80"
                    }`}
                  >
                    {isCompleted ? "Completed" : "Mark as Done"}
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
<section className={`bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 mb-8 transition-all duration-1000 delay-600 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`} role="region" aria-labelledby="forum-heading">
<h2 id="forum-heading" className="text-white font-semibold text-xl mb-4 flex items-center gap-2">
<MessageSquare size={20} className="text-green-400" aria-hidden="true" /> Forum Discussion
</h2>
<form onSubmit={(e) => { e.preventDefault(); createForum(); }} className="mb-6">
<div className="relative">
<label htmlFor="forum-message" className="sr-only">Write your forum message</label>
<textarea 
  id="forum-message"
  rows={4} 
  value={message} 
  onChange={(e) => setMessage(e.target.value)} 
  placeholder="Write your message..." 
  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all duration-200 resize-vertical min-h-[100px]"
  aria-describedby={!isFormValid.forum && message.length > 0 ? "forum-error" : "forum-help"}
  maxLength={500}
/>
{!isFormValid.forum && message.length > 0 && (
  <p id="forum-error" className="text-red-400 text-sm mt-1" role="alert">
    Message cannot be empty
  </p>
)}
<p id="forum-help" className="text-gray-400 text-sm mt-1">
  {message.length}/500 characters
</p>
</div>
<button 
  type="submit"
  disabled={forumSubmitting || !isFormValid.forum} 
  className="mt-3 flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-400 transition-all duration-200 min-w-[120px]"
  aria-label="Post message to forum"
>
{forumSubmitting ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <SendHorizonal size={16} aria-hidden="true" />} 
{forumSubmitting ? "Posting..." : "Post"}
</button>
</form>
<div className="space-y-4" role="feed" aria-label="Forum messages" aria-live="polite">

{forums.length === 0 && !dataLoading && (
  <div className="text-center py-8 bg-white/5 rounded-lg">
    <MessageSquare size={48} className="text-gray-600 mx-auto mb-4" aria-hidden="true" />
    <p className="text-gray-400 text-lg">No messages yet.</p>
    <p className="text-gray-500 text-sm mt-1">Start the conversation!</p>
  </div>
)}

{forums.map((msg, i) => (
  <article key={i} className="flex items-start gap-4 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 p-4 rounded-lg border border-white/10 text-white hover:from-purple-500/15 hover:to-cyan-500/15 transition-all duration-200" role="article">
    {/* Avatar */}
    <img
      src={msg.author.avatar}
      alt={`${msg.author.name}'s avatar`}
      className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10"
      loading="lazy"
    />

    {/* Message Content */}
    <div className="flex-1 min-w-0">
      {/* Header with name and time */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold truncate">{msg.author.name}</h3>
        <time className="text-sm text-white/50 flex-shrink-0 ml-2" dateTime={msg.createdAt}>
          {getRelativeTime(msg.createdAt)}
        </time>
      </div>

      {/* Message Body */}
      <p className="text-white break-words">{msg.content}</p>
    </div>
  </article>
))}
</div>
</section>


{/* Reviews */}
<section className={`bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 transition-all duration-1000 delay-800 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`} role="region" aria-labelledby="reviews-heading">
<h2 id="reviews-heading" className="text-white font-semibold text-xl mb-6">Reviews & Ratings</h2>
<div className="space-y-4 mb-8" role="feed" aria-label="Course reviews">
{reviews.length === 0 && !dataLoading ? (
  <div className="text-center py-8 bg-white/5 rounded-lg">
    <Star size={48} className="text-gray-600 mx-auto mb-4" aria-hidden="true" />
    <p className="text-gray-400 text-lg">No reviews yet.</p>
    <p className="text-gray-500 text-sm mt-1">Be the first to review this course!</p>
  </div>
) : (
reviews.map((r, i) => (
<article key={i} className="bg-white/5 p-4 rounded-lg border border-white/10 hover:bg-white/10 transition-colors duration-200" role="article">
<div className="flex items-start gap-4 p-4 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-lg">
  {/* Avatar */}
  <img
    src={r.user.avatar}
    alt={`${r.user.name}'s avatar`}
    className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10"
    loading="lazy"
  />

  {/* Content */}
  <div className="flex-1 min-w-0">
    {/* Header with name and time */}
    <div className="flex justify-between items-center mb-2">
      <h3 className="font-semibold text-white truncate">{r.user.name}</h3>
      <time className="text-sm text-white/50 flex-shrink-0 ml-2" dateTime={r.createdAt}>
        {getRelativeTime(r.createdAt)}
      </time>
    </div>

    {/* Star Rating */}
    <div className="flex text-yellow-400 mb-2" role="img" aria-label={`${r.rating} out of 5 stars`}>
      {[...Array(5)].map((_, idx) => (
        <Star 
          key={idx} 
          size={16} 
          fill={idx < r.rating ? "currentColor" : "none"} 
          className={idx < r.rating ? "text-yellow-400" : "text-gray-600"}
          aria-hidden="true"
        />
      ))}
      <span className="sr-only">{r.rating} out of 5 stars</span>
    </div>

    {/* Review content */}
    <p className="text-white break-words mb-3">{r.review}</p>
    
    {/* Helpful voting */}
    <div className="flex items-center justify-between">
      <button
        onClick={() => toggleReviewHelpful(r.id)}
        className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 ${
          r.userMarkedHelpful 
            ? "bg-green-600/20 text-green-400 hover:bg-green-600/30 focus:ring-green-500" 
            : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white focus:ring-gray-500"
        }`}
        aria-pressed={r.userMarkedHelpful}
        aria-label={`Mark review as ${r.userMarkedHelpful ? 'not ' : ''}helpful`}
      >
        <span className="text-base">👍</span>
        <span>Helpful ({r.helpfulCount})</span>
      </button>
      
      <div className="text-xs text-gray-500">
        Review #{r.id.slice(-6)}
      </div>
    </div>
  </div>
</div>
</article>
))
)}
</div>

{/* Review Form */}
<div className="border-t border-white/10 pt-6">
<h3 className="text-white font-medium text-lg mb-4">Write a Review</h3>
<form onSubmit={(e) => { e.preventDefault(); createReview(); }} className="space-y-4">
<div>
<label htmlFor="review-text" className="block text-white text-sm font-medium mb-2">Your Review</label>
<textarea 
  id="review-text"
  rows={4} 
  value={newReview.text} 
  placeholder="Write your review..." 
  onChange={(e) => setNewReview({ ...newReview, text: e.target.value })} 
  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200 resize-vertical min-h-[100px]"
  aria-describedby={!isFormValid.review && newReview.text.length > 0 ? "review-error" : "review-help"}
  maxLength={500}
/>
{!isFormValid.review && newReview.text.length > 0 && (
  <p id="review-error" className="text-red-400 text-sm mt-1" role="alert">
    Review cannot be empty
  </p>
)}
<p id="review-help" className="text-gray-400 text-sm mt-1">
  {newReview.text.length}/500 characters
</p>
</div>

<div>
<label htmlFor="review-rating" className="block text-white text-sm font-medium mb-2">Rating</label>
<select 
  id="review-rating"
  value={newReview.rating} 
  onChange={(e) => setNewReview({ ...newReview, rating: Number(e.target.value) })} 
  className="bg-white/5 text-white border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 min-w-[120px]"
  aria-label="Select rating"
>
{[1, 2, 3, 4, 5].map(r => (
  <option key={r} value={r}>{"⭐".repeat(r)} {r} Star{r !== 1 ? 's' : ''}</option>
))}
</select>
</div>

<button 
  type="submit"
  disabled={reviewSubmitting || !isFormValid.review} 
  className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-200 flex items-center gap-2 min-w-[140px]"
  aria-label="Submit review"
>
{reviewSubmitting ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : null}
{reviewSubmitting ? "Submitting..." : "Submit Review"}
</button>
</form>
</div>
</section>
</div>
)}

{/* Sidebar */}
<aside 
  className={`fixed top-0 right-0 h-full w-80 bg-slate-900/95 backdrop-blur-lg border-l border-white/10 p-6 transform transition-transform duration-500 z-50 ${sidebarOpen ? "translate-x-0" : "translate-x-full"}`}
  role="complementary"
  aria-labelledby="sidebar-heading"
  aria-hidden={!sidebarOpen}
>
<div className="flex justify-between items-center mb-6">
<h2 id="sidebar-heading" className="text-white font-semibold text-xl">Upcoming Events</h2>
<button 
  onClick={() => setSidebarOpen(false)} 
  className="text-gray-400 hover:text-white hover:bg-white/10 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all duration-200"
  aria-label="Close events sidebar"
>
✕
</button>
</div>

{hasContent.events ? (
<div className="space-y-4" role="list" aria-label="Upcoming events">
{events.map((e, i) => (
<article key={e.id || i} className="bg-white/5 p-4 rounded-lg border border-white/10 hover:bg-white/10 transition-colors duration-200" role="listitem">
<div className="flex justify-between items-start mb-2">
<h3 className="text-white font-semibold">{e.title}</h3>
<span className={`px-2 py-1 rounded-full text-xs font-medium ${
  e.type === 'qa' ? 'bg-blue-600/20 text-blue-400' :
  e.type === 'cultural' ? 'bg-purple-600/20 text-purple-400' :
  e.type === 'workshop' ? 'bg-green-600/20 text-green-400' :
  'bg-gray-600/20 text-gray-400'
}`}>
{e.type}
</span>
</div>
<p className="text-gray-300 text-sm mb-3">{e.description}</p>
<div className="space-y-2 text-sm text-gray-400 mb-4">
<time className="flex items-center gap-2" dateTime={e.datetime}>
📅 {new Date(e.datetime).toLocaleString()}
</time>
{e.location && (
<div className="flex items-center gap-2">
📍 {e.location}
</div>
)}
<div className="flex items-center justify-between">
<span className="flex items-center gap-1">
👥 {e.attendingCount}{e.capacity && `/${e.capacity}`} attending
</span>
{e.capacity && (
<span className={`text-xs ${e.attendingCount >= e.capacity ? 'text-red-400' : 'text-green-400'}`}>
{e.attendingCount >= e.capacity ? 'Full' : `${e.capacity - e.attendingCount} spots left`}
</span>
)}
</div>
</div>
<button 
  onClick={() => attendEvent(e.id)} 
  disabled={!e.attending && !!e.capacity && e.attendingCount >= e.capacity}
  className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed ${
    e.attending 
      ? "bg-green-600 hover:bg-green-700 focus:ring-green-500" 
      : "bg-cyan-600 hover:bg-cyan-700 focus:ring-cyan-500"
  } text-white`}
  aria-pressed={e.attending}
  aria-label={e.attending ? `Stop attending ${e.title}` : `Attend ${e.title}`}
>
{e.attending ? "✅ Attending" : 
 (!e.capacity || e.attendingCount < e.capacity) ? "👋 Join Event" : "🚫 Event Full"}
</button>
</article>
))}
</div>
) : (
<div className="text-center py-8">
<Calendar size={48} className="text-gray-600 mx-auto mb-4" aria-hidden="true" />
<p className="text-gray-400 text-lg">No upcoming events</p>
<p className="text-gray-500 text-sm mt-1">Check back later for new events!</p>
</div>
)}
</aside>

{/* Sidebar Overlay */}
{sidebarOpen && (
<div 
  className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
  onClick={() => setSidebarOpen(false)}
  aria-hidden="true"
/>
)}
</div>
);
}
