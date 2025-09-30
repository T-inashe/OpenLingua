import { useState, useEffect, useMemo } from "react";
import { Search, Plus, BookOpen, TrendingUp, Users, Star, Award, Settings, Bell } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import config from "../config";
import LoaderOverlay from "./Loader";
import ThemeToggle from "./ThemeToggle";
import { useProAlert } from "../context/ProAlertContext";
import { handleUnauthorized } from "../utils/handleUnauthorized";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [init, setInit] = useState('');
  const [progress, setProgress] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [mycourses, setMycourses] = useState<Courses[]>([]);
  const [coursess, setCoursess] = useState<Courses[]>([]);
  const [joined, setJoined] = useState<Joined[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  // const [joinedall, setJoinedall] = useState<Joined[]>([]);
  // const [joinedBoth, setJoinedBoth] = useState<Joined | null>(null);

  const navigate = useNavigate();
  const proAlert = useProAlert();

  interface User {
    id: string;
    name: string;
    email: string;
    avatar: string;
    // Add other fields if needed (like avatar, googleId, etc.)
  }
  interface Courses {
    id: string;
    title: string;
    createdAt: string;
    description: string;
    level: string;
    // Add other fields if needed (like avatar, googleId, etc.)
  }
  interface Joined {
    id: string;
    progress: string;
    // Add other fields if needed (like avatar, googleId, etc.)
  }

  const getUser = async () => {
    try {
      const res = await fetch(`${config.BACKEND_URL}/api/auth/me/`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
      });

      if (handleUnauthorized(res, navigate, proAlert)) {
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to fetch current user");
      }

      const data = await res.json();

      setUser(data.user);
      setInit(getInitials(data.user.name));

      await Promise.all([
        getMyCourses(data.user),
        getJoinedCourses(data.user)
      ]);
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  const getMyCourses = async (user: User) => {
    // Basic validation

    // Transform your state into the format expected by your backend
    // const payload = {
    //   userId: user?.id,
    // };

    try {
      const res = await fetch(`${config.BACKEND_URL}/api/courses/getcourses/${user?.id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (handleUnauthorized(res, navigate, proAlert)) {
        return;
      }

      if (!res.ok) {
        console.log(res.json())
        throw new Error("Failed to fetch my courses");
      }

      const data = await res.json();
      // alert(JSON.stringify(data))
      if (Array.isArray(data.courses)) {
        setMycourses(data.courses);  // Use the courses array
      } else {
        console.error("Expected an array but got:", data);
        //setMycourses([]); // fallback to empty array to avoid crashes
      }
    } catch (error) {
      console.error("Error creating course:", error);
      proAlert.error("Something went wrong while loading your courses.");
    }
  };

  const getCourses = async () => {
    // Basic validation

    // Transform your state into the format expected by your backend

    try {
      const res = await fetch(`${config.BACKEND_URL}/api/courses/`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (handleUnauthorized(res, navigate, proAlert)) {
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to fetch courses");
      }

      const data = await res.json();
      // alert(JSON.stringify(data))
      if (Array.isArray(data.courses)) {
        setCoursess(data.courses);
      } else {
        console.error("Expected an array but got:", data);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      proAlert.error("Something went wrong while loading courses.");
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsPageLoading(true);
        await Promise.all([getUser(), getCourses()]);
      } finally {
        setIsPageLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const getJoinedCourses = async (user: User) => {
    try {
      const res = await fetch(`${config.BACKEND_URL}/api/courses/getjoinedcourses/${user.id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (handleUnauthorized(res, navigate, proAlert)) {
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to fetch courses");
      }

      const data = await res.json();

      if (Array.isArray(data.courses)) {
        setJoined(data.courses);

        if (data.courses.length === 0) {
          setProgress("0%");
        } else {
          const courses: Joined[] = data.courses;
          const total = courses.reduce<number>((sum, course) => {
            const num = parseFloat(course.progress || "0"); // Handle undefined/null
            return sum + (isNaN(num) ? 0 : num);
          }, 0);

          const average = total / data.courses.length; // ✅ Use data.courses directly
          setProgress(`${average.toFixed(2)}%`);
        }
      } else {
        console.error("Expected an array but got:", data);
      }
    } catch (error) {
      console.error("Error fetching joined courses:", error);
      proAlert.error("Something went wrong while fetching the joined courses.");
    }
  };

  const JoinCourse = async (course: Courses): Promise<boolean> => {
    if (!user) {
      proAlert.info("Please sign in before joining a course.");
      return false;
    }

    const payload = {
      userId: user.id,
      courseId: course.id,
    };

    try {
    const response = await fetch(`${config.BACKEND_URL}/api/courses/${course.id}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify(payload)
    });

      if (handleUnauthorized(response, navigate, proAlert)) {
        return false;
      }

      if (response.ok) {
        proAlert.success("Course joined successfully!");
        await getJoinedCourses(user);
        navigate(`/course/${course.id}`);
        return true;
      } else {
        const errorData = await response.json();
        console.error("Failed to join course:", errorData);
        proAlert.error("Failed to join course.");
      }
    } catch (error) {
      console.error("Error joining course:", error);
      proAlert.error("Something went wrong while joining the course.");
    }

    return false;
  };

  function getInitials(name: string): string {
    if (!name) return '';
    const words = name.trim().split(' ');
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  }

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Sample data
  // const userStats = {
  //   coursesEnrolled: 8,
  //   coursesCreated: 3,
  //   totalProgress: 64,
  //   currentStreak: 12
  // };

  // const courses = [
  //   {
  //     id: 1,
  //     title: "Advanced isiXhosa Grammar",
  //     description: "Master complex grammatical structures and cultural nuances",
  //     language: "isiXhosa",
  //     progress: 78,
  //     students: 245,
  //     rating: 4.8,
  //     category: "Grammar",
  //     isCreated: true,
  //     lastActivity: "2 hours ago",
  //     difficulty: "Advanced"
  //   },
  //   {
  //     id: 2,
  //     title: "Swahili for Business",
  //     description: "Professional communication in East African markets",
  //     language: "Swahili",
  //     progress: 45,
  //     students: 189,
  //     rating: 4.6,
  //     category: "Business",
  //     isCreated: false,
  //     lastActivity: "Yesterday",
  //     difficulty: "Intermediate"
  //   },
  //   {
  //     id: 3,
  //     title: "Shona Poetry & Literature",
  //     description: "Explore the rich literary tradition through classic works",
  //     language: "Shona",
  //     progress: 92,
  //     students: 156,
  //     rating: 4.9,
  //     category: "Literature",
  //     isCreated: true,
  //     lastActivity: "3 days ago",
  //     difficulty: "Advanced"
  //   },
  //   {
  //     id: 4,
  //     title: "Beginner Xitsonga Conversations",
  //     description: "Essential phrases for everyday communication",
  //     language: "Xitsonga",
  //     progress: 23,
  //     students: 78,
  //     rating: 4.5,
  //     category: "Conversation",
  //     isCreated: false,
  //     lastActivity: "1 week ago",
  //     difficulty: "Beginner"
  //   }
  // ];

  // const recentActivity = [
  //   { action: "Completed lesson", course: "Advanced isiXhosa Grammar", time: "2 hours ago" },
  //   { action: "Course published", course: "Shona Poetry & Literature", time: "1 day ago" },
  //   { action: "New student enrolled", course: "Advanced isiXhosa Grammar", time: "2 days ago" },
  //   { action: "Quiz completed", course: "Swahili for Business", time: "3 days ago" }
  // ];

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'my-courses', label: 'My Courses', icon: BookOpen },
    { id: 'created-courses', label: 'Created Courses', icon: Award },
    { id: 'community', label: 'Community', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  // const filteredCourses = courses.filter(course =>
  //   course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //   course.language.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //   course.category.toLowerCase().includes(searchQuery.toLowerCase())
  // );

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'text-green-400 bg-green-400/10';
      case 'Intermediate': return 'text-yellow-400 bg-yellow-400/10';
      case 'Advanced': return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const handleSidebarItemClick = (itemId: string) => {
    if (itemId === 'community') {
      navigate('/community');
    } else {
      setActiveTab(itemId);
    }
  };

  const filteredCourses = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    const normalizedDifficulty = difficultyFilter.trim().toLowerCase();

    return coursess.filter((course) => {
      const matchesDifficulty = !normalizedDifficulty
        || (course.level ? course.level.toLowerCase() === normalizedDifficulty : false);

      if (!normalizedSearch) {
        return matchesDifficulty;
      }

      const searchableFields = [course.title, course.description, course.level];
      const matchesSearch = searchableFields.some((field) =>
        typeof field === 'string' && field.toLowerCase().includes(normalizedSearch)
      );

      return matchesDifficulty && matchesSearch;
    });
  }, [coursess, difficultyFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 relative">
      {isPageLoading && <LoaderOverlay message="Loading dashboard..." />}
      {/* Header */}
      <header className={`sticky top-0 z-50 bg-slate-900/60 backdrop-blur-lg border-b border-white/10 transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              type="button"
              className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
            >
              OpenLingua
            </button>
            
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <button className="relative p-2 text-gray-400 hover:text-white transition-colors duration-200">
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-500 rounded-full"></span>
              </button>
              <button className="flex items-center space-x-3 bg-white/5 rounded-full px-4 py-2 border border-white/10 hover:border-white/20 transition-all duration-200">
               {user ? (
        <img
          src={user.avatar}
          alt="avatar"
          className="w-8 h-8 rounded-full object-cover"
        />
      ) : (
        <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full flex items-center justify-center text-white font-semibold text-sm">
          { init || "?"}
        </div>
      )}
                {user ? (
  <span className="text-white text-sm font-medium">
    {user.name}
  </span>
):null}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`w-64 min-h-screen bg-slate-900/50 backdrop-blur-lg border-r border-white/10 transition-all duration-1000 delay-200 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}>
          <div className="p-6">
            <nav className="space-y-2">
              {sidebarItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSidebarItemClick(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 hover:bg-white/5 ${
                      activeTab === item.id 
                        ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border border-cyan-500/30' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                    style={{ transitionDelay: `${index * 50}ms` }}
                  >
                    <Icon size={18} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>


            {/* Quick Actions */}
            <div className="mt-8 p-4 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-lg border border-cyan-500/20">
              <h3 className="text-white font-semibold mb-3">Quick Actions</h3>
              {
                user &&   <Link to={`/create/${user.id}`}>
              <button className="w-full flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-3 py-2 rounded-lg hover:shadow-lg transition-all duration-200 hover:scale-105">
                <Plus size={16} />
                <span className="text-sm font-medium">Create Course</span>
              </button>
              </Link>
              }
            
            </div>
          </div>

                    <Link to="/">
                        <button className={`bg-gradient-to-r m-16 from-cyan-500 to-purple-500 text-white px-6 py-2 rounded-full hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105 transform ${isVisible? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                            Log Out
                        </button>
                    </Link>
        </aside>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Stats Cards */}
          <div className={`grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 transition-all duration-1000 delay-400 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>

            {
              joined && ( <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:border-cyan-500/30 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Courses Enrolled</p>
                  <p className="text-white text-2xl font-bold">{joined.length}</p>
                </div>
                <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                  <BookOpen className="text-cyan-400" size={24} />
                </div>
              </div>
            </div>)
            }
           
            {
              mycourses && (<div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:border-purple-500/30 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Courses Created</p>
                  <p className="text-white text-2xl font-bold">{mycourses.length}</p>
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Award className="text-purple-400" size={24} />
                </div>
              </div>
            </div>)
            }

            
{
  progress && (<div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:border-green-500/30 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>

                  <p className="text-gray-400 text-sm font-medium">Avg Progress</p>
                  <p className="text-white text-2xl font-bold">{progress}</p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="text-green-400" size={24} />
                </div>
              </div>
            </div>)
}
            

           
          </div>

          {/* Search and Filters */}
          <div className={`mb-8 transition-all duration-1000 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200"
                />
              </div>
              
              <div className="flex space-x-3">
                
                
                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-all duration-200"
                >
                  <option value="">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>
          </div>

          {/* Course Grid */}
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 transition-all duration-1000 delay-600 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>

            {filteredCourses.length > 0 ? (
              filteredCourses.map((course, index) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  index={index}
                  user={user}
                  JoinCourse={JoinCourse}
                  isJoined={joined.some((joinedCourse) => joinedCourse.id === course.id)}
                  getDifficultyColor={getDifficultyColor}
                />
              ))
            ) : (
              <div className="col-span-full text-center text-gray-400 text-sm">
                {coursess.length === 0 ? 'No courses available yet.' : 'No courses match your filters.'}
              </div>
            )}
          </div>

          {/* Recent Activity 
          <div className={`bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6 transition-all duration-1000 delay-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <h2 className="text-white font-semibold text-xl mb-6">Recent Activity</h2>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg border border-white/5 hover:border-white/10 transition-all duration-200"
                >
                  <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-white text-sm">
                      <span className="font-medium">{activity.action}</span> in{" "}
                      <span className="text-cyan-300">{activity.course}</span>
                    </p>
                    <p className="text-gray-400 text-xs">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          */}
        </div>
      </div>
    </div>
  );
};

interface Courses {
  id: string;
  title: string;
  createdAt: string;
  description: string;
  level: string;
  // Add other fields if needed (like avatar, googleId, etc.)
}

type CourseCardProps = {
  course: Courses;
  index: number;
  user?: User | null;
  JoinCourse: (course: Courses) => Promise<boolean>;
  isJoined: boolean;
  getDifficultyColor: (level: string) => string;
};


  interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  // Add other fields if needed (like avatar, googleId, etc.)
}
interface Courses {
  id: string;
  title: string;
  createdAt: string;
  description: string;
  level: string;
  // Add other fields if needed (like avatar, googleId, etc.)
}
interface Joined {
  id: string;
  progress: string;
  // Add other fields if needed (like avatar, googleId, etc.)
}

const CourseCard: React.FC<CourseCardProps> = ({
  course,
  index,
  user,
  JoinCourse,
  isJoined,
  getDifficultyColor,
}) => {
const [joinedall, setJoinedall] = useState<Joined[]>([]);
const [joinedBoth, setJoinedBoth] = useState<Joined | null>(null);
const proAlert = useProAlert();
const navigate = useNavigate();
  const getJoinedCoursesUseridCourseid = async (user: User, course: Courses) => {
  try {
    const res = await fetch(`${config.BACKEND_URL}/api/courses/joined/${user.id}/${course.id}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
    });

    if (handleUnauthorized(res, navigate, proAlert)) {
      return null;
    }

    if (!res.ok) {
      throw new Error("Failed to fetch courses");
    }

    const data = await res.json();
if (data.joined) {
  setJoinedBoth(data.joined);
} else {
  setJoinedBoth(null); // not joined
}
   
    
  } catch (error) {
    console.error("Error fetching joined courses:", error);
    proAlert.error("Something went wrong while fetching the joined courses.");
  }
};
const getJoinedCoursesCourseid = async (course: Courses) => {
  try {
    const res = await fetch(`${config.BACKEND_URL}/api/courses/course/${course.id}`, {
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
//console.log("hjhjhjhjj",JSON.stringify(data))
 
        if (Array.isArray(data.joinedCourses)) {
      setJoinedall(data.joinedCourses);

     
    } else {
      console.error("Expected an array but got:", data);
    }

    
    
  } catch (error) {
    console.error("Error fetching joined courses:", error);
    proAlert.error("Something went wrong while fetching the joined courses.");
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
  useEffect(() => {
    if (user && course && isJoined) {
      getJoinedCoursesUseridCourseid(user, course);
    } else {
      setJoinedBoth(null);
    }
  }, [user, course, isJoined])
  useEffect(()=>{
getJoinedCoursesCourseid(course)
  },[course])

  const handleJoinClick = async () => {
    if (!user) {
      proAlert.info("Please sign in before joining a course.");
      return;
    }

    const joined = await JoinCourse(course);
    if (joined) {
      await getJoinedCoursesUseridCourseid(user, course);
      await getJoinedCoursesCourseid(course);
    }
  };
  return (
    <div
      style={{ transitionDelay: `${index * 100}ms` }}
      className="group bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 hover:border-cyan-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-cyan-500/10"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-white font-semibold text-lg group-hover:text-cyan-300 transition-colors duration-200">
                {course.title}
              </h3>
              {course.createdAt && (
                <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full border border-purple-500/30">
                  Created
                </span>
              )}
            </div>
            <p className="text-gray-400 text-sm mb-3 line-clamp-2">{course.description}</p>
          </div>
        </div>

        <div className="space-y-3">
          {!isJoined ? (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Progress</span>
                <span className="text-white font-medium">Enroll to progress</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: "0%" }}
                ></div>
              </div>
            </>
          ):(<>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Progress</span>
                <span className="text-white font-medium">{joinedBoth?.progress ?? "0%"}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${joinedBoth?.progress ?? "0%"}` }}
                ></div>
              </div>
            </>)}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              {
                joinedall ? (<div className="flex items-center space-x-1">
                <Users size={14} />
                <span>{joinedall.length}</span>
              </div>):(<div className="flex items-center space-x-1">
                <Users size={14} />
                <span>No enrolled students yet</span>
              </div>)
              }
              
              <div className="flex items-center space-x-1">
                <Star size={14} className="text-yellow-400" />
                <span>4.8</span>
              </div>
            </div>
            <span className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(course.level)}`}>
              {course.level}
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <span className="text-gray-400 text-xs"> {getRelativeTime(course.createdAt)}</span>
            {!isJoined ? (
              <button
                onClick={handleJoinClick}
                className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors duration-200"
              >
                Enroll →
              </button>
            
            ) : (
              <Link to={`/course/${course.id}`}>
                <button className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors duration-200">
                  View →
                </button>
              </Link>
               
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
