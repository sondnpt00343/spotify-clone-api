import { Router } from 'express';
import { AlbumController } from '../controllers/albumController';
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
  AlbumController.getAlbums
);

router.get('/popular', 
  generalLimiter,
  AlbumController.getPopular
);

router.get('/new-releases', 
  generalLimiter,
  AlbumController.getNewReleases
);

router.get('/:id', 
  generalLimiter,
  optionalAuth,
  AlbumController.getAlbum
);

router.get('/:id/tracks', 
  generalLimiter,
  optionalAuth,
  AlbumController.getAlbumTracks
);

router.post('/:id/like', 
  generalLimiter,
  authenticateToken,
  AlbumController.likeAlbum
);

router.delete('/:id/like', 
  generalLimiter,
  authenticateToken,
  AlbumController.unlikeAlbum
);

router.post('/', 
  generalLimiter,
  authenticateToken, // In production: add admin check middleware
  AlbumController.createAlbum
);

router.put('/:id', 
  generalLimiter,
  authenticateToken, // In production: add admin check middleware
  AlbumController.updateAlbum
);

router.delete('/:id', 
  generalLimiter,
  authenticateToken, // In production: add admin check middleware
  AlbumController.deleteAlbum
);

export default router; 