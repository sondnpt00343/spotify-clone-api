import { Request } from 'express';
import { pathToUrl } from '../middleware/fileUpload';

// Helper to map file paths to URLs in responses
export const mapFileUrls = (obj: any, req?: Request): any => {
  if (!obj) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => mapFileUrls(item, req));
  }
  
  if (typeof obj === 'object') {
    const mapped = { ...obj };
    
    // List of file URL fields to convert
    const fileUrlFields = [
      'avatar_url',
      'image_url', 
      'background_image_url',
      'cover_image_url',
      'audio_url',
      'artist_image_url',
      'album_cover_image_url'
    ];
    
    fileUrlFields.forEach(field => {
      if (mapped[field]) {
        mapped[field] = pathToUrl(mapped[field], req);
      }
    });
    
    // Recursively map nested objects
    Object.keys(mapped).forEach(key => {
      if (typeof mapped[key] === 'object' && mapped[key] !== null) {
        mapped[key] = mapFileUrls(mapped[key], req);
      }
    });
    
    return mapped;
  }
  
  return obj;
}; 