
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Bell, Calendar, LogOut } from "lucide-react";
import TranslatorSection from "./TranslatorSection";
import EventsSidebar from "../layout/EventsSidebar";
import LoaderOverlay from "../ui/Loader";
import ThemeToggle from "../layout/ThemeToggle";
import CourseLessons from "./CourseLessons";
import ForumSection from "../community/ForumSection";
import ReviewsSection from "../community/ReviewsSection";
import { useProAlert } from "../../context/ProAlertContext";
import { handleUnauthorized } from "../../utils/handleUnauthorized";
import { logoutRequest } from "../../utils/logout";
import { useCourseData, useForumData, useReviewData, useCurrentUser } from "../../hooks/useCourseData";
import { useProgressTracking } from "../../hooks/useProgressTracking";
import type { Event } from "../../types/course";
import config from "../../config";

export default function CourseDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const proAlert = useProAlert();
  
  // Custom hooks for data management
  const { currentUser } = useCurrentUser();
  const { course, unitsToRender } = useCourseData(id);
  const { forums, createForum } = useForumData(id);
  const { reviews, createReview, toggleReviewHelpful } = useReviewData(id);
  const { completedLessons, quizResponses, toggleLessonDone, updateQuizResponses } = useProgressTracking(
    currentUser?.id || null,
    id || null,
    unitsToRender
  );

  // UI state
  const [pageLoading, setPageLoading] = useState(true);
  const [input, setInput] = useState("");
  const [translation, setTranslation] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("en");

  // Events state
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
  
  const isFormValid = {
    translation: input.trim().length > 0,
  };
  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setPageLoading(true);
        // Data loading is now handled by custom hooks
      } finally {
        setPageLoading(false);
      }
    };

    load();
  }, [id]);

  // Handler functions
  const handleCreateForum = async (message: string) => {
    if (!currentUser) {
      proAlert.info("Please sign in before posting to the forum.");
      return;
    }
    await createForum(message, currentUser.id);
  };

  const handleCreateReview = async (reviewText: string, rating: number) => {
    if (!currentUser) {
      proAlert.info("Please sign in before posting a review.");
      return;
    }
    await createReview(reviewText, rating, currentUser.id);
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

  const attendEvent = (eventId: string) => {
    setEvents(prev => prev.map(e => {
      if (e.id !== eventId) return e;
      const willAttend = !e.attending;
      if (willAttend) {
        if (typeof e.capacity === 'number' && e.attendingCount >= e.capacity) return e;
        return { ...e, attending: true, attendingCount: e.attendingCount + 1 };
      }
      return { ...e, attending: false, attendingCount: Math.max(0, e.attendingCount - 1) };
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

          <TranslatorSection
            input={input}
            sourceLang={sourceLang}
            targetLang={targetLang}
            loading={loading}
            translation={translation}
            isValid={isFormValid.translation}
            onChangeInput={setInput}
            onChangeSource={setSourceLang}
            onChangeTarget={setTargetLang}
            onTranslate={translate}
          />

          <CourseLessons
            unitsToRender={unitsToRender}
            completedLessons={completedLessons}
            quizResponses={quizResponses}
            isVisible={isVisible}
            onToggleLessonDone={toggleLessonDone}
            onQuizResponseUpdate={updateQuizResponses}
          />

          <ForumSection
            forums={forums}
            currentUser={currentUser}
            isVisible={isVisible}
            onCreateForum={handleCreateForum}
          />

          <ReviewsSection
            reviews={reviews}
            currentUser={currentUser}
            isVisible={isVisible}
            onCreateReview={handleCreateReview}
            onToggleReviewHelpful={toggleReviewHelpful}
          />
        </div>

{/* Sidebar */}
<EventsSidebar
  open={sidebarOpen}
  events={events}
  onClose={() => setSidebarOpen(false)}
  onAttend={attendEvent}
/>

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
