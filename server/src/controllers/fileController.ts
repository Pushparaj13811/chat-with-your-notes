import type { Request, Response } from 'express';
import { processAndStoreFile, getAllFiles, deleteFile } from '../services/fileService';
import type { UploadedFile } from '../services/fileService';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { prisma } from '../config/database';

export const uploadFile = asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      throw new ApiError(400, 'No file uploaded');
    }

    const deviceId = (req as any).deviceId;
    if (!deviceId) {
      throw new ApiError(401, 'Device not authenticated');
    }

    const uploadedFile: UploadedFile = {
      originalname: req.file.originalname,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      deviceId: deviceId
    };

    const fileId = await processAndStoreFile(uploadedFile);

    return res
      .status(201)
      .json(
        new ApiResponse(
          201, 'File uploaded and processed successfully', {
        fileId,
        filename: uploadedFile.originalname,
        size: uploadedFile.size
      }
    ));

  } catch (error) {
    console.error('Upload error:', error);
    throw new ApiError(500, 'Failed to upload file', [], undefined, error instanceof Error ? error.stack : '');
  }
});

export const getFiles = asyncHandler(async (req: Request, res: Response) => {
  try {
    const deviceId = (req as any).deviceId;
    if (!deviceId) {
      throw new ApiError(401, 'Device not authenticated');
    }

    const files = await getAllFiles(deviceId);
    return res.status(200).json(new ApiResponse(200, 'Files fetched successfully', files));
  } catch (error) {
    throw new ApiError(500, 'Failed to fetch files');
  }
});

export const removeFile = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    const deviceId = (req as any).deviceId;

    if (!fileId) {
      throw new ApiError(400, 'File ID is required');
    }

    if (!deviceId) {
      throw new ApiError(401, 'Device not authenticated');
    }

    await deleteFile(fileId, deviceId);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200, 'File deleted successfully'
        )
      );

  } catch (error) {
    console.error('Delete file error:', error);
    throw new ApiError(500, 'Failed to delete file', [], undefined, error instanceof Error ? error.stack : '');
  }
});

// Return stored questions for a file
export const generateFileQuestions = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    const deviceId = (req as any).deviceId;

    if (!fileId) throw new ApiError(400, 'File ID is required');
    if (!deviceId) throw new ApiError(401, 'Device not authenticated');

    const file = await prisma.file.findFirst({ 
      where: { 
        id: fileId,
        deviceId: deviceId
      } 
    });
    
    if (!file) throw new ApiError(404, 'File not found or access denied');

    const questions = Array.isArray(file.questions) ? file.questions : [];
    return res.status(200).json(new ApiResponse(200, 'Questions fetched', { questions }));
  } catch (error) {
    console.error('Fetch file questions error:', error);
    throw new ApiError(500, 'Failed to fetch questions', [], undefined, error instanceof Error ? error.stack : '');
  }
});