const { Router } = require("express");
const { authenticate } = require("../middleware/auth");
const { cacheMiddleware, clearCachePattern } = require("../middleware/cache");
const { createCourse, getCourses, joinCourse, leaveCourse, getCourseDetails,getCoursesByUserId,getJoinedCoursesByUserId,getForumMessagesByCourseId,getJoinedCoursesByUserIdAndCourseId,
    getJoinedCoursesByCourseId,
    translateText,
    getCourseReviews,
    postCourseReview,
    updateCourse,
    deleteCourse,
    updateCourseProgress
} = require("../controllers/courseController");

const router = Router();

// Middleware to clear cache when courses are modified
const clearCourseCacheOnModify = (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (data) => {
    if (res.statusCode < 400) {
      clearCachePattern('/api/courses');
    }
    return originalJson(data);
  };
  next();
};

// Write operations (clear cache on success)
router.post("/", clearCourseCacheOnModify, createCourse);
router.patch("/:courseId", authenticate, clearCourseCacheOnModify, updateCourse);
router.delete("/:courseId", authenticate, clearCourseCacheOnModify, deleteCourse);
router.post("/:courseId/join", authenticate, clearCourseCacheOnModify, joinCourse);
router.post("/:courseId/leave", authenticate, clearCourseCacheOnModify, leaveCourse);
router.patch("/:courseId/progress", authenticate, clearCourseCacheOnModify, updateCourseProgress);
router.post('/reviews', authenticate, clearCourseCacheOnModify, postCourseReview);

// Read operations (with caching)
router.get("/", cacheMiddleware(120), getCourses); // Cache for 2 minutes
router.get('/getcourses/:userId', cacheMiddleware(60), getCoursesByUserId); // Cache for 1 minute
router.get('/getjoinedcourses/:userId', cacheMiddleware(30), getJoinedCoursesByUserId); // Cache for 30 seconds
router.get("/:courseId", authenticate, cacheMiddleware(60), getCourseDetails); // Cache for 1 minute
router.get('/course/:courseId', authenticate, cacheMiddleware(30), getJoinedCoursesByCourseId);
router.get('/joined/:userId/:courseId', authenticate, cacheMiddleware(30), getJoinedCoursesByUserIdAndCourseId);
router.get('/reviews/:courseId', cacheMiddleware(60), getCourseReviews); // Cache for 1 minute
router.get('/forum/:courseId/messages', cacheMiddleware(30), getForumMessagesByCourseId);

// No cache for translate
router.post("/translate", translateText);

module.exports = router;
