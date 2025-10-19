const prisma = require('../lib/prisma');

const apiKey = " AIzaSyBS5OACi5JlNTgdLAYNFILd3T8IcYysJOA"; // replace with your real API key

const translateText = async (req, res) => {
  try {
    const { q, source, target } = req.body;

    if (!q || !source || !target) {
      return res.status(400).json({ error: "Missing required fields: q, source, target" });
    }

    // Build REST API URL manually
    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q,
        source,
        target,
        format: "text",
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(JSON.stringify(data.error));
    }

    res.json({ translatedText: data.data.translations[0].translatedText });
  } catch (error) {
    console.error("Translation error:", error);
    res.status(500).json({ error: "Translation service failed" });
  }
};
const createCourse = async (req, res) => {
  try {
    const {
      title,
      description,
      language,
      level,
      category,
      hours,
      public, // Or use a toggle if you have one
      community,
      discussions, // Set default or get from user
      info,
      instructorId,
      units = []
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: "Title and description are required" });
    }

    // Check if a course with the same title already exists (case-insensitive)
    const existingCourse = await prisma.course.findFirst({
      where: {
        title: {
          equals: title,
          mode: 'insensitive' // Case-insensitive comparison
        }
      },
      select: {
        id: true,
        title: true,
        instructor: {
          select: {
            name: true
          }
        }
      }
    });

    if (existingCourse) {
      return res.status(409).json({ 
        error: "A course with this title already exists",
        existingCourse: {
          title: existingCourse.title,
          createdBy: existingCourse.instructor.name
        }
      });
    }

    const course = await prisma.course.create({
      data: {
        title,
      
        description,
          instructorId,
          category,
          community,
          discussions,
          hours,
          info,
        language,
        level,
        public,
        units: {
          create: units.map((unit, unitIndex) => ({
            title: unit.title,
            description: unit.description,
            position: typeof unit.position === "number" ? unit.position : unitIndex,
            lessons: {
              create: (unit.lessons || []).map((lesson, lessonIndex) => ({
                title: lesson.title,
                type: lesson.type,
                duration:
                  typeof lesson.duration === "number" && Number.isFinite(lesson.duration)
                    ? lesson.duration
                    : null,
                content: lesson.content ?? null,
                position: typeof lesson.position === "number" ? lesson.position : lessonIndex
              }))
            }
          }))
        }
      },
      include: {
        units: {
          orderBy: { position: "asc" },
          include: {
            lessons: { orderBy: { position: "asc" } }
          }
        }
      }
    });

    res.status(201).json({ message: "Course created successfully", course });
    
