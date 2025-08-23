import { Router } from 'express';
import { UploadController } from '../controllers/uploadController';
import { authenticateToken } from '../middleware/auth';
import { uploadAvatar, uploadCover, uploadAudio, uploadMultipleImages } from '../middleware/fileUpload';
import rateLimit from 'express-rate-limit';

const router = Router();


// Rate limiting for upload endpoints
const uploadLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_UPLOAD_MAX || '50000'), // limit each IP to uploads per 15 minutes
  message: {
    error: {
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
      message: 'Too many upload requests, please try again later.'
    }
  }
});

// Rate limiting for file serving (more lenient)
const serveLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_SERVE_WINDOW || '60000'), // 1 minute
  max: parseInt(process.env.RATE_LIMIT_SERVE_MAX || '50000'), // limit each IP to requests per minute
  message: {
    error: {
      code: 'SERVE_RATE_LIMIT_EXCEEDED',
      message: 'Too many file requests, please try again later.'
    }
  }
});

router.post('/avatar',
  authenticateToken,
  uploadLimiter,
  uploadAvatar.single('avatar'),
  UploadController.uploadUserAvatar
);

// Artist image upload (admin only)
// POST /api/upload/artist/:artistId/image
router.post('/artist/:artistId/image',
  authenticateToken,
  uploadLimiter,
  uploadCover.single('image'),
  UploadController.uploadArtistImage
);

// Artist background image upload (admin only)
// POST /api/upload/artist/:artistId/background
router.post('/artist/:artistId/background',
  authenticateToken,
  uploadLimiter,
  uploadCover.single('background'),
  UploadController.uploadArtistBackground
);

// Album cover upload (admin only)
// POST /api/upload/album/:albumId/cover
router.post('/album/:albumId/cover',
  authenticateToken,
  uploadLimiter,
  uploadCover.single('cover'),
  UploadController.uploadAlbumCover
);

// Playlist cover upload (owner only)
// POST /api/upload/playlist/:playlistId/cover
router.post('/playlist/:playlistId/cover',
  authenticateToken,
  uploadLimiter,
  uploadCover.single('cover'),
  UploadController.uploadPlaylistCover
);

// Track audio upload (admin only)
// POST /api/upload/track/:trackId/audio
router.post('/track/:trackId/audio',
  authenticateToken,
  uploadLimiter,
  uploadAudio.single('audio'),
  UploadController.uploadTrackAudio
);

// Track image upload (admin only)
// POST /api/upload/track/:trackId/image
router.post('/track/:trackId/image',
  authenticateToken,
  uploadLimiter,
  uploadCover.single('image'),
  UploadController.uploadTrackImage
);

// Multiple images upload
// POST /api/upload/images
router.post('/images',
  authenticateToken,
  uploadLimiter,
  uploadMultipleImages.array('images', 5),
  UploadController.uploadMultipleImages
);

router.get('/serve/:type/:filename',
  serveLimiter,
  UploadController.serveFile
);

router.get('/info/:type/:filename',
  authenticateToken,
  UploadController.getFileInfo
);

// Delete uploaded file (admin only)
// DELETE /api/upload/:type/:filename
router.delete('/:type/:filename',
  authenticateToken,
  uploadLimiter,
  UploadController.deleteUploadedFile
);

export default router; 