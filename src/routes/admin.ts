import { Router } from 'express';
import { UserModel } from '../models/User';
import { ArtistModel } from '../models/Artist';
import { AlbumModel } from '../models/Album';
import { TrackModel } from '../models/Track';
import { PlaylistModel } from '../models/Playlist';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import rateLimit from 'express-rate-limit';
import db from '../config/database';

const router = Router();

// Rate limiting for admin endpoints
const adminLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_ADMIN_MAX || '50000'), // Allow more requests for admin operations
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many admin requests, please try again later.'
    }
  }
});

// Get all users (admin only)
router.get('/users', authenticateToken, adminLimiter, async (req, res) => {
  try {
    const { limit = 20, offset = 0, search } = req.query;
    
    let query = db('users')
      .select('id', 'email', 'username', 'display_name', 'avatar_url', 'created_at', 'updated_at');
    
    if (search) {
      query = query.where(function() {
        this.where('email', 'like', `%${search}%`)
            .orWhere('username', 'like', `%${search}%`)
            .orWhere('display_name', 'like', `%${search}%`);
      });
    }

    const limitNum = parseInt(String(limit)) || 20;
    const offsetNum = parseInt(String(offset)) || 0;
    
    const users = await query
      .limit(limitNum)
      .offset(offsetNum)
      .orderBy('created_at', 'desc');

    // Get total count for pagination
    let countQuery = db('users');
    if (search) {
      countQuery = countQuery.where(function() {
        this.where('email', 'like', `%${search}%`)
            .orWhere('username', 'like', `%${search}%`)
            .orWhere('display_name', 'like', `%${search}%`);
      });
    }
    const totalResult = await countQuery.count('* as count').first();
    const total = parseInt(totalResult?.count as string) || 0;

    res.json({
      success: true,
      data: users,
      pagination: {
        total,
        limit: limitNum,
        offset: offsetNum,
        hasMore: total > offsetNum + limitNum
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch users'
      }
    });
  }
});

// Get user by ID (admin only)
router.get('/users/:id', authenticateToken, adminLimiter, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_USER_ID',
          message: 'User ID is required'
        }
      });
    }

    const user = await UserModel.findById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    const userResponse = UserModel.toResponse(user);
    return res.json({
      success: true,
      data: userResponse
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch user'
      }
    });
  }
});

// Create user (admin only)
router.post('/users', authenticateToken, adminLimiter, async (req, res) => {
  try {
    const { email, username, password, display_name, avatar_url } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'Email and password are required'
        }
      });
    }

    // Check if email already exists
    const emailExists = await UserModel.emailExists(email);
    if (emailExists) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: 'Email already registered'
        }
      });
    }

    // Check if username already exists (only if username is provided)
    if (username) {
      const usernameExists = await UserModel.usernameExists(username);
      if (usernameExists) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'USERNAME_EXISTS',
            message: 'Username already taken'
          }
        });
      }
    }

    // Create new user
    const newUser = await UserModel.create({
      email,
      username: username || undefined,
      password,
      display_name: display_name || undefined,
      avatar_url: avatar_url || undefined
    });

    const userResponse = UserModel.toResponse(newUser);
    return res.status(201).json({
      success: true,
      data: userResponse,
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create user'
      }
    });
  }
});

// Update user (admin only)
router.put('/users/:id', authenticateToken, adminLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, username, display_name, avatar_url } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_USER_ID',
          message: 'User ID is required'
        }
      });
    }

    // Check if email already exists (only if email is being changed)
    if (email) {
      const existingUser = await UserModel.findById(id);
      if (existingUser && existingUser.email !== email) {
        const emailExists = await UserModel.emailExists(email);
        if (emailExists) {
          return res.status(409).json({
            success: false,
            error: {
              code: 'EMAIL_EXISTS',
              message: 'Email already registered'
            }
          });
        }
      }
    }

    // Check if username already exists (only if username is being changed)
    if (username) {
      const existingUser = await UserModel.findById(id);
      if (existingUser && existingUser.username !== username) {
        const usernameExists = await UserModel.usernameExists(username);
        if (usernameExists) {
          return res.status(409).json({
            success: false,
            error: {
              code: 'USERNAME_EXISTS',
              message: 'Username already taken'
            }
          });
        }
      }
    }

    const updatedUser = await UserModel.update(id, {
      email: email || undefined,
      username: username || undefined,
      display_name: display_name || undefined,
      avatar_url: avatar_url || undefined
    });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    const userResponse = UserModel.toResponse(updatedUser);
    return res.json({
      success: true,
      data: userResponse,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update user'
      }
    });
  }
});

