import { Request, Response, NextFunction } from 'express';
import { mapFileUrls } from '../utils/response';

export const responseUrlMapping = (req: Request, res: Response, next: NextFunction) => {
  // Store original json method
  const originalJson = res.json;
  
  // Override json method to map file URLs
  res.json = function(body: any) {
    // Map file URLs in the response body
    const mappedBody = mapFileUrls(body, req);
    
    // Call original json method with mapped body
    return originalJson.call(this, mappedBody);
  };
  
  next();
}; 