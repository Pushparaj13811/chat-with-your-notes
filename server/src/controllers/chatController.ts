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

    if (!question || !fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
        throw new ApiError(400, 'Question and a non-empty array of fileIds are required');
    }

    const response = await processQuestion({ question, fileIds, chatSessionId });

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

    if (!chatSessionId) {
        throw new ApiError(400, 'Chat Session ID is required');
    }

    const messages = await getChatHistory(chatSessionId);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200, 'History fetched successfully', messages
            )
        );
});

export const getAllSessions = asyncHandler(async (req: Request, res: Response) => {
    const sessions = await getAllChatSessions();
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

    if (!chatSessionId) {
        throw new ApiError(400, 'Chat Session ID is required');
    }

    await deleteChatSession(chatSessionId);

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

    if (!chatSessionId) {
        throw new ApiError(400, 'Chat Session ID is required');
    }

    const summary = await summarizeConversation(chatSessionId);

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

    if (!chatSessionId) {
        throw new ApiError(400, 'Chat Session ID is required');
    }

    await clearConversationMemory(chatSessionId);

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

    if (!chatSessionId) {
        throw new ApiError(400, 'Chat Session ID is required');
    }

    const memoryStats = await getMemoryStats(chatSessionId);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200, 'Memory statistics fetched successfully', memoryStats
            )
        );
});