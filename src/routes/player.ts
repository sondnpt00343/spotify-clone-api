import { Router } from 'express';
import { PlayerController } from '../controllers/playerController';
import { authenticateToken } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     PlaybackRequest:
 *       type: object
 *       required:
 *         - track_id
 *       properties:
 *         track_id:
 *           type: string
 *           format: uuid
 *         context_type:
 *           type: string
 *           enum: [album, playlist, artist, search]
 *         context_id:
 *           type: string
 *         position_ms:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         volume_percent:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *         device_name:
 *           type: string
 */

// Rate limiting for player endpoints
const playerLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300, // limit each IP to 300 requests per minute (higher for real-time controls)
  message: {
    error: {
      code: 'PLAYER_RATE_LIMIT_EXCEEDED',
      message: 'Too many player requests, please try again later.'
    }
  }
});

// All player routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/me/player:
 *   get:
 *     summary: Get current playback state
 *     tags: [Player]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current playback state
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CurrentPlayback'
 *       204:
 *         description: No active playback
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', 
  playerLimiter,
  PlayerController.getCurrentPlayback
);

/**
 * @swagger
 * /api/me/player/play:
 *   put:
 *     summary: Start or update playback
 *     tags: [Player]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PlaybackRequest'
 *     responses:
 *       200:
 *         description: Playback started/updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CurrentPlayback'
 *       400:
 *         description: Invalid request
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

/**
 * @swagger
 * /api/me/player/pause:
 *   put:
 *     summary: Pause current playback
 *     tags: [Player]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Playback paused successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CurrentPlayback'
 *       204:
 *         description: No active playback to pause
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/pause', 
  playerLimiter,
  PlayerController.pausePlayback
);

/**
 * @swagger
 * /api/me/player/next:
 *   post:
 *     summary: Skip to next track
 *     tags: [Player]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully skipped to next track
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CurrentPlayback'
 *       204:
 *         description: No active playback or no next track
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: No next track available
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/next', 
  playerLimiter,
  PlayerController.skipToNext
);

/**
 * @swagger
 * /api/me/player/previous:
 *   post:
 *     summary: Skip to previous track
 *     tags: [Player]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully skipped to previous track
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CurrentPlayback'
 *       204:
 *         description: No active playbook or no previous track
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: No previous track available
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/previous', 
  playerLimiter,
  PlayerController.skipToPrevious
);

/**
 * @swagger
 * /api/me/player/seek:
 *   put:
 *     summary: Seek to specific position in current track
 *     tags: [Player]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - position_ms
 *             properties:
 *               position_ms:
 *                 type: integer
 *                 minimum: 0
 *                 description: Position in milliseconds to seek to
 *     responses:
 *       200:
 *         description: Successfully seeked to position
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CurrentPlayback'
 *       400:
 *         description: Invalid seek position
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
 *         description: No active playback
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/seek', 
  playerLimiter,
  PlayerController.seekToPosition
);

/**
 * @swagger
 * /api/me/player/volume:
 *   put:
 *     summary: Set playbook volume
 *     tags: [Player]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - volume_percent
 *             properties:
 *               volume_percent:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Volume level (0-100)
 *     responses:
 *       200:
 *         description: Volume set successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CurrentPlayback'
 *       400:
 *         description: Invalid volume level
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
 *         description: No active playbook
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/volume', 
  playerLimiter,
  PlayerController.setVolume
);

/**
 * @swagger
 * /api/me/player/shuffle:
 *   put:
 *     summary: Toggle shuffle mode
 *     tags: [Player]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - state
 *             properties:
 *               state:
 *                 type: boolean
 *                 description: Enable or disable shuffle mode
 *     responses:
 *       200:
 *         description: Shuffle mode updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CurrentPlayback'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: No active playback
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Toggle shuffle mode
// PUT /api/me/player/shuffle
router.put('/shuffle', 
  playerLimiter,
  PlayerController.setShuffle
);

/**
 * @swagger
 * /api/me/player/repeat:
 *   put:
 *     summary: Set repeat mode
 *     tags: [Player]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - state
 *             properties:
 *               state:
 *                 type: string
 *                 enum: [off, context, track]
 *                 description: Repeat mode - off, context (playlist/album), or track
 *     responses:
 *       200:
 *         description: Repeat mode updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CurrentPlayback'
 *       400:
 *         description: Invalid repeat mode
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
 *         description: No active playback
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Set repeat mode
// PUT /api/me/player/repeat
router.put('/repeat', 
  playerLimiter,
  PlayerController.setRepeat
);

/**
 * @swagger
 * /api/me/player/queue:
 *   get:
 *     summary: Get current playback queue
 *     tags: [Player]
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
 *         description: Number of queue items to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of queue items to skip
 *     responses:
 *       200:
 *         description: Current playback queue
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 queue:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/TrackWithDetails'
 *                       - type: object
 *                         properties:
 *                           queue_id:
 *                             type: string
 *                           position:
 *                             type: integer
 *                           added_at:
 *                             type: string
 *                             format: date-time
 *                           added_by:
 *                             type: string
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Add track to queue
 *     tags: [Player]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - track_id
 *             properties:
 *               track_id:
 *                 type: string
 *                 format: uuid
 *                 description: Track ID to add to queue
 *               position:
 *                 type: integer
 *                 minimum: 0
 *                 description: Position in queue (optional, defaults to end)
 *     responses:
 *       200:
 *         description: Track added to queue successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 queue_item:
 *                   $ref: '#/components/schemas/TrackWithDetails'
 *       400:
 *         description: Invalid track or queue full
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

/**
 * @swagger
 * /api/me/player/queue/{queueItemId}:
 *   delete:
 *     summary: Remove specific item from queue
 *     tags: [Player]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: queueItemId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Queue item ID to remove
 *     responses:
 *       200:
 *         description: Item removed from queue successfully
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
 *         description: Queue item not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Remove specific item from queue
router.delete('/queue/:queueItemId', 
  playerLimiter,
  PlayerController.removeFromQueue
);

/**
 * @swagger
 * /api/me/player/queue:
 *   delete:
 *     summary: Clear entire playback queue
 *     tags: [Player]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Queue cleared successfully
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
 */
// Clear entire queue
router.delete('/queue', 
  playerLimiter,
  PlayerController.clearQueue
);

/**
 * @swagger
 * /api/me/player/device:
 *   put:
 *     summary: Transfer playback to different device
 *     tags: [Player]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - device_name
 *             properties:
 *               device_name:
 *                 type: string
 *                 description: Name of the device to transfer playback to
 *               play:
 *                 type: boolean
 *                 default: true
 *                 description: Whether to start playing on the new device
 *     responses:
 *       200:
 *         description: Playback transferred successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CurrentPlayback'
 *       400:
 *         description: Invalid device or no active playback
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
 *         description: Device not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Transfer playback to different device
router.put('/device', 
  playerLimiter,
  PlayerController.transferPlayback
);

/**
 * @swagger
 * /api/me/player:
 *   delete:
 *     summary: Stop playback completely
 *     tags: [Player]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Playback stopped successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       204:
 *         description: No active playback to stop
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Stop playback completely
router.delete('/', 
  playerLimiter,
  PlayerController.stopPlayback
);

export default router; 