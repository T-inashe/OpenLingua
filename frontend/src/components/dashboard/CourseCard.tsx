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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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

  const handleJoinClick = async () => {
    if (!user) {
      proAlert.info("Please sign in before joining a course.");
      return;
    }

    const joined = await JoinCourse(course);
    if (joined) {
      await getJoinedCoursesCourseid(course);
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

  console.log("🎨 CourseCard:", {
    courseTitle: course.title,
    courseInstructorId: course.instructorId,
    userId: user?.id,
    isOwner: isOwner,
  });

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
              {isOwner && (
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
          ) : (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Progress</span>
                <span className="text-white font-medium">{enrollmentProgress}</span>
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
            <div className="flex items-center space-x-4 text-sm text-gray-400">
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
                <Star size={14} className="text-yellow-400" />
                <span>4.8</span>
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

          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <span className="text-gray-400 text-xs">
              {getRelativeTime(course.createdAt)}
            </span>
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
            {isOwner && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleEdit}
                  className="text-yellow-400 hover:text-yellow-300 text-sm font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={handleDeleteClick}
                  className="text-red-400 hover:text-red-300 text-sm font-medium"
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
          <div className="bg-slate-900/90 border border-red-500/30 rounded-2xl px-8 py-6 max-w-md w-full text-center shadow-xl">
            <h3 className="text-xl font-semibold text-white mb-3">Delete Course?</h3>
            <p className="text-sm text-gray-300 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-cyan-300">{course.title}</span>? This
              action cannot be undone and all course data will be permanently removed.
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/10 rounded-lg hover:bg-white/15 transition-colors"
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
