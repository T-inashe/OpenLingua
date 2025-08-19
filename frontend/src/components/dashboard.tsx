import { useState, useEffect } from "react";
import { Search, Plus, BookOpen, TrendingUp, Users, Star, Clock, Award, Settings, Bell } from "lucide-react";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Sample data
  const userStats = {
    coursesEnrolled: 8,
    coursesCreated: 3,
    totalProgress: 64,
    currentStreak: 12
  };

  const courses = [
    {
      id: 1,
      title: "Advanced isiXhosa Grammar",
      description: "Master complex grammatical structures and cultural nuances",
      language: "isiXhosa",
      progress: 78,
      students: 245,
      rating: 4.8,
      category: "Grammar",
      isCreated: true,
      lastActivity: "2 hours ago",
      difficulty: "Advanced"
    },
    {
      id: 2,
      title: "Swahili for Business",
      description: "Professional communication in East African markets",
      language: "Swahili",
      progress: 45,
      students: 189,
      rating: 4.6,
      category: "Business",
      isCreated: false,
      lastActivity: "Yesterday",
      difficulty: "Intermediate"
    },
    {
      id: 3,
      title: "Shona Poetry & Literature",
      description: "Explore the rich literary tradition through classic works",
      language: "Shona",
      progress: 92,
      students: 156,
      rating: 4.9,
      category: "Literature",
      isCreated: true,
      lastActivity: "3 days ago",
      difficulty: "Advanced"
    },
    {
      id: 4,
      title: "Beginner Xitsonga Conversations",
      description: "Essential phrases for everyday communication",
      language: "Xitsonga",
      progress: 23,
      students: 78,
      rating: 4.5,
      category: "Conversation",
      isCreated: false,
      lastActivity: "1 week ago",
      difficulty: "Beginner"
    }
  ];

  const recentActivity = [
    { action: "Completed lesson", course: "Advanced isiXhosa Grammar", time: "2 hours ago" },
    { action: "Course published", course: "Shona Poetry & Literature", time: "1 day ago" },
    { action: "New student enrolled", course: "Advanced isiXhosa Grammar", time: "2 days ago" },
    { action: "Quiz completed", course: "Swahili for Business", time: "3 days ago" }
  ];

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'my-courses', label: 'My Courses', icon: BookOpen },
    { id: 'created-courses', label: 'Created Courses', icon: Award },
    { id: 'community', label: 'Community', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.language.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'text-green-400 bg-green-400/10';
      case 'Intermediate': return 'text-yellow-400 bg-yellow-400/10';
      case 'Advanced': return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Header */}
      <header className={`sticky top-0 z-50 bg-slate-900/60 backdrop-blur-lg border-b border-white/10 transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              OpenLingua
            </div>
            
            <div className="flex items-center space-x-6">
              <button className="relative p-2 text-gray-400 hover:text-white transition-colors duration-200">
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-500 rounded-full"></span>
              </button>
              <button className="flex items-center space-x-3 bg-white/5 rounded-full px-4 py-2 border border-white/10 hover:border-white/20 transition-all duration-200">
                <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  TN
                </div>
                <span className="text-white text-sm font-medium">Tinashe Nganadange</span>
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
                    onClick={() => setActiveTab(item.id)}
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
              <button className="w-full flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-3 py-2 rounded-lg hover:shadow-lg transition-all duration-200 hover:scale-105">
                <Plus size={16} />
                <span className="text-sm font-medium">Create Course</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Stats Cards */}
          <div className={`grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 transition-all duration-1000 delay-400 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:border-cyan-500/30 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Courses Enrolled</p>
                  <p className="text-white text-2xl font-bold">{userStats.coursesEnrolled}</p>
                </div>
                <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                  <BookOpen className="text-cyan-400" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:border-purple-500/30 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Courses Created</p>
                  <p className="text-white text-2xl font-bold">{userStats.coursesCreated}</p>
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Award className="text-purple-400" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:border-green-500/30 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Avg Progress</p>
                  <p className="text-white text-2xl font-bold">{userStats.totalProgress}%</p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="text-green-400" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:border-orange-500/30 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Current Streak</p>
                  <p className="text-white text-2xl font-bold">{userStats.currentStreak} days</p>
                </div>
                <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <Clock className="text-orange-400" size={24} />
                </div>
              </div>
            </div>
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
                <select className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-all duration-200">
                  <option value="">All Languages</option>
                  <option value="isixhosa">isiXhosa</option>
                  <option value="swahili">Swahili</option>
                  <option value="shona">Shona</option>
                  <option value="xitsonga">Xitsonga</option>
                </select>
                
                <select className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-all duration-200">
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
            {filteredCourses.map((course, index) => (
              <div
                key={course.id}
                style={{transitionDelay: `${index * 100}ms`}}
                className="group bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 hover:border-cyan-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-cyan-500/10"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-white font-semibold text-lg group-hover:text-cyan-300 transition-colors duration-200">
                          {course.title}
                        </h3>
                        {course.isCreated && (
                          <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full border border-purple-500/30">
                            Created
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                        {course.description}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-white font-medium">{course.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${course.progress}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Users size={14} />
                          <span>{course.students}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star size={14} className="text-yellow-400" />
                          <span>{course.rating}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(course.difficulty)}`}>
                        {course.difficulty}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <span className="text-gray-400 text-xs">{course.lastActivity}</span>
                      <button className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors duration-200">
                        Continue →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Activity */}
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
        </div>
      </div>
    </div>
  );
};

export default Dashboard;