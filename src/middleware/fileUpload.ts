import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { parseFile } from 'music-metadata';

// Ensure upload directories exist
const ensureDirectoryExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Create upload directories
const uploadDir = path.join(process.cwd(), 'uploads');
const imageDir = path.join(uploadDir, 'images');
const audioDir = path.join(uploadDir, 'audio');
const tempDir = path.join(uploadDir, 'temp');

ensureDirectoryExists(imageDir);
ensureDirectoryExists(audioDir);
ensureDirectoryExists(tempDir);

// File type validation
const imageFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedImageTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedImageTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, JPG, PNG, GIF, WebP) are allowed'));
  }
};

const audioFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedAudioTypes = /mp3|wav|flac|m4a|aac|ogg/;
  const extname = allowedAudioTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedAudioTypes.test(file.mimetype) || 
                   file.mimetype.startsWith('audio/');

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only audio files (MP3, WAV, FLAC, M4A, AAC, OGG) are allowed'));
  }
};

// Storage configuration for images
const imageStorage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    cb(null, imageDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = uuidv4();
    const extension = path.extname(file.originalname);
    const filename = `img_${uniqueSuffix}${extension}`;
    cb(null, filename);
  }
});

// Storage configuration for audio files
const audioStorage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    cb(null, audioDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = uuidv4();
    const extension = path.extname(file.originalname);
    const filename = `audio_${uniqueSuffix}${extension}`;
    cb(null, filename);
  }
});

// Memory storage for temporary processing
const memoryStorage = multer.memoryStorage();

// Upload configurations
export const uploadImage = multer({
  storage: imageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit for images
    files: 1
  }
});

export const uploadAudio = multer({
  storage: audioStorage,
  fileFilter: audioFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for audio files
    files: 1
  }
});

export const uploadToMemory = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit for memory uploads
    files: 1
  }
});

// Multiple file upload configurations
export const uploadMultipleImages = multer({
  storage: imageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit for multiple images
    files: 5 // Maximum 5 images
  }
});

// Avatar upload (smaller size limit)
export const uploadAvatar = multer({
  storage: imageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit for avatars
    files: 1
  }
});

// Cover image upload
export const uploadCover = multer({
  storage: imageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit for cover images
    files: 1
  }
});

// File validation helpers
export const validateFileType = (file: Express.Multer.File, allowedTypes: string[]): boolean => {
  const fileExtension = path.extname(file.originalname).toLowerCase();
  return allowedTypes.includes(fileExtension);
};

export const validateFileSize = (file: Express.Multer.File, maxSizeInMB: number): boolean => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
};

// File utility functions
export const deleteFile = (filePath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err && err.code !== 'ENOENT') {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

export const moveFile = (oldPath: string, newPath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    fs.rename(oldPath, newPath, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

export const getFileStats = (filePath: string): Promise<fs.Stats> => {
  return new Promise((resolve, reject) => {
    fs.stat(filePath, (err, stats) => {
      if (err) {
        reject(err);
      } else {
        resolve(stats);
      }
    });
  });
};

// Generate file URL for serving (now returns path for storage)
export const generateFilePath = (filename: string, type: 'image' | 'audio'): string => {
  if (type === 'image') {
    return `/uploads/images/${filename}`;
  } else if (type === 'audio') {
    return `/uploads/audio/${filename}`;
  }
  return '';
};

// Convert stored path to full URL with current origin
export const pathToUrl = (path: string | null | undefined, req?: any): string | null => {
  if (!path) return null;
  
  // If already full URL, return as is (for backward compatibility)
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Get base URL from request or environment
  let baseUrl = process.env.APP_URL || 'http://localhost:3000';
  
  if (req) {
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:3000';
    baseUrl = `${protocol}://${host}`;
  }
  
  return `${baseUrl}${path}`;
};

// Legacy function for backward compatibility - now calls generateFilePath
export const generateFileUrl = (filename: string, type: 'image' | 'audio'): string => {
  return generateFilePath(filename, type);
};

// Clean up temporary files
export const cleanupTempFiles = async (maxAgeInMinutes: number = 60): Promise<void> => {
  try {
    const files = await fs.promises.readdir(tempDir);
    const now = Date.now();
    const maxAge = maxAgeInMinutes * 60 * 1000;

    for (const file of files) {
      const filePath = path.join(tempDir, file);
      const stats = await fs.promises.stat(filePath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        await fs.promises.unlink(filePath);
      }
    }
  } catch (error) {
    console.error('Error cleaning up temp files:', error);
  }
};

// Image processing validation (for future integration with sharp)
export interface ImageProcessingOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  crop?: boolean;
}

// Audio metadata extraction (for future integration with node-ffmpeg)
export interface AudioMetadata {
  duration?: number;
  bitrate?: number;
  sampleRate?: number;
  channels?: number;
  format?: string;
}

// File upload result interface
export interface FileUploadResult {
  filename: string;
  originalname: string;
  size: number;
  mimetype: string;
  path: string;
  url: string;
  metadata?: AudioMetadata | any;
}

// Process uploaded file
export const processUploadedFile = async (
  file: Express.Multer.File,
  type: 'image' | 'audio',
  options?: ImageProcessingOptions
): Promise<FileUploadResult> => {
  const path = generateFilePath(file.filename, type);
  
  const result: FileUploadResult = {
    filename: file.filename,
    originalname: file.originalname,
    size: file.size,
    mimetype: file.mimetype,
    path: file.path,
    url: path, // Now stores path instead of full URL
    metadata: undefined
  };

  // Extract audio metadata if it's an audio file
  if (type === 'audio') {
    try {
      const metadata = await parseFile(file.path);
      result.metadata = {
        duration: metadata.format.duration ? Math.round(metadata.format.duration) : undefined,
        bitrate: metadata.format.bitrate,
        sampleRate: metadata.format.sampleRate,
        channels: metadata.format.numberOfChannels,
        format: metadata.format.container
      };
      console.log('Extracted audio metadata:', result.metadata);
    } catch (error) {
      console.error('Error extracting audio metadata:', error);
      // Continue without metadata if extraction fails
    }
  }

  // TODO: Add image processing with sharp
  
  return result;
};

export default {
  uploadImage,
  uploadAudio,
  uploadAvatar,
  uploadCover,
  uploadMultipleImages,
  uploadToMemory,
  validateFileType,
  validateFileSize,
  deleteFile,
  moveFile,
  generateFileUrl,
  processUploadedFile,
  cleanupTempFiles
}; 