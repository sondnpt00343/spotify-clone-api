import { Request } from 'express';
import { pathToUrl } from '../middleware/fileUpload';

// File URL fields that need path → URL conversion
const FILE_URL_FIELDS = new Set([
  'avatar_url',
  'image_url', 
  'background_image_url',
  'cover_image_url',
  'audio_url',
  'artist_image_url',
  'album_cover_image_url'
]);

// Helper to map file paths to URLs in responses
export const mapFileUrls = (obj: any, req?: Request): any => {
  if (!obj) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => mapFileUrls(item, req));
  }
  
  if (typeof obj === 'object') {
    const mapped = { ...obj };
    
    // Convert file URL fields from path to full URL
    FILE_URL_FIELDS.forEach(field => {
      if (mapped[field]) {
        mapped[field] = pathToUrl(mapped[field], req);
      }
    });
    
    // Recursively map nested objects (avoid infinite loops)
    Object.keys(mapped).forEach(key => {
      if (typeof mapped[key] === 'object' && mapped[key] !== null && !Array.isArray(mapped[key])) {
        mapped[key] = mapFileUrls(mapped[key], req);
      } else if (Array.isArray(mapped[key])) {
        mapped[key] = mapped[key].map((item: any) => mapFileUrls(item, req));
      }
    });
    
    return mapped;
  }
  
  return obj;
}; 