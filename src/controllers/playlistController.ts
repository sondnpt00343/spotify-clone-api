import { Request, Response, NextFunction } from 'express';
import { PlaylistModel } from '../models/Playlist';
import { TrackModel } from '../models/Track';
import { CustomError } from '../middleware/errorHandler';

export class PlaylistController {
  // GET /api/playlists/:id
  static async getPlaylist(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!id) {
        const error: CustomError = new Error('Playlist ID is required');
        error.statusCode = 400;
        error.code = 'MISSING_PLAYLIST_ID';
        throw error;
      }

      // Check if user can access this playlist
      const canAccess = await PlaylistModel.canAccess(id, userId);
      if (!canAccess) {
        const error: CustomError = new Error('Playlist not found or access denied');
        error.statusCode = 404;
        error.code = 'PLAYLIST_NOT_FOUND';
        throw error;
      }

      // Get playlist with details
      const playlist = await PlaylistModel.getWithDetails(id);
      if (!playlist) {
        const error: CustomError = new Error('Playlist not found');
        error.statusCode = 404;
        error.code = 'PLAYLIST_NOT_FOUND';
        throw error;
      }

      // Check if user is following (if authenticated)
      let is_following = false;
      let is_owner = false;
      if (userId) {
        is_following = await PlaylistModel.isFollowing(userId, id);
        is_owner = await PlaylistModel.isOwner(id, userId);
      }

