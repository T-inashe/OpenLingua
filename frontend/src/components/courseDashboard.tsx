
import config from "../config";


import { useParams } from "react-router-dom";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, BookOpen, SendHorizonal, MessageSquare, Bell, Loader2, Star,Calendar } from "lucide-react";

 type Lesson = {
  id?: string;
  title: string;
  content: string;
  done: boolean;
  type: 'vocabulary' | 'grammar' | 'exercise' | 'reading';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime?: number; // in minutes
};

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
}
interface Course {
  id: string;
  title: string;
  createdAt: string;
  description: string;
  level: string;
  words: Word[]
  // Add other fields if needed (like avatar, googleId, etc.)
}
type Event = {
id: string;
title: string;
description: string;
datetime: string;
attendingCount: number;
attending: boolean;
capacity?: number;
location?: string;
type: 'workshop' | 'qa' | 'cultural' | 'practice';
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
  const { id, uid } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [forums, setForums] = useState<Forum[]>([]);

  // Example lessons for Zulu course
  const [lessons, setLessons] = useState<Lesson[]>([
    { 
      id: '1',
      title: "Lesson 1: Basic Greetings", 
      content: "Learn essential Zulu greetings: Sawubona (Hello), Unjani? (How are you?)", 
      done: false,
      type: 'vocabulary',
      difficulty: 'beginner',
      estimatedTime: 15
    },
    { 
      id: '2',
      title: "Lesson 2: Expressing Gratitude", 
      content: "Master gratitude expressions: Ngiyabonga (Thank you), Ngiyabonga kakhulu (Thank you very much)", 
      done: false,
      type: 'vocabulary',
      difficulty: 'beginner',
      estimatedTime: 10
    },
    { 
      id: '3',
      title: "Lesson 3: Basic Responses", 
      content: "Learn to respond appropriately: Yebo (Yes), Cha (No), Ngiyaphila (I am well)", 
      done: false,
      type: 'grammar',
      difficulty: 'beginner',
      estimatedTime: 20
    },
  ]);

  const [input, setInput] = useState("");
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
    
    // Load all data on component mount
    const loadData = async () => {
      setDataLoading(true);
      try {
        await Promise.all([
          getCourses(),
          getForum(),
          getReview()
        ]);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setDataLoading(false);
      }
    };
    
    loadData();
  }, [id]); // Add id as dependency

  const getCourses = useCallback(async () => {
    try {
      const res = await fetch(`${config.BACKEND_URL}/api/courses/${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error("Failed to fetch course");
      }

      const data = await res.json();
      setCourse(data.course);
    } catch (error) {
      console.error("Error fetching course:", error);
      alert("Something went wrong while fetching the course.");
    }
  }, [id]);

  const getForum = useCallback(async () => {
    try {
      const res = await fetch(`${config.BACKEND_URL}/api/forum/${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error("Failed to fetch forum");
      }

      const data = await res.json();
      setForums(data.posts);
    } catch (error) {
      console.error("Error fetching forum:", error);
      alert("Something went wrong while fetching the forum.");
    }
  }, [id]);

  const getReview = useCallback(async () => {
    try {
      const res = await fetch(`${config.BACKEND_URL}/api/courses/reviews/${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error("Failed to fetch reviews");
      }

      const data = await res.json();
      setReviews(data.reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      alert("Something went wrong while fetching the reviews.");
    }
  }, [id]);
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

      const data = await res.json();
      setTranslation(data.translatedText);
    } catch (err) {
      console.error("Translation error:", err);
      setTranslation("Error fetching translation");
    } finally {
      setLoading(false);
    }
  };

 const createForum = useCallback(async () => {
   if (!message.trim()) return;
   
   setForumSubmitting(true);
   const payload = {
     content: message,
     userId: uid,
   };
  
   try {
     const response = await fetch(`${config.BACKEND_URL}/api/forum/${id}`, {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       credentials: 'include',
       body: JSON.stringify(payload)
     });
 
     if (response.ok) {
       alert("Forum post created successfully!");
       setMessage(""); // Clear the form
       getForum();
     } else {
       const errorData = await response.json();
       console.error("Failed to create forum post:", errorData);
       alert("Failed to create forum post.");
     }
   } catch (error) {
     console.error("Error creating forum post:", error);
     alert("Something went wrong while creating the forum post.");
   } finally {
     setForumSubmitting(false);
   }
 }, [message, uid, id, getForum]);

  const createReview = useCallback(async () => {
   if (!newReview.text.trim()) return;
   
   setReviewSubmitting(true);
   const payload = {
    courseId:id,
     review: newReview.text,
     rating: newReview.rating,
     userId: uid,
   };
  
   try {
     const response = await fetch(`${config.BACKEND_URL}/api/courses/reviews`, {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       credentials: 'include',
       body: JSON.stringify(payload)
     });
 
     if (response.ok) {
       alert("Review created successfully!");
       setNewReview({ name: "", text: "", rating: 5 }); // Clear the form
       getReview();
     } else {
       const errorData = await response.json();
       console.error("Failed to create review:", errorData);
       alert("Failed to create review.");
     }
   } catch (error) {
     console.error("Error creating review:", error);
     alert("Something went wrong while creating the review.");
   } finally {
     setReviewSubmitting(false);
   }
 }, [newReview.text, newReview.rating, uid, id, getReview]);

  const toggleLessonDone = useCallback((index: number) => {
    setLessons(prev => prev.map((l, i) => i === index ? { ...l, done: !l.done } : l));
  }, []);

  const toggleReviewHelpful = useCallback(async (reviewId: string) => {
    try {
      const review = reviews.find(r => r.id === reviewId);
      if (!review) return;

      const response = await fetch(`${config.BACKEND_URL}/api/courses/reviews/${reviewId}/helpful`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ helpful: !review.userMarkedHelpful })
      });

      if (response.ok) {
        setReviews(prev => prev.map(r => 
          r.id === reviewId 
            ? {
                ...r,
                userMarkedHelpful: !r.userMarkedHelpful,
                helpfulCount: r.userMarkedHelpful 
                  ? r.helpfulCount - 1 
                  : r.helpfulCount + 1
              }
            : r
        ));
      }
    } catch (error) {
      console.error("Error toggling review helpful:", error);
    }
  }, [reviews]);

  const attendEvent = useCallback(async (eventId: string) => {
    try {
      const event = events.find(e => e.id === eventId);
      if (!event) return;

      const response = await fetch(`${config.BACKEND_URL}/api/events/${eventId}/attend`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ attending: !event.attending })
      });

      if (response.ok) {
        setEvents(prev => prev.map(e => 
          e.id === eventId 
            ? {
                ...e,
                attending: !e.attending,
                attendingCount: e.attending 
                  ? e.attendingCount - 1 
                  : e.attendingCount + 1
              }
            : e
        ));
      }
    } catch (error) {
      console.error("Error attending event:", error);
      // Fallback to local state update
      setEvents(prev => prev.map(e => 
        e.id === eventId 
          ? {
              ...e,
              attending: !e.attending,
              attendingCount: e.attending 
                ? e.attendingCount - 1 
                : e.attendingCount + 1
            }
          : e
      ));
    }
  }, [events]);

  // Memoized computed values
  const hasContent = useMemo(() => ({
    course: course !== null,
    forums: forums.length > 0,
    reviews: reviews.length > 0,
    events: events.length > 0
  }), [course, forums.length, reviews.length, events.length]);

  const isFormValid = useMemo(() => ({
    forum: message.trim().length > 0,
    review: newReview.text.trim().length > 0,
    translation: input.trim().length > 0
  }), [message, newReview.text, input]);

  return (
  <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 relative overflow-hidden">
{/* Header */}
<header className={`sticky top-0 z-50 bg-slate-900/60 backdrop-blur-lg border-b border-white/10 transition-all duration-1000 ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}`} role="banner">
<div className="container mx-auto px-6 py-4 flex items-center justify-between">
<div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent" role="heading" aria-level={1}>
OpenLingua
</div>
<nav className="flex items-center gap-4" role="navigation" aria-label="Main navigation">
<button 
  onClick={() => setSidebarOpen(true)} 
  className="p-2 text-gray-400 hover:text-white transition-colors duration-200 hover:bg-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
  aria-label="Open events calendar"
  title="View upcoming events"
>
<Calendar size={20} />
</button>
<button 
  className="relative p-2 text-gray-400 hover:text-white transition-colors duration-200 hover:bg-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
  aria-label="View notifications"
  title="You have new notifications"
>
<Bell size={20} />
<span className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-500 rounded-full" aria-hidden="true"></span>
</button>
</nav>
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
{course && (
<div className="text-sm text-gray-400">
{course.words.filter(w => w.type === "completed").length} of {course.words.length} completed
</div>
)}
</div>

{!hasContent.course ? (
  <div className="text-center py-8">
    <p className="text-gray-400">Loading lessons...</p>
  </div>
) : (
<div className="space-y-4">
{/* Course Words as Vocabulary Lessons */}
{course && course.words.length > 0 && (
<div>
<h3 className="text-white font-medium text-lg mb-3 flex items-center gap-2">
📚 Vocabulary ({course.words.length} words)
</h3>
<ul className="grid gap-3 md:grid-cols-2" role="list" aria-label="Vocabulary lessons">
{course.words.map((word, i) => (
<li key={i} className="bg-white/5 p-4 rounded-lg border border-white/5 hover:bg-white/10 transition-colors duration-200" role="listitem">
<div className="flex justify-between items-start mb-2">
<strong className="text-white text-lg">{word.title}</strong>
<span className={`px-2 py-1 rounded-full text-xs font-medium ${word.type === "completed" ? "bg-green-600/20 text-green-400" : "bg-purple-600/20 text-purple-400"}`} aria-label={`Status: ${word.type}`}>
{word.type === "completed" ? "✓ Learned" : "New"}
</span>
</div>
<p className="text-gray-300 mb-3 text-sm">{word.content}</p>
<button 
  onClick={() => toggleLessonDone(i)} 
  className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 ${word.type === "completed" ? "bg-green-600 hover:bg-green-700 focus:ring-green-500" : "bg-cyan-600 hover:bg-cyan-700 focus:ring-cyan-500"} text-white`}
  aria-pressed={word.type === "completed"}
  aria-label={word.type === "completed" ? "Mark as not learned" : "Mark as learned"}
>
{word.type === "completed" ? "✓ Learned" : "📖 Mark as Learned"}
</button>
</li>
))}
</ul>
</div>
)}

