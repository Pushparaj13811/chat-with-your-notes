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
    const fullPrompt = `You are an AI assistant helping users understand information from a given context.

    Use only the information provided below to answer the question. If the context does not contain enough information, clearly say: "Sorry, I couldn't find enough information in the provided context. if it can be found in the internet then use the internet to find the information and answer the question properly."
    
    Please follow these rules when answering:
    - Be concise and clear unless the user asks for a longer response
    - Use bullet points or headings if needed
    - Format your response using Markdown (e.g., **bold**, _italic_, \`code\`, etc.)
    - Do not make up facts
    - Cite any specific part of the context if it supports your answer
    
    ---
    
    ### 🧠 Context:
    ${context}
    
    ---
    
    ### ❓ Question:
    ${prompt}
    
    ---
    
    ### ✅ Answer:
    `;

    const result = await textModel.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating response:', error);
    throw new Error('Failed to generate response');
  }
} 