      res.status(200).json({
        ...playlist,
        is_following,
        is_owner
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/playlists/:id/tracks
  static async getPlaylistTracks(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      if (!id) {
        const error: CustomError = new Error('Playlist ID is required');
        error.statusCode = 400;
        error.code = 'MISSING_PLAYLIST_ID';
        throw error;
      }

      // Check if user can access this playlist
      const canAccess = await PlaylistModel.canAccess(id, userId);
      if (!canAccess) {
        const error: CustomError = new Error('Playlist not found or access denied');
        error.statusCode = 404;
        error.code = 'PLAYLIST_NOT_FOUND';
        throw error;
      }

      // Get playlist tracks
      const tracks = await PlaylistModel.getTracks(id, limit, offset);

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

  // GET /api/playlists (browse/search public playlists)
  static async getPlaylists(req: Request, res: Response, next: NextFunction) {
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

      const playlists = await PlaylistModel.getPublicPlaylists(query, limit, offset);

      res.status(200).json({
        playlists,
        pagination: {
          limit,
          offset,
          total: playlists.length
        },
        query: query || null
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/me/playlists (user's own playlists)
  static async getUserPlaylists(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        const error: CustomError = new Error('User not authenticated');
        error.statusCode = 401;
        error.code = 'NOT_AUTHENTICATED';
        throw error;
      }

      const playlists = await PlaylistModel.getUserPlaylists(userId, true);

      res.status(200).json({
        playlists
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/me/playlists/followed (user's followed playlists)
  static async getFollowedPlaylists(req: Request, res: Response, next: NextFunction) {
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

      const playlists = await PlaylistModel.getFollowedPlaylists(userId, limit, offset);

      res.status(200).json({
        playlists,
        pagination: {
          limit,
          offset,
          total: playlists.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/playlists
  static async createPlaylist(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const { name, description, image_url, is_public } = req.body;

      if (!userId) {
        const error: CustomError = new Error('User not authenticated');
        error.statusCode = 401;
        error.code = 'NOT_AUTHENTICATED';
        throw error;
      }

      // Validate required fields
      if (!name || name.trim().length === 0) {
        const error: CustomError = new Error('Playlist name is required');
        error.statusCode = 400;
        error.code = 'MISSING_PLAYLIST_NAME';
        throw error;
      }

      // Create playlist
      const newPlaylist = await PlaylistModel.create(userId, {
        name: name.trim(),
        description,
        image_url,
        is_public: is_public || false
      });

      res.status(201).json({
        message: 'Playlist created successfully',
        playlist: newPlaylist
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/playlists/:id
  static async updatePlaylist(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const { name, description, image_url, is_public } = req.body;

      if (!id) {
        const error: CustomError = new Error('Playlist ID is required');
        error.statusCode = 400;
        error.code = 'MISSING_PLAYLIST_ID';
        throw error;
      }

      if (!userId) {
        const error: CustomError = new Error('User not authenticated');
        error.statusCode = 401;
        error.code = 'NOT_AUTHENTICATED';
        throw error;
      }

      // Check if user owns the playlist
      const isOwner = await PlaylistModel.isOwner(id, userId);
      if (!isOwner) {
        const error: CustomError = new Error('Permission denied: You can only edit your own playlists');
        error.statusCode = 403;
        error.code = 'PERMISSION_DENIED';
        throw error;
      }

      // Get current playlist to check if it's the default "Liked Songs" playlist
      const currentPlaylist = await PlaylistModel.findById(id);
      if (!currentPlaylist) {
        const error: CustomError = new Error('Playlist not found');
        error.statusCode = 404;
        error.code = 'PLAYLIST_NOT_FOUND';
        throw error;
      }

      // Prevent updating the default "Liked Songs" playlist
      if (currentPlaylist.name === 'Liked Songs') {
        const error: CustomError = new Error('Cannot modify the default "Liked Songs" playlist');
        error.statusCode = 403;
        error.code = 'CANNOT_MODIFY_LIKED_SONGS';
        throw error;
      }

      // Check for duplicate playlist name if name is being updated
      if (name && name.trim() !== currentPlaylist.name) {
        const trimmedName = name.trim();
        const duplicatePlaylist = await PlaylistModel.findByNameAndUser(trimmedName, userId);
        if (duplicatePlaylist) {
          const error: CustomError = new Error(`A playlist named "${trimmedName}" already exists in your library`);
          error.statusCode = 409;
          error.code = 'DUPLICATE_PLAYLIST_NAME';
          throw error;
        }
      }

      // Update playlist
      const updatedPlaylist = await PlaylistModel.update(id, userId, {
        name: name?.trim(),
        description,
        image_url,
        is_public
      });

      if (!updatedPlaylist) {
        const error: CustomError = new Error('Playlist not found');
        error.statusCode = 404;
        error.code = 'PLAYLIST_NOT_FOUND';
        throw error;
      }

      res.status(200).json({
        message: 'Playlist updated successfully',
        playlist: updatedPlaylist
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/playlists/:id
  static async deletePlaylist(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!id) {
        const error: CustomError = new Error('Playlist ID is required');
        error.statusCode = 400;
        error.code = 'MISSING_PLAYLIST_ID';
        throw error;
      }

      if (!userId) {
        const error: CustomError = new Error('User not authenticated');
        error.statusCode = 401;
        error.code = 'NOT_AUTHENTICATED';
        throw error;
      }

      // Check if user owns the playlist
      const isOwner = await PlaylistModel.isOwner(id, userId);
      if (!isOwner) {
        const error: CustomError = new Error('Permission denied: You can only delete your own playlists');
        error.statusCode = 403;
        error.code = 'PERMISSION_DENIED';
        throw error;
      }

      // Get current playlist to check if it's the default "Liked Songs" playlist
      const currentPlaylist = await PlaylistModel.findById(id);
      if (!currentPlaylist) {
        const error: CustomError = new Error('Playlist not found');
        error.statusCode = 404;
        error.code = 'PLAYLIST_NOT_FOUND';
        throw error;
      }

      // Prevent deleting the default "Liked Songs" playlist
      if (currentPlaylist.name === 'Liked Songs') {
        const error: CustomError = new Error('Cannot delete the default "Liked Songs" playlist');
        error.statusCode = 403;
        error.code = 'CANNOT_DELETE_LIKED_SONGS';
        throw error;
      }

      // Delete playlist
      await PlaylistModel.delete(id, userId);

      res.status(200).json({
        message: 'Playlist deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/playlists/:id/tracks
  static async addTrackToPlaylist(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const { track_id } = req.body;

      if (!id) {
        const error: CustomError = new Error('Playlist ID is required');
        error.statusCode = 400;
        error.code = 'MISSING_PLAYLIST_ID';
        throw error;
      }

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

      // Check if user owns the playlist
      const isOwner = await PlaylistModel.isOwner(id, userId);
      if (!isOwner) {
        const error: CustomError = new Error('Permission denied: You can only add tracks to your own playlists');
        error.statusCode = 403;
        error.code = 'PERMISSION_DENIED';
        throw error;
      }

      // Check if track exists
      const track = await TrackModel.findById(track_id);
      if (!track) {
        const error: CustomError = new Error('Track not found');
        error.statusCode = 404;
        error.code = 'TRACK_NOT_FOUND';
        throw error;
      }

      // Check if track is already in playlist
      const hasTrack = await PlaylistModel.hasTrack(id, track_id);
      if (hasTrack) {
        const error: CustomError = new Error('Track already exists in playlist');
        error.statusCode = 409;
        error.code = 'TRACK_ALREADY_EXISTS';
        throw error;
      }

      // Add track to playlist
      const playlistTrack = await PlaylistModel.addTrack(id, track_id, userId);

      res.status(200).json({
        message: 'Track added to playlist successfully',
        playlist_track: playlistTrack
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/playlists/:id/tracks/:trackId
  static async removeTrackFromPlaylist(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, trackId } = req.params;
      const userId = req.user?.userId;

      if (!id || !trackId) {
        const error: CustomError = new Error('Playlist ID and Track ID are required');
        error.statusCode = 400;
        error.code = 'MISSING_IDS';
        throw error;
      }

      if (!userId) {
        const error: CustomError = new Error('User not authenticated');
        error.statusCode = 401;
        error.code = 'NOT_AUTHENTICATED';
        throw error;
      }

      // Check if user owns the playlist
      const isOwner = await PlaylistModel.isOwner(id, userId);
      if (!isOwner) {
        const error: CustomError = new Error('Permission denied: You can only remove tracks from your own playlists');
        error.statusCode = 403;
        error.code = 'PERMISSION_DENIED';
        throw error;
      }

      // Check if track is in playlist
      const hasTrack = await PlaylistModel.hasTrack(id, trackId);
      if (!hasTrack) {
        const error: CustomError = new Error('Track not found in playlist');
        error.statusCode = 404;
        error.code = 'TRACK_NOT_IN_PLAYLIST';
        throw error;
      }

      // Remove track from playlist
      await PlaylistModel.removeTrack(id, trackId, userId);

      res.status(200).json({
        message: 'Track removed from playlist successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/playlists/:id/tracks/:trackId/position
  static async reorderTrack(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, trackId } = req.params;
      const userId = req.user?.userId;
      const { position } = req.body;

      if (!id || !trackId) {
        const error: CustomError = new Error('Playlist ID and Track ID are required');
        error.statusCode = 400;
        error.code = 'MISSING_IDS';
        throw error;
      }

      if (!userId) {
        const error: CustomError = new Error('User not authenticated');
        error.statusCode = 401;
        error.code = 'NOT_AUTHENTICATED';
        throw error;
      }

      if (typeof position !== 'number' || position < 1) {
        const error: CustomError = new Error('Valid position (>= 1) is required');
        error.statusCode = 400;
        error.code = 'INVALID_POSITION';
        throw error;
      }

      // Check if user owns the playlist
      const isOwner = await PlaylistModel.isOwner(id, userId);
      if (!isOwner) {
        const error: CustomError = new Error('Permission denied: You can only reorder tracks in your own playlists');
        error.statusCode = 403;
        error.code = 'PERMISSION_DENIED';
        throw error;
      }

      // Reorder track
      await PlaylistModel.reorderTracks(id, trackId, position, userId);

      res.status(200).json({
        message: 'Track position updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/playlists/:id/follow
  static async followPlaylist(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!id) {
        const error: CustomError = new Error('Playlist ID is required');
        error.statusCode = 400;
        error.code = 'MISSING_PLAYLIST_ID';
        throw error;
      }

      if (!userId) {
        const error: CustomError = new Error('User not authenticated');
        error.statusCode = 401;
        error.code = 'NOT_AUTHENTICATED';
        throw error;
      }

      // Check if playlist exists and is public
      const playlist = await PlaylistModel.findById(id);
      if (!playlist) {
        const error: CustomError = new Error('Playlist not found');
        error.statusCode = 404;
        error.code = 'PLAYLIST_NOT_FOUND';
        throw error;
      }

      if (!playlist.is_public) {
        const error: CustomError = new Error('Cannot follow private playlist');
        error.statusCode = 403;
        error.code = 'PRIVATE_PLAYLIST';
        throw error;
      }

      // Can't follow your own playlist
      if (playlist.user_id === userId) {
        const error: CustomError = new Error('Cannot follow your own playlist');
        error.statusCode = 409;
        error.code = 'OWN_PLAYLIST';
        throw error;
      }

      // Check if already following
      const isFollowing = await PlaylistModel.isFollowing(userId, id);
      if (isFollowing) {
        const error: CustomError = new Error('Already following this playlist');
        error.statusCode = 409;
        error.code = 'ALREADY_FOLLOWING';
        throw error;
      }

      // Follow playlist
      await PlaylistModel.follow(userId, id);

      res.status(200).json({
        message: 'Playlist followed successfully',
        is_following: true
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/playlists/:id/follow
  static async unfollowPlaylist(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!id) {
        const error: CustomError = new Error('Playlist ID is required');
        error.statusCode = 400;
        error.code = 'MISSING_PLAYLIST_ID';
        throw error;
      }

      if (!userId) {
        const error: CustomError = new Error('User not authenticated');
        error.statusCode = 401;
        error.code = 'NOT_AUTHENTICATED';
        throw error;
      }

      // Check if currently following
      const isFollowing = await PlaylistModel.isFollowing(userId, id);
      if (!isFollowing) {
        const error: CustomError = new Error('Not following this playlist');
        error.statusCode = 409;
        error.code = 'NOT_FOLLOWING';
        throw error;
      }

      // Unfollow playlist
      await PlaylistModel.unfollow(userId, id);

      res.status(200).json({
        message: 'Playlist unfollowed successfully',
        is_following: false
      });
    } catch (error) {
      next(error);
    }
  }
} 