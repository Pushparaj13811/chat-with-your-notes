import { prisma } from '../config/database';
import { 
  generateResponse, 
  generateConversationSummary, 
  generateMemoryEnhancedResponse 
} from '../config/gemini';
import { findSimilarChunks } from '../utils/textProcessor';
import { memoryManager } from '../utils/memoryManager';
import type { Chunk } from '@prisma/client';

export interface ChatRequest {
  question: string;
  fileIds: string[];
  chatSessionId?: string;
  deviceId?: string;
  userId?: string;
}

export interface ChatResponse {
  answer: string;
  context: any[];
  chatSessionId: string;
  shouldSummarize?: boolean;
  conversationSummary?: string;
  memoryStats?: {
    messageCount: number;
    isSummarized: boolean;
    memoryEfficiency: number;
  };
}

export interface ConversationMemory {
  history: Array<{ role: string; content: string }>;
  summary?: string;
  messageCount: number;
  isSummarized: boolean;
}

export async function processQuestion(request: ChatRequest): Promise<ChatResponse> {
  const { question, fileIds, chatSessionId: existingSessionId, deviceId, userId } = request;

  let session;
  let chatSessionId = existingSessionId;

  // 1. Find or create the chat session
  if (chatSessionId) {
    session = await prisma.chatSession.findFirst({ 
      where: { 
        id: chatSessionId,
        ...(userId ? { userId } : { deviceId })
      },
      include: { messages: true }
    });
  }

  if (!session) {
    const sessionTitle = question.substring(0, 50) + (question.length > 50 ? '...' : '');
    const newSession = await prisma.chatSession.create({
      data: {
        title: sessionTitle,
        ...(userId ? { userId } : { deviceId }),
        files: {
          connect: fileIds.map(id => ({ id })),
        },
      },
      include: { messages: true }
    });
    chatSessionId = newSession.id;
    session = newSession;
  }

  if (!chatSessionId) {
    throw new Error("Could not create or find a chat session.");
  }

  // 2. Get optimized conversation context using memory manager
  const optimizedContext = await memoryManager.getOptimizedContext(chatSessionId);

  // 3. Store User's Message
  await prisma.chatMessage.create({
    data: {
      role: 'user',
      content: question,
      chatSessionId,
    },
  });

  // Update message count
  await prisma.chatSession.update({
    where: { id: chatSessionId },
    data: { messageCount: { increment: 1 } }
  });

  // 4. Find Relevant Context
  const relevantChunks = await findSimilarChunks(question, 5, fileIds, deviceId);
  const context = relevantChunks.map((chunk: Chunk) => chunk.content).join('\n\n');

  // 5. Generate AI Response with Memory
  let answer: string;
  let shouldSummarize = optimizedContext.shouldSummarize;
  let conversationSummary: string | undefined;

  if (optimizedContext.history.length > 0) {
    // Use memory-enhanced response for ongoing conversations
    const memoryResponse = await generateMemoryEnhancedResponse(
      question,
      context,
      optimizedContext.history,
      20 // maxHistoryLength
    );
    
    answer = memoryResponse.answer;
    shouldSummarize = shouldSummarize || memoryResponse.shouldSummarize;

    // Check if we should optimize memory
    if (shouldSummarize) {
      const optimizationResult = await memoryManager.optimizeMemory(chatSessionId);
      if (optimizationResult.optimized && optimizationResult.summary) {
        conversationSummary = optimizationResult.summary;
      }
    }
  } else {
    // First message in conversation - use regular response
    answer = await generateResponse(question, context, undefined, optimizedContext.summary);
  }

  // 6. Store Assistant's Message
  await prisma.chatMessage.create({
    data: {
      role: 'assistant',
      content: answer,
      chatSessionId,
      context: relevantChunks.map((c: Chunk) => c.content),
    },
  });

  // Update message count again for assistant message
  await prisma.chatSession.update({
    where: { id: chatSessionId },
    data: { messageCount: { increment: 1 } }
  });

  // 7. Get memory statistics
  const memoryStats = await memoryManager.getMemoryStats(chatSessionId);
  
  return {
    answer,
    context: relevantChunks.map((chunk) => chunk.content),
    chatSessionId,
    shouldSummarize,
    conversationSummary,
    memoryStats
  };
}

