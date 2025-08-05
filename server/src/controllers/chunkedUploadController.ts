import type { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { 
  storeChunk, 
  areAllChunksUploaded, 
  mergeChunks, 
  cleanupChunks, 
  getUploadProgress,
  getChunkMetadata,
  calculateChunkSize,
  calculateTotalChunks,
  type ChunkMetadata 
} from '../services/chunkedUploadService';
import { processAndStoreFile } from '../services/fileService';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import cloudinaryService from '../services/cloudinary';
import fs from 'fs/promises';

// Configure multer for chunk uploads (no file size limit since we're handling chunks)
const chunkUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB per chunk max
  }
});

/**
 * Upload a single chunk
 */
export const uploadChunk = asyncHandler(async (req: Request, res: Response) => {
  try {
    // Validate authentication
    const userId = req.user?.id;
    const deviceId = (req as any).deviceId;
    
    if (!userId && !deviceId) {
      throw new ApiError(401, 'Authentication required');
    }

    // Validate required fields
    const { fileName, chunkIndex, totalChunks, fileSize, mimeType } = req.body;
    
    if (!fileName || chunkIndex === undefined || !totalChunks || !fileSize || !mimeType) {
      throw new ApiError(400, 'Missing required fields: fileName, chunkIndex, totalChunks, fileSize, mimeType');
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(mimeType)) {
      throw new ApiError(400, 'Invalid file type. Only PDF, TXT, and DOCX files are allowed.');
    }

    // Validate chunk index
    const chunkIndexNum = parseInt(chunkIndex);
    const totalChunksNum = parseInt(totalChunks);
    const fileSizeNum = parseInt(fileSize);
    
    if (isNaN(chunkIndexNum) || isNaN(totalChunksNum) || isNaN(fileSizeNum)) {
      throw new ApiError(400, 'Invalid numeric values');
    }
    
    if (chunkIndexNum < 0 || chunkIndexNum >= totalChunksNum) {
      throw new ApiError(400, 'Invalid chunk index');
    }

    // Check if file was uploaded
    if (!req.file) {
      throw new ApiError(400, 'No chunk file uploaded');
    }

    // Create metadata - use Cloudinary for large files
    const useCloudinary = fileSizeNum > 50 * 1024 * 1024; // Use Cloudinary for files > 50MB
    const metadata: ChunkMetadata = {
      fileName,
      chunkIndex: chunkIndexNum,
      totalChunks: totalChunksNum,
      fileSize: fileSizeNum,
      mimeType,
      deviceId: deviceId || '',
      userId: userId,
      useCloudinary
    };

    // Store the chunk
    const { chunkDirName } = await storeChunk(req.file.buffer, metadata);

    // Check if all chunks are uploaded
    const allChunksUploaded = await areAllChunksUploaded(chunkDirName);
    
    if (allChunksUploaded) {
      // All chunks received, merge and process
      const uploadsDir = process.env.UPLOAD_DIR || './uploads';
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(fileName);
      const finalFileName = `file-${uniqueSuffix}${ext}`;
      const finalPath = path.join(uploadsDir, finalFileName);

      try {
        // Merge chunks into final file
        await mergeChunks(chunkDirName, finalPath);
        
        // Upload merged file to Cloudinary
        const fileBuffer = await fs.readFile(finalPath);
        const cloudinaryResult = await cloudinaryService.upload(
          fileBuffer,
          fileName,
          'chat-notes'
        );

        // Delete the temporary merged file
        await fs.unlink(finalPath).catch(() => {});
        
        // Process the merged file
        const uploadedFile = {
          originalname: fileName,
          filename: cloudinaryResult.public_id,
          mimetype: mimeType,
          size: fileSizeNum,
          cloudinaryUrl: cloudinaryResult.secure_url,
          cloudinaryPublicId: cloudinaryResult.public_id,
          userId: userId,
          deviceId: deviceId
        };

        const fileId = await processAndStoreFile(uploadedFile);

        // Clean up chunks
        await cleanupChunks(chunkDirName);

        return res.status(201).json(
          new ApiResponse(201, 'File uploaded and processed successfully', {
            fileId,
            filename: fileName,
            size: fileSizeNum,
            chunkDirName
          })
        );

      } catch (error) {
        // Clean up chunks on error
        await cleanupChunks(chunkDirName);
        throw error;
      }
    } else {
      // More chunks expected
      const progress = await getUploadProgress(chunkDirName);
      
      return res.status(200).json(
        new ApiResponse(200, 'Chunk uploaded successfully', {
          chunkDirName,
          progress,
          completed: false
        })
      );
    }

  } catch (error) {
    console.error('Chunk upload error:', error);
    throw new ApiError(500, 'Failed to upload chunk', [], undefined, error instanceof Error ? error.stack : '');
  }
});

