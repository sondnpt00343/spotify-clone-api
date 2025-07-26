import { Router } from 'express';
import { ArtistController } from '../controllers/artistController';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     ArtistWithStats:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         bio:
 *           type: string
 *         image_url:
 *           type: string
 *           format: uri
 *         monthly_listeners:
 *           type: integer
 *         is_verified:
 *           type: boolean
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *         followers_count:
 *           type: integer
 *         total_tracks:
 *           type: integer
 *         total_albums:
 *           type: integer
 *         is_following:
 *           type: boolean
 *     CreateArtistRequest:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *           maxLength: 255
 *         bio:
 *           type: string
 *         image_url:
 *           type: string
 *           format: uri
 *         is_verified:
 *           type: boolean
 *           default: false
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
 * /api/artists:
 *   get:
 *     summary: Browse and search artists
 *     tags: [Artists]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for artist names
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
 *         description: List of artists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 artists:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ArtistWithStats'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.get('/', 
  generalLimiter,
  optionalAuth,
  ArtistController.getArtists
);

/**
 * @swagger
 * /api/artists/trending:
 *   get:
 *     summary: Get trending artists
 *     tags: [Artists]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: Number of trending artists to return
 *     responses:
 *       200:
 *         description: List of trending artists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 artists:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ArtistWithStats'
 */
router.get('/trending', 
  generalLimiter,
  ArtistController.getTrending
);

/**
 * @swagger
 * /api/artists/{id}:
 *   get:
 *     summary: Get specific artist details
 *     tags: [Artists]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Artist ID
 *     responses:
 *       200:
 *         description: Artist details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ArtistWithStats'
 *       404:
 *         description: Artist not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', 
  generalLimiter,
  optionalAuth,
  ArtistController.getArtist
);

/**
 * @swagger
 * /api/artists/{id}/tracks/popular:
 *   get:
 *     summary: Get artist's popular tracks
 *     tags: [Artists]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Artist ID
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
 *         description: Artist's popular tracks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 artist:
 *                   $ref: '#/components/schemas/ArtistWithStats'
 *                 tracks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TrackWithDetails'
 *       404:
 *         description: Artist not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Get artist's popular tracks
// GET /api/artists/:id/tracks/popular
router.get('/:id/tracks/popular', 
  generalLimiter,
  optionalAuth,
  ArtistController.getPopularTracks
);

/**
 * @swagger
 * /api/artists/{id}/albums:
 *   get:
 *     summary: Get artist's albums
 *     tags: [Artists]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Artist ID
 *       - in: query
 *         name: include_singles
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include singles and EPs
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
 *         description: Artist's albums
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 artist:
 *                   $ref: '#/components/schemas/ArtistWithStats'
 *                 albums:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AlbumWithDetails'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       404:
 *         description: Artist not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Get artist's albums
// GET /api/artists/:id/albums
router.get('/:id/albums', 
  generalLimiter,
  optionalAuth,
  ArtistController.getAlbums
);

/**
 * @swagger
 * /api/artists/{id}/follow:
 *   post:
 *     summary: Follow an artist
 *     tags: [Artists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Artist ID
 *     responses:
 *       200:
 *         description: Successfully followed artist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 is_following:
 *                   type: boolean
 *       400:
 *         description: Already following this artist
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
 *         description: Artist not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Unfollow an artist
 *     tags: [Artists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Artist ID
 *     responses:
 *       200:
 *         description: Successfully unfollowed artist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 is_following:
 *                   type: boolean
 *       400:
 *         description: Not following this artist
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
 *         description: Artist not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/artists:
 *   post:
 *     summary: Create a new artist (Admin only)
 *     tags: [Artists]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateArtistRequest'
 *     responses:
 *       201:
 *         description: Artist created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 artist:
 *                   $ref: '#/components/schemas/ArtistWithStats'
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
 *       409:
 *         description: Artist already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Admin routes (would require admin middleware in production)
// POST /api/artists
router.post('/', 
  generalLimiter,
  authenticateToken, // In production: add admin check middleware
  ArtistController.createArtist
);

/**
 * @swagger
 * /api/artists/{id}:
 *   put:
 *     summary: Update an artist (Admin only)
 *     tags: [Artists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Artist ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *               bio:
 *                 type: string
 *               image_url:
 *                 type: string
 *                 format: uri
 *               is_verified:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Artist updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 artist:
 *                   $ref: '#/components/schemas/ArtistWithStats'
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
 *         description: Artist not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// PUT /api/artists/:id
router.put('/:id', 
  generalLimiter,
  authenticateToken, // In production: add admin check middleware
  ArtistController.updateArtist
);

/**
 * @swagger
 * /api/artists/{id}:
 *   delete:
 *     summary: Delete an artist (Admin only)
 *     tags: [Artists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Artist ID
 *     responses:
 *       200:
 *         description: Artist deleted successfully
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
 *         description: Artist not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// DELETE /api/artists/:id
router.delete('/:id', 
  generalLimiter,
  authenticateToken, // In production: add admin check middleware
  ArtistController.deleteArtist
);

export default router; 