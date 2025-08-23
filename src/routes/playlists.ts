import { Router } from 'express';
import { PlaylistController } from '../controllers/playlistController';
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
  PlaylistController.getPlaylists
);

router.get('/:id', 
  generalLimiter,
  optionalAuth,
  PlaylistController.getPlaylist
);

router.get('/:id/tracks', 
  generalLimiter,
  optionalAuth,
  PlaylistController.getPlaylistTracks
);

router.post('/', 
  generalLimiter,
  authenticateToken,
  PlaylistController.createPlaylist
);

router.put('/:id', 
  generalLimiter,
  authenticateToken,
  PlaylistController.updatePlaylist
);

router.delete('/:id', 
  generalLimiter,
  authenticateToken,
  PlaylistController.deletePlaylist
);

router.post('/:id/tracks', 
  generalLimiter,
  authenticateToken,
  PlaylistController.addTrackToPlaylist
);

router.delete('/:id/tracks/:trackId', 
  generalLimiter,
  authenticateToken,
  PlaylistController.removeTrackFromPlaylist
);

router.put('/:id/tracks/:trackId/position', 
  generalLimiter,
  authenticateToken,
  PlaylistController.reorderTrack
);

router.post('/:id/follow', 
  generalLimiter,
  authenticateToken,
  PlaylistController.followPlaylist
);

router.delete('/:id/follow', 
  generalLimiter,
  authenticateToken,
  PlaylistController.unfollowPlaylist
);

export default router; 