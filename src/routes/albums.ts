import { Router } from 'express';
import { AlbumController } from '../controllers/albumController';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     AlbumWithDetails:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         title:
 *           type: string
 *         release_date:
 *           type: string
 *           format: date
 *         total_tracks:
 *           type: integer
 *         cover_image_url:
 *           type: string
 *           format: uri
 *         artist_id:
 *           type: string
 *           format: uuid
 *         artist_name:
 *           type: string
 *         artist_image_url:
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
 *     CreateAlbumRequest:
 *       type: object
 *       required:
 *         - title
 *         - artist_id
 *         - release_date
 *       properties:
 *         title:
 *           type: string
 *           minLength: 1
 *           maxLength: 255
 *         release_date:
 *           type: string
 *           format: date
 *         cover_image_url:
 *           type: string
 *           format: uri
 *         artist_id:
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
 * /api/albums:
 *   get:
 *     summary: Browse and search albums
 *     tags: [Albums]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for album titles
 *       - in: query
 *         name: artist_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by artist ID
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
 *         description: List of albums
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 albums:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AlbumWithDetails'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.get('/', 
  generalLimiter,
  optionalAuth,
  AlbumController.getAlbums
);

/**
 * @swagger
 * /api/albums/popular:
 *   get:
 *     summary: Get popular albums
 *     tags: [Albums]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: Number of popular albums to return
 *     responses:
 *       200:
 *         description: List of popular albums
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 albums:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AlbumWithDetails'
 */
router.get('/popular', 
  generalLimiter,
  AlbumController.getPopular
);

/**
 * @swagger
 * /api/albums/new-releases:
 *   get:
 *     summary: Get new album releases
 *     tags: [Albums]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: Number of new releases to return
 *     responses:
 *       200:
 *         description: List of new album releases
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 albums:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AlbumWithDetails'
 */
router.get('/new-releases', 
  generalLimiter,
  AlbumController.getNewReleases
);

/**
 * @swagger
 * /api/albums/{id}:
 *   get:
 *     summary: Get specific album details
 *     tags: [Albums]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Album ID
 *     responses:
 *       200:
 *         description: Album details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AlbumWithDetails'
 *       404:
 *         description: Album not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', 
  generalLimiter,
  optionalAuth,
  AlbumController.getAlbum
);

/**
 * @swagger
 * /api/albums/{id}/tracks:
 *   get:
 *     summary: Get tracks from a specific album
 *     tags: [Albums]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Album ID
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
 *         description: List of album tracks
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
 *       404:
 *         description: Album not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id/tracks', 
  generalLimiter,
  optionalAuth,
  AlbumController.getAlbumTracks
);

/**
 * @swagger
 * /api/albums/{id}/like:
 *   post:
 *     summary: Like an album
 *     tags: [Albums]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Album ID
 *     responses:
 *       200:
 *         description: Successfully liked album
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
 *         description: Already liked this album
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
 *         description: Album not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Unlike an album
 *     tags: [Albums]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Album ID
 *     responses:
 *       200:
 *         description: Successfully unliked album
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
 *         description: Not liked this album
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
 *         description: Album not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/albums:
 *   post:
 *     summary: Create a new album (Admin only)
 *     tags: [Albums]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAlbumRequest'
 *     responses:
 *       201:
 *         description: Album created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 album:
 *                   $ref: '#/components/schemas/AlbumWithDetails'
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
 *       409:
 *         description: Album already exists
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
router.post('/', 
  generalLimiter,
  authenticateToken, // In production: add admin check middleware
  AlbumController.createAlbum
);

/**
 * @swagger
 * /api/albums/{id}:
 *   put:
 *     summary: Update an album (Admin only)
 *     tags: [Albums]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Album ID
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
 *               release_date:
 *                 type: string
 *                 format: date
 *               cover_image_url:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: Album updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 album:
 *                   $ref: '#/components/schemas/AlbumWithDetails'
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
 *       404:
 *         description: Album not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Delete an album (Admin only)
 *     tags: [Albums]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Album ID
 *     responses:
 *       200:
 *         description: Album deleted successfully
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
 *       404:
 *         description: Album not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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