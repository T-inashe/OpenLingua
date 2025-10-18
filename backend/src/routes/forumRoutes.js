const { Router } = require("express");
const { authenticate } = require("../middleware/auth");
const { createPost, replyToPost, getPosts } = require("../controllers/forumController");

const router = Router();

router.post("/:courseId", authenticate, createPost);
router.get("/:courseId", authenticate, getPosts);
router.post("/reply/:postId", authenticate, replyToPost);

module.exports = router;
