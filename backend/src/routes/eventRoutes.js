const { Router } = require("express");
const { authenticate } = require("../middleware/auth");
const {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getEventsByDateRange,
  getUpcomingEvents
} = require("../controllers/eventController");

const router = Router();

router.post("/", authenticate, createEvent);
router.get("/", getEvents);
router.get("/upcoming", getUpcomingEvents);
router.get("/date-range", getEventsByDateRange);
router.get("/:eventId", getEventById);
router.patch("/:eventId", authenticate, updateEvent);
router.delete("/:eventId", authenticate, deleteEvent);

module.exports = router;