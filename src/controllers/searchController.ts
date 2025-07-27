import { Request, Response, NextFunction } from 'express';
import { SearchModel } from '../models/Search';
import { CustomError } from '../middleware/errorHandler';

export class SearchController {
  // GET /api/search
  static async universalSearch(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query.q as string;
      const type = req.query.type as 'track' | 'artist' | 'album' | 'playlist' | 'all' | undefined;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      // Validate query
      if (!query || query.trim().length < 1) {
        const error: CustomError = new Error('Search query is required');
        error.statusCode = 400;
        error.code = 'MISSING_QUERY';
        throw error;
      }

      if (query.trim().length > 100) {
        const error: CustomError = new Error('Search query too long (max 100 characters)');
        error.statusCode = 400;
        error.code = 'QUERY_TOO_LONG';
        throw error;
      }

      // Validate limit
      if (limit > 50) {
        const error: CustomError = new Error('Limit cannot exceed 50');
        error.statusCode = 400;
        error.code = 'INVALID_LIMIT';
        throw error;
      }

      // Perform search
      const searchResults = await SearchModel.search(query.trim(), {
        type: type || 'all',
        limit,
        offset
      });

      res.status(200).json(searchResults);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/search/quick
  static async quickSearch(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query.q as string;
      const limit = parseInt(req.query.limit as string) || 5;

      // Validate query
      if (!query || query.trim().length < 1) {
        const error: CustomError = new Error('Search query is required');
        error.statusCode = 400;
        error.code = 'MISSING_QUERY';
        throw error;
      }

      // Validate limit
      if (limit > 10) {
        const error: CustomError = new Error('Limit cannot exceed 10 for quick search');
        error.statusCode = 400;
        error.code = 'INVALID_LIMIT';
        throw error;
      }

      // Perform quick search
      const results = await SearchModel.quickSearch(query.trim(), limit);

      res.status(200).json({
        query: query.trim(),
        results,
        total: results.length
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/search/suggestions
  static async getSuggestions(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query.q as string;
      const limit = parseInt(req.query.limit as string) || 8;

      // Validate query
      if (!query || query.trim().length < 1) {
        return res.status(200).json({
          query: '',
          suggestions: []
        });
      }

      if (query.trim().length > 50) {
        const error: CustomError = new Error('Query too long for suggestions');
        error.statusCode = 400;
        error.code = 'QUERY_TOO_LONG';
        throw error;
      }

      // Validate limit
      if (limit > 15) {
        const error: CustomError = new Error('Limit cannot exceed 15 for suggestions');
        error.statusCode = 400;
        error.code = 'INVALID_LIMIT';
        throw error;
      }

      // Get suggestions
      const suggestions = await SearchModel.getSuggestions(query.trim(), limit);

      return res.status(200).json({
        query: query.trim(),
        suggestions
      });
    } catch (error) {
      return next(error);
    }
  }

  // GET /api/search/trending
  static async getTrendingSearches(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;

      // Validate limit
      if (limit > 20) {
        const error: CustomError = new Error('Limit cannot exceed 20');
        error.statusCode = 400;
        error.code = 'INVALID_LIMIT';
        throw error;
      }

      // Get trending searches
      const trending = await SearchModel.getTrendingSearches(limit);

      res.status(200).json({
        trending_searches: trending,
        total: trending.length
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/search/tracks
  static async searchTracks(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query.q as string;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      // Validate query
      if (!query || query.trim().length < 1) {
        const error: CustomError = new Error('Search query is required');
        error.statusCode = 400;
        error.code = 'MISSING_QUERY';
        throw error;
      }

      // Validate limit
      if (limit > 50) {
        const error: CustomError = new Error('Limit cannot exceed 50');
        error.statusCode = 400;
        error.code = 'INVALID_LIMIT';
        throw error;
      }

      // Search tracks only
      const results = await SearchModel.searchByCategory(query.trim(), 'track', {}, limit, offset);

      res.status(200).json({
        query: query.trim(),
        tracks: results,
        pagination: {
          limit,
          offset,
          total: results.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/search/artists
  static async searchArtists(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query.q as string;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      // Validate query
      if (!query || query.trim().length < 1) {
        const error: CustomError = new Error('Search query is required');
        error.statusCode = 400;
        error.code = 'MISSING_QUERY';
        throw error;
      }

      // Validate limit
      if (limit > 50) {
        const error: CustomError = new Error('Limit cannot exceed 50');
        error.statusCode = 400;
        error.code = 'INVALID_LIMIT';
        throw error;
      }

      // Search artists only
      const results = await SearchModel.searchByCategory(query.trim(), 'artist', {}, limit, offset);

      res.status(200).json({
        query: query.trim(),
        artists: results,
        pagination: {
          limit,
          offset,
          total: results.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/search/albums
  static async searchAlbums(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query.q as string;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      // Validate query
      if (!query || query.trim().length < 1) {
        const error: CustomError = new Error('Search query is required');
        error.statusCode = 400;
        error.code = 'MISSING_QUERY';
        throw error;
      }

      // Validate limit
      if (limit > 50) {
        const error: CustomError = new Error('Limit cannot exceed 50');
        error.statusCode = 400;
        error.code = 'INVALID_LIMIT';
        throw error;
      }

      // Search albums only
      const results = await SearchModel.searchByCategory(query.trim(), 'album', {}, limit, offset);

      res.status(200).json({
        query: query.trim(),
        albums: results,
        pagination: {
          limit,
          offset,
          total: results.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/search/playlists
  static async searchPlaylists(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query.q as string;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      // Validate query
      if (!query || query.trim().length < 1) {
        const error: CustomError = new Error('Search query is required');
        error.statusCode = 400;
        error.code = 'MISSING_QUERY';
        throw error;
      }

      // Validate limit
      if (limit > 50) {
        const error: CustomError = new Error('Limit cannot exceed 50');
        error.statusCode = 400;
        error.code = 'INVALID_LIMIT';
        throw error;
      }

      // Search playlists only
      const results = await SearchModel.searchByCategory(query.trim(), 'playlist', {}, limit, offset);

      res.status(200).json({
        query: query.trim(),
        playlists: results,
        pagination: {
          limit,
          offset,
          total: results.length
        }
      });
    } catch (error) {
      next(error);
    }
  }
} 