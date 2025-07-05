import { prisma } from '../config/database';
import { generateEmbedding, generateResponse } from '../config/gemini';
import { findSimilarChunks } from '../utils/textProcessor';
import type { Chunk } from '@prisma/client';

export interface ChatRequest {
  question: string;
  fileIds: string[];
  chatSessionId?: string;
}

export interface ChatResponse {
  answer: string;
  context: any[]; // Consider defining a more specific type for context chunks
  chatSessionId: string;
}



export async function processQuestion(request: ChatRequest): Promise<ChatResponse> {
  const { question, fileIds, chatSessionId: existingSessionId } = request;

  let session;
  let chatSessionId = existingSessionId;

  // 1. Find or create the chat session
  if (chatSessionId) {
    session = await prisma.chatSession.findUnique({ where: { id: chatSessionId } });
  }

  if (!session) {
    const sessionTitle = question.substring(0, 50) + (question.length > 50 ? '...' : '');
    const newSession = await prisma.chatSession.create({
      data: {
        title: sessionTitle,
        files: {
          connect: fileIds.map(id => ({ id })),
        },
      },
    });
    chatSessionId = newSession.id;
  } else if (chatSessionId) {
    // If session exists, just ensure we use its ID
    chatSessionId = session.id;
  }

  if (!chatSessionId) {
    throw new Error("Could not create or find a chat session.");
  }

  // 2. Store User's Message
  await prisma.chatMessage.create({
    data: {
      role: 'user',
      content: question,
      chatSessionId,
    },
  });

  // 3. Find Relevant Context
  const relevantChunks = await findSimilarChunks(question, 5, fileIds);
  const context = relevantChunks.map((chunk: Chunk) => chunk.content).join('\n\n');

  // 4. Generate AI Response
  const answer = await generateResponse(question, context);

  // 5. Store Assistant's Message
  await prisma.chatMessage.create({
    data: {
      role: 'assistant',
      content: answer,
      chatSessionId,
      context: relevantChunks.map((c: Chunk) => c.content), 
    },
  });
  
  return {
    answer,
    context: relevantChunks.map((chunk) => chunk.content),
    chatSessionId,
  };
}

export async function getChatHistory(chatSessionId: string) {
    const messages = await prisma.chatMessage.findMany({
        where: { chatSessionId },
        orderBy: { createdAt: 'asc' },
    });

    // Map messages to ensure context is always string[]
    return messages.map(msg => {
        let transformedContext: string[] = [];
        if (msg.context) {
            const contextData = msg.context as any; // Cast to any to access properties safely
            if (contextData.chunks && Array.isArray(contextData.chunks)) {
                // Old format: { chunks: [{ content: '...' }] }
                transformedContext = contextData.chunks.map((c: any) => c.content);
            } else if (Array.isArray(contextData)) {
                // New format: ['...', '...'] or if it was stored as an array directly
                transformedContext = contextData.map((c: any) => String(c)); // Ensure elements are strings
            }
        }

        return {
            ...msg,
            context: transformedContext,
        };
    });
} 

export async function getAllChatSessions() {
  const sessions = await prisma.chatSession.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      createdAt: true,
      files: {
        select: {
          id: true,
          originalName: true, // Changed from 'name' to 'originalName'
        },
      },
    },
  });
  return sessions;
} 

export async function deleteChatSession(chatSessionId: string) {
  // Delete associated chat messages first due to foreign key constraints
  await prisma.chatMessage.deleteMany({
    where: { chatSessionId: chatSessionId },
  });

  // Now delete the chat session
  await prisma.chatSession.delete({
    where: { id: chatSessionId },
  });
} 