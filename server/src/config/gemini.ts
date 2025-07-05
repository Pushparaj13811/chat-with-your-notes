import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is required');
}

export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

export async function generateResponse(prompt: string, context: string): Promise<string> {
  try {
    const fullPrompt = `Based on the following context, please answer the question. If the context doesn't contain enough information to answer the question, say so. Format your answer using Markdown.

Context:
${context}

Question: ${prompt}

Answer:`;

    const result = await textModel.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating response:', error);
    throw new Error('Failed to generate response');
  }
} 