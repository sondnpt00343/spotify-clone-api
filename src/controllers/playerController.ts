import { Request, Response, NextFunction } from 'express';
import { PlayerModel } from '../models/Player';
import { TrackModel } from '../models/Track';
import { CustomError } from '../middleware/errorHandler';

export class PlayerController {
  // GET /api/me/player
  static async getCurrentPlayback(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        const error: CustomError = new Error('User not authenticated');
        error.statusCode = 401;
        error.code = 'NOT_AUTHENTICATED';
        throw error;
      }

      // Get current playback state
      const currentPlayback = await PlayerModel.getCurrentPlayback(userId);

      if (!currentPlayback) {
        return res.status(204).send(); // No content - no active playback
      }

      return res.status(200).json(currentPlayback);
    } catch (error) {
      return next(error);
    }
  }

  // PUT /api/me/player/play
  static async startPlayback(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const { 
        track_id, 
        context_type, 
        context_id, 
        position_ms = 0,
        volume_percent,
        device_name 
      } = req.body;

      if (!userId) {
        const error: CustomError = new Error('User not authenticated');
        error.statusCode = 401;
        error.code = 'NOT_AUTHENTICATED';
        throw error;
      }

      if (!track_id) {
        const error: CustomError = new Error('Track ID is required');
        error.statusCode = 400;
        error.code = 'MISSING_TRACK_ID';
        throw error;
      }

      // Verify track exists
      const track = await TrackModel.findById(track_id);
      if (!track) {
        const error: CustomError = new Error('Track not found');
        error.statusCode = 404;
        error.code = 'TRACK_NOT_FOUND';
        throw error;
      }

      // Start/update playback
      await PlayerModel.updatePlayback(userId, track_id, {
        context_type,
        context_id,
        is_playing: true,
        position_ms,
        volume_percent,
        device_name
      });

      // Note: Play will be recorded when track is completed/skipped with proper duration
      // Don't record immediately on start to avoid counting incomplete plays

      // Get updated playback state
      const updatedPlayback = await PlayerModel.getCurrentPlayback(userId);

      res.status(200).json(updatedPlayback);
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/me/player/pause
  static async pausePlayback(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        const error: CustomError = new Error('User not authenticated');
        error.statusCode = 401;
        error.code = 'NOT_AUTHENTICATED';
        throw error;
      }

      // Pause playback
      const updatedPlayback = await PlayerModel.playbackControl(userId, {
        action: 'pause'
      });

      if (!updatedPlayback) {
        const error: CustomError = new Error('No active playback session');
        error.statusCode = 404;
        error.code = 'NO_ACTIVE_PLAYBACK';
        throw error;
      }

      res.status(200).json(updatedPlayback);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/me/player/next
  static async skipToNext(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        const error: CustomError = new Error('User not authenticated');
        error.statusCode = 401;
        error.code = 'NOT_AUTHENTICATED';
        throw error;
      }

      // Skip to next track
      const updatedPlayback = await PlayerModel.playbackControl(userId, {
        action: 'next'
      });

      if (!updatedPlayback) {
        const error: CustomError = new Error('No next track available');
        error.statusCode = 404;
        error.code = 'NO_NEXT_TRACK';
        throw error;
      }

      // Record play for new track (when skipping, we assume some listening time)
      // Use a reasonable duration for skip scenarios
      await TrackModel.recordPlay(userId, updatedPlayback.track.id, 35);

      res.status(200).json(updatedPlayback);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/me/player/previous
  static async skipToPrevious(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        const error: CustomError = new Error('User not authenticated');
        error.statusCode = 401;
        error.code = 'NOT_AUTHENTICATED';
        throw error;
      }

      // Skip to previous track
      const updatedPlayback = await PlayerModel.playbackControl(userId, {
        action: 'previous'
      });

      if (!updatedPlayback) {
        const error: CustomError = new Error('No previous track available');
        error.statusCode = 404;
        error.code = 'NO_PREVIOUS_TRACK';
        throw error;
      }

      // Record play for previous track (when going back, assume some listening time)
      // Use a reasonable duration for previous track scenarios
      await TrackModel.recordPlay(userId, updatedPlayback.track.id, 35);

      res.status(200).json(updatedPlayback);
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/me/player/seek
  static async seekToPosition(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const { position_ms } = req.body;

      if (!userId) {
        const error: CustomError = new Error('User not authenticated');
        error.statusCode = 401;
        error.code = 'NOT_AUTHENTICATED';
        throw error;
      }

      if (typeof position_ms !== 'number' || position_ms < 0) {
        const error: CustomError = new Error('Valid position in milliseconds is required');
        error.statusCode = 400;
        error.code = 'INVALID_POSITION';
        throw error;
      }

      // Seek to position
      const updatedPlayback = await PlayerModel.playbackControl(userId, {
        action: 'seek',
        position_ms
      });

      if (!updatedPlayback) {
        const error: CustomError = new Error('No active playback session');
        error.statusCode = 404;
        error.code = 'NO_ACTIVE_PLAYBACK';
        throw error;
      }

      res.status(200).json(updatedPlayback);
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/me/player/volume
  static async setVolume(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const { volume_percent } = req.body;

      if (!userId) {
        const error: CustomError = new Error('User not authenticated');
        error.statusCode = 401;
        error.code = 'NOT_AUTHENTICATED';
        throw error;
      }

      if (typeof volume_percent !== 'number' || volume_percent < 0 || volume_percent > 100) {
        const error: CustomError = new Error('Volume must be between 0 and 100');
        error.statusCode = 400;
        error.code = 'INVALID_VOLUME';
        throw error;
      }

      // Set volume
      const updatedPlayback = await PlayerModel.playbackControl(userId, {
        action: 'volume',
        volume_percent
      });

      if (!updatedPlayback) {
        const error: CustomError = new Error('No active playback session');
        error.statusCode = 404;
        error.code = 'NO_ACTIVE_PLAYBACK';
        throw error;
      }

      res.status(200).json(updatedPlayback);
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/me/player/shuffle
  static async setShuffle(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const { state } = req.body;

      if (!userId) {
        const error: CustomError = new Error('User not authenticated');
        error.statusCode = 401;
        error.code = 'NOT_AUTHENTICATED';
        throw error;
      }

      if (typeof state !== 'boolean') {
        const error: CustomError = new Error('Shuffle state must be boolean');
        error.statusCode = 400;
        error.code = 'INVALID_SHUFFLE_STATE';
        throw error;
      }

      // Set shuffle
      const updatedPlayback = await PlayerModel.playbackControl(userId, {
        action: 'shuffle',
        shuffle_state: state
      });

      if (!updatedPlayback) {
        const error: CustomError = new Error('No active playback session');
        error.statusCode = 404;
        error.code = 'NO_ACTIVE_PLAYBACK';
        throw error;
      }

      res.status(200).json(updatedPlayback);
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/me/player/repeat
  static async setRepeat(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const { state } = req.body;

      if (!userId) {
        const error: CustomError = new Error('User not authenticated');
        error.statusCode = 401;
        error.code = 'NOT_AUTHENTICATED';
        throw error;
      }

      if (!['off', 'track', 'context'].includes(state)) {
        const error: CustomError = new Error('Repeat state must be "off", "track", or "context"');
        error.statusCode = 400;
        error.code = 'INVALID_REPEAT_STATE';
        throw error;
      }

      // Set repeat
      const updatedPlayback = await PlayerModel.playbackControl(userId, {
        action: 'repeat',
        repeat_state: state
      });

      if (!updatedPlayback) {
        const error: CustomError = new Error('No active playback session');
        error.statusCode = 404;
        error.code = 'NO_ACTIVE_PLAYBACK';
        throw error;
      }

      res.status(200).json(updatedPlayback);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/me/player/queue
  static async getQueue(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const limit = parseInt(req.query.limit as string) || 20;

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

      // Get user's queue
      const queue = await PlayerModel.getQueue(userId, limit);

      res.status(200).json({
        queue,
        total: queue.length
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/me/player/queue
  static async addToQueue(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const { track_id, context_type, context_id } = req.body;

      if (!userId) {
        const error: CustomError = new Error('User not authenticated');
        error.statusCode = 401;
        error.code = 'NOT_AUTHENTICATED';
        throw error;
      }

      if (!track_id) {
        const error: CustomError = new Error('Track ID is required');
        error.statusCode = 400;
        error.code = 'MISSING_TRACK_ID';
        throw error;
      }

      // Verify track exists
      const track = await TrackModel.findById(track_id);
      if (!track) {
        const error: CustomError = new Error('Track not found');
        error.statusCode = 404;
        error.code = 'TRACK_NOT_FOUND';
        throw error;
      }

      // Add to queue
      const queueItem = await PlayerModel.addToQueue(
        userId, 
        track_id,
        context_type && context_id ? { type: context_type, id: context_id } : undefined
      );

      res.status(200).json({
        message: 'Track added to queue',
        queue_item: queueItem
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/me/player/queue/:queueItemId
  static async removeFromQueue(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const { queueItemId } = req.params;

      if (!userId) {
        const error: CustomError = new Error('User not authenticated');
        error.statusCode = 401;
        error.code = 'NOT_AUTHENTICATED';
        throw error;
      }

      if (!queueItemId) {
        const error: CustomError = new Error('Queue item ID is required');
        error.statusCode = 400;
        error.code = 'MISSING_QUEUE_ITEM_ID';
        throw error;
      }

      // Remove from queue
      await PlayerModel.removeFromQueue(userId, queueItemId);

      res.status(200).json({
        message: 'Track removed from queue'
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/me/player/queue
  static async clearQueue(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        const error: CustomError = new Error('User not authenticated');
        error.statusCode = 401;
        error.code = 'NOT_AUTHENTICATED';
        throw error;
      }

      // Clear queue
      await PlayerModel.clearQueue(userId);

      res.status(200).json({
        message: 'Queue cleared'
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/me/player/device
  static async transferPlayback(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const { device_name } = req.body;

      if (!userId) {
        const error: CustomError = new Error('User not authenticated');
        error.statusCode = 401;
        error.code = 'NOT_AUTHENTICATED';
        throw error;
      }

      if (!device_name || typeof device_name !== 'string') {
        const error: CustomError = new Error('Device name is required');
        error.statusCode = 400;
        error.code = 'MISSING_DEVICE_NAME';
        throw error;
      }

      // Transfer playback to device
      const updatedPlayback = await PlayerModel.transferPlayback(userId, device_name);

      if (!updatedPlayback) {
        const error: CustomError = new Error('No active playback session');
        error.statusCode = 404;
        error.code = 'NO_ACTIVE_PLAYBACK';
        throw error;
      }

      res.status(200).json({
        message: 'Playback transferred successfully',
        device_name: updatedPlayback.device_name
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/me/player
  static async stopPlayback(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        const error: CustomError = new Error('User not authenticated');
        error.statusCode = 401;
        error.code = 'NOT_AUTHENTICATED';
        throw error;
      }

      // Stop playback
      await PlayerModel.stopPlayback(userId);

      res.status(200).json({
        message: 'Playback stopped'
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/me/player/play - Resume playback
  static async resumePlayback(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        const error: CustomError = new Error('User not authenticated');
        error.statusCode = 401;
        error.code = 'NOT_AUTHENTICATED';
        throw error;
      }

      // Resume playback
      const updatedPlayback = await PlayerModel.playbackControl(userId, {
        action: 'play'
      });

      if (!updatedPlayback) {
        const error: CustomError = new Error('No active playback session');
        error.statusCode = 404;
        error.code = 'NO_ACTIVE_PLAYBACK';
        throw error;
      }

      res.status(200).json(updatedPlayback);
    } catch (error) {
      next(error);
    }
  }
} 