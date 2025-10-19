import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, MessageCircle, Calendar, Plus, LogOut } from "lucide-react";
import LoaderOverlay from "./Loader";
import { logoutRequest } from "../utils/logout";
import ThemeToggle from "./ThemeToggle";
import { useProAlert } from "../context/ProAlertContext";

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
}

interface CreateEventData {
  title: string;
  date: string;
  time: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  // Update these to match your backend response
  coursesTaught?: Array<{
    id: string;
    title: string;
    language: string;
  }>;
  joinedCourses?: Array<{
    course: {
      id: string;
      title: string;
      language: string;
    };
  }>;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
}

interface Conversation {
  id: string;
  participant1: User;
  participant2: User;
  messages: Message[];
}

// Dummy discussions data
const discussions = [
  { id: 1, topic: "Language Learning Tips", lastActivity: "2 hours ago" },
  { id: 2, topic: "Advanced Grammar Tricks", lastActivity: "1 day ago" },
  { id: 3, topic: "Cultural Insights", lastActivity: "3 days ago" },
];

const CommunityDashboard = () => {
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  const proAlert = useProAlert();

  // Fetch community data on component mount
  useEffect(() => {
    fetchCommunityData();
    fetchEvents();
  }, []);

  const fetchCommunityData = async () => {
    try {
      setIsLoading(true);
      
      console.log('Fetching current user...');
      const currentUserResponse = await fetch(`${config.BACKEND_URL}/api/chat/me`, {
        credentials: 'include',
      });
      
      if (currentUserResponse.ok) {
        const currentUserData = await currentUserResponse.json();
        console.log('Current user:', currentUserData.user);
        setCurrentUser(currentUserData.user);
      } else {
        console.log('Failed to get current user, status:', currentUserResponse.status);
      }

      console.log('Fetching community users...');
      const usersResponse = await fetch(`${config.BACKEND_URL}/api/chat/users`, {
        credentials: 'include',
      });
      
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        console.log('Community users response:', usersData);
        setCommunityMembers(usersData.users || []);
      } else {
        console.log('Failed to get community users, status:', usersResponse.status);
      }
    } catch (error) {
      console.error('Error fetching community data:', error);
      proAlert.error('Failed to load community data');
    } finally {
      setIsLoading(false);
    }
  };
  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${config.BACKEND_URL}/api/event`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      
      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      proAlert.error('Failed to load events');
    } finally {
      setIsLoading(false);
    }
  };

  // When a member is selected, load their conversation
  const handleMemberClick = async (member: User) => {
    setSelectedMember(member);
    try {
      const response = await fetch(`${config.BACKEND_URL}/api/chat/conversations/${member.id}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentConversation(data.conversation);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      proAlert.error('Failed to load conversation');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentConversation) return;

    try {
      const response = await fetch(`${config.BACKEND_URL}/api/chat/conversations/${currentConversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ content: newMessage })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Add the new message to the current conversation
        setCurrentConversation(prev => 
          prev ? {
            ...prev,
            messages: [...prev.messages, data.message]
          } : null
        );
        
        setNewMessage("");
      }
    } catch (error) {
      console.error('Error sending message:', error);
      proAlert.error('Failed to send message');
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEvent.title || !newEvent.date || !newEvent.time) {
      proAlert.error('Please fill in all event fields');
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await fetch(`${config.BACKEND_URL}/api/event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', 
        body: JSON.stringify(newEvent)
      });

      if (!response.ok) {
        throw new Error('Failed to create event');
      }

      const data = await response.json();
      
      // Add the new event to the local state
      setEvents(prevEvents => [data.event, ...prevEvents]);
      
      // Reset form and close
      setNewEvent({ title: "", date: "", time: "" });
      setShowEventForm(false);
      proAlert.success('Event created successfully!');
      
    } catch (error) {
      console.error('Error creating event:', error);
      proAlert.error('Failed to create event');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      const response = await fetch(`${config.BACKEND_URL}/api/event/${eventId}`, {
        method: 'DELETE',
        credentials: 'include', 
      });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      // Remove event from local state
      setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
      proAlert.success('Event deleted successfully!');
      
    } catch (error) {
      console.error('Error deleting event:', error);
      proAlert.error('Failed to delete event');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewEvent(prev => ({
      ...prev,
      [name]: value
    }));
  };

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

  // Utility function to find common courses
  const getCommonCourses = (member: User) => {
    if (!currentUser) return [];
    
    // Get current user's courses (both taught and enrolled)
    const currentUserCourses = [
      ...(currentUser.coursesTaught?.map(c => c.title) || []),
      ...(currentUser.joinedCourses?.map(e => e.course.title) || [])
    ];
    
    // Get member's courses (both taught and enrolled)
    const memberCourses = [
      ...(member.coursesTaught?.map(c => c.title) || []),
      ...(member.joinedCourses?.map(e => e.course.title) || [])
    ];
    
    return memberCourses.filter(course => currentUserCourses.includes(course));
  };

  const relevantMembers = communityMembers.filter(member => 
    currentUser && member.id !== currentUser.id && getCommonCourses(member).length > 0
  );

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

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
          {relevantMembers.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-400">No community members found with common courses.</p>
            </div>
          ) : (
            relevantMembers.map(member => {
              const commonCourses = getCommonCourses(member);
              return (
                <div
                  key={member.id}
                  className="bg-white/5 backdrop-blur-lg rounded-xl p-5 border border-white/10 hover:border-cyan-500/30 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                  onClick={() => handleMemberClick(member)}
                >
                  <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center mb-3">
                    {member.avatar ? (
                      <img 
                        src={member.avatar} 
                        alt={member.name}
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <span className="text-white font-medium">{member.name[0]}</span>
                    )}
                  </div>
                  <p className="text-white font-semibold">{member.name}</p>
                  <p className="text-gray-400 text-sm">
                    In common: {commonCourses.join(", ") || "No common courses"}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Upcoming Events Section */}
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
          <form onSubmit={handleCreateEvent} className="mb-4 bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10">
            <input
              type="text"
              name="title"
              placeholder="Event Title"
              value={newEvent.title}
              onChange={handleInputChange}
              className="w-full mb-2 px-3 py-2 rounded-lg bg-white/5 text-white placeholder-gray-400 border border-white/10 focus:outline-none focus:border-cyan-500/50"
              required
            />
            <input
              type="date"
              name="date"
              value={newEvent.date}
              onChange={handleInputChange}
              className="w-full mb-2 px-3 py-2 rounded-lg bg-white/5 text-white placeholder-gray-400 border border-white/10 focus:outline-none focus:border-cyan-500/50"
              required
            />
            <input
              type="time"
              name="time"
              value={newEvent.time}
              onChange={handleInputChange}
              className="w-full mb-2 px-3 py-2 rounded-lg bg-white/5 text-white placeholder-gray-400 border border-white/10 focus:outline-none focus:border-cyan-500/50"
              required
            />
            <div className="flex gap-2">
              <button 
                type="submit" 
                className="bg-cyan-500 px-4 py-2 rounded-lg hover:bg-cyan-600 transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Event'}
              </button>
              <button 
                type="button"
                onClick={() => {
                  setShowEventForm(false);
                  setNewEvent({ title: "", date: "", time: "" });
                }}
                className="bg-gray-500 px-4 py-2 rounded-lg hover:bg-gray-600 transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Events List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {events.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-400">No events scheduled yet. Create the first one!</p>
            </div>
          ) : (
            events.map(event => (
              <div key={event.id} className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10 hover:border-purple-500/30 transition-all duration-200 group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Calendar size={16} className="text-cyan-400 mr-2" />
                    <p className="text-white font-medium">{event.title}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteEvent(event.id)}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-gray-400 text-sm">{formatDate(event.date)} at {event.time}</p>
              </div>
            ))
          )}
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

      {/* Real Chat Modal */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-lg">Chat with {selectedMember.name}</h3>
              <button 
                className="text-gray-400 hover:text-white" 
                onClick={() => {
                  setSelectedMember(null);
                  setCurrentConversation(null);
                }}
              >
                ✕
              </button>
            </div>
            
            {/* Messages Container */}
            <div className="h-64 bg-white/5 rounded-lg p-4 mb-4 overflow-y-auto">
              {currentConversation?.messages.length === 0 ? (
                <p className="text-gray-400 text-sm italic text-center">No messages yet. Start the conversation!</p>
              ) : (
                currentConversation?.messages.map(message => (
                  <div
                    key={message.id}
                    className={`mb-3 ${message.senderId === currentUser?.id ? 'text-right' : 'text-left'}`}
                  >
                    <div
                      className={`inline-block max-w-xs px-4 py-2 rounded-lg ${
                        message.senderId === currentUser?.id
                          ? 'bg-cyan-500 text-white'
                          : 'bg-white/10 text-white'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.createdAt).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Message Input */}
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500/50 transition-all duration-200"
              />
              <button 
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="bg-cyan-500 px-4 py-2 rounded-lg hover:bg-cyan-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
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