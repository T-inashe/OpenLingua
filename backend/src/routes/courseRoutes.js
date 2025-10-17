const { Router } = require("express");
const { authenticate } = require("../middleware/auth");
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

router.post("/", createCourse);
router.get("/", getCourses);
router.get("/:courseId", authenticate, getCourseDetails);
router.patch("/:courseId", authenticate, updateCourse);
router.delete("/:courseId", authenticate, deleteCourse);
router.patch("/:courseId/progress", authenticate, updateCourseProgress);
router.post("/:courseId/join", authenticate, joinCourse);
router.post("/:courseId/leave", authenticate, leaveCourse);
router.get('/getcourses/:userId', getCoursesByUserId);
router.get('/getjoinedcourses/:userId', getJoinedCoursesByUserId);
router.get('/forum/:courseId/messages', getForumMessagesByCourseId);
router.get('/joined/:userId/:courseId',authenticate, getJoinedCoursesByUserIdAndCourseId);
router.get('/course/:courseId',authenticate, getJoinedCoursesByCourseId);
router.get('/reviews/:courseId',getCourseReviews);
router.post('/reviews',authenticate,postCourseReview);
router.post("/translate", translateText);

module.exports = router;
