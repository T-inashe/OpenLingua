
import config from "../config";


import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Search, BookOpen, SendHorizonal, MessageSquare, Bell, Loader2, Star, Heart,Calendar } from "lucide-react";

 type Lesson = {
  title: string;
  content: string;
  done: boolean;
  type: string;
};

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
  type: String;
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
  const { id,uid } = useParams();
const [course, setCourse] = useState<Course | null>(null);
const [forums, setForums] = useState<Forum[]>([]);
//const [lessons, setLessons] = useState<Lesson | null>(null);
  // Example lessons for Zulu course
  const [lessons, setLessons] = useState<Lesson[]>([
  ]);

  const [input, setInput] = useState("");
  const [translation, setTranslation] = useState("");
  const [forum, setForum] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);

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
  const [reviewText, setReviewText] = useState("");
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
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

    if (!res.ok) {
      throw new Error("Failed to fetch courses");
    }

    const data = await res.json();
   //console.log(JSON.stringify(data.course))

  setCourse(data.course);  // Use the courses array
 
  } catch (error) {
    console.error("Error creating course:", error);
    alert("Something went wrong while creating the course.");
  }
};


useEffect(()=>{
 getCourses()
},[])
const getForum = async () => {
  // Basic validation

  // Transform your state into the format expected by your backend

  try {
    const res = await fetch(`${config.BACKEND_URL}/api/forum/${id}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error("Failed to fetch courses");
    }

    const data = await res.json();
   console.log(JSON.stringify(data))

  setForums(data.posts);  // Use the courses array
 
  } catch (error) {
    console.error("Error creating course:", error);
    alert("Something went wrong while creating the course.");
  }
};


useEffect(()=>{
 getForum()
},[])

const getReview = async () => {
  // Basic validation

  // Transform your state into the format expected by your backend

  try {
    const res = await fetch(`${config.BACKEND_URL}/api/courses/reviews/${id}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error("Failed to fetch courses");
    }

    const data = await res.json();
   console.log(JSON.stringify(data))

  setReviews(data.reviews);  // Use the courses array
 
  } catch (error) {
    console.error("Error creating course:", error);
    alert("Something went wrong while creating the course.");
  }
};


useEffect(()=>{
 getReview()
},[])
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

 const createForum = async () => {
   // Basic validation
 
   // Transform your state into the format expected by your backend
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
       alert("forum created successfully!");
       getForum()
     } else {
       const errorData = await response.json();
       console.error("Failed to create forum:", errorData);
       alert("Failed to create forum.");
     }
   } catch (error) {
     console.error("Error creating forum:", error);
     alert("Something went wrong while creating the forum.");
   }
 };

  const createReview = async () => {
   // Basic validation
 
   // Transform your state into the format expected by your backend
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
       alert("forum created successfully!");
       getReview()
     } else {
       const errorData = await response.json();
       console.error("Failed to create forum:", errorData);
       alert("Failed to create forum.");
     }
   } catch (error) {
     console.error("Error creating forum:", error);
     alert("Something went wrong while creating the forum.");
   }
 };

  const markAsDone = (index: number) => {
    setLessons(prev => prev.map((lesson, i) => i === index ? { ...lesson, done: true } : lesson));
  };



  
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
const toggleLessonDone = (index: number) => {
setLessons(prev => prev.map((l, i) => i === index ? { ...l, done: !l.done } : l));
};

  return (
  <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 relative overflow-hidden">
{/* Header */}
<header className={`sticky top-0 z-50 bg-slate-900/60 backdrop-blur-lg border-b border-white/10 transition-all duration-1000 ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}`}>
<div className="container mx-auto px-6 py-4 flex items-center justify-between">
<div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
OpenLingua
</div>
<div className="flex items-center gap-4">
<button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-400 hover:text-white transition-colors duration-200">
<Calendar size={20} />
</button>
<button className="relative p-2 text-gray-400 hover:text-white transition-colors duration-200">
<Bell size={20} />
<span className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-500 rounded-full"></span>
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
<ul className="space-y-2">


{
course&& (course.words.map((l, i) => (
<li key={i} className="text-gray-300 bg-white/5 p-3 rounded-lg border border-white/5">
<strong className="text-white">{l.type}</strong>
{
  l.type === "text" ? (<video
        controls
        className="w-full max-h-[400px] rounded-lg"
        src={`${config.BACKEND_URL}${l.content}`}
      />) : (l.type === "image" ? (<img
        src={`${config.BACKEND_URL}${l.content}`}
        alt="Preview"
        className="max-w-full max-h-[400px] rounded-lg"
      />):(l.type === "audio" ? (<audio
        controls
        className="w-full"
        src={`${config.BACKEND_URL}${l.content}`}
      />):(<p>{l.content}</p>)) )
}

<button onClick={() => toggleLessonDone(i)} className={`mt-2 px-3 py-1 rounded-lg text-sm ${l.type ==="text" ? "bg-green-600" : "bg-cyan-600"} text-white`}>
{l.type ==="text" ? "Done" : "Mark as Done"}
</button>
</li>
)))
}
</ul>
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