export async function getConversationMemory(chatSessionId: string, deviceId: string): Promise<ConversationMemory> {
  // Verify device ownership
  const session = await prisma.chatSession.findFirst({
    where: { 
      id: chatSessionId,
      deviceId: deviceId
    }
  });

  if (!session) {
    throw new Error('Chat session not found or access denied');
  }

  const optimizedContext = await memoryManager.getOptimizedContext(chatSessionId);
  
  return {
    history: optimizedContext.history,
    summary: optimizedContext.summary,
    messageCount: session.messageCount,
    isSummarized: session.isSummarized
  };
}

export async function getChatHistory(chatSessionId: string, deviceId?: string, userId?: string) {
  // Verify ownership
  const session = await prisma.chatSession.findFirst({
    where: { 
      id: chatSessionId,
      ...(userId ? { userId } : { deviceId })
    }
  });

  if (!session) {
    throw new Error('Chat session not found or access denied');
  }

  const messages = await prisma.chatMessage.findMany({
    where: { chatSessionId },
    orderBy: { createdAt: 'asc' },
  });

  return messages.map((message) => ({
    id: message.id,
    role: message.role,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
    context: message.context,
  }));
}

export async function getAllChatSessions(deviceId?: string, userId?: string) {
  const sessions = await prisma.chatSession.findMany({
    where: {
      ...(userId ? { userId } : { deviceId })
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
      messageCount: true,
      isSummarized: true,
      conversationSummary: true,
      files: {
        select: {
          id: true,
          originalName: true,
        },
      },
    },
  });

  // Add memory statistics to each session
  const sessionsWithStats = await Promise.all(
    sessions.map(async (session) => {
      const memoryStats = await memoryManager.getMemoryStats(session.id);
      return {
        ...session,
        memoryStats
      };
    })
  );

  return sessionsWithStats;
}

export async function deleteChatSession(chatSessionId: string, deviceId?: string, userId?: string) {
  // Verify ownership
  const session = await prisma.chatSession.findFirst({
    where: { 
      id: chatSessionId,
      ...(userId ? { userId } : { deviceId })
    }
  });

  if (!session) {
    throw new Error('Chat session not found or access denied');
  }

  // Delete associated chat messages first due to foreign key constraints
  await prisma.chatMessage.deleteMany({
    where: { chatSessionId: chatSessionId },
  });

  // Now delete the chat session
  await prisma.chatSession.delete({
    where: { id: chatSessionId },
  });
}

export async function summarizeConversation(chatSessionId: string, deviceId: string): Promise<string> {
  // Verify device ownership
  const session = await prisma.chatSession.findFirst({
    where: { 
      id: chatSessionId,
      deviceId: deviceId
    }
  });

  if (!session) {
    throw new Error('Chat session not found or access denied');
  }

  const optimizationResult = await memoryManager.optimizeMemory(chatSessionId);
  
  if (!optimizationResult.optimized) {
    throw new Error('No conversation history to summarize or conversation already summarized');
  }

  return optimizationResult.summary || '';
}

export async function clearConversationMemory(chatSessionId: string, deviceId: string) {
  // Verify device ownership
  const session = await prisma.chatSession.findFirst({
    where: { 
      id: chatSessionId,
      deviceId: deviceId
    }
  });

  if (!session) {
    throw new Error('Chat session not found or access denied');
  }

  await prisma.chatSession.update({
    where: { id: chatSessionId },
    data: {
      conversationSummary: null,
      lastSummarizedAt: null,
      isSummarized: false,
      messageCount: 0
    }
  });

  await prisma.chatMessage.updateMany({
    where: { chatSessionId },
    data: { isSummarized: false }
  });
}

export async function getMemoryStats(chatSessionId: string, deviceId: string) {
  // Verify device ownership
  const session = await prisma.chatSession.findFirst({
    where: { 
      id: chatSessionId,
      deviceId: deviceId
    }
  });

  if (!session) {
    throw new Error('Chat session not found or access denied');
  }

  return await memoryManager.getMemoryStats(chatSessionId);
}

export async function cleanupOldMessages(chatSessionId: string, keepRecentCount: number = 10) {
  return await memoryManager.cleanupOldMessages(chatSessionId, keepRecentCount);
} 