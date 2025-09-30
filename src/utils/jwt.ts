import jwt from 'jsonwebtoken';
import { CustomError } from '../middleware/errorHandler';
import { TokenBlacklistModel } from '../models/TokenBlacklist';

export interface JwtPayload {
  userId: string;
  email: string;
  username?: string;
}

export const generateAccessToken = (payload: JwtPayload): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRE || '1h',
    issuer: 'spotify-clone-api',
    audience: 'spotify-clone-client'
  } as jwt.SignOptions);
};

export const generateRefreshToken = (payload: JwtPayload): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  return jwt.sign(payload, secret, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRE || '30d',
    issuer: 'spotify-clone-api',
    audience: 'spotify-clone-client'
  } as jwt.SignOptions);
};

export const verifyToken = async (token: string): Promise<JwtPayload> => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  try {
    // First check if token is blacklisted
    const isBlacklisted = await TokenBlacklistModel.isTokenBlacklisted(token);
    if (isBlacklisted) {
      const customError: CustomError = new Error('Token has been revoked');
      customError.statusCode = 401;
      customError.code = 'TOKEN_REVOKED';
      throw customError;
    }

    const decoded = jwt.verify(token, secret, {
      issuer: 'spotify-clone-api',
      audience: 'spotify-clone-client'
    }) as JwtPayload;

    return decoded;
  } catch (error) {
    // If it's already our custom error, re-throw it
    if (error instanceof Error && 'statusCode' in error) {
      throw error;
    }

    if (error instanceof jwt.TokenExpiredError) {
      const customError: CustomError = new Error('Token has expired');
      customError.statusCode = 401;
      customError.code = 'TOKEN_EXPIRED';
      throw customError;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      const customError: CustomError = new Error('Invalid token');
      customError.statusCode = 401;
      customError.code = 'INVALID_TOKEN';
      throw customError;
    }

    throw error;
  }
};

export const extractTokenFromHeader = (authHeader: string | undefined): string => {
  if (!authHeader) {
    const error: CustomError = new Error('Authorization header is required');
    error.statusCode = 401;
    error.code = 'AUTH_HEADER_MISSING';
    throw error;
  }

  if (!authHeader.startsWith('Bearer ')) {
    const error: CustomError = new Error('Authorization header must start with Bearer');
    error.statusCode = 401;
    error.code = 'INVALID_AUTH_HEADER';
    throw error;
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  if (!token) {
    const error: CustomError = new Error('Token is required');
    error.statusCode = 401;
    error.code = 'TOKEN_MISSING';
    throw error;
  }

  return token;
}; 