const { Router } = require("express");
const { authenticate } = require("../middleware/auth");
const { createCourse, getCourses, joinCourse, leaveCourse, getCourseDetails } = require("../controllers/courseController");

const router = Router();

router.post("/", authenticate, createCourse);
router.get("/", getCourses);
router.get("/:courseId", authenticate, getCourseDetails);
router.post("/:courseId/join", authenticate, joinCourse);
router.post("/:courseId/leave", authenticate, leaveCourse);

module.exports = router;
