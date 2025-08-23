import { Router } from 'express';
import { TrackController } from '../controllers/trackController';
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
  TrackController.getTracks
);

router.get('/popular', 
  generalLimiter,
  TrackController.getPopular
);

router.get('/trending', 
  generalLimiter,
  TrackController.getTrending
);

router.get('/:id', 
  generalLimiter,
  optionalAuth,
  TrackController.getTrack
);

// Play track (requires authentication)
// POST /api/tracks/:id/play
router.post('/:id/play', 
  generalLimiter,
  authenticateToken,
  TrackController.playTrack
);

// Complete track play with duration (requires authentication)
// POST /api/tracks/:id/complete
router.post('/:id/complete', 
  generalLimiter,
  authenticateToken,
  TrackController.completeTrack
);

// Like track (requires authentication)
// POST /api/tracks/:id/like
router.post('/:id/like', 
  generalLimiter,
  authenticateToken,
  TrackController.likeTrack
);

// Unlike track (requires authentication)
// DELETE /api/tracks/:id/like
router.delete('/:id/like', 
  generalLimiter,
  authenticateToken,
  TrackController.unlikeTrack
);

// Admin routes (would require admin middleware in production)
// POST /api/tracks
router.post('/', 
  generalLimiter,
  authenticateToken, // In production: add admin check middleware
  TrackController.createTrack
);

// PUT /api/tracks/:id
router.put('/:id', 
  generalLimiter,
  authenticateToken, // In production: add admin check middleware
  TrackController.updateTrack
);

// DELETE /api/tracks/:id
router.delete('/:id', 
  generalLimiter,
  authenticateToken, // In production: add admin check middleware
  TrackController.deleteTrack
);

export default router; 