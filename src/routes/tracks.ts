import { Router } from 'express';
import { TrackController } from '../controllers/trackController';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     TrackWithDetails:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         title:
 *           type: string
 *         duration:
 *           type: integer
 *           description: Duration in seconds
 *         track_number:
 *           type: integer
 *         audio_url:
 *           type: string
 *           format: uri
 *         image_url:
 *           type: string
 *           format: uri
 *         play_count:
 *           type: integer
 *         artist_id:
 *           type: string
 *           format: uuid
 *         artist_name:
 *           type: string
 *         artist_image_url:
 *           type: string
 *           format: uri
 *         album_id:
 *           type: string
 *           format: uuid
 *         album_title:
 *           type: string
 *         album_cover_image_url:
 *           type: string
 *           format: uri
 *         is_liked:
 *           type: boolean
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     CreateTrackRequest:
 *       type: object
 *       required:
 *         - title
 *         - artist_id
 *         - duration
 *       properties:
 *         title:
 *           type: string
 *           minLength: 1
 *           maxLength: 255
 *         duration:
 *           type: integer
 *           minimum: 1
 *         track_number:
 *           type: integer
 *           minimum: 1
 *         audio_url:
 *           type: string
 *           format: uri
 *         image_url:
 *           type: string
 *           format: uri
 *         artist_id:
 *           type: string
 *           format: uuid
 *         album_id:
 *           type: string
 *           format: uuid
 */

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.'
    }
  }
});

/**
 * @swagger
 * /api/tracks:
 *   get:
 *     summary: Browse and search tracks
 *     tags: [Tracks]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for track titles
 *       - in: query
 *         name: artist_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by artist ID
 *       - in: query
 *         name: album_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by album ID
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
 *         description: List of tracks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tracks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TrackWithDetails'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.get('/', 
  generalLimiter,
  optionalAuth,
  TrackController.getTracks
);

/**
 * @swagger
 * /api/tracks/popular:
 *   get:
 *     summary: Get popular tracks
 *     tags: [Tracks]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: Number of popular tracks to return
 *     responses:
 *       200:
 *         description: List of popular tracks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tracks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TrackWithDetails'
 */
router.get('/popular', 
  generalLimiter,
  TrackController.getPopular
);

/**
 * @swagger
 * /api/tracks/trending:
 *   get:
 *     summary: Get trending tracks
 *     tags: [Tracks]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: Number of trending tracks to return
 *     responses:
 *       200:
 *         description: List of trending tracks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tracks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TrackWithDetails'
 */
router.get('/trending', 
  generalLimiter,
  TrackController.getTrending
);

/**
 * @swagger
 * /api/tracks/{id}:
 *   get:
 *     summary: Get specific track details
 *     tags: [Tracks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Track ID
 *     responses:
 *       200:
 *         description: Track details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TrackWithDetails'
 *       404:
 *         description: Track not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', 
  generalLimiter,
  optionalAuth,
  TrackController.getTrack
);

/**
 * @swagger
 * /api/tracks/{id}/play:
 *   post:
 *     summary: Play track and record in listening history
 *     tags: [Tracks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Track ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               context_type:
 *                 type: string
 *                 enum: [album, playlist, artist, search]
 *                 description: Playback context
 *               context_id:
 *                 type: string
 *                 description: Context ID (album/playlist/artist ID)
 *     responses:
 *       200:
 *         description: Track play recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 track:
 *                   $ref: '#/components/schemas/TrackWithDetails'
 *                 play_count:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Track not found
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
// Play track (requires authentication)
// POST /api/tracks/:id/play
router.post('/:id/play', 
  generalLimiter,
  authenticateToken,
  TrackController.playTrack
);

/**
 * @swagger
 * /api/tracks/{id}/like:
 *   post:
 *     summary: Like a track
 *     tags: [Tracks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Track ID
 *     responses:
 *       200:
 *         description: Successfully liked track
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 is_liked:
 *                   type: boolean
 *       400:
 *         description: Already liked this track
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
 *       404:
 *         description: Track not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Like track (requires authentication)
// POST /api/tracks/:id/like
router.post('/:id/like', 
  generalLimiter,
  authenticateToken,
  TrackController.likeTrack
);

/**
 * @swagger
 * /api/tracks/{id}/like:
 *   delete:
 *     summary: Unlike a track
 *     tags: [Tracks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Track ID
 *     responses:
 *       200:
 *         description: Successfully unliked track
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 is_liked:
 *                   type: boolean
 *       400:
 *         description: Not liked this track
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
 *       404:
 *         description: Track not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Unlike track (requires authentication)
// DELETE /api/tracks/:id/like
router.delete('/:id/like', 
  generalLimiter,
  authenticateToken,
  TrackController.unlikeTrack
);

/**
 * @swagger
 * /api/tracks:
 *   post:
 *     summary: Create a new track (Admin only)
 *     tags: [Tracks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTrackRequest'
 *     responses:
 *       201:
 *         description: Track created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 track:
 *                   $ref: '#/components/schemas/TrackWithDetails'
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
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Artist or album not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Track already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Admin routes (would require admin middleware in production)
// POST /api/tracks
router.post('/', 
  generalLimiter,
  authenticateToken, // In production: add admin check middleware
  TrackController.createTrack
);

/**
 * @swagger
 * /api/tracks/{id}:
 *   put:
 *     summary: Update a track (Admin only)
 *     tags: [Tracks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Track ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *               duration:
 *                 type: integer
 *                 minimum: 1
 *               track_number:
 *                 type: integer
 *                 minimum: 1
 *               audio_url:
 *                 type: string
 *                 format: uri
 *               image_url:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: Track updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 track:
 *                   $ref: '#/components/schemas/TrackWithDetails'
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
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Track not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// PUT /api/tracks/:id
router.put('/:id', 
  generalLimiter,
  authenticateToken, // In production: add admin check middleware
  TrackController.updateTrack
);

/**
 * @swagger
 * /api/tracks/{id}:
 *   delete:
 *     summary: Delete a track (Admin only)
 *     tags: [Tracks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Track ID
 *     responses:
 *       200:
 *         description: Track deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Track not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// DELETE /api/tracks/:id
router.delete('/:id', 
  generalLimiter,
  authenticateToken, // In production: add admin check middleware
  TrackController.deleteTrack
);

export default router; 