import { GoogleGenerativeAI } from '@google/generative-ai';
import { appConfig } from './env';

if (!appConfig.apis.gemini.isEnabled) {
  throw new Error('GEMINI_API_KEY is required but not configured');
}

export const genAI = new GoogleGenerativeAI(appConfig.apis.gemini.apiKey!);

export const embeddingModel = genAI.getGenerativeModel({ model: 'embedding-001' });
export const textModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const result = await embeddingModel.embedContent(text);
    const embedding = await result.embedding;
    return embedding.values;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error('Failed to generate embedding');
  }
}

export async function generateResponse(
  prompt: string,
  context: string,
  conversationHistory?: Array<{ role: string; content: string }>,
  conversationSummary?: string
): Promise<string> {
  try {
    let conversationContext = '';

    if (conversationSummary) {
      conversationContext = `### 📝 Previous Conversation Summary:
${conversationSummary}

`;
    } else if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-6); // Last 6 messages for context
      conversationContext = `### 💬 Recent Conversation History:
${recentHistory.map(msg => `${msg.role === 'user' ? '👤 User' : '🤖 Assistant'}: ${msg.content}`).join('\n')}

`;
    }

    const fullPrompt = `You are a knowledgeable and experienced professor known for making complex topics easy to understand. You're mentoring students and professionals by providing helpful, clear, and approachable explanations using the information provided.

    Your role is to offer insightful, thoughtful, and accurate answers based strictly on the context given. If the context doesn’t provide enough information, simply say:
    
    **"I'm afraid the context doesn't provide enough information to answer that. You might want to look it up or ask for more details."**
    
    ---
    
    ### 📌 Guidelines for Your Response:
    
    - ✅ Speak like a kind and experienced professor: with the depth, precision, warmth, patience, and clarity
    - ✅ Use simple, understandable language—even for difficult topics
    - ✅ Encourage understanding, and if applicable, relate concepts to foundational ideas.
    - ✅ Base everything strictly on the provided context (no assumptions)
    - ❌ Never fabricate or guess facts that aren’t supported by the context
    - ✅ If helpful, break down your answer into steps, bullet points, or examples
    - ✅ Format your answer using **Markdown** for readability
    - ✅ If it’s a follow-up question, refer back to earlier context naturally
    - ✅ Avoid overly technical jargon unless necessary—explain it if you use it
    
    ---
    
    ### 💬 Previous Conversation (if any):
    ${conversationContext}
    
    ---
    
    ### 📄 Document Context:
    ${context}
    
    ---
    
    ### ❓ Current User Question:
    ${prompt}
    
    ---
    
    ### 👨‍🏫 Professor's Answer:
    `;



    const result = await textModel.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating response:', error);
    throw new Error('Failed to generate response');
  }
}

export async function generateConversationSummary(
  conversationHistory: Array<{ role: string; content: string }>
): Promise<string> {
  try {
    if (conversationHistory.length < 4) {
      return ''; // No need to summarize short conversations
    }

    const conversationText = conversationHistory
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    const summaryPrompt = `Please provide a concise summary of the following conversation, focusing on:
1. The main topics discussed
2. Key questions asked by the user
3. Important information provided by the assistant
4. Any ongoing themes or threads

Keep the summary under 200 words and focus on the most relevant information for future context.

Conversation:
${conversationText}

Summary:`;

    const result = await textModel.generateContent(summaryPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating conversation summary:', error);
    return ''; // Return empty string if summarization fails
  }
}

export async function generateMemoryEnhancedResponse(
  prompt: string,
  context: string,
  conversationHistory: Array<{ role: string; content: string }>,
  maxHistoryLength: number = 20
): Promise<{ answer: string; shouldSummarize: boolean }> {
  try {
    let shouldSummarize = false;
    let conversationContext = '';

    // If conversation is getting long, suggest summarization
    if (conversationHistory.length > maxHistoryLength) {
      shouldSummarize = true;
      // Use only recent history for context
      const recentHistory = conversationHistory.slice(-8);
      conversationContext = `### 💬 Recent Conversation (Last ${recentHistory.length} messages):
${recentHistory.map(msg => `${msg.role === 'user' ? '👤 User' : '🤖 Assistant'}: ${msg.content}`).join('\n')}

⚠️ Note: This conversation is getting long. Consider asking for a summary to maintain context quality.

`;
    } else {
      // Use full history for shorter conversations
      conversationContext = `### 💬 Conversation History:
${conversationHistory.map(msg => `${msg.role === 'user' ? '👤 User' : '🤖 Assistant'}: ${msg.content}`).join('\n')}

`;
    }

    const fullPrompt = `You are an AI assistant with memory of the ongoing conversation. Use both the document context and conversation history to provide informed, contextual responses.

    Guidelines:
    - Reference previous parts of the conversation when relevant
    - Maintain consistency with your previous answers
    - If the user asks follow-up questions, use the conversation history for context
    - Be concise but comprehensive
    - Use Markdown formatting for better readability
    - If the conversation is getting long, suggest summarizing it
    
    ---
    
    ${conversationContext}
    
    ### 🧠 Document Context:
    ${context}
    
    ---
    
    ### ❓ Current Question:
    ${prompt}
    
    ---
    
    ### ✅ Answer:
    `;

    const result = await textModel.generateContent(fullPrompt);
    const response = await result.response;
    return { answer: response.text(), shouldSummarize };
  } catch (error) {
    console.error('Error generating memory-enhanced response:', error);
    throw new Error('Failed to generate memory-enhanced response');
  }
} 