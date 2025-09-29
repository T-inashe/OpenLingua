import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, MessageCircle, Calendar, Plus, LogOut } from "lucide-react";
import LoaderOverlay from "../ui/Loader";
import { logoutRequest } from "../../utils/logout";
import ThemeToggle from "../layout/ThemeToggle";
import { useProAlert } from "../../context/ProAlertContext";

// Dummy current user data
const currentUser = {
  id: 2,
  name: "Hluma Nziweni",
  enrolledCourses: ["Advanced isiXhosa Grammar", "Swahili for Business"],
  createdCourses: ["Shona Poetry & Literature"]
};

// Dummy community data
const communityMembers = [
  { id: 1, name: "Tinashe Nganadange", enrolledCourses: ["Advanced isiXhosa Grammar"], createdCourses: [] },
  { id: 2, name: "Hluma Nziweni", enrolledCourses: ["Advanced isiXhosa Grammar", "Swahili for Business"], createdCourses: ["Shona Poetry & Literature"] },
  { id: 3, name: "Bongumusa Makhubu", enrolledCourses: ["Swahili for Business"], createdCourses: ["Beginner Xitsonga Conversations"] },
];

// Dummy events data
const events = [
  { id: 1, title: "isiXhosa Beginner Meetup", date: "2025-09-10", time: "15:00", participants: ["Hluma Nziweni", "Tinashe Nganadange"] },
  { id: 2, title: "Swahili Business Workshop", date: "2025-09-15", time: "10:00", participants: ["Hluma Nziweni", "Bongumusa Makhubu"] },
];

// Dummy discussions data
const discussions = [
  { id: 1, topic: "Language Learning Tips", lastActivity: "2 hours ago" },
  { id: 2, topic: "Advanced Grammar Tricks", lastActivity: "1 day ago" },
  { id: 3, topic: "Cultural Insights", lastActivity: "3 days ago" },
];

// Utility function to find common courses (note: it can and should be changed)
const getCommonCourses = (member: typeof communityMembers[0]) => {
  const commonEnrolled = member.enrolledCourses.filter(course => currentUser.enrolledCourses.includes(course));
  const commonCreated = member.createdCourses.filter(course => currentUser.enrolledCourses.includes(course));
  return [...commonEnrolled, ...commonCreated];
};

const CommunityDashboard = () => {
  const [selectedMember, setSelectedMember] = useState<typeof communityMembers[0] | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  const proAlert = useProAlert();

  const relevantMembers = communityMembers.filter(member => member.id !== currentUser.id && getCommonCourses(member).length > 0);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const success = await logoutRequest();
    setIsLoggingOut(false);

    if (success) {
      navigate('/signIn');
    } else {
      proAlert.error('Unable to log out. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-6 space-y-12">
      {isLoggingOut && <LoaderOverlay message="Logging out..." />}

      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/dashboard')}
          type="button"
          className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
        >
          OpenLingua
        </button>
        <div className="flex items-center gap-3">
          <ThemeToggle />
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

      {/* Header */}
      <h1 className="text-white text-3xl font-bold mb-6 flex items-center">
        <Users className="mr-3" /> Community Dashboard
      </h1>

      {/* Relevant Members */}
      <section>
        <h2 className="text-white font-semibold text-xl mb-4">Connect With People:</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {relevantMembers.map(member => {
            const commonCourses = getCommonCourses(member);
            return (
              <div
                key={member.id}
                className="bg-white/5 backdrop-blur-lg rounded-xl p-5 border border-white/10 hover:border-cyan-500/30 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                onClick={() => setSelectedMember(member)}
              >
                <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center mb-3">
                  <span className="text-white font-medium">{member.name[0]}</span>
                </div>
                <p className="text-white font-semibold">{member.name}</p>
                <p className="text-gray-400 text-sm">
                  In common: {commonCourses.join(", ")}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Upcoming Events Section is below */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold text-xl">Upcoming Events</h2>
          <button
            className="flex items-center space-x-2 bg-cyan-500 px-3 py-1 rounded-lg hover:bg-cyan-600 transition-all duration-200"
            onClick={() => setShowEventForm(!showEventForm)}
          >
            <Plus size={16} className="text-white" />
            <Calendar size={16} className="text-white" />
            <span className="text-white text-sm">Add Event</span>
          </button>
        </div>

        {/* Event Form */}
        {showEventForm && (
          <div className="mb-4 bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10">
            <input
              type="text"
              placeholder="Event Title"
              className="w-full mb-2 px-3 py-2 rounded-lg bg-white/5 text-white placeholder-gray-400 border border-white/10 focus:outline-none focus:border-cyan-500/50"
            />
            <input
              type="date"
              className="w-full mb-2 px-3 py-2 rounded-lg bg-white/5 text-white placeholder-gray-400 border border-white/10 focus:outline-none focus:border-cyan-500/50"
            />
            <input
              type="time"
              className="w-full mb-2 px-3 py-2 rounded-lg bg-white/5 text-white placeholder-gray-400 border border-white/10 focus:outline-none focus:border-cyan-500/50"
            />
            <button className="bg-cyan-500 px-4 py-2 rounded-lg hover:bg-cyan-600 transition-all duration-200">Create Event</button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {events.map(event => (
            <div key={event.id} className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10 hover:border-purple-500/30 transition-all duration-200">
              <div className="flex items-center mb-2">
                <Calendar size={16} className="text-cyan-400 mr-2" />
                <p className="text-white font-medium">{event.title}</p>
              </div>
              <p className="text-gray-400 text-sm">{event.date} at {event.time}</p>
              <p className="text-gray-400 text-sm mt-1">Participants: {event.participants.join(", ")}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Forum Discussion Section */}
      <section>
        <h2 className="text-white font-semibold text-xl mb-4">Forum Discussions</h2>
        <div className="space-y-4">
          {discussions.map(discussion => (
            <div key={discussion.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 hover:border-cyan-500/30 transition-all duration-200">
              <p className="text-white font-medium">{discussion.topic}</p>
              <p className="text-gray-400 text-sm">{discussion.lastActivity}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Dummy Messaging that isn't implemented yet */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-lg">Chat with {selectedMember.name}</h3>
              <button className="text-gray-400 hover:text-white" onClick={() => setSelectedMember(null)}>✕</button>
            </div>
            <div className="h-64 bg-white/5 rounded-lg p-4 mb-4 overflow-y-auto">
              <p className="text-gray-400 text-sm italic">Messaging not implemented yet...</p>
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500/50 transition-all duration-200"
              />
              <button className="bg-cyan-500 px-4 py-2 rounded-lg hover:bg-cyan-600 transition-all duration-200">
                <MessageCircle size={16} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CommunityDashboard;
