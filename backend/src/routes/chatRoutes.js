const { Router } = require("express");
const { authenticate } = require("../middleware/auth");
const {
  // Chat functions
  getCommunityUsers,
  getCurrentUser,
  createConversation,
  getUserConversations,
  getConversationMessages,
  sendMessage,
  deleteMessage,
  getOrCreateConversation
} = require("../controllers/chatController");

const router = Router();
// Chat Routes
router.get("/users", authenticate, getCommunityUsers);
router.get("/me", authenticate, getCurrentUser);
router.get("/conversations", authenticate, getUserConversations);
router.post("/conversations", authenticate, createConversation);
router.get("/conversations/:participantId", authenticate, getOrCreateConversation);
router.get("/conversations/:conversationId/messages", authenticate, getConversationMessages);
router.post("/conversations/:conversationId/messages", authenticate, sendMessage);
router.delete("/messages/:messageId", authenticate, deleteMessage);

module.exports = router;