//res.redirect(`${process.env.FRONTEND_URL}/dashboard`)
  } catch (error) {
    console.error("Create course error:", error);
    res.status(500).json({ error });
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
    const { courseId, userId } = req.body;

    // Check if user is already enrolled in this course
    const existingEnrollment = await prisma.courseEnrollment.findFirst({
      where: {
        userId: userId,
        courseId: courseId
      }
    });

    if (existingEnrollment) {
      return res.status(400).json({ 
        error: "You are already enrolled in this course",
        enrollmentId: existingEnrollment.id 
      });
    }

    const enrollment = await prisma.courseEnrollment.create({
      data: {
        userId: userId,
        courseId: courseId,
        progress: "0%"
      }
    });

    res.json({ 
      message: "Joined course successfully",
      enrollmentId: enrollment.id 
    });
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
    const userId = req.user?.id;

    // Single optimized query with all needed data
    const [course, forumPosts, reviews] = await Promise.all([
      prisma.course.findUnique({
        where: { id: courseId },
        include: {
          units: {
            orderBy: { position: "asc" },
            include: {
              lessons: { orderBy: { position: "asc" } }
            }
          },
          words: {
            orderBy: { createdAt: "asc" }
          },
          instructor: { 
            select: { id: true, name: true, avatar: true } 
          }
        }
      }),
      // Forum posts with author info
      prisma.forumPost.findMany({
        where: { courseId },
        include: {
          author: {
            select: { id: true, name: true, email: true, avatar: true }
          }
        },
        orderBy: { createdAt: "desc" },
        take: 50 // Limit to recent posts for performance
      }),
      // Reviews with user info
      prisma.courseReview.findMany({
        where: { courseId },
        include: {
          user: {
            select: { id: true, name: true, avatar: true }
          },
          helpfulVotes: userId ? {
            where: { userId }
          } : false
        },
        orderBy: { createdAt: "desc" },
        take: 50 // Limit for performance
      })
    ]);

    if (!course) return res.status(404).json({ error: "Course not found" });

    // Format reviews to match frontend expectations
    const formattedReviews = reviews.map(review => ({
      user: review.user,
      review: review.content,
      rating: review.rating,
      helpfulCount: review.helpfulCount,
      helpful: review.helpfulVotes && review.helpfulVotes.length > 0,
      userMarkedHelpFull: review.helpfulVotes && review.helpfulVotes.length > 0,
      createdAt: review.createdAt
    }));

    res.json({ 
      course,
      forums: forumPosts,
      reviews: formattedReviews,
      user: req.user // Include current user data
    });
  } catch (error) {
    console.error("Error fetching course details:", error);
    res.status(500).json({ error: "Error fetching course details" });
  }
};
const getCoursesByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const courses = await prisma.course.findMany({
      where: { instructorId: userId },
      include: {
        instructor: { select: { id: true, name: true, email: true } }
      }
    });

    res.json({ courses });
  } catch (error) {
    console.error("Error fetching user's courses:", error);
    res.status(500).json({ error: "Error fetching user's courses" });
  }
};
const getJoinedCoursesByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const joinedCourses = await prisma.courseEnrollment.findMany({
      where: { userId: userId },
      include: {
        course: {
          include: {
            instructor: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: {
        createdAt: 'desc' // Get most recent enrollment first
      }
    });

    // Return courses with enrollment info (including progress)
    // Remove duplicates by keeping only the most recent enrollment per course
    const seen = new Set();
    const coursesWithProgress = joinedCourses
      .filter(entry => {
        if (seen.has(entry.courseId)) {
          console.warn(`⚠️ Duplicate enrollment detected for course ${entry.courseId}, user ${userId}`);
          return false; // Skip duplicate
        }
        seen.add(entry.courseId);
        return true;
      })
      .map(entry => ({
        ...entry.course,
        enrollmentId: entry.id,
        progress: entry.progress,
        enrolledAt: entry.createdAt
      }));

    res.json({ courses: coursesWithProgress });
  } catch (error) {
    console.error("Error fetching joined courses:", error);
    res.status(500).json({ error: "Error fetching joined courses" });
  }
};
const getJoinedCoursesByUserIdAndCourseId = async (req, res) => {
  try {
    const { userId, courseId } = req.params;

    const joined = await prisma.courseEnrollment.findFirst({
      where: {
        userId,
        courseId,
      },
    });

    if (!joined) {
      return res.json({ joined: null }); // or just `{}` if you prefer
    }

    res.json({ joined }); // ✅ returns the joined enrollment record
  } catch (error) {
    console.error("Error fetching joined course:", error);
    res.status(500).json({ error: "Error fetching joined course" });
  }
};

const getJoinedCoursesByCourseId = async (req, res) => {
  try {
    const { courseId } = req.params;

    const joinedCourses = await prisma.courseEnrollment.findMany({
      where: {
        courseId: courseId
      },
      
    });

    res.json({ joinedCourses });
  } catch (error) {
    console.error("Error fetching joined courses by courseId:", error);
    res.status(500).json({ error: "Error fetching joined courses" });
  }
};

const getForumMessagesByCourseId = async (req, res) => {
  try {
    const { courseId } = req.params;

    const forumPosts = await prisma.forumPost.findMany({
      where: { courseId: parseInt(courseId) },
      include: {
        user: { select: { id: true, name: true, email: true } },
        replies: {
          include: { user: { select: { id: true, name: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ forumPosts });
  } catch (error) {
    console.error("Error fetching forum messages:", error);
    res.status(500).json({ error: "Error fetching forum messages" });
  }
};

const getCourseReviews = async (req, res) => {
  try {
    const { courseId } = req.params;
    const reviews = await prisma.courseReview.findMany({
      where: { courseId: courseId },
      include: {
        user: true,
        course: {
          select: {
            id: true,
            title: true,
          }
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        },
        helpfulVotes: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ reviews });
  } catch (error) {
    console.error("Error fetching course reviews:", error);
    res.status(500).json({ error: "Error fetching course reviews" });
  }
};

const postCourseReview = async (req, res) => {
  try {
    const { courseId, rating, review, userId } = req.body;// assuming authentication middleware sets req.user


    // Optional: check if user already reviewed this course
    const existingReview = await prisma.courseReview.findFirst({
      where: {
        userId,
        courseId
      }
    });

    if (existingReview) {
      return res.status(409).json({ error: "User has already reviewed this course" });
    }

    const newReview = await prisma.courseReview.create({
      data: {
        userId,
        courseId,
        rating,
        review
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true } },
      }
    });

    res.status(201).json({ review: newReview });
  } catch (error) {
    console.error("Error posting review:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update a course (only instructor can update)
const updateCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return res.status(404).json({ error: "Course not found" });

    // req.user comes from passport deserializeUser
    const userId = req.user && (req.user.id || req.user.userId);
    if (!userId || course.instructorId !== userId) {
      return res.status(403).json({ error: "Not authorized to update this course" });
    }

    const {
      title,
      description,
      language,
      level,
      category,
      hours,
      public: isPublic,
      community,
      discussions,
      info
    } = req.body;

    // If title is being changed, check if new title already exists
    if (title && title !== course.title) {
      const existingCourse = await prisma.course.findFirst({
        where: {
          title: {
            equals: title,
            mode: 'insensitive'
          },
          id: {
            not: courseId // Exclude current course
          }
        },
        select: {
          id: true,
          title: true,
          instructor: {
            select: {
              name: true
            }
          }
        }
      });

      if (existingCourse) {
        return res.status(409).json({ 
          error: "A course with this title already exists",
          existingCourse: {
            title: existingCourse.title,
            createdBy: existingCourse.instructor.name
          }
        });
      }
    }

    const updated = await prisma.course.update({
      where: { id: courseId },
      data: {
        title: typeof title === 'string' ? title : course.title,
        description: typeof description === 'string' ? description : course.description,
        language: typeof language === 'string' ? language : course.language,
        level: typeof level === 'string' ? level : course.level,
        category: typeof category === 'string' ? category : course.category,
        hours: typeof hours === 'string' ? hours : course.hours,
        public: typeof isPublic !== 'undefined' ? isPublic : course.public,
        community: typeof community !== 'undefined' ? community : course.community,
        discussions: typeof discussions !== 'undefined' ? discussions : course.discussions,
        info: typeof info === 'string' ? info : course.info
      }
    });

    res.json({ course: updated });
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({ error: "Error updating course" });
  }
};

// Delete a course (only instructor can delete)
const deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return res.status(404).json({ error: "Course not found" });

    const userId = req.user && (req.user.id || req.user.userId);
    if (!userId || course.instructorId !== userId) {
      return res.status(403).json({ error: "Not authorized to delete this course" });
    }

    await prisma.course.delete({ where: { id: courseId } });
    res.json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({ error: "Error deleting course" });
  }
};

// Update course progress for a user
const updateCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { progress } = req.body;
    
    const userId = req.user && (req.user.id || req.user.userId);
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Validate progress value
    const progressNum = typeof progress === 'number' ? progress : parseFloat(progress);
    if (isNaN(progressNum) || progressNum < 0 || progressNum > 100) {
      return res.status(400).json({ error: "Invalid progress value. Must be between 0 and 100." });
    }

    // Find or create enrollment
    const enrollment = await prisma.courseEnrollment.findFirst({
      where: {
        userId: userId,
        courseId: courseId
      }
    });

    if (!enrollment) {
      return res.status(404).json({ error: "User not enrolled in this course" });
    }

    // Update progress
    const updated = await prisma.courseEnrollment.update({
      where: { id: enrollment.id },
      data: { progress: `${progressNum}%` }
    });

    res.json({ progress: updated.progress, message: "Progress updated successfully" });
  } catch (error) {
    console.error("Error updating progress:", error);
    res.status(500).json({ error: "Error updating progress" });
  }
};

module.exports = {
  createCourse,
  getCourses,
  joinCourse,
  leaveCourse,
  getCourseDetails,
  getCoursesByUserId,
  getJoinedCoursesByUserId,
  getForumMessagesByCourseId,
  getJoinedCoursesByUserIdAndCourseId,
  getJoinedCoursesByCourseId,
  translateText,
  getCourseReviews,
  postCourseReview,
  updateCourse,
  deleteCourse,
  updateCourseProgress
};
