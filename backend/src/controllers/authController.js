const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    req.login(user, (err) => {
      if (err) {
        console.error('Login error:', err);
        return res.status(500).json({ error: 'Registration successful but login failed' });
      }
      
      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      });
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.login(user, (err) => {
      if (err) {
        console.error('Login error:', err);
        return res.status(500).json({ error: 'Login failed' });
      }
      
      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar
        }
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

exports.logout = (req, res) => {
  if (!req.session) {
    return res.status(400).json({ error: 'No active session' });
  }

  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
        return res.status(500).json({ error: 'Logout failed' });
      }
      
      res.clearCookie('connect.sid');
      res.json({ message: 'Logout successful' });
    });
  });
};

exports.me = async (req, res) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // User is already loaded by passport.deserializeUser
    // Just return it with selected fields
    const user = {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      avatar: req.user.avatar,
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt
    };

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user information' });
  }
};