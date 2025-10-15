import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../config';
import type { Course, Forum, Review, User } from '../types/course';
import { useProAlert } from '../context/ProAlertContext';
import { handleUnauthorized } from '../utils/handleUnauthorized';

export const useCourseData = (courseId: string | undefined) => {
  const [course, setCourse] = useState<Course | null>(null);
  const navigate = useNavigate();
  const proAlert = useProAlert();

  const getCourse = async () => {
    if (!courseId) return;

    try {
      const res = await fetch(`${config.BACKEND_URL}/api/courses/${courseId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
      });

      if (handleUnauthorized(res, navigate, proAlert)) {
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to fetch course");
      }

      const data = await res.json();
      setCourse(data.course);
    } catch (error) {
      console.error("Error fetching course:", error);
      proAlert.error("Something went wrong while loading the course.");
    }
  };

  useEffect(() => {
    getCourse();
  }, [courseId]);

  const unitsToRender = useMemo(() => {
    if (!course) return [];
    
    return course.units && course.units.length > 0
      ? course.units
      : course.words
      ? [
          {
            id: "legacy",
            title: "Course Content",
            description: "",
            position: 0,
            lessons: course.words.map((word, index) => ({
              id: `${word.title}-${index}`,
              title: word.title,
              content: word.content,
              type: (word.type || "text").toLowerCase(),
              duration: word.duration ? Number(word.duration) || null : null,
              position: index
            }))
          }
        ]
      : [];
  }, [course]);

  return { course, unitsToRender, refetchCourse: getCourse };
};

export const useForumData = (courseId: string | undefined) => {
  const [forums, setForums] = useState<Forum[]>([]);
  const navigate = useNavigate();
  const proAlert = useProAlert();

  const getForum = async () => {
    if (!courseId) return;

    try {
      const res = await fetch(`${config.BACKEND_URL}/api/forum/${courseId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
      });

      if (handleUnauthorized(res, navigate, proAlert)) {
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to fetch forum");
      }

      const data = await res.json();
      setForums(data.posts);
    } catch (error) {
      console.error("Error fetching forum:", error);
      proAlert.error("Something went wrong while loading the forum posts.");
    }
  };

  const createForum = async (message: string, userId: string) => {
    if (!courseId) return;

    const payload = {
      content: message,
      userId: userId,
    };

    try {
      const response = await fetch(`${config.BACKEND_URL}/api/forum/${courseId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (handleUnauthorized(response, navigate, proAlert)) {
        return;
      }

      if (response.ok) {
        proAlert.success("Forum post created successfully!");
        await getForum();
      } else {
        const errorData = await response.json();
        console.error("Failed to create forum:", errorData);
        proAlert.error("Failed to create forum.");
      }
    } catch (error) {
      console.error("Error creating forum:", error);
      proAlert.error("Something went wrong while creating the forum.");
    }
  };

  useEffect(() => {
    getForum();
  }, [courseId]);

  return { forums, createForum, refetchForum: getForum };
};

export const useReviewData = (courseId: string | undefined) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const navigate = useNavigate();
  const proAlert = useProAlert();

  const getReviews = async () => {
    if (!courseId) return;

    try {
      const res = await fetch(`${config.BACKEND_URL}/api/courses/reviews/${courseId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
      });

      if (handleUnauthorized(res, navigate, proAlert)) {
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to fetch reviews");
      }

      const data = await res.json();
      setReviews(data.reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      proAlert.error("Something went wrong while loading the course reviews.");
    }
  };

  const createReview = async (reviewText: string, rating: number, userId: string) => {
    if (!courseId) return;

    const payload = {
      courseId: courseId,
      review: reviewText,
      rating: rating,
      userId: userId,
    };

    try {
      const response = await fetch(`${config.BACKEND_URL}/api/courses/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (handleUnauthorized(response, navigate, proAlert)) {
        return;
      }

      if (response.ok) {
        proAlert.success("Review submitted successfully!");
        await getReviews();
      } else {
        const errorData = await response.json();
        console.error("Failed to create review:", errorData);
        proAlert.error("Failed to create review.");
      }
    } catch (error) {
      console.error("Error creating review:", error);
      proAlert.error("Something went wrong while submitting the review.");
    }
  };

  const toggleReviewHelpful = (reviewId: string) => {
    setReviews(prev => prev.map(r => {
      if (r.id !== reviewId) return r;
      const next = !r.userMarkedHelpful;
      return {
        ...r,
        userMarkedHelpful: next,
        helpfulCount: Math.max(0, r.helpfulCount + (next ? 1 : -1))
      };
    }));
  };

  useEffect(() => {
    getReviews();
  }, [courseId]);

  return { reviews, createReview, toggleReviewHelpful, refetchReviews: getReviews };
};

export const useCurrentUser = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const proAlert = useProAlert();

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch(`${config.BACKEND_URL}/api/auth/me/`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include"
      });

      if (handleUnauthorized(res, navigate, proAlert)) {
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to fetch current user");
      }

      const data = await res.json();
      setCurrentUser(data.user);
    } catch (error) {
      console.error("Error fetching current user:", error);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  return { currentUser, refetchUser: fetchCurrentUser };
};