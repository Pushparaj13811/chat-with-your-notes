import type { Request, Response, NextFunction } from 'express';
import { getOrCreateDeviceId, isValidDeviceId, getDeviceIdFromRequest } from '../utils/deviceManager';
import { ApiError } from '../utils/apiError';

/**
 * Middleware to ensure device ID is present and valid
 */
export function requireDeviceId(req: Request, res: Response, next: NextFunction): void {
  try {
    const deviceId = getOrCreateDeviceId(req, res);
    
    // Add device ID to request object for use in controllers
    (req as any).deviceId = deviceId;
    
    next();
  } catch (error) {
    next(new ApiError(400, 'Invalid device identification'));
  }
}

/**
 * Middleware to validate device ID without creating new one
 */
export function validateDeviceId(req: Request, res: Response, next: NextFunction): void {
  try {
    const deviceId = getDeviceIdFromRequest(req);
    
    if (!deviceId || !isValidDeviceId(deviceId)) {
      throw new ApiError(401, 'Device not authenticated');
    }
    
    // Add device ID to request object for use in controllers
    (req as any).deviceId = deviceId;
    
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware to ensure device owns the resource
 */
export function requireDeviceOwnership(resourceType: 'file' | 'session') {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const deviceId = (req as any).deviceId;
      const resourceId = req.params.fileId || req.params.chatSessionId;
      
      if (!resourceId) {
        throw new ApiError(400, `${resourceType} ID is required`);
      }
      
      if (!deviceId) {
        throw new ApiError(401, 'Device not authenticated');
      }
      
      // Import Prisma here to avoid circular dependencies
      const { prisma } = await import('../config/database');
      
      let resource;
      
      if (resourceType === 'file') {
        resource = await prisma.file.findUnique({
          where: { id: resourceId },
          select: { deviceId: true }
        });
      } else {
        resource = await prisma.chatSession.findUnique({
          where: { id: resourceId },
          select: { deviceId: true }
        });
      }
      
      if (!resource) {
        throw new ApiError(404, `${resourceType} not found`);
      }
      
      if (resource.deviceId !== deviceId) {
        throw new ApiError(403, `Access denied: ${resourceType} belongs to another device`);
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
} 