/**
 * Get upload progress for a chunked upload
 */
export const getChunkProgress = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { chunkDirName } = req.params;
    const deviceId = (req as any).deviceId;

    if (!deviceId) {
      throw new ApiError(401, 'Device not authenticated');
    }

    if (!chunkDirName) {
      throw new ApiError(400, 'Chunk directory name is required');
    }

    // Get metadata to verify device ownership
    const metadata = await getChunkMetadata(chunkDirName);
    if (!metadata) {
      throw new ApiError(404, 'Upload not found');
    }

    if (metadata.deviceId !== deviceId) {
      throw new ApiError(403, 'Access denied');
    }

    const progress = await getUploadProgress(chunkDirName);
    const allChunksUploaded = await areAllChunksUploaded(chunkDirName);

    return res.status(200).json(
      new ApiResponse(200, 'Progress retrieved successfully', {
        progress,
        completed: allChunksUploaded,
        metadata: {
          fileName: metadata.fileName,
          fileSize: metadata.fileSize,
          totalChunks: metadata.totalChunks
        }
      })
    );

  } catch (error) {
    console.error('Get progress error:', error);
    throw new ApiError(500, 'Failed to get upload progress');
  }
});

/**
 * Cancel a chunked upload
 */
export const cancelChunkedUpload = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { chunkDirName } = req.params;
    const deviceId = (req as any).deviceId;

    if (!deviceId) {
      throw new ApiError(401, 'Device not authenticated');
    }

    if (!chunkDirName) {
      throw new ApiError(400, 'Chunk directory name is required');
    }

    // Get metadata to verify device ownership
    const metadata = await getChunkMetadata(chunkDirName);
    if (!metadata) {
      throw new ApiError(404, 'Upload not found');
    }

    if (metadata.deviceId !== deviceId) {
      throw new ApiError(403, 'Access denied');
    }

    // Clean up chunks
    await cleanupChunks(chunkDirName);

    return res.status(200).json(
      new ApiResponse(200, 'Upload cancelled successfully')
    );

  } catch (error) {
    console.error('Cancel upload error:', error);
    throw new ApiError(500, 'Failed to cancel upload');
  }
});

/**
 * Initialize chunked upload (get chunk size recommendations)
 */
export const initializeChunkedUpload = asyncHandler(async (req: Request, res: Response) => {
  try {
    const deviceId = (req as any).deviceId;
    if (!deviceId) {
      throw new ApiError(401, 'Device not authenticated');
    }

    const { fileName, fileSize, mimeType } = req.body;

    if (!fileName || !fileSize || !mimeType) {
      throw new ApiError(400, 'Missing required fields: fileName, fileSize, mimeType');
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(mimeType)) {
      throw new ApiError(400, 'Invalid file type. Only PDF, TXT, and DOCX files are allowed.');
    }

    const fileSizeNum = parseInt(fileSize);
    if (isNaN(fileSizeNum) || fileSizeNum <= 0) {
      throw new ApiError(400, 'Invalid file size');
    }

    // Calculate optimal chunk size and total chunks
    const chunkSize = calculateChunkSize(fileSizeNum);
    const totalChunks = calculateTotalChunks(fileSizeNum, chunkSize);

    return res.status(200).json(
      new ApiResponse(200, 'Upload initialized successfully', {
        chunkSize,
        totalChunks,
        fileName,
        fileSize: fileSizeNum,
        mimeType
      })
      );

  } catch (error) {
    console.error('Initialize upload error:', error);
    throw new ApiError(500, 'Failed to initialize upload');
  }
});

// Export multer middleware for use in routes
export { chunkUpload }; 