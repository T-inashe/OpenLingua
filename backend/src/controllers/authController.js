const { prisma } = require('../lib/prisma');
const bcrypt = require('bcryptjs');
const { generateTokens } = require('../utils/jwt');
const { setAuthCookies, clearAuthCookies } = require('../utils/cookies');

exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Basic validations expected by tests
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const emailRegex = /.+@.+\..+/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password too short' });
    }

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

    // Issue tokens and set cookies as expected in tests
    const { accessToken, refreshToken } = generateTokens({ userId: user.id, email: user.email });
    setAuthCookies(res, accessToken, refreshToken);
    
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    // Handle Prisma unique constraint
    if (error && error.code === 'P2002') {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Something went wrong during registration' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Missing credentials' });
    }

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

    // Issue tokens and set cookies as expected in tests
    const { accessToken, refreshToken } = generateTokens({ userId: user.id, email: user.email });
    setAuthCookies(res, accessToken, refreshToken);
    
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Something went wrong during login' });
  }
};

exports.logout = (req, res) => {
  try {
    // Clear auth cookies as expected by tests
    clearAuthCookies(res);
    return res.json({ message: 'Logged out successfully' });
  } catch (e) {
    return res.status(500).json({ error: 'Something went wrong during logout' });
  }
};

exports.me = async (req, res) => {
  try {
    const userId = req.user && (req.user.userId || req.user.id);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Something went wrong during me' });
  }
};