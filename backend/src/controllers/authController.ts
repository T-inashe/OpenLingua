import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { generateTokens } from '../utils/jwt';
import { setAuthCookies, clearAuthCookies } from '../utils/cookies';

interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

const isPrismaError = (error: unknown): error is { code: string; message: string } => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as any).code === 'string'
  );
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name }: RegisterRequest = req.body;

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

  } catch (error: unknown) {
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

export const login = async (req: Request, res: Response) => {
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

  } catch (error: unknown) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Something went wrong during login. Please try again.' 
    });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    clearAuthCookies(res);
    res.json({ message: 'Logged out successfully' });
  } catch (error: unknown) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      error: 'Something went wrong during logout' 
    });
  }
};

// Just use 'any' - it's simple and works!
export const me = async (req: any, res: Response) => {
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
  } catch (error: unknown) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      error: 'Something went wrong fetching user data' 
    });
  }
};