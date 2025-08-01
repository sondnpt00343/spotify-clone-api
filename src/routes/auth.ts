import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { TrackController } from '../controllers/trackController';
import { PlaylistController } from '../controllers/playlistController';
import { AlbumController } from '../controllers/albumController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest, registerSchema, loginSchema, changePasswordSchema, updateProfileSchema } from '../utils/validation';
import rateLimit from 'express-rate-limit';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           minLength: 3
 *           maxLength: 50
 *           nullable: true
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           minLength: 6
 *         display_name:
 *           type: string
 *           maxLength: 100
 *           nullable: true
 *         bio:
 *           type: string
 *           maxLength: 500
 *           nullable: true
 *         date_of_birth:
 *           type: string
 *           format: date
 *           nullable: true
 *         country:
 *           type: string
 *           maxLength: 100
 *           nullable: true
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *     AuthResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         user:
 *           $ref: '#/components/schemas/User'
 *         tokens:
 *           type: object
 *           properties:
 *             access_token:
 *               type: string
 *             refresh_token:
 *               type: string
 */

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later.'
    }
  }
});

const generalAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // limit each IP to 10000 requests per windowMs
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.'
    }
  }
});

// Authentication routes

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: User already exists
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
router.post('/register', 
  generalAuthLimiter,
  validateRequest(registerSchema), 
  AuthController.register
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid credentials
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
router.post('/login', 
  authLimiter,
  validateRequest(loginSchema), 
  AuthController.login
);

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - current_password
 *               - new_password
 *             properties:
 *               current_password:
 *                 type: string
 *                 description: Current password for verification
 *               new_password:
 *                 type: string
 *                 minLength: 6
 *                 description: New password (minimum 6 characters)
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error or weak password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid current password or unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many password change attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/change-password', 
  authLimiter,
  authenticateToken,
  validateRequest(changePasswordSchema), 
  AuthController.changePassword
);

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     description: Generate new access token using refresh token (In production, this would use refresh token validation)
 *     responses:
 *       200:
 *         description: New access token generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 tokens:
 *                   type: object
 *                   properties:
 *                     access_token:
 *                       type: string
 *                     refresh_token:
 *                       type: string
 *                     expires_in:
 *                       type: integer
 *                       description: Token expiration time in seconds
 *       401:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many token refresh requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/refresh-token', 
  generalAuthLimiter,
  authenticateToken, // This would use refresh token validation in production
  AuthController.refreshToken
);

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     summary: Update current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               display_name:
 *                 type: string
 *                 maxLength: 100
 *               bio:
 *                 type: string
 *                 maxLength: 500
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *               country:
 *                 type: string
 *                 maxLength: 100
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/auth/me/tracks/liked:
 *   get:
 *     summary: Get user's liked tracks
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: Number of liked tracks to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of liked tracks to skip
 *     responses:
 *       200:
 *         description: User's liked tracks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tracks:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/TrackWithDetails'
 *                       - type: object
 *                         properties:
 *                           liked_at:
 *                             type: string
 *                             format: date-time
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// User's liked tracks
router.get('/me/tracks/liked', 
  generalAuthLimiter,
  authenticateToken, 
  TrackController.getLikedTracks
);

/**
 * @swagger
 * /api/auth/me/player/recently-played:
 *   get:
 *     summary: Get user's recently played tracks
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: Number of recently played tracks to return
 *       - in: query
 *         name: after
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Only show tracks played after this timestamp
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Only show tracks played before this timestamp
 *     responses:
 *       200:
 *         description: User's recently played tracks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tracks:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/TrackWithDetails'
 *                       - type: object
 *                         properties:
 *                           played_at:
 *                             type: string
 *                             format: date-time
 *                           context:
 *                             type: object
 *                             properties:
 *                               type:
 *                                 type: string
 *                                 enum: [album, playlist, artist, search]
 *                               id:
 *                                 type: string
 *                 cursors:
 *                   type: object
 *                   properties:
 *                     after:
 *                       type: string
 *                     before:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// User's recently played tracks
router.get('/me/player/recently-played', 
  generalAuthLimiter,
  authenticateToken, 
  TrackController.getRecentlyPlayed
);

/**
 * @swagger
 * /api/auth/me/playlists:
 *   get:
 *     summary: Get user's own playlists
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: User's own playlists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 playlists:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PlaylistWithDetails'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// User's playlists
router.get('/me/playlists', 
  generalAuthLimiter,
  authenticateToken, 
  PlaylistController.getUserPlaylists
);

/**
 * @swagger
 * /api/auth/me/playlists/followed:
 *   get:
 *     summary: Get user's followed playlists
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: Number of followed playlists to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of followed playlists to skip
 *     responses:
 *       200:
 *         description: User's followed playlists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 playlists:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/PlaylistWithDetails'
 *                       - type: object
 *                         properties:
 *                           followed_at:
 *                             type: string
 *                             format: date-time
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// User's followed playlists
router.get('/me/playlists/followed', 
  generalAuthLimiter,
  authenticateToken, 
  PlaylistController.getFollowedPlaylists
);

/**
 * @swagger
 * /api/auth/me/albums/liked:
 *   get:
 *     summary: Get user's liked albums
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: Number of liked albums to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of liked albums to skip
 *     responses:
 *       200:
 *         description: User's liked albums
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 albums:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/AlbumWithDetails'
 *                       - type: object
 *                         properties:
 *                           liked_at:
 *                             type: string
 *                             format: date-time
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// User's liked albums
router.get('/me/albums/liked', 
  generalAuthLimiter,
  authenticateToken, 
  AlbumController.getLikedAlbums
);

export default router; 