import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import cookieParser from 'cookie-parser';
import { connectDatabase, disconnectDatabase } from './config/database';
import fileRoutes from './routes/fileRoutes';
import chatRoutes from './routes/chatRoutes';
import { cleanupOldChunks } from './services/chunkedUploadService';

// Load environment variables
dotenv.config();

// Fix SSL certificate verification issues for Google Generative AI API
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin:
        process.env.NODE_ENV === 'production'
            ? ['https://yourdomain.com']
            : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
}));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// API Routes
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

        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/health`);
            console.log(`📁 File upload: http://localhost:${PORT}/api/upload`);
            console.log(`💬 Chat endpoint: http://localhost:${PORT}/api/ask`);
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
