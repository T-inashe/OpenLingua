const prisma = require('../lib/prisma');

// Create a new event
const createEvent = async (req, res) => {
  try {
    const { title, date, time } = req.body;

    if (!title || !date || !time) {
      return res.status(400).json({ error: "Missing required fields: title, date, time" });
    }

    const event = await prisma.event.create({
      data: {
        title,
        date: new Date(date),
        time
      }
    });

    res.status(201).json({ message: "Event created successfully", event });
  } catch (error) {
    console.error("Create event error:", error);
    res.status(500).json({ error: "Error creating event" });
  }
};

// Get all events
const getEvents = async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      orderBy: [
        { date: 'asc' },
        { time: 'asc' }
      ]
    });
    res.json({ events });
  } catch (error) {
    console.error("Get events error:", error);
    res.status(500).json({ error: "Error fetching events" });
  }
};

// Get event by ID
const getEventById = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.json({ event });
  } catch (error) {
    console.error("Get event error:", error);
    res.status(500).json({ error: "Error fetching event" });
  }
};

// Update an event
const updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { title, date, time } = req.body;

    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        title: title || event.title,
        date: date ? new Date(date) : event.date,
        time: time || event.time
      }
    });

    res.json({ message: "Event updated successfully", event: updatedEvent });
  } catch (error) {
    console.error("Update event error:", error);
    res.status(500).json({ error: "Error updating event" });
  }
};

// Delete an event
const deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    await prisma.event.delete({
      where: { id: eventId }
    });

    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Delete event error:", error);
    res.status(500).json({ error: "Error deleting event" });
  }
};

// Get events by date range
const getEventsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: "Missing required query parameters: startDate, endDate" });
    }

    const events = await prisma.event.findMany({
      where: {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      orderBy: [
        { date: 'asc' },
        { time: 'asc' }
      ]
    });

    res.json({ events });
  } catch (error) {
    console.error("Get events by date range error:", error);
    res.status(500).json({ error: "Error fetching events" });
  }
};

// Get upcoming events
const getUpcomingEvents = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const events = await prisma.event.findMany({
      where: {
        date: {
          gte: today
        }
      },
      orderBy: [
        { date: 'asc' },
        { time: 'asc' }
      ]
    });

    res.json({ events });
  } catch (error) {
    console.error("Get upcoming events error:", error);
    res.status(500).json({ error: "Error fetching upcoming events" });
  }
};

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getEventsByDateRange,
  getUpcomingEvents
};