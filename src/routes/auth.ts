import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { TrackController } from '../controllers/trackController';
import { PlaylistController } from '../controllers/playlistController';
import { AlbumController } from '../controllers/albumController';
import { ArtistController } from '../controllers/artistController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest, registerSchema, loginSchema, changePasswordSchema, updateProfileSchema } from '../utils/validation';
import rateLimit from 'express-rate-limit';

const router = Router();


// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '50000'), // limit each IP to auth requests per windowMs
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later.'
    }
  }
});

const generalAuthLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX || '50000'), // limit each IP to requests per windowMs
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.'
    }
  }
});

// Authentication routes

router.post('/register', 
  generalAuthLimiter,
  validateRequest(registerSchema), 
  AuthController.register
);

router.post('/login', 
  authLimiter,
  validateRequest(loginSchema), 
  AuthController.login
);

router.post('/change-password', 
  authLimiter,
  authenticateToken,
  validateRequest(changePasswordSchema), 
  AuthController.changePassword
);

router.post('/refresh-token', 
  generalAuthLimiter,
  authenticateToken, // This would use refresh token validation in production
  AuthController.refreshToken
);

router.get('/users/me', 
  generalAuthLimiter,
  authenticateToken, 
  AuthController.getProfile
);

router.put('/users/me', 
  generalAuthLimiter,
  authenticateToken,
  validateRequest(updateProfileSchema), 
  AuthController.updateProfile
);

// User's liked tracks
router.get('/me/tracks/liked', 
  generalAuthLimiter,
  authenticateToken, 
  TrackController.getLikedTracks
);

// User's recently played tracks
router.get('/me/player/recently-played', 
  generalAuthLimiter,
  authenticateToken, 
  TrackController.getRecentlyPlayed
);

// User's playlists
router.get('/me/playlists', 
  generalAuthLimiter,
  authenticateToken, 
  PlaylistController.getUserPlaylists
);

// User's followed playlists
router.get('/me/playlists/followed', 
  generalAuthLimiter,
  authenticateToken, 
  PlaylistController.getFollowedPlaylists
);

// User's liked albums
router.get('/me/albums/liked', 
  generalAuthLimiter,
  authenticateToken, 
  AlbumController.getLikedAlbums
);

// User's followed artists
router.get('/me/following', 
  generalAuthLimiter,
  authenticateToken, 
  ArtistController.getFollowedArtists
);

export default router; 