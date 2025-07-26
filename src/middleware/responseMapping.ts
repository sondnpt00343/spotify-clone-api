import { Request, Response, NextFunction } from 'express';
import { mapFileUrls } from '../utils/response';

export const responseUrlMapping = (req: Request, res: Response, next: NextFunction) => {
  // Store original json method
  const originalJson = res.json;
  
  // Override json method to map file URLs
  res.json = function(body: any) {
    try {
      // Only process if body contains data that might have file URLs
      if (body && (typeof body === 'object' || Array.isArray(body))) {
        // Map file URLs in the response body
        const mappedBody = mapFileUrls(body, req);
        
        // Call original json method with mapped body
        return originalJson.call(this, mappedBody);
      } else {
        // Return body as-is for simple responses
        return originalJson.call(this, body);
      }
    } catch (error) {
      console.error('Error in responseUrlMapping:', error);
      // Fallback to original response if mapping fails
      return originalJson.call(this, body);
    }
  };
  
  next();
}; 