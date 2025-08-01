import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { CustomError } from '../middleware/errorHandler';
import { processUploadedFile, generateFileUrl, deleteFile, pathToUrl } from '../middleware/fileUpload';
import { UserModel } from '../models/User';
import { ArtistModel } from '../models/Artist';
import { AlbumModel } from '../models/Album';
import { TrackModel } from '../models/Track';
import { PlaylistModel } from '../models/Playlist';

export class UploadController {
  // Upload user avatar
  static async uploadUserAvatar(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        const error: CustomError = new Error('User not authenticated');
        error.statusCode = 401;
        error.code = 'NOT_AUTHENTICATED';
        throw error;
      }

      if (!req.file) {
        const error: CustomError = new Error('No file uploaded');
        error.statusCode = 400;
        error.code = 'NO_FILE_UPLOADED';
        throw error;
      }

      // Process uploaded file
      const fileResult = await processUploadedFile(req.file, 'image');

      // Update user avatar path in database (store path, not full URL)
      await UserModel.update(userId, {
        avatar_url: fileResult.url // This is now a path
      });

      res.status(200).json({
        message: 'Avatar uploaded successfully',
        file: {
          filename: fileResult.filename,
          url: fileResult.url, // Return path only (not full URL)
          size: fileResult.size
        }
      });
    } catch (error) {
      // Clean up uploaded file on error
      if (req.file && req.file.path) {
        await deleteFile(req.file.path).catch(() => {});
      }
      next(error);
    }
  }

  // Upload artist image
  static async uploadArtistImage(req: Request, res: Response, next: NextFunction) {
    try {
      const { artistId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        const error: CustomError = new Error('User not authenticated');
        error.statusCode = 401;
        error.code = 'NOT_AUTHENTICATED';
        throw error;
      }

      if (!artistId) {
        const error: CustomError = new Error('Artist ID is required');
        error.statusCode = 400;
        error.code = 'MISSING_ARTIST_ID';
        throw error;
      }

      if (!req.file) {
        const error: CustomError = new Error('No file uploaded');
        error.statusCode = 400;
        error.code = 'NO_FILE_UPLOADED';
        throw error;
      }

      // Verify artist exists
      const artist = await ArtistModel.findById(artistId);
      if (!artist) {
        const error: CustomError = new Error('Artist not found');
        error.statusCode = 404;
        error.code = 'ARTIST_NOT_FOUND';
        throw error;
      }

      // Process uploaded file
      const fileResult = await processUploadedFile(req.file, 'image');

      // Update artist image path in database (store path, not full URL)
      await ArtistModel.update(artistId, {
        image_url: fileResult.url // This is now a path
      });

      res.status(200).json({
        message: 'Artist image uploaded successfully',
        artist_id: artistId,
        file: {
          filename: fileResult.filename,
          url: fileResult.url, // Return path only (not full URL)
          size: fileResult.size
        }
      });
    } catch (error) {
      // Clean up uploaded file on error
      if (req.file && req.file.path) {
        await deleteFile(req.file.path).catch(() => {});
      }
      next(error);
    }
  }

  // Upload artist background image
  static async uploadArtistBackground(req: Request, res: Response, next: NextFunction) {
    try {
      const { artistId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        const error: CustomError = new Error('User not authenticated');
        error.statusCode = 401;
        error.code = 'NOT_AUTHENTICATED';
        throw error;
      }

      if (!artistId) {
        const error: CustomError = new Error('Artist ID is required');
        error.statusCode = 400;
        error.code = 'MISSING_ARTIST_ID';
        throw error;
      }

      if (!req.file) {
        const error: CustomError = new Error('No file uploaded');
        error.statusCode = 400;
        error.code = 'NO_FILE_UPLOADED';
        throw error;
      }

      // Verify artist exists
      const artist = await ArtistModel.findById(artistId);
      if (!artist) {
        const error: CustomError = new Error('Artist not found');
        error.statusCode = 404;
        error.code = 'ARTIST_NOT_FOUND';
        throw error;
      }

      // Process uploaded file
      const fileResult = await processUploadedFile(req.file, 'image');

      // Update artist background image path in database (store path, not full URL)
      await ArtistModel.update(artistId, {
        background_image_url: fileResult.url // This is now a path
      });

      res.status(200).json({
        message: 'Artist background image uploaded successfully',
        artist_id: artistId,
        file: {
          filename: fileResult.filename,
          url: fileResult.url, // Return path only (not full URL)
          size: fileResult.size
        }
      });
    } catch (error) {
      // Clean up uploaded file on error
      if (req.file && req.file.path) {
        await deleteFile(req.file.path).catch(() => {});
      }
      next(error);
    }
  }

  // Upload album cover
  static async uploadAlbumCover(req: Request, res: Response, next: NextFunction) {
    try {
      const { albumId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        const error: CustomError = new Error('User not authenticated');
        error.statusCode = 401;
        error.code = 'NOT_AUTHENTICATED';
        throw error;
      }

      if (!albumId) {
        const error: CustomError = new Error('Album ID is required');
        error.statusCode = 400;
        error.code = 'MISSING_ALBUM_ID';
        throw error;
      }

      if (!req.file) {
        const error: CustomError = new Error('No file uploaded');
        error.statusCode = 400;
        error.code = 'NO_FILE_UPLOADED';
        throw error;
      }

      // Verify album exists
      const album = await AlbumModel.findById(albumId);
      if (!album) {
        const error: CustomError = new Error('Album not found');
        error.statusCode = 404;
        error.code = 'ALBUM_NOT_FOUND';
        throw error;
      }

      // Process uploaded file
      const fileResult = await processUploadedFile(req.file, 'image');

      // Update album cover path in database (store path, not full URL)
      await AlbumModel.update(albumId, {
        cover_image_url: fileResult.url // This is now a path
      });

      res.status(200).json({
        message: 'Album cover uploaded successfully',
        album_id: albumId,
        file: {
          filename: fileResult.filename,
          url: fileResult.url, // Return path only (not full URL)
          size: fileResult.size
        }
      });
    } catch (error) {
      // Clean up uploaded file on error
      if (req.file && req.file.path) {
        await deleteFile(req.file.path).catch(() => {});
      }
      next(error);
    }
  }

  // Upload playlist cover
  static async uploadPlaylistCover(req: Request, res: Response, next: NextFunction) {
    try {
      const { playlistId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        const error: CustomError = new Error('User not authenticated');
        error.statusCode = 401;
        error.code = 'NOT_AUTHENTICATED';
        throw error;
      }

      if (!playlistId) {
        const error: CustomError = new Error('Playlist ID is required');
        error.statusCode = 400;
        error.code = 'MISSING_PLAYLIST_ID';
        throw error;
      }

      if (!req.file) {
        const error: CustomError = new Error('No file uploaded');
        error.statusCode = 400;
        error.code = 'NO_FILE_UPLOADED';
        throw error;
      }

      // Verify playlist exists and user owns it
      const playlist = await PlaylistModel.findById(playlistId);
      if (!playlist) {
        const error: CustomError = new Error('Playlist not found');
        error.statusCode = 404;
        error.code = 'PLAYLIST_NOT_FOUND';
        throw error;
      }

      const isOwner = await PlaylistModel.isOwner(playlistId, userId);
      if (!isOwner) {
        const error: CustomError = new Error('You can only upload covers for your own playlists');
        error.statusCode = 403;
        error.code = 'NOT_PLAYLIST_OWNER';
        throw error;
      }

      // Process uploaded file
      const fileResult = await processUploadedFile(req.file, 'image');

      // Update playlist cover path in database (store path, not full URL)
      await PlaylistModel.update(userId, playlistId, {
        image_url: fileResult.url // This is now a path
      });

      res.status(200).json({
        message: 'Playlist cover uploaded successfully',
        playlist_id: playlistId,
        file: {
          filename: fileResult.filename,
          url: fileResult.url, // Return path only (not full URL)
          size: fileResult.size
        }
      });
    } catch (error) {
      // Clean up uploaded file on error
      if (req.file && req.file.path) {
        await deleteFile(req.file.path).catch(() => {});
      }
      next(error);
    }
  }

  // Upload track image (admin only)
  static async uploadTrackImage(req: Request, res: Response, next: NextFunction) {
    try {
      const { trackId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        const error: CustomError = new Error('User not authenticated');
        error.statusCode = 401;
        error.code = 'NOT_AUTHENTICATED';
        throw error;
      }

      if (!trackId) {
        const error: CustomError = new Error('Track ID is required');
        error.statusCode = 400;
        error.code = 'MISSING_TRACK_ID';
        throw error;
      }

      if (!req.file) {
        const error: CustomError = new Error('No file uploaded');
        error.statusCode = 400;
        error.code = 'NO_FILE_UPLOADED';
        throw error;
      }

      // Verify track exists
      const track = await TrackModel.findById(trackId);
      if (!track) {
        const error: CustomError = new Error('Track not found');
        error.statusCode = 404;
        error.code = 'TRACK_NOT_FOUND';
        throw error;
      }

      // Process uploaded file
      const fileResult = await processUploadedFile(req.file, 'image');

      // Update track image path in database (store path, not full URL)
      await TrackModel.update(trackId, {
        image_url: fileResult.url // This is now a path
      });

      res.status(200).json({
        message: 'Track image uploaded successfully',
        track_id: trackId,
        file: {
          filename: fileResult.filename,
          url: fileResult.url, // Return path only (not full URL)
          size: fileResult.size
        }
      });
    } catch (error) {
      // Clean up uploaded file on error
      if (req.file && req.file.path) {
        await deleteFile(req.file.path).catch(() => {});
      }
      next(error);
    }
  }

  // Upload track audio file (admin only)
  static async uploadTrackAudio(req: Request, res: Response, next: NextFunction) {
    try {
      const { trackId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        const error: CustomError = new Error('User not authenticated');
        error.statusCode = 401;
        error.code = 'NOT_AUTHENTICATED';
        throw error;
      }

      // TODO: Add admin role check
      // For now, we'll allow all authenticated users

      if (!trackId) {
        const error: CustomError = new Error('Track ID is required');
        error.statusCode = 400;
        error.code = 'MISSING_TRACK_ID';
        throw error;
      }

      if (!req.file) {
        const error: CustomError = new Error('No file uploaded');
        error.statusCode = 400;
        error.code = 'NO_FILE_UPLOADED';
        throw error;
      }

      // Process uploaded file
      const fileResult = await processUploadedFile(req.file, 'audio');

      // Update track with new audio URL and duration if available
      const updateData: any = {
        audio_url: fileResult.url
      };
      
      // Add duration if extracted from metadata
      if (fileResult.metadata?.duration) {
        updateData.duration = fileResult.metadata.duration;
        console.log(`Auto-updating track duration to ${fileResult.metadata.duration} seconds`);
      }

      await TrackModel.update(trackId, updateData);

      console.log('Track updated with:', updateData);

      res.status(200).json({
        message: 'Track audio uploaded successfully',
        track_id: trackId,
        file: {
          filename: fileResult.filename,
          url: fileResult.url, // Return path only (not full URL)
          size: fileResult.size,
          metadata: fileResult.metadata
        }
      });
    } catch (error) {
      // Clean up uploaded file on error
      if (req.file && req.file.path) {
        await deleteFile(req.file.path).catch(() => {});
      }
      next(error);
    }
  }

  // Serve uploaded files
  static async serveFile(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, filename } = req.params;

      if (!type || !filename) {
        const error: CustomError = new Error('File type and filename are required');
        error.statusCode = 400;
        error.code = 'MISSING_PARAMETERS';
        throw error;
      }

      if (!['images', 'audio'].includes(type)) {
        const error: CustomError = new Error('Invalid file type');
        error.statusCode = 400;
        error.code = 'INVALID_FILE_TYPE';
        throw error;
      }

      const uploadDir = path.join(process.cwd(), 'uploads');
      const filePath = path.join(uploadDir, type, filename);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        const error: CustomError = new Error('File not found');
        error.statusCode = 404;
        error.code = 'FILE_NOT_FOUND';
        throw error;
      }

      // Set appropriate headers
      const ext = path.extname(filename).toLowerCase();
      let contentType = 'application/octet-stream';

      if (type === 'images') {
        switch (ext) {
          case '.jpg':
          case '.jpeg':
            contentType = 'image/jpeg';
            break;
          case '.png':
            contentType = 'image/png';
            break;
          case '.gif':
            contentType = 'image/gif';
            break;
          case '.webp':
            contentType = 'image/webp';
            break;
        }
      } else if (type === 'audio') {
        switch (ext) {
          case '.mp3':
            contentType = 'audio/mpeg';
            break;
          case '.wav':
            contentType = 'audio/wav';
            break;
          case '.flac':
            contentType = 'audio/flac';
            break;
          case '.m4a':
            contentType = 'audio/mp4';
            break;
          case '.aac':
            contentType = 'audio/aac';
            break;
          case '.ogg':
            contentType = 'audio/ogg';
            break;
        }
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

      fileStream.on('error', (error) => {
        const customError: CustomError = new Error('Error streaming file');
        customError.statusCode = 500;
        customError.code = 'FILE_STREAM_ERROR';
        next(customError);
      });

    } catch (error) {
      next(error);
    }
  }

  // Delete uploaded file
  static async deleteUploadedFile(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, filename } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        const error: CustomError = new Error('User not authenticated');
        error.statusCode = 401;
        error.code = 'NOT_AUTHENTICATED';
        throw error;
      }

      if (!type || !filename) {
        const error: CustomError = new Error('File type and filename are required');
        error.statusCode = 400;
        error.code = 'MISSING_PARAMETERS';
        throw error;
      }

      if (!['images', 'audio'].includes(type)) {
        const error: CustomError = new Error('Invalid file type');
        error.statusCode = 400;
        error.code = 'INVALID_FILE_TYPE';
        throw error;
      }

      const uploadDir = path.join(process.cwd(), 'uploads');
      const filePath = path.join(uploadDir, type, filename);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        const error: CustomError = new Error('File not found');
        error.statusCode = 404;
        error.code = 'FILE_NOT_FOUND';
        throw error;
      }

      // TODO: Add ownership/permission checks
      // For now, only allow admin users to delete files

      // Delete the file
      await deleteFile(filePath);

      res.status(200).json({
        message: 'File deleted successfully',
        filename: filename
      });
    } catch (error) {
      next(error);
    }
  }

  // Get file information
  static async getFileInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, filename } = req.params;

      if (!type || !filename) {
        const error: CustomError = new Error('File type and filename are required');
        error.statusCode = 400;
        error.code = 'MISSING_PARAMETERS';
        throw error;
      }

      if (!['images', 'audio'].includes(type)) {
        const error: CustomError = new Error('Invalid file type');
        error.statusCode = 400;
        error.code = 'INVALID_FILE_TYPE';
        throw error;
      }

      const uploadDir = path.join(process.cwd(), 'uploads');
      const filePath = path.join(uploadDir, type, filename);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        const error: CustomError = new Error('File not found');
        error.statusCode = 404;
        error.code = 'FILE_NOT_FOUND';
        throw error;
      }

              // Get file stats
      const stats = fs.statSync(filePath);
      const filePath_url = generateFileUrl(filename, type === 'images' ? 'image' : 'audio'); // This returns path now

      res.status(200).json({
        filename: filename,
        type: type,
        size: stats.size,
        created_at: stats.birthtime,
        modified_at: stats.mtime,
        url: filePath_url // Return path only (will be converted by response middleware)
      });
    } catch (error) {
      next(error);
    }
  }

  // Upload multiple images (for galleries, etc.)
  static async uploadMultipleImages(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        const error: CustomError = new Error('User not authenticated');
        error.statusCode = 401;
        error.code = 'NOT_AUTHENTICATED';
        throw error;
      }

      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        const error: CustomError = new Error('No files uploaded');
        error.statusCode = 400;
        error.code = 'NO_FILES_UPLOADED';
        throw error;
      }

      const uploadedFiles = [];

      try {
        for (const file of req.files) {
          const fileResult = await processUploadedFile(file as Express.Multer.File, 'image');
          uploadedFiles.push({
            filename: fileResult.filename,
            url: fileResult.url, // Return path only (not full URL)
            size: fileResult.size,
            originalname: fileResult.originalname
          });
        }

        res.status(200).json({
          message: `${uploadedFiles.length} files uploaded successfully`,
          files: uploadedFiles
        });
      } catch (error) {
        // Clean up any uploaded files on error
        for (const file of req.files) {
          if ((file as Express.Multer.File).path) {
            await deleteFile((file as Express.Multer.File).path).catch(() => {});
          }
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  }
} 