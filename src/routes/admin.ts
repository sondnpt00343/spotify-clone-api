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
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Allow more requests for admin operations
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many admin requests, please try again later.'
    }
  }
});

// Get all users (admin only)
router.get('/users', adminLimiter, async (req, res) => {
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
router.get('/users/:id', adminLimiter, async (req, res) => {
  try {
    const { id } = req.params;
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

            const userResponse = UserModel.toResponse(user, req);
    res.json({
      success: true,
      data: userResponse
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch user'
      }
    });
  }
});

// Update user (admin only)
router.put('/users/:id', adminLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { display_name, avatar_url } = req.body;

    const updatedUser = await UserModel.update(id, {
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

            const userResponse = UserModel.toResponse(updatedUser, req);
    res.json({
      success: true,
      data: userResponse,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update user'
      }
    });
  }
});

// Delete user (admin only)
router.delete('/users/:id', adminLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    
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

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete user'
      }
    });
  }
});

// Get dashboard stats
router.get('/stats', adminLimiter, async (req, res) => {
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

export default router; 