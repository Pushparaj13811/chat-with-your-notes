import type { Request, Response } from 'express';
import { authService } from '../services/authService';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { appConfig } from '../config/env';
import passport from '../config/passport';

// Custom signup
export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  if (password.length < 6) {
    throw new ApiError(400, 'Password must be at least 6 characters long');
  }

  try {
    const user = await authService.createUser({
      email,
      password,
      name,
      authProvider: 'custom'
    });

    // Generate JWT token
    const token = authService.generateJWT({
      userId: user.id,
      email: user.email,
      authProvider: user.authProvider
    });

    // Remove password from response
    const { password: _, ...userResponse } = user;

    res.status(201).json(
      new ApiResponse(201, 'User created successfully. Please verify your email.', {
        user: userResponse,
        token,
        requiresVerification: !user.isVerified
      })
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      throw new ApiError(409, 'User already exists with this email');
    }
    throw error;
  }
});

// Custom login
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  try {
    const { user, token } = await authService.loginUser({ email, password });

    // Remove password from response
    const { password: _, ...userResponse } = user;

    res.status(200).json(
      new ApiResponse(200, 'Login successful', {
        user: userResponse,
        token
      })
    );
  } catch (error) {
    if (error instanceof Error) {
      throw new ApiError(401, error.message);
    }
    throw new ApiError(401, 'Login failed');
  }
});

// Get Google OAuth URL endpoint
export const getGoogleAuthUrl = asyncHandler(async (req: Request, res: Response) => {
  const { deviceId } = req.query;
  const baseUrl = `${appConfig.urls.server}/api/auth/google`;
  const url = deviceId ? `${baseUrl}?deviceId=${deviceId}` : baseUrl;
  
  res.status(200).json(
    new ApiResponse(200, 'Google OAuth URL retrieved successfully', {
      url
    })
  );
});

// Google OAuth initiate
export const googleAuth = passport.authenticate('google', { 
  scope: ['profile', 'email'] 
});

// Google OAuth callback
export const googleCallback = asyncHandler(async (req: Request, res: Response) => {
  passport.authenticate('google', { session: false }, async (err: any, user: any) => {
    if (err) {
      console.error('Google OAuth error:', err);
      return res.redirect(`${process.env.CLIENT_URL}/auth/error?message=oauth_failed`);
    }

    if (!user) {
      return res.redirect(`${process.env.CLIENT_URL}/auth/error?message=oauth_failed`);
    }

    try {
      // Generate JWT token
      const token = authService.generateJWT({
        userId: user.id,
        email: user.email,
        authProvider: user.authProvider
      });

      // Check if user has device data to migrate
      const deviceId = req.query.deviceId as string;
      if (deviceId) {
        try {
          const migrationResult = await authService.migrateDeviceDataToUser(deviceId, user.id);
          console.log('Migration result:', migrationResult);
        } catch (migrationError) {
          console.warn('Device migration failed:', migrationError);
          // Don't fail the login if migration fails
        }
      }

      // Redirect to frontend with token
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      res.redirect(`${clientUrl}/auth/success?token=${token}`);
    } catch (error) {
      console.error('Token generation error:', error);
      res.redirect(`${process.env.CLIENT_URL}/auth/error?message=token_failed`);
    }
  })(req, res);
});

// Email verification
export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.params;

  if (!token) {
    throw new ApiError(400, 'Verification token is required');
  }

  try {
    const user = await authService.verifyEmail(token);
    
    // Remove password from response
    const { password: _, ...userResponse } = user;

    res.status(200).json(
      new ApiResponse(200, 'Email verified successfully', {
        user: userResponse
      })
    );
  } catch (error) {
    if (error instanceof Error) {
      throw new ApiError(400, error.message);
    }
    throw new ApiError(400, 'Email verification failed');
  }
});

// Request password reset
export const requestPasswordReset = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, 'Email is required');
  }

  try {
    const resetToken = await authService.generatePasswordResetToken(email);
    
    // In a real app, you would send this token via email
    // For now, we'll return it in the response for testing
    res.status(200).json(
      new ApiResponse(200, 'Password reset token generated. Check your email.', {
        // Don't return the token in production!
        resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
      })
    );
  } catch (error) {
    if (error instanceof Error) {
      throw new ApiError(400, error.message);
    }
    throw new ApiError(400, 'Password reset request failed');
  }
});

// Reset password
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    throw new ApiError(400, 'Token and new password are required');
  }

  if (newPassword.length < 6) {
    throw new ApiError(400, 'Password must be at least 6 characters long');
  }

  try {
    const user = await authService.resetPassword(token, newPassword);
    
    // Remove password from response
    const { password: _, ...userResponse } = user;

    res.status(200).json(
      new ApiResponse(200, 'Password reset successfully', {
        user: userResponse
      })
    );
  } catch (error) {
    if (error instanceof Error) {
      throw new ApiError(400, error.message);
    }
    throw new ApiError(400, 'Password reset failed');
  }
});

// Get current user profile
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required');
  }

  // Remove sensitive fields
  const { password: _, resetToken: __, verificationToken: ___, ...userResponse } = req.user as any;

  res.status(200).json(
    new ApiResponse(200, 'Profile retrieved successfully', {
      user: userResponse
    })
  );
});

// Migrate device data to user
export const migrateDeviceData = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required');
  }

  const { deviceId } = req.body;

  if (!deviceId) {
    throw new ApiError(400, 'Device ID is required');
  }

  try {
    console.log(`🔍 Migration request: deviceId=${deviceId}, userId=${req.user.id}`);
    const result = await authService.migrateDeviceDataToUser(deviceId, req.user.id);

    if (result.migrated) {
      res.status(200).json(
        new ApiResponse(200, 'Device data migrated successfully', {
          deviceId,
          userId: req.user.id,
          migrated: true,
          migratedItems: result.migratedItems
        })
      );
    } else {
      res.status(200).json(
        new ApiResponse(200, result.reason || 'Migration not needed', {
          deviceId,
          userId: req.user.id,
          migrated: false,
          reason: result.reason
        })
      );
    }
  } catch (error) {
    console.error('Migration error:', error);
    if (error instanceof Error) {
      throw new ApiError(500, `Data migration failed: ${error.message}`);
    }
    throw new ApiError(500, 'Data migration failed');
  }
});

// Logout (mainly for clearing any client-side data)
export const logout = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(
    new ApiResponse(200, 'Logged out successfully')
  );
});