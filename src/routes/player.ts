import { Router } from 'express';
import { PlayerController } from '../controllers/playerController';
import { authenticateToken } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = Router();


// Rate limiting for player endpoints
const playerLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_PLAYER_WINDOW || '60000'), // 1 minute
  max: parseInt(process.env.RATE_LIMIT_PLAYER_MAX || '50000'), // limit each IP to requests per minute (higher for real-time controls)
  message: {
    error: {
      code: 'PLAYER_RATE_LIMIT_EXCEEDED',
      message: 'Too many player requests, please try again later.'
    }
  }
});

// All player routes require authentication
router.use(authenticateToken);

router.get('/', 
  playerLimiter,
  PlayerController.getCurrentPlayback
);

router.put('/play', 
  playerLimiter,
  PlayerController.startPlayback
);

// Resume current playback
// PUT /api/me/player/play (without body)
router.put('/play', 
  playerLimiter,
  PlayerController.resumePlayback
);

router.put('/pause', 
  playerLimiter,
  PlayerController.pausePlayback
);

router.post('/next', 
  playerLimiter,
  PlayerController.skipToNext
);

router.post('/previous', 
  playerLimiter,
  PlayerController.skipToPrevious
);

router.put('/seek', 
  playerLimiter,
  PlayerController.seekToPosition
);

router.put('/volume', 
  playerLimiter,
  PlayerController.setVolume
);

// Toggle shuffle mode
// PUT /api/me/player/shuffle
router.put('/shuffle', 
  playerLimiter,
  PlayerController.setShuffle
);

// Set repeat mode
// PUT /api/me/player/repeat
router.put('/repeat', 
  playerLimiter,
  PlayerController.setRepeat
);

// Queue management
// GET /api/me/player/queue
router.get('/queue', 
  playerLimiter,
  PlayerController.getQueue
);

// Add track to queue
// POST /api/me/player/queue
router.post('/queue', 
  playerLimiter,
  PlayerController.addToQueue
);

// Remove specific item from queue
router.delete('/queue/:queueItemId', 
  playerLimiter,
  PlayerController.removeFromQueue
);

// Clear entire queue
router.delete('/queue', 
  playerLimiter,
  PlayerController.clearQueue
);

// Transfer playback to different device
router.put('/device', 
  playerLimiter,
  PlayerController.transferPlayback
);

// Stop playback completely
router.delete('/', 
  playerLimiter,
  PlayerController.stopPlayback
);

export default router; 