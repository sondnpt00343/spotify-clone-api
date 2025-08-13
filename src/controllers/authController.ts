import { Request, Response, NextFunction } from 'express';
import { UserModel, CreateUserData } from '../models/User';
import { PlaylistModel } from '../models/Playlist';
import { generateAccessToken, generateRefreshToken, JwtPayload } from '../utils/jwt';
import { CustomError } from '../middleware/errorHandler';

export class AuthController {
  // POST /api/auth/register
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, username, password, display_name, bio, date_of_birth, country } = req.body as CreateUserData & {
        bio?: string;
        date_of_birth?: string;
        country?: string;
      };

      // Check if email already exists
      const emailExists = await UserModel.emailExists(email);
      if (emailExists) {
        const error: CustomError = new Error('Email already registered');
        error.statusCode = 409;
        error.code = 'EMAIL_EXISTS';
        throw error;
      }

      // Check if username already exists (only if username is provided)
      if (username) {
        const usernameExists = await UserModel.usernameExists(username);
        if (usernameExists) {
          const error: CustomError = new Error('Username already taken');
          error.statusCode = 409;
          error.code = 'USERNAME_EXISTS';
          throw error;
        }
      }

      // Create new user
      const newUser = await UserModel.create({
        email,
        username: username || undefined,
        password,
        display_name
      });

      // Create default "Liked Songs" playlist for new user
      try {
        await PlaylistModel.create(newUser.id, {
          name: 'Liked Songs',
          description: 'Your liked songs will appear here',
          is_public: false
        });
      } catch (playlistError) {
        // Log the error but don't fail the registration process
        console.error('Error creating default playlist for user:', newUser.id, playlistError);
      }

      // Generate JWT tokens
      const payload: JwtPayload = {
        userId: newUser.id,
        email: newUser.email,
        username: newUser.username
      };

      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      // Return user data (without password) and tokens
      const userResponse = UserModel.toResponse(newUser);

      res.status(201).json({
        message: 'User registered successfully',
        user: userResponse,
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'Bearer'
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/login
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await UserModel.findByEmail(email);
      if (!user) {
        const error: CustomError = new Error('Invalid email or password');
        error.statusCode = 401;
        error.code = 'INVALID_CREDENTIALS';
        throw error;
      }

      // Verify password
      const isPasswordValid = await UserModel.verifyPassword(password, user.password_hash);
      if (!isPasswordValid) {
        const error: CustomError = new Error('Invalid email or password');
        error.statusCode = 401;
        error.code = 'INVALID_CREDENTIALS';
        throw error;
      }

      // Generate JWT tokens
      const payload: JwtPayload = {
        userId: user.id,
        email: user.email,
        username: user.username
      };

      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      // Return user data (without password) and tokens
      const userResponse = UserModel.toResponse(user);

      res.status(200).json({
        message: 'Login successful',
        user: userResponse,
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'Bearer'
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/users/me
  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        const error: CustomError = new Error('User not authenticated');
        error.statusCode = 401;
        error.code = 'NOT_AUTHENTICATED';
        throw error;
      }

      // Get user from database
      const user = await UserModel.findById(userId);
      if (!user) {
        const error: CustomError = new Error('User not found');
        error.statusCode = 404;
        error.code = 'USER_NOT_FOUND';
        throw error;
      }

      // Get user stats
      const stats = await UserModel.getUserStats(userId);

      // Return user profile with stats
      const userResponse = UserModel.toResponse(user);

      res.status(200).json({
        user: userResponse,
        stats
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/users/me
  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        const error: CustomError = new Error('User not authenticated');
        error.statusCode = 401;
        error.code = 'NOT_AUTHENTICATED';
        throw error;
      }

      const { display_name, avatar_url } = req.body;

      // Update user profile
      const updatedUser = await UserModel.update(userId, {
        display_name,
        avatar_url
      });

      if (!updatedUser) {
        const error: CustomError = new Error('User not found');
        error.statusCode = 404;
        error.code = 'USER_NOT_FOUND';
        throw error;
      }

      // Return updated user profile
      const userResponse = UserModel.toResponse(updatedUser);

      res.status(200).json({
        message: 'Profile updated successfully',
        user: userResponse
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/change-password
  static async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        const error: CustomError = new Error('User not authenticated');
        error.statusCode = 401;
        error.code = 'NOT_AUTHENTICATED';
        throw error;
      }

      const { current_password, new_password } = req.body;

      // Get user from database
      const user = await UserModel.findById(userId);
      if (!user) {
        const error: CustomError = new Error('User not found');
        error.statusCode = 404;
        error.code = 'USER_NOT_FOUND';
        throw error;
      }

      // Verify current password
      const isCurrentPasswordValid = await UserModel.verifyPassword(current_password, user.password_hash);
      if (!isCurrentPasswordValid) {
        const error: CustomError = new Error('Current password is incorrect');
        error.statusCode = 400;
        error.code = 'INVALID_CURRENT_PASSWORD';
        throw error;
      }

      // Update password
      await UserModel.changePassword(userId, new_password);

      res.status(200).json({
        message: 'Password changed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/refresh-token
  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      // This would be implemented with a refresh token store
      // For now, we'll return a simple response
      const userId = req.user?.userId;
      
      if (!userId) {
        const error: CustomError = new Error('Invalid refresh token');
        error.statusCode = 401;
        error.code = 'INVALID_REFRESH_TOKEN';
        throw error;
      }

      // Get user data
      const user = await UserModel.findById(userId);
      if (!user) {
        const error: CustomError = new Error('User not found');
        error.statusCode = 404;
        error.code = 'USER_NOT_FOUND';
        throw error;
      }

      // Generate new access token
      const payload: JwtPayload = {
        userId: user.id,
        email: user.email,
        username: user.username
      };

      const accessToken = generateAccessToken(payload);

      res.status(200).json({
        access_token: accessToken,
        token_type: 'Bearer'
      });
    } catch (error) {
      next(error);
    }
  }
} 