// Delete user (admin only)
router.delete('/users/:id', authenticateToken, adminLimiter, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_USER_ID',
          message: 'User ID is required'
        }
      });
    }
    
    // Check if user exists
    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Delete user (this will cascade delete related data)
    await UserModel.delete(id);

    return res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete user'
      }
    });
  }
});

// Get dashboard stats
router.get('/stats', authenticateToken, adminLimiter, async (req, res) => {
  try {
    const [usersCount, artistsCount, albumsCount, tracksCount, playlistsCount] = await Promise.all([
      db('users').count('* as count').first(),
      db('artists').count('* as count').first(),
      db('albums').count('* as count').first(),
      db('tracks').count('* as count').first(),
      db('playlists').count('* as count').first(),
    ]);

    res.json({
      success: true,
      data: {
        users: parseInt(usersCount?.count as string) || 0,
        artists: parseInt(artistsCount?.count as string) || 0,
        albums: parseInt(albumsCount?.count as string) || 0,
        tracks: parseInt(tracksCount?.count as string) || 0,
        playlists: parseInt(playlistsCount?.count as string) || 0,
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch dashboard stats'
      }
    });
  }
});

// Get all playlists (admin only) - shows both public and private
router.get('/playlists', authenticateToken, adminLimiter, async (req, res) => {
  try {
    const { limit = 20, offset = 0, search } = req.query;
    
    let query = db('playlists')
      .select(
        'playlists.id',
        'playlists.name', 
        'playlists.description',
        'playlists.image_url',
        'playlists.is_public',
        'playlists.user_id',
        'playlists.created_at',
        'playlists.updated_at',
        'users.username as user_username',
        'users.display_name as user_display_name'
      )
      .leftJoin('users', 'playlists.user_id', 'users.id');
    
    if (search) {
      query = query.where(function() {
        this.where('playlists.name', 'like', `%${search}%`)
            .orWhere('playlists.description', 'like', `%${search}%`)
            .orWhere('users.username', 'like', `%${search}%`)
            .orWhere('users.display_name', 'like', `%${search}%`);
      });
    }

    const limitNum = parseInt(String(limit)) || 20;
    const offsetNum = parseInt(String(offset)) || 0;
    
    const playlists = await query
      .limit(limitNum)
      .offset(offsetNum)
      .orderBy('playlists.created_at', 'desc');

    // Add total tracks count for each playlist
    const playlistsWithDetails = await Promise.all(
      playlists.map(async (playlist) => {
        const trackCountResult = await db('playlist_tracks')
          .where('playlist_id', playlist.id)
          .count('* as count')
          .first();
        
        return {
          ...playlist,
          total_tracks: parseInt(trackCountResult?.count as string) || 0
        };
      })
    );

    // Get total count for pagination
    let countQuery = db('playlists').leftJoin('users', 'playlists.user_id', 'users.id');
    if (search) {
      countQuery = countQuery.where(function() {
        this.where('playlists.name', 'like', `%${search}%`)
            .orWhere('playlists.description', 'like', `%${search}%`)
            .orWhere('users.username', 'like', `%${search}%`)
            .orWhere('users.display_name', 'like', `%${search}%`);
      });
    }
    const totalResult = await countQuery.count('playlists.id as count').first();
    const total = parseInt(totalResult?.count as string) || 0;

    res.json({
      success: true,
      data: playlistsWithDetails,
      pagination: {
        total,
        limit: limitNum,
        offset: offsetNum,
        hasMore: total > offsetNum + limitNum
      }
    });
  } catch (error) {
    console.error('Error fetching playlists:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch playlists'
      }
    });
  }
});

export default router; 