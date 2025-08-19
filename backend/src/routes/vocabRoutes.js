const { Router } = require("express");
const { authenticate } = require("../middleware/auth");
const { addWord, getWords } = require("../controllers/vocabController");

const router = Router();

router.post("/:courseId", authenticate, addWord);
router.get("/:courseId", authenticate, getWords);

module.exports = router;
