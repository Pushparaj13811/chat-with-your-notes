import type { Request, Response, NextFunction } from 'express';
import passport from '../config/passport';
import { ApiError } from '../utils/apiError';
import { authService } from '../services/authService';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      name?: string;
      picture?: string;
      authProvider: string;
      isVerified: boolean;
    }
  }
}

// JWT Authentication middleware
export const requireAuth = passport.authenticate('jwt', { session: false });

// Optional JWT Authentication (doesn't fail if no token)
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  passport.authenticate('jwt', { session: false }, (err: any, user: any) => {
    if (err) {
      return next();
    }
    if (user) {
      req.user = user;
    }
    next();
  })(req, res, next);
};

// Middleware to handle both device-based and user-based authentication
export const requireDeviceOrUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check for JWT token first
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return passport.authenticate('jwt', { session: false }, (err: any, user: any) => {
        if (err) {
          return next(new ApiError(401, 'Authentication failed'));
        }
        if (user) {
          req.user = user;
          (req as any).userId = user.id;
          return next();
        }
        // Fall back to device authentication if JWT fails
        return checkDeviceAuth(req, res, next);
      })(req, res, next);
    }

    // Fall back to device authentication
    return checkDeviceAuth(req, res, next);
  } catch (error) {
    next(new ApiError(401, 'Authentication failed'));
  }
};

// Device authentication fallback
const checkDeviceAuth = (req: Request, res: Response, next: NextFunction) => {
  const deviceId = req.headers['x-device-id'] as string;
  
  if (!deviceId) {
    return next(new ApiError(401, 'Device ID or user authentication required'));
  }
  
  (req as any).deviceId = deviceId;
  next();
};

// Middleware to ensure user owns the resource or has device access
export const requireResourceOwnership = (resourceType: 'file' | 'chatSession') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const resourceId = req.params.fileId || req.params.sessionId || req.params.chatSessionId;
      const userId = req.user?.id;
      const deviceId = (req as any).deviceId;

      if (!resourceId) {
        return next(new ApiError(400, 'Resource ID required'));
      }

      const { prisma } = await import('../config/database');
      
      let resource;
      if (resourceType === 'file') {
        resource = await prisma.file.findUnique({
          where: { id: resourceId }
        });
      } else {
        resource = await prisma.chatSession.findUnique({
          where: { id: resourceId }
        });
      }

      if (!resource) {
        return next(new ApiError(404, `${resourceType} not found`));
      }

      // Check ownership: user owns it OR device owns it
      const hasAccess = (userId && resource.userId === userId) || 
                       (deviceId && resource.deviceId === deviceId);

      if (!hasAccess) {
        return next(new ApiError(403, 'Access denied'));
      }

      next();
    } catch (error) {
      next(new ApiError(500, 'Failed to verify resource ownership'));
    }
  };
};

// Email verification middleware
export const requireEmailVerification = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new ApiError(401, 'Authentication required'));
  }

  if (!req.user.isVerified) {
    return next(new ApiError(403, 'Email verification required'));
  }

  next();
};