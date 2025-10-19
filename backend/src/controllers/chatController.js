const prisma = require('../lib/prisma');

// Chat Controller

// Get all users for community (excluding current user)
const getCommunityUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    
    const users = await prisma.user.findMany({
      where: {
        id: {
          not: currentUserId
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        createdAt: true,
        // Courses taught by the user
        coursesTaught: {
          select: {
            id: true,
            title: true,
            language: true
          }
        },
        // Courses the user is enrolled in
        joinedCourses: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                language: true
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json({ users });
  } catch (error) {
    console.error("Get community users error:", error);
    res.status(500).json({ error: "Error fetching community users" });
  }
};

// Get current user with their courses
const getCurrentUser = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    
    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        createdAt: true,
        // Courses taught by the user
        coursesTaught: {
          select: {
            id: true,
            title: true,
            language: true
          }
        },
        // Courses the user is enrolled in
        joinedCourses: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                language: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ error: "Error fetching user data" });
  }
};

// Create a conversation between two users
const createConversation = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { participantId } = req.body;

    if (!participantId) {
      return res.status(400).json({ error: "Participant ID is required" });
    }

    // Check if conversation already exists
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          {
            participant1Id: currentUserId,
            participant2Id: participantId
          },
          {
            participant1Id: participantId,
            participant2Id: currentUserId
          }
        ]
      },
      include: {
        participant1: {
          select: { id: true, name: true, avatar: true }
        },
        participant2: {
          select: { id: true, name: true, avatar: true }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            sender: {
              select: { id: true, name: true, avatar: true }
            }
          }
        }
      }
    });

    if (existingConversation) {
      return res.json({ 
        message: "Conversation already exists", 
        conversation: existingConversation 
      });
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        participant1Id: currentUserId,
        participant2Id: participantId
      },
      include: {
        participant1: {
          select: { id: true, name: true, avatar: true }
        },
        participant2: {
          select: { id: true, name: true, avatar: true }
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: { id: true, name: true, avatar: true }
            }
          }
        }
      }
    });

    res.status(201).json({ 
      message: "Conversation created successfully", 
      conversation 
    });
  } catch (error) {
    console.error("Create conversation error:", error);
    res.status(500).json({ error: "Error creating conversation" });
  }
};

// Get all conversations for current user
const getUserConversations = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { participant1Id: currentUserId },
          { participant2Id: currentUserId }
        ]
      },
      include: {
        participant1: {
          select: { id: true, name: true, avatar: true }
        },
        participant2: {
          select: { id: true, name: true, avatar: true }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: { id: true, name: true }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Format conversations with last message and unread count
    const formattedConversations = conversations.map(conversation => {
      const otherParticipant = 
        conversation.participant1Id === currentUserId 
          ? conversation.participant2 
          : conversation.participant1;
      
      const lastMessage = conversation.messages[0] || null;

      return {
        id: conversation.id,
        otherParticipant,
        lastMessage,
        unreadCount: 0,
        updatedAt: conversation.updatedAt
      };
    });

    res.json({ conversations: formattedConversations });
  } catch (error) {
    console.error("Get user conversations error:", error);
    res.status(500).json({ error: "Error fetching conversations" });
  }
};

// Get messages for a specific conversation
const getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const currentUserId = req.user.id;

    // Verify user is part of the conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { participant1Id: currentUserId },
          { participant2Id: currentUserId }
        ]
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({ messages });
  } catch (error) {
    console.error("Get conversation messages error:", error);
    res.status(500).json({ error: "Error fetching messages" });
  }
};

// Send a message
const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;
    const currentUserId = req.user.id;

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: "Message content is required" });
    }

    // Verify user is part of the conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { participant1Id: currentUserId },
          { participant2Id: currentUserId }
        ]
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        senderId: currentUserId,
        conversationId
      },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });

    // Update conversation's updatedAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    res.status(201).json({ message });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ error: "Error sending message" });
  }
};

// Delete a message (only by sender)
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user.id;

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: true
      }
    });

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Check if current user is the sender
    if (message.senderId !== currentUserId) {
      return res.status(403).json({ error: "Not authorized to delete this message" });
    }

    await prisma.message.delete({
      where: { id: messageId }
    });

    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Delete message error:", error);
    res.status(500).json({ error: "Error deleting message" });
  }
};

// Get or create conversation with a specific user
const getOrCreateConversation = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { participantId } = req.params;

    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          {
            participant1Id: currentUserId,
            participant2Id: participantId
          },
          {
            participant1Id: participantId,
            participant2Id: currentUserId
          }
        ]
      },
      include: {
        participant1: {
          select: { id: true, name: true, avatar: true }
        },
        participant2: {
          select: { id: true, name: true, avatar: true }
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: { id: true, name: true, avatar: true }
            }
          }
        }
      }
    });

    if (!conversation) {
      // Create new conversation if it doesn't exist
      conversation = await prisma.conversation.create({
        data: {
          participant1Id: currentUserId,
          participant2Id: participantId
        },
        include: {
          participant1: {
            select: { id: true, name: true, avatar: true }
          },
          participant2: {
            select: { id: true, name: true, avatar: true }
          },
          messages: {
            orderBy: { createdAt: 'asc' },
            include: {
              sender: {
                select: { id: true, name: true, avatar: true }
              }
            }
          }
        }
      });
    }

    res.json({ conversation });
  } catch (error) {
    console.error("Get or create conversation error:", error);
    res.status(500).json({ error: "Error getting conversation" });
  }
};

module.exports = {
  getCommunityUsers,
  getCurrentUser,
  createConversation,
  getUserConversations,
  getConversationMessages,
  sendMessage,
  deleteMessage,
  getOrCreateConversation
};