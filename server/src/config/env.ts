import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
// Note: Bun automatically loads .env files, but we keep this for compatibility
dotenv.config();

// Debug: Log environment variable loading status
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 Environment variables check:');
  console.log(`   CLOUDINARY_CLOUD_NAME: ${process.env.CLOUDINARY_CLOUD_NAME ? '✅ Set' : '❌ Missing'}`);
  console.log(`   CLOUDINARY_API_KEY: ${process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`   CLOUDINARY_API_SECRET: ${process.env.CLOUDINARY_API_SECRET ? '✅ Set' : '❌ Missing'}`);
  console.log(`   GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Missing'}`);
  if (process.env.GEMINI_API_KEY) {
    console.log(`   GEMINI_API_KEY Length: ${process.env.GEMINI_API_KEY.length}`);
    console.log(`   GEMINI_API_KEY Preview: ${process.env.GEMINI_API_KEY.substring(0, 10)}...`);
  }
}

// Define the environment schema with validation
const envSchema = z.object({
  // Server Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3001'),
  
  // Database
  DATABASE_URL: z.string().min(1, 'Database URL is required'),
  
  // Authentication
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  SESSION_SECRET: z.string().min(32, 'Session secret must be at least 32 characters'),
  
  // API Keys
  GEMINI_API_KEY: z.string().min(1, 'Gemini API key must not be empty').optional(),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  
  // Cloudinary Configuration
  CLOUDINARY_CLOUD_NAME: z.string().min(1, 'Cloudinary cloud name is required'),
  CLOUDINARY_API_KEY: z.string().min(1, 'Cloudinary API key is required'),
  CLOUDINARY_API_SECRET: z.string().min(1, 'Cloudinary API secret is required'),
  
  // File Upload
  MAX_FILE_SIZE: z.string().transform(Number).default("104857600"), // 100MB
  UPLOAD_DIR: z.string().default('./uploads'),
  TEMP_UPLOAD_DIR: z.string().default('./temp-uploads'),
  
  // Google OAuth2
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  
  // URLs
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  SERVER_URL: z.string().url().default('http://localhost:3001'),
});

// Parse and validate environment variables
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment variable validation failed:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
};

// Export the validated configuration
export const config = parseEnv();

// Type-safe config object with additional computed values
export const appConfig = {
  // Server
  server: {
    port: config.PORT,
    env: config.NODE_ENV,
    isDevelopment: config.NODE_ENV === 'development',
    isProduction: config.NODE_ENV === 'production',
    isTest: config.NODE_ENV === 'test',
  },
  
  // Database
  database: {
    url: config.DATABASE_URL,
  },
  
  // Authentication
  auth: {
    jwtSecret: config.JWT_SECRET,
    jwtExpiresIn: config.JWT_EXPIRES_IN,
    sessionSecret: config.SESSION_SECRET,
    googleOAuth: {
      clientId: config.GOOGLE_CLIENT_ID,
      clientSecret: config.GOOGLE_CLIENT_SECRET,
      isEnabled: !!(config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET),
    },
  },
  
  // External APIs
  apis: {
    gemini: {
      apiKey: config.GEMINI_API_KEY,
      isEnabled: !!config.GEMINI_API_KEY,
    },
    openai: {
      apiKey: config.OPENAI_API_KEY,
      isEnabled: !!config.OPENAI_API_KEY,
    },
    anthropic: {
      apiKey: config.ANTHROPIC_API_KEY,
      isEnabled: !!config.ANTHROPIC_API_KEY,
    },
  },
  
  // Cloudinary
  cloudinary: {
    cloudName: config.CLOUDINARY_CLOUD_NAME,
    apiKey: config.CLOUDINARY_API_KEY,
    apiSecret: config.CLOUDINARY_API_SECRET,
    folderName: `chat-notes-${config.NODE_ENV}`,
  },
  
  // File Upload
  fileUpload: {
    maxSize: config.MAX_FILE_SIZE,
    uploadDir: config.UPLOAD_DIR,
    tempUploadDir: config.TEMP_UPLOAD_DIR,
  },
  
  // URLs
  urls: {
    client: config.CLIENT_URL,
    server: config.SERVER_URL,
    googleOAuthCallback: `${config.SERVER_URL}/api/auth/google/callback`,
  },
  
  // CORS
  cors: {
    origin: config.CLIENT_URL,
    credentials: true,
  },
} as const;

// Export types for TypeScript support
export type Config = typeof config;
export type AppConfig = typeof appConfig;

// Utility function to check if we're in development
export const isDev = () => appConfig.server.isDevelopment;
export const isProd = () => appConfig.server.isProduction;
export const isTest = () => appConfig.server.isTest;