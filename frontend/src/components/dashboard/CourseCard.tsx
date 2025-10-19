import { useState, useEffect } from "react";
import { Users, Star } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { Course, EnrolledCourse, User } from "../../types/dashboard.types";
import { useProAlert } from "../../context/ProAlertContext";
import { handleUnauthorized } from "../../utils/handleUnauthorized";
import { apiFetch } from "../../utils/api";

interface CourseCardProps {
  course: Course;
  index: number;
  user?: User | null;
  JoinCourse: (course: Course) => Promise<boolean>;
  isJoined: boolean;
  getDifficultyColor: (level: string) => string;
  isOwner?: boolean;
  enrollmentProgress?: string;
}

const CourseCard = ({
  course,
  index,
  user,
  JoinCourse,
  isJoined,
  getDifficultyColor,
  isOwner = false,
  enrollmentProgress = "0%",
}: CourseCardProps) => {
  const [joinedStudents, setJoinedStudents] = useState<EnrolledCourse[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState<number>(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const proAlert = useProAlert();
  const navigate = useNavigate();

  const getJoinedCoursesCourseid = async (course: Course) => {
    try {
      const res = await apiFetch(`/api/courses/course/${course.id}`, {
        method: "GET",
      });

      if (handleUnauthorized(res, navigate, proAlert)) {
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to fetch courses");
      }

      const data = await res.json();

      if (Array.isArray(data.joinedCourses)) {
        setJoinedStudents(data.joinedCourses);
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
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

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
    let isMounted = true;
    
    const fetchStudents = async () => {
      await getJoinedCoursesCourseid(course);
    };
    
    if (isMounted) {
      fetchStudents();
    }

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course.id]); // Only re-fetch when course ID changes, not the entire course object

  // Fetch reviews to compute average rating for display on the card
  useEffect(() => {
    let cancelled = false;

    const fetchRatings = async () => {
      try {
        const res = await apiFetch(`/api/courses/reviews/${course.id}?limit=100`, { method: 'GET' });
        if (!res.ok) return;
        const data = await res.json();
        const reviews = data.reviews || [];
        if (reviews.length === 0) {
          if (!cancelled) {
            setAvgRating(null);
            setReviewCount(0);
          }
          return;
        }

        const total = reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0);
        const avg = total / reviews.length;
        if (!cancelled) {
          setAvgRating(avg);
          setReviewCount(reviews.length);
        }
      } catch (err) {
        console.error('Failed to load course ratings', err);
      }
    };

    fetchRatings();

    return () => { cancelled = true; };
  }, [course.id]);

  const handleJoinClick = async () => {
    if (!user) {
      proAlert.info("Please sign in before joining a course.");
      return;
    }

    setIsEnrolling(true);
    try {
      const joined = await JoinCourse(course);
      if (joined) {
        await getJoinedCoursesCourseid(course);
      }
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleEdit = async () => {
    navigate(`/create/${user?.id}?edit=${course.id}`);
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setShowDeleteModal(false);
    try {
      const res = await apiFetch(`/api/courses/${course.id}`, {
        method: "DELETE",
      });

      if (handleUnauthorized(res, navigate, proAlert)) return;

      if (!res.ok) {
        const err = await res.json();
        proAlert.error(err?.error || "Failed to delete course");
        return;
      }

      proAlert.success("Course deleted successfully");
      window.location.reload();
    } catch (error) {
      console.error("Delete error", error);
      proAlert.error("Failed to delete course");
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
  };

  return (
    <div
      style={{ transitionDelay: `${index * 100}ms` }}
      className="group bg-gradient-to-br from-gray-50 to-gray-100 dark:bg-gradient-to-br dark:from-purple-900/50 dark:to-indigo-900/50 backdrop-blur-lg rounded-xl border border-gray-200 dark:border-white/10 hover:border-cyan-500/50 dark:hover:border-cyan-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-cyan-500/10"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-gray-900 dark:text-white font-semibold text-lg group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors duration-200">
                {course.title}
              </h3>
              {isOwner && (
                <span className="px-2 py-1 bg-purple-500/20 text-purple-700 dark:text-purple-300 text-xs rounded-full border border-purple-500/30">
                  Created
                </span>
              )}
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
              {course.description}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {!isJoined ? (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Progress</span>
                <span className="text-gray-900 dark:text-white font-medium">Enroll to progress</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: "0%" }}
                ></div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Progress</span>
                <span className="text-gray-900 dark:text-white font-medium">{enrollmentProgress}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: enrollmentProgress }}
                ></div>
              </div>
            </>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              {joinedStudents.length > 0 ? (
                <div className="flex items-center space-x-1">
                  <Users size={14} />
                  <span>{joinedStudents.length}</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1">
                  <Users size={14} />
                  <span>No enrolled students yet</span>
                </div>
              )}

              <div className="flex items-center space-x-1">
                <Star size={14} className="text-yellow-500 dark:text-yellow-400" />
                <span>{avgRating !== null ? avgRating.toFixed(1) : '—'}</span>
                {reviewCount > 0 && <span className="text-xs text-gray-400 ml-2">({reviewCount})</span>}
              </div>
            </div>
            <span
              className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(
                course.level
              )}`}
            >
              {course.level}
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-white/10">
            <span className="text-gray-500 dark:text-gray-400 text-xs">
              {getRelativeTime(course.createdAt)}
            </span>
            {!isJoined ? (
              <button
                onClick={handleJoinClick}
                disabled={isEnrolling}
                className={`text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 text-sm font-medium transition-colors duration-200 flex items-center gap-2 ${
                  isEnrolling ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isEnrolling ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-cyan-600 dark:text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Enrolling...</span>
                  </>
                ) : (
                  "Enroll →"
                )}
              </button>
            ) : (
              <Link to={`/course/${course.id}`}>
                <button className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 text-sm font-medium transition-colors duration-200">
                  View →
                </button>
              </Link>
            )}
            {isOwner && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleEdit}
                  className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 text-sm font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={handleDeleteClick}
                  className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900/90 border border-red-500/30 rounded-2xl px-8 py-6 max-w-md w-full text-center shadow-xl">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Delete Course?</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-cyan-600 dark:text-cyan-300">{course.title}</span>? This
              action cannot be undone and all course data will be permanently removed.
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/10 rounded-lg hover:bg-gray-200 dark:hover:bg-white/15 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 rounded-lg hover:opacity-90 transition-opacity"
              >
                Delete Course
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseCard;
