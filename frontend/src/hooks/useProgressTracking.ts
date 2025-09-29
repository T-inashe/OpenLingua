import { useState, useEffect, useMemo } from 'react';
import config from '../config';
import type { CourseUnit, QuizResponses } from '../types/course';

export const useProgressTracking = (
  currentUserId: string | null, 
  courseId: string | null, 
  unitsToRender: CourseUnit[]
) => {
  const [completedLessons, setCompletedLessons] = useState<Record<string, boolean>>({});
  const [quizResponses, setQuizResponses] = useState<QuizResponses>({});

  const lessonIds = useMemo(() => {
    return unitsToRender.flatMap((unit) => unit.lessons.map((lesson) => lesson.id));
  }, [unitsToRender]);

  const storageKey = useMemo(() => {
    if (!currentUserId || !courseId) return null;
    return `course-progress-${currentUserId}-${courseId}`;
  }, [currentUserId, courseId]);

  const calculateProgress = (state: Record<string, boolean>) => {
    if (lessonIds.length === 0) return 0;
    const completedCount = lessonIds.filter((id) => state[id]).length;
    return Math.round((completedCount / lessonIds.length) * 100);
  };

  const updateProgressOnServer = async (progressValue: number) => {
    if (!courseId || !currentUserId) return;
    try {
      await fetch(`${config.BACKEND_URL}/api/courses/${courseId}/progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ progress: progressValue }),
      });
    } catch (error) {
      console.error('Failed to update course progress', error);
    }
  };

  const toggleLessonDone = (lessonId: string) => {
    setCompletedLessons(prev => {
      const newState = {
        ...prev,
        [lessonId]: !prev[lessonId]
      };
      
      if (storageKey) {
        localStorage.setItem(storageKey, JSON.stringify(newState));
        const progress = calculateProgress(newState);
        updateProgressOnServer(progress);
      }
      
      return newState;
    });
  };

  const updateQuizResponses = (lessonId: string, responses: Record<string, { selectedOptionId: number; isCorrect: boolean }>) => {
    setQuizResponses(prev => ({
      ...prev,
      [lessonId]: responses
    }));
  };

  useEffect(() => {
    if (!storageKey) {
      setCompletedLessons({});
      return;
    }

    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Record<string, boolean>;
        const filtered: Record<string, boolean> = {};
        lessonIds.forEach((lessonId) => {
          if (parsed[lessonId]) {
            filtered[lessonId] = true;
          }
        });
        setCompletedLessons(filtered);
        const initialProgress = calculateProgress(filtered);
        updateProgressOnServer(initialProgress);
      } catch (error) {
        console.error('Failed to parse stored progress', error);
        setCompletedLessons({});
        updateProgressOnServer(0);
      }
    } else {
      setCompletedLessons({});
      updateProgressOnServer(0);
    }
  }, [storageKey, lessonIds]);

  return {
    completedLessons,
    quizResponses,
    toggleLessonDone,
    updateQuizResponses,
    calculateProgress: () => calculateProgress(completedLessons)
  };
};