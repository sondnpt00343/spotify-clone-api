import { Router } from 'express';
import { SearchController } from '../controllers/searchController';
import rateLimit from 'express-rate-limit';

const router = Router();


// Rate limiting for search endpoints
const searchLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_SEARCH_WINDOW || '60000'), // 1 minute
  max: parseInt(process.env.RATE_LIMIT_SEARCH_MAX || '50000'), // limit each IP to requests per minute
  message: {
    error: {
      code: 'SEARCH_RATE_LIMIT_EXCEEDED',
      message: 'Too many search requests, please try again later.'
    }
  }
});

// Rate limiting for suggestions (more lenient)
const suggestionLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_SEARCH_WINDOW || '60000'), // 1 minute
  max: parseInt(process.env.RATE_LIMIT_SEARCH_MAX || '50000'), // limit each IP to requests per minute
  message: {
    error: {
      code: 'SUGGESTION_RATE_LIMIT_EXCEEDED',
      message: 'Too many suggestion requests, please try again later.'
    }
  }
});

router.get('/', 
  searchLimiter,
  SearchController.universalSearch
);

// Quick search for autocomplete (faster, fewer results)
// GET /api/search/quick?q=query&limit=5
router.get('/quick', 
  suggestionLimiter,
  SearchController.quickSearch
);

// Get search suggestions for autocomplete
// GET /api/search/suggestions?q=partial_query&limit=8
router.get('/suggestions', 
  suggestionLimiter,
  SearchController.getSuggestions
);

// Get trending searches
// GET /api/search/trending?limit=10
router.get('/trending', 
  searchLimiter,
  SearchController.getTrendingSearches
);

// Search specific entity types
// GET /api/search/tracks?q=query&limit=20&offset=0
router.get('/tracks', 
  searchLimiter,
  SearchController.searchTracks
);

// GET /api/search/artists?q=query&limit=20&offset=0
router.get('/artists', 
  searchLimiter,
  SearchController.searchArtists
);

// GET /api/search/albums?q=query&limit=20&offset=0
router.get('/albums', 
  searchLimiter,
  SearchController.searchAlbums
);

// GET /api/search/playlists?q=query&limit=20&offset=0
router.get('/playlists', 
  searchLimiter,
  SearchController.searchPlaylists
);

export default router; 