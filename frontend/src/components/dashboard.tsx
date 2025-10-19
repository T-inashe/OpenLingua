import { useState, useEffect, useMemo } from "react";
import { BookOpen, TrendingUp, Users, Award, Settings } from "lucide-react";
import LoaderOverlay from "./ui/LoaderOverlay";
import DashboardHeader from "./dashboard/DashboardHeader";
import DashboardSidebar from "./dashboard/DashboardSidebar";
import DashboardStats from "./dashboard/DashboardStats";
import CourseFilters from "./dashboard/CourseFilters";
import DashboardSettings from "./dashboard/DashboardSettings";
import CourseCard from "./dashboard/CourseCard";
import { useDashboardData } from "../hooks/useDashboardData";
import type { SidebarItem } from "../types/dashboard.types";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [sortBy, setSortBy] = useState<string>("recent");
  const [isVisible, setIsVisible] = useState(false);

  const {
    user,
    userInitials,
    myCourses,
    allCourses,
    enrolledCourses,
    isPageLoading,
    stats,
    JoinCourse,
    resetUserData,
  } = useDashboardData();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const sidebarItems: SidebarItem[] = [
    { id: "overview", label: "Overview", icon: TrendingUp },
    { id: "my-courses", label: "My Courses", icon: BookOpen },
    { id: "created-courses", label: "Created Courses", icon: Award },
    { id: "community", label: "Community", icon: Users },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "text-green-400 bg-green-400/10";
      case "Intermediate":
        return "text-yellow-400 bg-yellow-400/10";
      case "Advanced":
        return "text-red-400 bg-red-400/10";
      default:
        return "text-gray-400 bg-gray-400/10";
    }
  };

  const filteredCourses = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    const normalizedDifficulty = difficultyFilter.trim().toLowerCase();

    // Use a Set to track unique course IDs and prevent duplicates
    const uniqueCourseIds = new Set<string>();
    
    return allCourses.filter((course) => {
      // Skip if we've already included this course
      if (uniqueCourseIds.has(course.id)) {
        return false;
      }
      
      const matchesDifficulty =
        !normalizedDifficulty ||
        (course.level ? course.level.toLowerCase() === normalizedDifficulty : false);

      if (!normalizedSearch) {
        if (matchesDifficulty) {
          uniqueCourseIds.add(course.id);
          return true;
        }
        return false;
      }

      const searchableFields = [course.title, course.description, course.level];
      const matchesSearch = searchableFields.some(
        (field) => typeof field === "string" && field.toLowerCase().includes(normalizedSearch)
      );

      const matches = matchesDifficulty && matchesSearch;
      if (matches) {
        uniqueCourseIds.add(course.id);
      }
      return matches;
    });
  }, [allCourses, difficultyFilter, searchQuery]);

  // Apply sorting after filtering
  const sortedCourses = useMemo(() => {
    const copy = [...filteredCourses];
    if (sortBy === 'enrolled') {
      // courses may have _count.enrollments from backend; otherwise fallback to 0
      copy.sort((a, b) => {
        const aCount = (a as any)._count?.enrollments || 0;
        const bCount = (b as any)._count?.enrollments || 0;
        return bCount - aCount; // descending
      });
    } else {
      // recent: sort by createdAt desc
      copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return copy;
  }, [filteredCourses, sortBy]);

  const handleLogoutSuccess = () => {
    resetUserData();
  };

  const renderCourseGrid = () => {
    // For the main overview tab use the pre-sorted list, otherwise fall back to
    // enrolled/my-created lists as before.
    let coursesToRender = activeTab === 'overview' ? sortedCourses : filteredCourses;
    let emptyMessage = "No courses available yet.";

    if (activeTab === "my-courses") {
      coursesToRender = enrolledCourses;
      emptyMessage = "You haven't enrolled in any courses yet.";
    } else if (activeTab === "created-courses") {
      coursesToRender = myCourses;
      emptyMessage = "You haven't created any courses yet.";
    } else if (filteredCourses.length === 0 && allCourses.length > 0) {
      emptyMessage = "No courses match your filters.";
    }

    if (coursesToRender.length === 0) {
      return (
        <div className="col-span-full text-center text-gray-600 dark:text-gray-400 text-sm">{emptyMessage}</div>
      );
    }

    return coursesToRender.map((course, index) => {
      const enrollment = enrolledCourses.find((j) => j.id === course.id);
      const isOwner = !!(user && user.id === course.instructorId);
      const isJoined = !!enrollment || activeTab === "my-courses";
      const enrollmentProgress = enrollment?.progress || (course as any).progress || "0%";

      return (
        <CourseCard
          key={course.id}
          course={course}
          index={index}
          user={user}
          JoinCourse={JoinCourse}
          isJoined={isJoined}
          getDifficultyColor={getDifficultyColor}
          isOwner={isOwner}
          enrollmentProgress={enrollmentProgress}
        />
      );
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-950 dark:via-purple-950 dark:to-slate-950 relative">
      {isPageLoading && <LoaderOverlay message="Loading dashboard..." />}

      <DashboardHeader user={user} userInitials={userInitials} isVisible={isVisible} />

      <div className="flex">
        <DashboardSidebar
          activeTab={activeTab}
          sidebarItems={sidebarItems}
          user={user}
          isVisible={isVisible}
          onTabChange={setActiveTab}
          onLogoutSuccess={handleLogoutSuccess}
        />

        <div className="flex-1 p-6">
          <DashboardStats stats={stats} isVisible={isVisible} />

          <CourseFilters
            searchQuery={searchQuery}
            difficultyFilter={difficultyFilter}
            sortBy={sortBy}
            onSearchChange={setSearchQuery}
            onDifficultyChange={setDifficultyFilter}
            onSortChange={setSortBy}
            isVisible={isVisible}
          />

          <div
            className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 transition-all duration-1000 delay-600 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
          >
            {activeTab === 'settings' ? (
              <div className="col-span-full">
                <DashboardSettings />
              </div>
            ) : (
              renderCourseGrid()
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;