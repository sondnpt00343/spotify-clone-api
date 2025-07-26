import { Router } from 'express';
import { SearchController } from '../controllers/searchController';
import rateLimit from 'express-rate-limit';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     SearchResponse:
 *       type: object
 *       properties:
 *         query:
 *           type: string
 *         total_results:
 *           type: integer
 *         results:
 *           type: object
 *           properties:
 *             tracks:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SearchResult'
 *             artists:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SearchResult'
 *             albums:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SearchResult'
 *             playlists:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SearchResult'
 *         pagination:
 *           type: object
 *           properties:
 *             limit:
 *               type: integer
 *             offset:
 *               type: integer
 */

// Rate limiting for search endpoints
const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per minute
  message: {
    error: {
      code: 'SEARCH_RATE_LIMIT_EXCEEDED',
      message: 'Too many search requests, please try again later.'
    }
  }
});

// Rate limiting for suggestions (more lenient)
const suggestionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // limit each IP to 200 requests per minute
  message: {
    error: {
      code: 'SUGGESTION_RATE_LIMIT_EXCEEDED',
      message: 'Too many suggestion requests, please try again later.'
    }
  }
});

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Universal search across all entities
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *         description: Search query
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, track, artist, album, playlist]
 *           default: all
 *         description: Type of content to search
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: Number of results to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of results to skip
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SearchResponse'
 *       400:
 *         description: Invalid search query
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', 
  searchLimiter,
  SearchController.universalSearch
);

/**
 * @swagger
 * /api/search/quick:
 *   get:
 *     summary: Quick search for autocomplete
 *     tags: [Search]
 *     description: Fast search with fewer results, optimized for autocomplete functionality
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 50
 *         description: Search query for quick results
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 10
 *           default: 5
 *         description: Number of quick results to return
 *     responses:
 *       200:
 *         description: Quick search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 query:
 *                   type: string
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                         enum: [track, artist, album, playlist]
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       subtitle:
 *                         type: string
 *                       image_url:
 *                         type: string
 *       400:
 *         description: Invalid search query
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Quick search for autocomplete (faster, fewer results)
// GET /api/search/quick?q=query&limit=5
router.get('/quick', 
  suggestionLimiter,
  SearchController.quickSearch
);

/**
 * @swagger
 * /api/search/suggestions:
 *   get:
 *     summary: Get search suggestions for autocomplete
 *     tags: [Search]
 *     description: Get search term suggestions based on partial input
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 50
 *         description: Partial search query for suggestions
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 15
 *           default: 8
 *         description: Number of suggestions to return
 *     responses:
 *       200:
 *         description: Search suggestions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 query:
 *                   type: string
 *                 suggestions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       text:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum: [query, artist, album, track]
 *                       popularity:
 *                         type: number
 *       400:
 *         description: Invalid search query
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Get search suggestions for autocomplete
// GET /api/search/suggestions?q=partial_query&limit=8
router.get('/suggestions', 
  suggestionLimiter,
  SearchController.getSuggestions
);

/**
 * @swagger
 * /api/search/trending:
 *   get:
 *     summary: Get trending search terms
 *     tags: [Search]
 *     description: Get popular search terms and trending queries
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 10
 *         description: Number of trending searches to return
 *     responses:
 *       200:
 *         description: Trending search terms
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 trending:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       query:
 *                         type: string
 *                       search_count:
 *                         type: integer
 *                       trend_score:
 *                         type: number
 *                       category:
 *                         type: string
 *                         enum: [artist, album, track, general]
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Get trending searches
// GET /api/search/trending?limit=10
router.get('/trending', 
  searchLimiter,
  SearchController.getTrendingSearches
);

/**
 * @swagger
 * /api/search/tracks:
 *   get:
 *     summary: Search tracks only
 *     tags: [Search]
 *     description: Search specifically for tracks with detailed results
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *         description: Search query for tracks
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: Number of tracks to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of tracks to skip
 *     responses:
 *       200:
 *         description: Track search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 query:
 *                   type: string
 *                 tracks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TrackWithDetails'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       400:
 *         description: Invalid search query
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Search specific entity types
// GET /api/search/tracks?q=query&limit=20&offset=0
router.get('/tracks', 
  searchLimiter,
  SearchController.searchTracks
);

/**
 * @swagger
 * /api/search/artists:
 *   get:
 *     summary: Search artists only
 *     tags: [Search]
 *     description: Search specifically for artists with detailed results
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *         description: Search query for artists
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: Number of artists to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of artists to skip
 *     responses:
 *       200:
 *         description: Artist search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 query:
 *                   type: string
 *                 artists:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ArtistWithStats'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       400:
 *         description: Invalid search query
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/search/artists?q=query&limit=20&offset=0
router.get('/artists', 
  searchLimiter,
  SearchController.searchArtists
);

/**
 * @swagger
 * /api/search/albums:
 *   get:
 *     summary: Search albums only
 *     tags: [Search]
 *     description: Search specifically for albums with detailed results
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *         description: Search query for albums
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: Number of albums to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of albums to skip
 *     responses:
 *       200:
 *         description: Album search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 query:
 *                   type: string
 *                 albums:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AlbumWithDetails'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       400:
 *         description: Invalid search query
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/search/albums?q=query&limit=20&offset=0
router.get('/albums', 
  searchLimiter,
  SearchController.searchAlbums
);

/**
 * @swagger
 * /api/search/playlists:
 *   get:
 *     summary: Search playlists only
 *     tags: [Search]
 *     description: Search specifically for public playlists with detailed results
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *         description: Search query for playlists
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: Number of playlists to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of playlists to skip
 *     responses:
 *       200:
 *         description: Playlist search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 query:
 *                   type: string
 *                 playlists:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PlaylistWithDetails'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       400:
 *         description: Invalid search query
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/search/playlists?q=query&limit=20&offset=0
router.get('/playlists', 
  searchLimiter,
  SearchController.searchPlaylists
);

export default router; 