{/* Structured Lessons */}
{lessons.length > 0 && (
<div>
<h3 className="text-white font-medium text-lg mb-3 flex items-center gap-2">
🎯 Structured Lessons ({lessons.filter(l => l.done).length}/{lessons.length} completed)
</h3>
<ul className="space-y-3" role="list" aria-label="Structured lessons">
{lessons.map((lesson, i) => (
<li key={lesson.id || i} className="bg-white/5 p-4 rounded-lg border border-white/5 hover:bg-white/10 transition-colors duration-200" role="listitem">
<div className="flex justify-between items-start mb-3">
<div className="flex-1">
<h4 className="text-white text-lg font-medium mb-1">{lesson.title}</h4>
<div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
<span className="flex items-center gap-1">
📊 {lesson.difficulty}
</span>
<span className="flex items-center gap-1">
🏷️ {lesson.type}
</span>
{lesson.estimatedTime && (
<span className="flex items-center gap-1">
⏱️ {lesson.estimatedTime} min
</span>
)}
</div>
</div>
<span className={`px-3 py-1 rounded-full text-xs font-medium ${lesson.done ? "bg-green-600/20 text-green-400" : "bg-blue-600/20 text-blue-400"}`}>
{lesson.done ? "✓ Completed" : "In Progress"}
</span>
</div>
<p className="text-gray-300 mb-4">{lesson.content}</p>
<div className="flex gap-2">
<button 
  onClick={() => toggleLessonDone(i)} 
  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 ${lesson.done ? "bg-green-600 hover:bg-green-700 focus:ring-green-500" : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"} text-white`}
  aria-pressed={lesson.done}
>
{lesson.done ? "✓ Completed" : "▶️ Start Lesson"}
</button>
{lesson.done && (
<button className="px-4 py-2 rounded-lg text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-800">
🔄 Review
</button>
)}
</div>
</li>
))}
</ul>
</div>
)}
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