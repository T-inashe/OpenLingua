
import config from "../config";


import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { Search, BookOpen, SendHorizonal, MessageSquare, Bell, Loader2, Star, Calendar } from "lucide-react";
import LoaderOverlay from "./Loader";
import ThemeToggle from "./ThemeToggle";
import { useProAlert } from "../context/ProAlertContext";
import { handleUnauthorized } from "../utils/handleUnauthorized";

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
      throw new Error("Failed to fetch courses");
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
      throw new Error("Failed to fetch courses");
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
      throw new Error("Failed to fetch courses");
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
  const resolvedContent = resolveLessonContent(lesson.content);

  if (!resolvedContent) {
    return <p className="text-gray-400 text-sm italic">No content provided.</p>;
  }

  const normalizedType = (lesson.type || "text").toLowerCase();

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


<div className="p-6">
<h1 className={`text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-8 transition-all duration-1000 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
Welcome To {course?.title}
</h1>


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
