/**
 * @file quizApi.test.ts
 */
import {
  createQuiz,
  getCourseQuizzes,
  getQuiz,
  submitQuizAttempt,
  getQuizAttempts,
  updateQuiz,
  deleteQuiz
} from '../../src/services/quizApi';
import config from "../../src/config";

// Mock fetch globally
global.fetch = jest.fn();

const mockFetch = global.fetch as jest.Mock;

describe("Quiz API client", () => {
  const courseId = "course123";
  const quizId = "quiz456";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ✅ Test createQuiz
  describe("createQuiz", () => {
    const quizData = { title: "Test Quiz", questions: [], passingScore:50 };

    test("successfully creates quiz", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "q1", ...quizData }),
      });

      const result = await createQuiz(courseId, quizData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/courses/${courseId}/quizzes`),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(quizData),
        })
      );
      expect(result.id).toBe("q1");
    });

    test("throws error on failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Invalid quiz" }),
      });

      await expect(createQuiz(courseId, quizData)).rejects.toThrow("Invalid quiz");
    });
  });

  // ✅ Test getCourseQuizzes
  describe("getCourseQuizzes", () => {
    test("returns quiz list", async () => {
      const quizzes = [{ id: "1" }, { id: "2" }];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => quizzes,
      });

      const result = await getCourseQuizzes(courseId);
      expect(result).toEqual(quizzes);
    });

    test("throws error if response not ok", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Failed" }),
      });

      await expect(getCourseQuizzes(courseId)).rejects.toThrow("Failed");
    });
  });

  // ✅ Test getQuiz
  describe("getQuiz", () => {
    test("returns quiz", async () => {
      const quiz = { id: quizId, title: "Sample" };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => quiz,
      });

      const result = await getQuiz(courseId, quizId);
      expect(result).toEqual(quiz);
    });
  });

  // ✅ Test submitQuizAttempt
  describe("submitQuizAttempt", () => {
    const attempt = {
      answers: { q1: "A" },
      startedAt: "2025-01-01T00:00:00Z",
      completedAt: "2025-01-01T00:10:00Z",
    };

    test("submits successfully", async () => {
      const mockResponse = { id: "attempt1", score: 90 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await submitQuizAttempt(
        courseId,
        quizId,
        attempt.answers,
        attempt.startedAt,
        attempt.completedAt
      );

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/courses/${courseId}/quizzes/${quizId}/attempts`),
        expect.objectContaining({ method: "POST" })
      );
      expect(result).toEqual(mockResponse);
    });

    test("throws error if submission fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Submission failed" }),
      });

      await expect(
        submitQuizAttempt(
          courseId,
          quizId,
          attempt.answers,
          attempt.startedAt,
          attempt.completedAt
        )
      ).rejects.toThrow("Submission failed");
    });
  });

  // ✅ Test getQuizAttempts
  describe("getQuizAttempts", () => {
    test("fetches attempts for a user", async () => {
      const data = { attempts: [], maxAttempts: 3, attemptsRemaining: 2 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => data,
      });

      const result = await getQuizAttempts(courseId, quizId, "user1");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`userId=user1`),
        expect.any(Object)
      );
      expect(result).toEqual(data);
    });

    test("throws error if fetch fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Fetch failed" }),
      });

      await expect(getQuizAttempts(courseId, quizId)).rejects.toThrow("Fetch failed");
    });
  });

  // ✅ Test updateQuiz
  describe("updateQuiz", () => {
    test("updates quiz successfully", async () => {
      const updates = { title: "Updated Title" };
      const updatedQuiz = { id: quizId, ...updates };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => updatedQuiz,
      });

      const result = await updateQuiz(courseId, quizId, updates);
      expect(result).toEqual(updatedQuiz);
    });

    test("throws error if update fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Update failed" }),
      });

      await expect(updateQuiz(courseId, quizId, {})).rejects.toThrow("Update failed");
    });
  });

  // ✅ Test deleteQuiz
  describe("deleteQuiz", () => {
    test("deletes quiz successfully", async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });
      await expect(deleteQuiz(courseId, quizId)).resolves.toBeUndefined();
    });

    test("throws error if delete fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Delete failed" }),
      });

      await expect(deleteQuiz(courseId, quizId)).rejects.toThrow("Delete failed");
    });
  });
});
