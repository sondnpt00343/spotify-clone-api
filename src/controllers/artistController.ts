import { Request, Response, NextFunction } from 'express';
import { ArtistModel } from '../models/Artist';
import { CustomError } from '../middleware/errorHandler';

export class ArtistController {
  // GET /api/artists/:id
  static async getArtist(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!id) {
        const error: CustomError = new Error('Artist ID is required');
        error.statusCode = 400;
        error.code = 'MISSING_ARTIST_ID';
        throw error;
      }

      // Get artist with stats
      const artist = await ArtistModel.getWithStats(id);
      if (!artist) {
        const error: CustomError = new Error('Artist not found');
        error.statusCode = 404;
        error.code = 'ARTIST_NOT_FOUND';
        throw error;
      }

      // Check if user is following (if authenticated)
      let is_following = false;
      if (userId) {
        is_following = await ArtistModel.isFollowing(userId, id);
      }

      res.status(200).json({
        ...artist,
        is_following
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/artists/:id/tracks/popular
  static async getPopularTracks(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      if (!id) {
        const error: CustomError = new Error('Artist ID is required');
        error.statusCode = 400;
        error.code = 'MISSING_ARTIST_ID';
        throw error;
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;

      // Validate limit
      if (limit > 50) {
        const error: CustomError = new Error('Limit cannot exceed 50');
        error.statusCode = 400;
        error.code = 'INVALID_LIMIT';
        throw error;
      }

      // Check if artist exists
      const artist = await ArtistModel.findById(id);
      if (!artist) {
        const error: CustomError = new Error('Artist not found');
        error.statusCode = 404;
        error.code = 'ARTIST_NOT_FOUND';
        throw error;
      }

      // Get popular tracks
      const tracks = await ArtistModel.getPopularTracks(id, limit, offset);

      res.status(200).json({
        tracks,
        artist: {
          id: artist.id,
          name: artist.name,
          image_url: artist.image_url
        },
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

  // GET /api/artists/:id/albums
  static async getAlbums(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id) {
        const error: CustomError = new Error('Artist ID is required');
        error.statusCode = 400;
        error.code = 'MISSING_ARTIST_ID';
        throw error;
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;

      // Check if artist exists
      const artist = await ArtistModel.findById(id);
      if (!artist) {
        const error: CustomError = new Error('Artist not found');
        error.statusCode = 404;
        error.code = 'ARTIST_NOT_FOUND';
        throw error;
      }

      // Get albums
      const albums = await ArtistModel.getAlbums(id, limit, offset);

      res.status(200).json({
        albums,
        artist: {
          id: artist.id,
          name: artist.name,
          image_url: artist.image_url
        },
        pagination: {
          limit,
          offset,
          total: albums.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/artists (search and browse)
  static async getArtists(req: Request, res: Response, next: NextFunction) {
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

      let artists;
      if (query) {
        // Search artists
        artists = await ArtistModel.search(query, limit, offset);
      } else {
        // Get all artists (browse)
        artists = await ArtistModel.getAll(limit, offset);
      }

      res.status(200).json({
        artists,
        pagination: {
          limit,
          offset,
          total: artists.length
        },
        query: query || null
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/artists/trending
  static async getTrending(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;

      const artists = await ArtistModel.getTrending(limit);

      res.status(200).json({
        artists,
        pagination: {
          limit,
          total: artists.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/artists/:id/follow
  static async followArtist(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!id) {
        const error: CustomError = new Error('Artist ID is required');
        error.statusCode = 400;
        error.code = 'MISSING_ARTIST_ID';
        throw error;
      }

      if (!userId) {
        const error: CustomError = new Error('User not authenticated');
        error.statusCode = 401;
        error.code = 'NOT_AUTHENTICATED';
        throw error;
      }

      // Check if artist exists
      const artist = await ArtistModel.findById(id);
      if (!artist) {
        const error: CustomError = new Error('Artist not found');
        error.statusCode = 404;
        error.code = 'ARTIST_NOT_FOUND';
        throw error;
      }

      // Check if already following
      const isAlreadyFollowing = await ArtistModel.isFollowing(userId, id);
      if (isAlreadyFollowing) {
        const error: CustomError = new Error('Already following this artist');
        error.statusCode = 409;
        error.code = 'ALREADY_FOLLOWING';
        throw error;
      }

      // Follow artist
      await ArtistModel.follow(userId, id);

      res.status(200).json({
        message: 'Artist followed successfully',
        is_following: true
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/artists/:id/follow
  static async unfollowArtist(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!id) {
        const error: CustomError = new Error('Artist ID is required');
        error.statusCode = 400;
        error.code = 'MISSING_ARTIST_ID';
        throw error;
      }

      if (!userId) {
        const error: CustomError = new Error('User not authenticated');
        error.statusCode = 401;
        error.code = 'NOT_AUTHENTICATED';
        throw error;
      }

      // Check if artist exists
      const artist = await ArtistModel.findById(id);
      if (!artist) {
        const error: CustomError = new Error('Artist not found');
        error.statusCode = 404;
        error.code = 'ARTIST_NOT_FOUND';
        throw error;
      }

      // Check if currently following
      const isFollowing = await ArtistModel.isFollowing(userId, id);
      if (!isFollowing) {
        const error: CustomError = new Error('Not following this artist');
        error.statusCode = 409;
        error.code = 'NOT_FOLLOWING';
        throw error;
      }

      // Unfollow artist
      await ArtistModel.unfollow(userId, id);

      res.status(200).json({
        message: 'Artist unfollowed successfully',
        is_following: false
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/artists (admin only)
  static async createArtist(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, bio, image_url, background_image_url, is_verified, monthly_listeners } = req.body;

      // Check if artist name already exists
      const existingArtist = await ArtistModel.findByName(name);
      if (existingArtist) {
        const error: CustomError = new Error('Artist with this name already exists');
        error.statusCode = 409;
        error.code = 'ARTIST_EXISTS';
        throw error;
      }

      // Create artist
      const newArtist = await ArtistModel.create({
        name,
        bio,
        image_url,
        background_image_url,
        is_verified: is_verified || false,
        monthly_listeners: monthly_listeners || 0
      });

      res.status(201).json({
        message: 'Artist created successfully',
        artist: newArtist
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/artists/:id (admin only)
  static async updateArtist(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name, bio, image_url, background_image_url, is_verified, monthly_listeners } = req.body;

      if (!id) {
        const error: CustomError = new Error('Artist ID is required');
        error.statusCode = 400;
        error.code = 'MISSING_ARTIST_ID';
        throw error;
      }

      // Check if artist exists
      const artist = await ArtistModel.findById(id);
      if (!artist) {
        const error: CustomError = new Error('Artist not found');
        error.statusCode = 404;
        error.code = 'ARTIST_NOT_FOUND';
        throw error;
      }

      // Update artist
      const updatedArtist = await ArtistModel.update(id, {
        name,
        bio,
        image_url,
        background_image_url,
        is_verified,
        monthly_listeners
      });

      res.status(200).json({
        message: 'Artist updated successfully',
        artist: updatedArtist
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/me/following - Get user's followed artists
  static async getFollowedArtists(req: Request, res: Response, next: NextFunction) {
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

      // Get followed artists
      const followedArtists = await ArtistModel.getFollowedArtists(userId, limit, offset);

      res.status(200).json({
        artists: followedArtists,
        pagination: {
          limit,
          offset,
          total: followedArtists.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/artists/:id (admin only)
  static async deleteArtist(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id) {
        const error: CustomError = new Error('Artist ID is required');
        error.statusCode = 400;
        error.code = 'MISSING_ARTIST_ID';
        throw error;
      }

      // Check if artist exists
      const artist = await ArtistModel.findById(id);
      if (!artist) {
        const error: CustomError = new Error('Artist not found');
        error.statusCode = 404;
        error.code = 'ARTIST_NOT_FOUND';
        throw error;
      }

      // Delete artist
      await ArtistModel.delete(id);

      res.status(200).json({
        message: 'Artist deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
} 