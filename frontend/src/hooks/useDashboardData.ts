import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { User, Course, EnrolledCourse, UserStats } from "../types/dashboard.types";
import { useProAlert } from "../context/ProAlertContext";
import { handleUnauthorized } from "../utils/handleUnauthorized";
import { apiFetch } from "../utils/api";

export const useDashboardData = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userInitials, setUserInitials] = useState("");
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);

  const navigate = useNavigate();
  const proAlert = useProAlert();

  const getInitials = (name: string): string => {
    if (!name) return "";
    const words = name.trim().split(" ");
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  const getUser = async () => {
    try {
      const res = await apiFetch("/api/auth/me", {
        method: "GET",
      });

      if (handleUnauthorized(res, navigate, proAlert)) {
        return;
      }

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Failed to fetch user. Status:", res.status, "Response:", errorText);
        throw new Error(`Failed to fetch current user: ${res.status}`);
      }

      const data = await res.json();
      setUser(data);
      setUserInitials(getInitials(data.name));

      await Promise.all([getMyCourses(data), getJoinedCourses(data)]);
    } catch (error) {
      console.error("Error fetching user:", error);
      proAlert.error("Failed to load user profile. Please try refreshing the page.");
    }
  };

  const getMyCourses = async (user: User) => {
    try {
      const res = await apiFetch(`/api/courses/getcourses/${user?.id}`, {
        method: "GET",
      });

      if (handleUnauthorized(res, navigate, proAlert)) {
        return;
      }

      if (!res.ok) {
        console.log(res.json());
        throw new Error("Failed to fetch my courses");
      }

      const data = await res.json();
      if (Array.isArray(data.courses)) {
        setMyCourses(data.courses);
      } else {
        console.error("Expected an array but got:", data);
      }
    } catch (error) {
      console.error("Error fetching my courses:", error);
      proAlert.error("Something went wrong while loading your courses.");
    }
  };

  const getCourses = async () => {
    try {
      const res = await apiFetch("/api/courses", {
        method: "GET",
      });

      if (handleUnauthorized(res, navigate, proAlert)) {
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to fetch courses");
      }

      const data = await res.json();
      if (Array.isArray(data.courses)) {
        setAllCourses(data.courses);
      } else {
        console.error("Expected an array but got:", data);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      proAlert.error("Something went wrong while loading courses.");
    }
  };

  const getJoinedCourses = async (user: User) => {
    try {
      const res = await apiFetch(`/api/courses/getjoinedcourses/${user.id}`, {
        method: "GET",
      });

      if (handleUnauthorized(res, navigate, proAlert)) {
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to fetch courses");
      }

      const data = await res.json();

      if (Array.isArray(data.courses)) {
        setEnrolledCourses(data.courses);
      } else {
        console.error("Expected an array but got:", data);
      }
    } catch (error) {
      console.error("Error fetching joined courses:", error);
      proAlert.error("Something went wrong while fetching the joined courses.");
    }
  };

  const JoinCourse = async (course: Course): Promise<boolean> => {
    if (!user) {
      proAlert.info("Please sign in before joining a course.");
      return false;
    }

    const payload = {
      userId: user.id,
      courseId: course.id,
    };

    try {
      const response = await apiFetch(`/api/courses/${course.id}/join`, {
        method: "POST",
        body: JSON.stringify(payload),
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

  const calculateStats = (): UserStats => {
    let avgProgress = "0%";

    if (enrolledCourses.length > 0) {
      const total = enrolledCourses.reduce<number>((sum, course) => {
        const progressStr = course.progress || "0%";
        const num = parseFloat(progressStr.replace("%", ""));
        return sum + (isNaN(num) ? 0 : num);
      }, 0);

      const average = total / enrolledCourses.length;
      avgProgress = `${average.toFixed(1)}%`;
    }

    return {
      coursesEnrolled: enrolledCourses.length,
      coursesCreated: myCourses.length,
      avgProgress,
    };
  };

  const resetUserData = () => {
    setUser(null);
    setUserInitials("");
    setMyCourses([]);
    setAllCourses([]);
    setEnrolledCourses([]);
  };

  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      try {
        setIsPageLoading(true);
        await getUser();
        if (isMounted) {
          await getCourses();
        }
      } finally {
        if (isMounted) {
          setIsPageLoading(false);
        }
      }
    };

    loadInitialData();

    // Listen for profile updates so different parts of the app can refresh user data
    const onUserUpdated = () => {
      getUser().catch((err) => console.error('Failed to refresh user after update', err));
    };
    window.addEventListener('user:updated', onUserUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener('user:updated', onUserUpdated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    user,
    userInitials,
    myCourses,
    allCourses,
    enrolledCourses,
    isPageLoading,
    stats: calculateStats(),
    JoinCourse,
    resetUserData,
    setIsPageLoading,
  };
};
