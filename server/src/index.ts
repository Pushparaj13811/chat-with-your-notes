import express from 'express';
import cors from 'cors';
import multer from 'multer';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { connectDatabase, disconnectDatabase } from './config/database';
import fileRoutes from './routes/fileRoutes';
import chatRoutes from './routes/chatRoutes';
import authRoutes from './routes/authRoutes';
import { cleanupOldChunks } from './services/chunkedUploadService';
import passport from './config/passport';
import { appConfig, isDev } from './config/env';

// Fix SSL certificate verification issues for Google Generative AI API
if (isDev()) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const app = express();

// Middleware
app.use(cors({
    origin: appConfig.cors.origin,
    credentials: true
}));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration for Passport
app.use(session({
    secret: appConfig.auth.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: appConfig.server.isProduction,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Image proxy endpoint for Google profile pictures
app.get('/api/proxy-image', async (req, res) => {
    try {
        const { url } = req.query;
        
        if (!url || typeof url !== 'string') {
            return res.status(400).json({ error: 'URL parameter is required' });
        }

        // Only allow Google User Content URLs for security
        if (!url.includes('googleusercontent.com')) {
            return res.status(403).json({ error: 'Only Google User Content URLs are allowed' });
        }

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; Bot/1.0)',
                'Referer': 'https://accounts.google.com/'
            }
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: 'Failed to fetch image' });
        }

        const contentType = response.headers.get('content-type');
        if (!contentType?.startsWith('image/')) {
            return res.status(400).json({ error: 'Invalid content type' });
        }

        // Set appropriate headers
        res.set({
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
            'Access-Control-Allow-Origin': '*'
        });

        // Pipe the image data
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        res.send(buffer);
    } catch (error) {
        console.error('Image proxy error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', fileRoutes);
app.use('/api', chatRoutes);

// Error handling middleware
app.use(
    (
        err: any,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ) => {
        console.error('Unhandled error:', err);

        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    message: 'File too large'
                });
            }
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
        });
    }
);

// 404 handler ✅ Fixed: No longer uses `'*'` to avoid path-to-regexp error
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down server...');
    await disconnectDatabase();
    process.exit(0);
});

// Start server
async function startServer() {
    try {
        await connectDatabase(); // Connect to DB (Prisma or similar)

        app.listen(appConfig.server.port, () => {
            console.log(`🚀 Server running on port ${appConfig.server.port}`);
            console.log(`📊 Health check: http://localhost:${appConfig.server.port}/health`);
            console.log(`📁 File upload: http://localhost:${appConfig.server.port}/api/upload`);
            console.log(`💬 Chat endpoint: http://localhost:${appConfig.server.port}/api/ask`);
        });

        // Set up periodic cleanup of old chunks (every 6 hours)
        setInterval(async () => {
            try {
                await cleanupOldChunks();
                console.log('🧹 Cleaned up old chunk directories');
            } catch (error) {
                console.error('Error cleaning up old chunks:', error);
            }
        }, 6 * 60 * 60 * 1000); // 6 hours

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
