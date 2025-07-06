import type { Request, Response } from 'express';
import { 
  processQuestion, 
  getChatHistory, 
  getAllChatSessions, 
  deleteChatSession,
  summarizeConversation,
  clearConversationMemory,
  getMemoryStats
} from '../services/chatService';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const askQuestion = asyncHandler(async (req: Request, res: Response) => {
    const { question, fileIds, chatSessionId } = req.body;
    const deviceId = (req as any).deviceId;

    if (!question || !fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
        throw new ApiError(400, 'Question and a non-empty array of fileIds are required');
    }

    if (!deviceId) {
        throw new ApiError(401, 'Device not authenticated');
    }

    const response = await processQuestion({ question, fileIds, chatSessionId, deviceId });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200, 'Question processed successfully', response
            )
        );
});

export const getHistory = asyncHandler(async (req: Request, res: Response) => {
    const { chatSessionId } = req.params;
    const deviceId = (req as any).deviceId;

    if (!chatSessionId) {
        throw new ApiError(400, 'Chat Session ID is required');
    }

    if (!deviceId) {
        throw new ApiError(401, 'Device not authenticated');
    }

    const history = await getChatHistory(chatSessionId, deviceId);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200, 'Chat history fetched successfully', history
            )
        );
});

export const getAllSessions = asyncHandler(async (req: Request, res: Response) => {
    const deviceId = (req as any).deviceId;

    if (!deviceId) {
        throw new ApiError(401, 'Device not authenticated');
    }

    const sessions = await getAllChatSessions(deviceId);
    return res
        .status(200)
        .json(
            new ApiResponse(
                200, 'Chat sessions fetched successfully', sessions
            )
        );
});

export const deleteSession = asyncHandler(async (req: Request, res: Response) => {
    const { chatSessionId } = req.params;
    const deviceId = (req as any).deviceId;

    if (!chatSessionId) {
        throw new ApiError(400, 'Chat Session ID is required');
    }

    if (!deviceId) {
        throw new ApiError(401, 'Device not authenticated');
    }

    await deleteChatSession(chatSessionId, deviceId);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200, 'Chat session deleted successfully', null
            )
        );
});

export const summarizeSession = asyncHandler(async (req: Request, res: Response) => {
    const { chatSessionId } = req.params;
    const deviceId = (req as any).deviceId;

    if (!chatSessionId) {
        throw new ApiError(400, 'Chat Session ID is required');
    }

    if (!deviceId) {
        throw new ApiError(401, 'Device not authenticated');
    }

    const summary = await summarizeConversation(chatSessionId, deviceId);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200, 'Conversation summarized successfully', { summary }
            )
        );
});

export const clearMemory = asyncHandler(async (req: Request, res: Response) => {
    const { chatSessionId } = req.params;
    const deviceId = (req as any).deviceId;

    if (!chatSessionId) {
        throw new ApiError(400, 'Chat Session ID is required');
    }

    if (!deviceId) {
        throw new ApiError(401, 'Device not authenticated');
    }

    await clearConversationMemory(chatSessionId, deviceId);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200, 'Conversation memory cleared successfully', null
            )
        );
});

export const getSessionMemoryStats = asyncHandler(async (req: Request, res: Response) => {
    const { chatSessionId } = req.params;
    const deviceId = (req as any).deviceId;

    if (!chatSessionId) {
        throw new ApiError(400, 'Chat Session ID is required');
    }

    if (!deviceId) {
        throw new ApiError(401, 'Device not authenticated');
    }

    const stats = await getMemoryStats(chatSessionId, deviceId);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200, 'Memory statistics fetched successfully', stats
            )
        );
});