import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { authService } from '../services/authService';
import { prisma } from './database';
import { appConfig } from './env';

// Extend Express User type to match Prisma User
declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      name?: string;
      picture?: string;
      googleId?: string;
      authProvider: string;
      isVerified: boolean;
    }
  }
}

// Configuration validation happens in env.ts
if (!appConfig.auth.googleOAuth.isEnabled) {
  console.warn('⚠️  Google OAuth credentials not found. Google authentication will be disabled.');
}

// Google OAuth Strategy
if (appConfig.auth.googleOAuth.isEnabled) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: appConfig.auth.googleOAuth.clientId!,
        clientSecret: appConfig.auth.googleOAuth.clientSecret!,
        callbackURL: appConfig.urls.googleOAuthCallback,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const user = await authService.findOrCreateGoogleUser(profile);
          // Convert Prisma User to Express User format
          const expressUser: Express.User = {
            id: user.id,
            email: user.email,
            name: user.name || undefined,
            picture: user.picture || undefined,
            googleId: user.googleId || undefined,
            authProvider: user.authProvider,
            isVerified: user.isVerified,
          };
          return done(null, expressUser);
        } catch (error) {
          console.error('Google OAuth error:', error);
          return done(error, false);
        }
      }
    )
  );
}

// JWT Strategy
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: appConfig.auth.jwtSecret,
    },
    async (payload, done) => {
      try {
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
        });

        if (user) {
          // Convert Prisma User to Express User format
          const expressUser: Express.User = {
            id: user.id,
            email: user.email,
            name: user.name || undefined,
            picture: user.picture || undefined,
            googleId: user.googleId || undefined,
            authProvider: user.authProvider,
            isVerified: user.isVerified,
          };
          return done(null, expressUser);
        } else {
          return done(null, false);
        }
      } catch (error) {
        console.error('JWT verification error:', error);
        return done(error, false);
      }
    }
  )
);

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    if (user) {
      // Convert Prisma User to Express User format
      const expressUser: Express.User = {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        picture: user.picture || undefined,
        googleId: user.googleId || undefined,
        authProvider: user.authProvider,
        isVerified: user.isVerified,
      };
      done(null, expressUser);
    } else {
      done(null, false);
    }
  } catch (error) {
    done(error, false);
  }
});

export default passport;