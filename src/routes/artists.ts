import { Router } from 'express';
import { ArtistController } from '../controllers/artistController';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = Router();


// Rate limiting
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX || '50000'), // limit each IP to requests per windowMs
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.'
    }
  }
});

router.get('/', 
  generalLimiter,
  optionalAuth,
  ArtistController.getArtists
);

router.get('/trending', 
  generalLimiter,
  ArtistController.getTrending
);

router.get('/:id', 
  generalLimiter,
  optionalAuth,
  ArtistController.getArtist
);

// Get artist's popular tracks
// GET /api/artists/:id/tracks/popular
router.get('/:id/tracks/popular', 
  generalLimiter,
  optionalAuth,
  ArtistController.getPopularTracks
);

// Get artist's albums
// GET /api/artists/:id/albums
router.get('/:id/albums', 
  generalLimiter,
  optionalAuth,
  ArtistController.getAlbums
);

router.post('/:id/follow', 
  generalLimiter,
  authenticateToken,
  ArtistController.followArtist
);

router.delete('/:id/follow', 
  generalLimiter,
  authenticateToken,
  ArtistController.unfollowArtist
);

// Admin routes (would require admin middleware in production)
// POST /api/artists
router.post('/', 
  generalLimiter,
  authenticateToken, // In production: add admin check middleware
  ArtistController.createArtist
);

// PUT /api/artists/:id
router.put('/:id', 
  generalLimiter,
  authenticateToken, // In production: add admin check middleware
  ArtistController.updateArtist
);

// DELETE /api/artists/:id
router.delete('/:id', 
  generalLimiter,
  authenticateToken, // In production: add admin check middleware
  ArtistController.deleteArtist
);

export default router; 