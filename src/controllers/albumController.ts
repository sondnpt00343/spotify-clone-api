import { Request, Response, NextFunction } from 'express';
import { AlbumModel } from '../models/Album';
import { CustomError } from '../middleware/errorHandler';

export class AlbumController {
  // GET /api/albums/:id
  static async getAlbum(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!id) {
        const error: CustomError = new Error('Album ID is required');
        error.statusCode = 400;
        error.code = 'MISSING_ALBUM_ID';
        throw error;
      }

      // Get album with details
      const album = await AlbumModel.getWithDetails(id);
      if (!album) {
        const error: CustomError = new Error('Album not found');
        error.statusCode = 404;
        error.code = 'ALBUM_NOT_FOUND';
        throw error;
      }

      // Check if user has liked this album (if authenticated)
      let is_liked = false;
      if (userId) {
        is_liked = await AlbumModel.isLiked(userId, id);
      }

      res.status(200).json({
        ...album,
        is_liked
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/albums/:id/tracks
  static async getAlbumTracks(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id) {
        const error: CustomError = new Error('Album ID is required');
        error.statusCode = 400;
        error.code = 'MISSING_ALBUM_ID';
        throw error;
      }

      // Check if album exists
      const album = await AlbumModel.findById(id);
      if (!album) {
        const error: CustomError = new Error('Album not found');
        error.statusCode = 404;
        error.code = 'ALBUM_NOT_FOUND';
        throw error;
      }

      // Get album tracks
      const tracks = await AlbumModel.getTracks(id);

      res.status(200).json({
        tracks,
        album: {
          id: album.id,
          title: album.title,
          cover_image_url: album.cover_image_url
        },
        total: tracks.length
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/albums (search and browse)
  static async getAlbums(req: Request, res: Response, next: NextFunction) {
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

      let albums;
      if (query) {
        // Search albums
        albums = await AlbumModel.search(query, limit, offset);
      } else {
        // Get all albums (browse)
        albums = await AlbumModel.getAll(undefined, limit, offset);
      }

      res.status(200).json({
        albums,
        pagination: {
          limit,
          offset,
          total: albums.length
        },
        query: query || null
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/albums/popular
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

      const albums = await AlbumModel.getPopular(limit, offset);

      res.status(200).json({
        albums,
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

  // GET /api/albums/new-releases
  static async getNewReleases(req: Request, res: Response, next: NextFunction) {
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

      const albums = await AlbumModel.getNewReleases(limit, offset);

      res.status(200).json({
        albums,
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

  // POST /api/albums/:id/like
  static async likeAlbum(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!id) {
        const error: CustomError = new Error('Album ID is required');
        error.statusCode = 400;
        error.code = 'MISSING_ALBUM_ID';
        throw error;
      }

      if (!userId) {
        const error: CustomError = new Error('User not authenticated');
        error.statusCode = 401;
        error.code = 'NOT_AUTHENTICATED';
        throw error;
      }

      // Check if album exists
      const album = await AlbumModel.findById(id);
      if (!album) {
        const error: CustomError = new Error('Album not found');
        error.statusCode = 404;
        error.code = 'ALBUM_NOT_FOUND';
        throw error;
      }

      // Check if already liked
      const isAlreadyLiked = await AlbumModel.isLiked(userId, id);
      if (isAlreadyLiked) {
        const error: CustomError = new Error('Album already liked');
        error.statusCode = 409;
        error.code = 'ALREADY_LIKED';
        throw error;
      }

      // Like album
      await AlbumModel.like(userId, id);

      res.status(200).json({
        message: 'Album liked successfully',
        is_liked: true
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/albums/:id/like
  static async unlikeAlbum(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!id) {
        const error: CustomError = new Error('Album ID is required');
        error.statusCode = 400;
        error.code = 'MISSING_ALBUM_ID';
        throw error;
      }

      if (!userId) {
        const error: CustomError = new Error('User not authenticated');
        error.statusCode = 401;
        error.code = 'NOT_AUTHENTICATED';
        throw error;
      }

      // Check if album exists
      const album = await AlbumModel.findById(id);
      if (!album) {
        const error: CustomError = new Error('Album not found');
        error.statusCode = 404;
        error.code = 'ALBUM_NOT_FOUND';
        throw error;
      }

      // Check if currently liked
      const isLiked = await AlbumModel.isLiked(userId, id);
      if (!isLiked) {
        const error: CustomError = new Error('Album not liked');
        error.statusCode = 409;
        error.code = 'NOT_LIKED';
        throw error;
      }

      // Unlike album
      await AlbumModel.unlike(userId, id);

      res.status(200).json({
        message: 'Album unliked successfully',
        is_liked: false
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/me/albums/liked
  static async getLikedAlbums(req: Request, res: Response, next: NextFunction) {
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

      const albums = await AlbumModel.getLikedAlbums(userId, limit, offset);

      res.status(200).json({
        albums,
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

  // POST /api/albums (admin only)
  static async createAlbum(req: Request, res: Response, next: NextFunction) {
    try {
      const { title, description, cover_image_url, release_date, artist_id } = req.body;

      // Validate required fields
      if (!title || !release_date || !artist_id) {
        const error: CustomError = new Error('Missing required fields');
        error.statusCode = 400;
        error.code = 'MISSING_FIELDS';
        error.details = 'title, release_date, and artist_id are required';
        throw error;
      }

      // Check if album already exists for this artist
      const existingAlbum = await AlbumModel.findByTitleAndArtist(title, artist_id);
      if (existingAlbum) {
        const error: CustomError = new Error('Album with this title already exists for this artist');
        error.statusCode = 409;
        error.code = 'ALBUM_EXISTS';
        throw error;
      }

      // Create album
      const newAlbum = await AlbumModel.create({
        title,
        description,
        cover_image_url,
        release_date,
        artist_id
      });

      res.status(201).json({
        message: 'Album created successfully',
        album: newAlbum
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/albums/:id (admin only)
  static async updateAlbum(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      console.log('Album update request body:', req.body);
      const { title, description, cover_image_url, release_date, artist_id } = req.body;

      if (!id) {
        const error: CustomError = new Error('Album ID is required');
        error.statusCode = 400;
        error.code = 'MISSING_ALBUM_ID';
        throw error;
      }

      // Check if album exists
      const album = await AlbumModel.findById(id);
      if (!album) {
        const error: CustomError = new Error('Album not found');
        error.statusCode = 404;
        error.code = 'ALBUM_NOT_FOUND';
        throw error;
      }

      // Update album
      const updatedAlbum = await AlbumModel.update(id, {
        title,
        description,
        cover_image_url,
        release_date,
        artist_id
      });

      res.status(200).json({
        message: 'Album updated successfully',
        album: updatedAlbum
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/albums/:id (admin only)
  static async deleteAlbum(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id) {
        const error: CustomError = new Error('Album ID is required');
        error.statusCode = 400;
        error.code = 'MISSING_ALBUM_ID';
        throw error;
      }

      // Check if album exists
      const album = await AlbumModel.findById(id);
      if (!album) {
        const error: CustomError = new Error('Album not found');
        error.statusCode = 404;
        error.code = 'ALBUM_NOT_FOUND';
        throw error;
      }

      // Delete album
      await AlbumModel.delete(id);

      res.status(200).json({
        message: 'Album deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
} 