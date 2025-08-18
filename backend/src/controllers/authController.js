const bcrypt = require('bcryptjs');
const { prisma } = require('../lib/prisma');
const { generateTokens } = require('../utils/jwt');
const { setAuthCookies, clearAuthCookies } = require('../utils/cookies');

const isPrismaError = (error) => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
  );
};

const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ 
        error: 'Please provide email, password, and name' 
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Please provide a valid email address' 
      });
    }

    if (password.length < 8) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters long' 
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: 'An account with this email already exists' 
      });
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        name: name.trim(),
      },
      select: {
        id: true,
        email: true,
        name: true,
      }
    });

    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
    });

    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    res.status(201).json({
      message: 'Account created successfully!',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (isPrismaError(error)) {
      if (error.code === 'P2002') {
        return res.status(400).json({ 
          error: 'An account with this email already exists' 
        });
      }
    }

    res.status(500).json({ 
      error: 'Something went wrong during registration. Please try again.' 
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Please provide email and password' 
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
      }
    });

    if (!user || !user.password) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
    });

    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Something went wrong during login. Please try again.' 
    });
  }
};

const logout = async (req, res) => {
  try {
    clearAuthCookies(res);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      error: 'Something went wrong during logout' 
    });
  }
};

const me = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        createdAt: true,
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      error: 'Something went wrong fetching user data' 
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  me
};