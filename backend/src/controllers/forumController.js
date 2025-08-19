const { prisma } = require('../lib/prisma');

// Create a forum post
const createPost = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { content } = req.body;

    const post = await prisma.forumPost.create({
      data: {
        content,
        userId: req.user.userId,
        courseId: parseInt(courseId)
      }
    });

    res.status(201).json({ message: "Post created", post });
  } catch (error) {
    res.status(500).json({ error: "Could not create post" });
  }
};

// Reply to a post
const replyToPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    const reply = await prisma.forumReply.create({
      data: {
        content,
        userId: req.user.userId,
        postId: parseInt(postId)
      }
    });

    res.status(201).json({ message: "Reply added", reply });
  } catch (error) {
    res.status(500).json({ error: "Could not reply to post" });
  }
};

// Get forum posts for a course
const getPosts = async (req, res) => {
  try {
    const { courseId } = req.params;

    const posts = await prisma.forumPost.findMany({
      where: { courseId: parseInt(courseId) },
      include: { user: true, replies: { include: { user: true } } },
      orderBy: { createdAt: "desc" }
    });

    res.json({ posts });
  } catch (error) {
    res.status(500).json({ error: "Could not fetch posts" });
  }
};

module.exports = { createPost, replyToPost, getPosts };
