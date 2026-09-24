import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { ApiResponse } from '../utils/ApiResponse';

const generateAccessToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET!, { expiresIn: '15m' });
};

const generateRefreshToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });
};

export const register = async (req: Request, res: Response): Promise<any> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json(ApiResponse.error('VALIDATION_ERROR', 'All fields are required.'));
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json(ApiResponse.error('VALIDATION_ERROR', 'Invalid email format.'));
    }

    if (password.length < 6) {
      return res.status(400).json(ApiResponse.error('VALIDATION_ERROR', 'Password must be at least 6 characters.'));
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json(ApiResponse.error('CONFLICT', 'Email is already in use.'));
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: { name, email, password_hash }
    });

    return res.status(201).json(ApiResponse.success({
      id: user.id,
      name: user.name,
      email: user.email
    }));
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json(ApiResponse.error('INTERNAL_ERROR', 'Failed to register user.'));
  }
};

export const login = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json(ApiResponse.error('VALIDATION_ERROR', 'Email and password are required.'));
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json(ApiResponse.error('UNAUTHORIZED', 'Invalid credentials.'));
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json(ApiResponse.error('UNAUTHORIZED', 'Invalid credentials.'));
    }

    const accessToken = generateAccessToken(user.id);
    const refreshTokenString = generateRefreshToken(user.id);

    // Persist refresh token in DB
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    await prisma.refreshToken.create({
      data: {
        token: refreshTokenString,
        user_id: user.id,
        expires_at: expiresAt
      }
    });

    // Send HTTP-only cookie
    res.cookie('refreshToken', refreshTokenString, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res.status(200).json(ApiResponse.success({
      accessToken,
      user: { id: user.id, name: user.name, email: user.email }
    }));
  } catch (error) {
    return res.status(500).json(ApiResponse.error('INTERNAL_ERROR', 'Failed to login.'));
  }
};

export const refresh = async (req: Request, res: Response): Promise<any> => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return res.status(401).json(ApiResponse.error('UNAUTHORIZED', 'No refresh token provided.'));
    }

    // Verify token structure
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { userId: string };

    // Check DB to ensure it hasn't been revoked and exists
    const tokenRecord = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!tokenRecord || tokenRecord.revoked || tokenRecord.expires_at < new Date()) {
      return res.status(401).json(ApiResponse.error('UNAUTHORIZED', 'Invalid or expired refresh token.'));
    }

    // Generate new access token
    const accessToken = generateAccessToken(decoded.userId);
    
    return res.status(200).json(ApiResponse.success({ accessToken }));
  } catch (error) {
    return res.status(401).json(ApiResponse.error('UNAUTHORIZED', 'Invalid refresh token.'));
  }
};

export const logout = async (req: Request, res: Response): Promise<any> => {
  try {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { token: refreshToken },
        data: { revoked: true }
      });
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });

    return res.status(200).json(ApiResponse.success({ message: 'Logged out successfully.' }));
  } catch (error) {
    return res.status(500).json(ApiResponse.error('INTERNAL_ERROR', 'Failed to logout.'));
  }
};
