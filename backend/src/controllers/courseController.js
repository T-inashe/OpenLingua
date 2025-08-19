const { prisma } = require('../lib/prisma');

// Create a new course (instructor only)
const createCourse = async (req, res) => {
  try {
    const { title, description, language, level, requirements } = req.body;

    if (!title || !language) {
      return res.status(400).json({ error: "Title and language are required" });
    }

    const course = await prisma.course.create({
      data: {
        title,
        description,
        language,
        level,
        requirements,
        instructorId: req.user.userId
      }
    });

    res.status(201).json({ message: "Course created successfully", course });
  } catch (error) {
    console.error("Create course error:", error);
    res.status(500).json({ error: "Something went wrong creating course" });
  }
};

// Get all courses
const getCourses = async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      include: {
        instructor: { select: { id: true, name: true, email: true } }
      }
    });
    res.json({ courses });
  } catch (error) {
    res.status(500).json({ error: "Error fetching courses" });
  }
};

// Join a course
const joinCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    await prisma.userCourse.create({
      data: {
        userId: req.user.userId,
        courseId: parseInt(courseId)
      }
    });

    res.json({ message: "Joined course successfully" });
  } catch (error) {
    console.error("Join course error:", error);
    res.status(500).json({ error: "Could not join course" });
  }
};

// Leave a course
const leaveCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    await prisma.userCourse.deleteMany({
      where: {
        userId: req.user.userId,
        courseId: parseInt(courseId)
      }
    });

    res.json({ message: "Left course successfully" });
  } catch (error) {
    res.status(500).json({ error: "Could not leave course" });
  }
};

// Get details of a course
const getCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await prisma.course.findUnique({
      where: { id: parseInt(courseId) },
      include: {
        vocabulary: true,
        forumPosts: { include: { user: true, replies: true } }
      }
    });

    if (!course) return res.status(404).json({ error: "Course not found" });

    res.json({ course });
  } catch (error) {
    res.status(500).json({ error: "Error fetching course details" });
  }
};

module.exports = {
  createCourse,
  getCourses,
  joinCourse,
  leaveCourse,
  getCourseDetails
};
