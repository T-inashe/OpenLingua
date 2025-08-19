const { prisma } = require('../lib/prisma');

// Add vocabulary word
const addWord = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { word, translation, usage } = req.body;

    const vocab = await prisma.vocabulary.create({
      data: {
        word,
        translation,
        usage,
        courseId: parseInt(courseId)
      }
    });

    res.status(201).json({ message: "Word added", vocab });
  } catch (error) {
    res.status(500).json({ error: "Could not add word" });
  }
};

// Get vocabulary for course
const getWords = async (req, res) => {
  try {
    const { courseId } = req.params;
    const words = await prisma.vocabulary.findMany({
      where: { courseId: parseInt(courseId) }
    });

    res.json({ words });
  } catch (error) {
    res.status(500).json({ error: "Could not fetch vocabulary" });
  }
};

module.exports = { addWord, getWords };
