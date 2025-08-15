import { Request, Response, NextFunction } from 'express';
import { TrackModel } from '../models/Track';
import { CustomError } from '../middleware/errorHandler';

export class TrackController {
  // GET /api/tracks/:id
  static async getTrack(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!id) {
        const error: CustomError = new Error('Track ID is required');
        error.statusCode = 400;
        error.code = 'MISSING_TRACK_ID';
        throw error;
      }

      // Get track with details
      const track = await TrackModel.getWithDetails(id);
      if (!track) {
        const error: CustomError = new Error('Track not found');
        error.statusCode = 404;
        error.code = 'TRACK_NOT_FOUND';
        throw error;
      }

      // Check if user has liked this track (if authenticated)
      let is_liked = false;
      if (userId) {
        is_liked = await TrackModel.isLiked(userId, id);
      }

      res.status(200).json({
        ...track,
        is_liked
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/tracks (search and browse)
  static async getTracks(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query.q as string;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      // Validate limit
      if (limit > 50) {
        const error: CustomError = new Error('Limit cannot exceed 50');
        error.statusCode = 400;
        error.code = 'INVALID_LIMIT';
        throw error;
      }

      let tracks;
      if (query) {
        // Search tracks
        tracks = await TrackModel.search(query, limit, offset);
      } else {
        // Get all tracks (browse)
        tracks = await TrackModel.getAll(limit, offset);
      }

      res.status(200).json({
        tracks,
        pagination: {
          limit,
          offset,
          total: tracks.length
        },
        query: query || null
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/tracks/popular
  static async getPopular(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      // Validate limit
      if (limit > 50) {
        const error: CustomError = new Error('Limit cannot exceed 50');
        error.statusCode = 400;
        error.code = 'INVALID_LIMIT';
        throw error;
      }

      const tracks = await TrackModel.getPopular(limit, offset);

      res.status(200).json({
        tracks,
        pagination: {
          limit,
          offset,
          total: tracks.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/tracks/trending
  static async getTrending(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 20;

      const tracks = await TrackModel.getTrending(limit);

      res.status(200).json({
        tracks,
        pagination: {
          limit,
          total: tracks.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/tracks/:id/complete - Track play completion with actual duration
  static async completeTrack(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const { play_duration } = req.body;

      if (!id) {
        const error: CustomError = new Error('Track ID is required');
        error.statusCode = 400;
        error.code = 'MISSING_TRACK_ID';
        throw error;
      }

      if (!userId) {
        const error: CustomError = new Error('User not authenticated');
        error.statusCode = 401;
        error.code = 'NOT_AUTHENTICATED';
        throw error;
      }

      if (!play_duration || typeof play_duration !== 'number' || play_duration <= 0) {
        const error: CustomError = new Error('Valid play duration in seconds is required');
        error.statusCode = 400;
        error.code = 'INVALID_PLAY_DURATION';
        throw error;
      }

      // Check if track exists
      const track = await TrackModel.findById(id);
      if (!track) {
        const error: CustomError = new Error('Track not found');
        error.statusCode = 404;
        error.code = 'TRACK_NOT_FOUND';
        throw error;
      }

      // Record completed play with actual duration
      const playWasCounted = await TrackModel.recordPlay(userId, id, play_duration);

      // Get updated track with new play count
      const updatedTrack = await TrackModel.getWithDetails(id);

      res.status(200).json({
        message: playWasCounted ? 'Track completion recorded and counted' : 'Track completion recorded (not counted due to duration/spam)',
        track: updatedTrack,
        play_count: updatedTrack?.play_count,
        was_counted: playWasCounted,
        play_duration_seconds: play_duration,
        minimum_required_seconds: Math.min(30, track.duration * 0.5)
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/tracks/:id/play
  static async playTrack(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const { position } = req.body;

      if (!id) {
        const error: CustomError = new Error('Track ID is required');
        error.statusCode = 400;
        error.code = 'MISSING_TRACK_ID';
        throw error;
      }

      if (!userId) {
        const error: CustomError = new Error('User not authenticated');
        error.statusCode = 401;
        error.code = 'NOT_AUTHENTICATED';
        throw error;
      }

      // Check if track exists
      const track = await TrackModel.findById(id);
      if (!track) {
        const error: CustomError = new Error('Track not found');
        error.statusCode = 404;
        error.code = 'TRACK_NOT_FOUND';
        throw error;
      }

      // Record play in history and increment play count if valid
      const playWasCounted = await TrackModel.recordPlay(userId, id, position);

      // Get updated track with new play count
      const updatedTrack = await TrackModel.getWithDetails(id);

      res.status(200).json({
        message: playWasCounted ? 'Track play recorded and counted' : 'Track play recorded (not counted due to duration/spam)',
        track: updatedTrack,
        play_count: updatedTrack?.play_count,
        was_counted: playWasCounted
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/tracks/:id/like
  static async likeTrack(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!id) {
        const error: CustomError = new Error('Track ID is required');
        error.statusCode = 400;
        error.code = 'MISSING_TRACK_ID';
        throw error;
      }

      if (!userId) {
        const error: CustomError = new Error('User not authenticated');
        error.statusCode = 401;
        error.code = 'NOT_AUTHENTICATED';
        throw error;
      }

      // Check if track exists
      const track = await TrackModel.findById(id);
      if (!track) {
        const error: CustomError = new Error('Track not found');
        error.statusCode = 404;
        error.code = 'TRACK_NOT_FOUND';
        throw error;
      }

      // Check if already liked
      const isAlreadyLiked = await TrackModel.isLiked(userId, id);
      if (isAlreadyLiked) {
        const error: CustomError = new Error('Track already liked');
        error.statusCode = 409;
        error.code = 'ALREADY_LIKED';
        throw error;
      }

      // Like track
      await TrackModel.like(userId, id);

      res.status(200).json({
        message: 'Track liked successfully',
        is_liked: true
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/tracks/:id/like
  static async unlikeTrack(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!id) {
        const error: CustomError = new Error('Track ID is required');
        error.statusCode = 400;
        error.code = 'MISSING_TRACK_ID';
        throw error;
      }

      if (!userId) {
        const error: CustomError = new Error('User not authenticated');
        error.statusCode = 401;
        error.code = 'NOT_AUTHENTICATED';
        throw error;
      }

      // Check if track exists
      const track = await TrackModel.findById(id);
      if (!track) {
        const error: CustomError = new Error('Track not found');
        error.statusCode = 404;
        error.code = 'TRACK_NOT_FOUND';
        throw error;
      }

      // Check if currently liked
      const isLiked = await TrackModel.isLiked(userId, id);
      if (!isLiked) {
        const error: CustomError = new Error('Track not liked');
        error.statusCode = 409;
        error.code = 'NOT_LIKED';
        throw error;
      }

      // Unlike track
      await TrackModel.unlike(userId, id);

      res.status(200).json({
        message: 'Track unliked successfully',
        is_liked: false
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/me/tracks/liked
  static async getLikedTracks(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      if (!userId) {
        const error: CustomError = new Error('User not authenticated');
        error.statusCode = 401;
        error.code = 'NOT_AUTHENTICATED';
        throw error;
      }

      // Validate limit
      if (limit > 50) {
        const error: CustomError = new Error('Limit cannot exceed 50');
        error.statusCode = 400;
        error.code = 'INVALID_LIMIT';
        throw error;
      }

      const tracks = await TrackModel.getLikedTracks(userId, limit, offset);

      res.status(200).json({
        tracks,
        pagination: {
          limit,
          offset,
          total: tracks.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/me/player/recently-played
  static async getRecentlyPlayed(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      if (!userId) {
        const error: CustomError = new Error('User not authenticated');
        error.statusCode = 401;
        error.code = 'NOT_AUTHENTICATED';
        throw error;
      }

      // Validate limit
      if (limit > 50) {
        const error: CustomError = new Error('Limit cannot exceed 50');
        error.statusCode = 400;
        error.code = 'INVALID_LIMIT';
        throw error;
      }

      const playHistory = await TrackModel.getRecentlyPlayed(userId, limit, offset);

      res.status(200).json({
        items: playHistory,
        pagination: {
          limit,
          offset,
          total: playHistory.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/tracks (admin only)
  static async createTrack(req: Request, res: Response, next: NextFunction) {
    try {
      console.log('Track creation request body:', req.body);
      const { title, duration, audio_url, image_url, album_id, artist_id, track_number } = req.body;

      // Validate required fields
      if (!title || !artist_id) {
        const error: CustomError = new Error('Missing required fields');
        error.statusCode = 400;
        error.code = 'MISSING_FIELDS';
        error.details = 'title and artist_id are required';
        throw error;
      }

      // Create track
      const newTrack = await TrackModel.create({
        title,
        duration,
        audio_url,
        image_url,
        album_id,
        artist_id,
        track_number
      });

      res.status(201).json({
        message: 'Track created successfully',
        track: newTrack
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/tracks/:id (admin only)
  static async updateTrack(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      console.log('Track update request body:', req.body);
      const { title, duration, audio_url, image_url, album_id, artist_id, track_number } = req.body;

      if (!id) {
        const error: CustomError = new Error('Track ID is required');
        error.statusCode = 400;
        error.code = 'MISSING_TRACK_ID';
        throw error;
      }

      // Check if track exists
      const track = await TrackModel.findById(id);
      if (!track) {
        const error: CustomError = new Error('Track not found');
        error.statusCode = 404;
        error.code = 'TRACK_NOT_FOUND';
        throw error;
      }

      // Update track
      const updatedTrack = await TrackModel.update(id, {
        title,
        duration,
        audio_url,
        image_url,
        album_id,
        artist_id,
        track_number
      });

      res.status(200).json({
        message: 'Track updated successfully',
        track: updatedTrack
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/tracks/:id (admin only)
  static async deleteTrack(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id) {
        const error: CustomError = new Error('Track ID is required');
        error.statusCode = 400;
        error.code = 'MISSING_TRACK_ID';
        throw error;
      }

      // Check if track exists
      const track = await TrackModel.findById(id);
      if (!track) {
        const error: CustomError = new Error('Track not found');
        error.statusCode = 404;
        error.code = 'TRACK_NOT_FOUND';
        throw error;
      }

      // Delete track
      await TrackModel.delete(id);

      res.status(200).json({
        message: 'Track deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
} 