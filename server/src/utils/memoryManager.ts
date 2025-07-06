import { prisma } from '../config/database';
import { generateConversationSummary } from '../config/gemini';

export interface MemoryConfig {
  maxMessagesBeforeSummary: number;
  maxHistoryLength: number;
  recentMessagesForContext: number;
  summaryThreshold: number;
}

export const DEFAULT_MEMORY_CONFIG: MemoryConfig = {
  maxMessagesBeforeSummary: 15,
  maxHistoryLength: 20,
  recentMessagesForContext: 8,
  summaryThreshold: 0.7 // 70% of max messages before suggesting summary
};

export class MemoryManager {
  private config: MemoryConfig;

  constructor(config: Partial<MemoryConfig> = {}) {
    this.config = { ...DEFAULT_MEMORY_CONFIG, ...config };
  }

  /**
   * Check if conversation should be summarized
   */
  async shouldSummarize(chatSessionId: string): Promise<boolean> {
    const session = await prisma.chatSession.findUnique({
      where: { id: chatSessionId },
      select: { messageCount: true, isSummarized: true }
    });

    if (!session) return false;

    return session.messageCount >= this.config.maxMessagesBeforeSummary && !session.isSummarized;
  }

  /**
   * Get optimized conversation context
   */
  async getOptimizedContext(chatSessionId: string): Promise<{
    history: Array<{ role: string; content: string }>;
    summary?: string;
    shouldSummarize: boolean;
  }> {
    const session = await prisma.chatSession.findUnique({
      where: { id: chatSessionId },
      select: {
        messageCount: true,
        isSummarized: true,
        conversationSummary: true
      }
    });

    if (!session) {
      return { history: [], shouldSummarize: false };
    }

    const shouldSummarize = await this.shouldSummarize(chatSessionId);

    // If conversation is summarized, use summary + recent messages
    if (session.isSummarized && session.conversationSummary) {
      const recentMessages = await this.getRecentMessages(chatSessionId, this.config.recentMessagesForContext);
      
      return {
        history: recentMessages,
        summary: session.conversationSummary,
        shouldSummarize
      };
    }

    // If conversation is getting long, suggest summarization
    if (shouldSummarize) {
      const recentMessages = await this.getRecentMessages(chatSessionId, this.config.recentMessagesForContext);
      
      return {
        history: recentMessages,
        shouldSummarize: true
      };
    }

    // Use full history for shorter conversations
    const fullHistory = await this.getRecentMessages(chatSessionId, this.config.maxHistoryLength);
    
    return {
      history: fullHistory,
      shouldSummarize: false
    };
  }

  /**
   * Get recent messages for context
   */
  private async getRecentMessages(chatSessionId: string, limit: number): Promise<Array<{ role: string; content: string }>> {
    const messages = await prisma.chatMessage.findMany({
      where: { 
        chatSessionId,
        isSummarized: false 
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { role: true, content: true }
    });

    // Reverse to get chronological order
    return messages.reverse();
  }

  /**
   * Optimize conversation memory
   */
  async optimizeMemory(chatSessionId: string): Promise<{
    optimized: boolean;
    summary?: string;
    messageCount: number;
  }> {
    const session = await prisma.chatSession.findUnique({
      where: { id: chatSessionId },
      include: { messages: true }
    });

    if (!session) {
      return { optimized: false, messageCount: 0 };
    }

    // Check if optimization is needed
    if (session.messageCount < this.config.maxMessagesBeforeSummary || session.isSummarized) {
      return { optimized: false, messageCount: session.messageCount };
    }

    // Generate summary
    const history = session.messages
      .filter(msg => !msg.isSummarized)
      .map(msg => ({ role: msg.role, content: msg.content }));

    if (history.length === 0) {
      return { optimized: false, messageCount: session.messageCount };
    }

    const summary = await generateConversationSummary(history);

    if (summary) {
      // Update session with summary
      await prisma.chatSession.update({
        where: { id: chatSessionId },
        data: {
          conversationSummary: summary,
          lastSummarizedAt: new Date(),
          isSummarized: true
        }
      });

      // Mark old messages as summarized
      await prisma.chatMessage.updateMany({
        where: { 
          chatSessionId,
          isSummarized: false 
        },
        data: { isSummarized: true }
      });

      return { optimized: true, summary, messageCount: session.messageCount };
    }

    return { optimized: false, messageCount: session.messageCount };
  }

  /**
   * Get memory statistics for a conversation
   */
  async getMemoryStats(chatSessionId: string): Promise<{
    messageCount: number;
    isSummarized: boolean;
    summaryLength?: number;
    lastSummarizedAt?: Date;
    memoryEfficiency: number; // 0-1, higher is better
  }> {
    const session = await prisma.chatSession.findUnique({
      where: { id: chatSessionId },
      select: {
        messageCount: true,
        isSummarized: true,
        conversationSummary: true,
        lastSummarizedAt: true
      }
    });

    if (!session) {
      return {
        messageCount: 0,
        isSummarized: false,
        memoryEfficiency: 0
      };
    }

    let memoryEfficiency = 1;
    if (session.isSummarized && session.conversationSummary) {
      // Calculate efficiency based on summary length vs message count
      const summaryLength = session.conversationSummary.length;
      const estimatedMessageLength = session.messageCount * 100; // Assume avg 100 chars per message
      memoryEfficiency = Math.min(1, summaryLength / estimatedMessageLength);
    } else if (session.messageCount > this.config.maxMessagesBeforeSummary) {
      // Penalize long conversations without summarization
      memoryEfficiency = this.config.maxMessagesBeforeSummary / session.messageCount;
    }

    return {
      messageCount: session.messageCount,
      isSummarized: session.isSummarized,
      summaryLength: session.conversationSummary?.length,
      lastSummarizedAt: session.lastSummarizedAt || undefined,
      memoryEfficiency
    };
  }

  /**
   * Clean up old summarized messages
   */
  async cleanupOldMessages(chatSessionId: string, keepRecentCount: number = 10): Promise<number> {
    const result = await prisma.chatMessage.deleteMany({
      where: {
        chatSessionId,
        isSummarized: true,
        createdAt: {
          lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
        }
      }
    });

    return result.count;
  }
}

// Export singleton instance
export const memoryManager = new MemoryManager(); 