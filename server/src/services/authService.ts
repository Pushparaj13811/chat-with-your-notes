import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../config/database';
import type { User } from '@prisma/client';

export interface CreateUserData {
  email: string;
  password?: string;
  name?: string;
  picture?: string;
  googleId?: string;
  authProvider: 'custom' | 'google';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  authProvider: string;
}

export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

  async createUser(userData: CreateUserData): Promise<User> {
    const { email, password, name, picture, googleId, authProvider } = userData;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Hash password for custom signup
    let hashedPassword: string | undefined;
    if (authProvider === 'custom' && password) {
      hashedPassword = await bcrypt.hash(password, 12);
    }

    // Generate verification token for custom signup
    const verificationToken = authProvider === 'custom' 
      ? crypto.randomBytes(32).toString('hex')
      : undefined;

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        picture,
        googleId,
        authProvider,
        isVerified: authProvider === 'google', // Google users are auto-verified
        verificationToken,
      }
    });

    return user;
  }

  async loginUser(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    const { email, password } = credentials;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if it's a custom auth user
    if (user.authProvider !== 'custom' || !user.password) {
      throw new Error('Please login with Google or use the correct authentication method');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Check if user is verified
    if (!user.isVerified) {
      throw new Error('Please verify your email before logging in');
    }

    // Generate JWT token
    const token = this.generateJWT({
      userId: user.id,
      email: user.email,
      authProvider: user.authProvider
    });

    return { user, token };
  }

  async findOrCreateGoogleUser(profile: any): Promise<User> {
    const { id: googleId, emails, displayName, photos } = profile;
    const email = emails[0]?.value;
    const picture = photos[0]?.value;

    if (!email) {
      throw new Error('No email found in Google profile');
    }

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email }
    });

    if (user) {
      // Update Google ID if not set
      if (!user.googleId && user.authProvider === 'custom') {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId,
            authProvider: 'google',
            isVerified: true,
            picture: picture || user.picture,
            name: displayName || user.name,
          }
        });
      }
      return user;
    }

    // Create new user
    return this.createUser({
      email,
      name: displayName,
      picture,
      googleId,
      authProvider: 'google'
    });
  }

  generateJWT(payload: JWTPayload): string {
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN
    } as jwt.SignOptions);
  }

  verifyJWT(token: string): JWTPayload {
    try {
      return jwt.verify(token, this.JWT_SECRET) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  async verifyEmail(token: string): Promise<User> {
    const user = await prisma.user.findFirst({
      where: { verificationToken: token }
    });

    if (!user) {
      throw new Error('Invalid verification token');
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null
      }
    });

    return updatedUser;
  }

  async generatePasswordResetToken(email: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || user.authProvider !== 'custom') {
      throw new Error('User not found or not eligible for password reset');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });

    return resetToken;
  }

  async resetPassword(token: string, newPassword: string): Promise<User> {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    return updatedUser;
  }

  async migrateDeviceDataToUser(deviceId: string, userId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // Check if device exists and isn't already migrated
      const device = await tx.device.findUnique({
        where: { deviceId }
      });

      if (device && device.isMigrated) {
        throw new Error('Device data has already been migrated');
      }

      // Create device record if it doesn't exist
      if (!device) {
        await tx.device.create({
          data: {
            deviceId,
            userId,
            isMigrated: true
          }
        });
      } else {
        // Update existing device
        await tx.device.update({
          where: { deviceId },
          data: {
            userId,
            isMigrated: true
          }
        });
      }

      // Migrate files
      const fileResults = await tx.file.updateMany({
        where: { deviceId },
        data: { userId }
      });

      // Migrate chat sessions
      const sessionResults = await tx.chatSession.updateMany({
        where: { deviceId },
        data: { userId }
      });
      
      console.log(`✅ Migrated ${fileResults.count} files and ${sessionResults.count} chat sessions`);

      console.log(`✅ Migrated data for device ${deviceId} to user ${userId}`);
    });
  }
}

export const authService = new AuthService();