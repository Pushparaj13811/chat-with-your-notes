import { prisma } from '../config/database';
import { generateEmbedding } from '../config/gemini';
import { extractTextFromFile, splitTextIntoChunks } from '../utils/textProcessor';
import fs from 'fs/promises';
import { textModel } from '../config/gemini';

export interface UploadedFile {
  originalname: string;
  filename: string;
  mimetype: string;
  size: number;
  path: string;
}

export async function processAndStoreFile(uploadedFile: UploadedFile): Promise<string> {
  try {
    // Extract text from file
    const text = await extractTextFromFile(uploadedFile.path, uploadedFile.mimetype);
    // Generate 6 questions from the file content (only at upload time)
    let questions: string[] = [];
    if (text && text.trim().length > 100) {
      const prompt = `You are an expert reader. Analyze the following document and generate 6 thought-provoking, insightful, and contextually relevant questions that a user could ask based on the document's content. The questions should reflect the actual structure, concepts, and ideas presented in the document. Avoid vague or overly broad questions. Output only the 6 questions as a numbered Markdown list.\n\n---\n\nDocument Content:\n${text.substring(0, 8000)}\n\n---`;
      try {
        const result = await textModel.generateContent(prompt);
        const response = await result.response;
        const questionsText = response.text();
        questions = questionsText
          .split(/\n+/)
          .map(line => line.replace(/^\d+\.|^- /, '').trim())
          .filter(q => q.length > 0)
          .slice(0, 6);
      } catch (err) {
        questions = [];
      }
    }
    // Split text into chunks
    const chunks = await splitTextIntoChunks(text);
    // Create file record in database (store questions)
    const file = await prisma.file.create({
      data: {
        filename: uploadedFile.filename,
        originalName: uploadedFile.originalname,
        mimeType: uploadedFile.mimetype,
        size: uploadedFile.size,
        path: uploadedFile.path,
        questions: questions.length > 0 ? questions : undefined,
      }
    });
    // Process chunks and generate embeddings
    const chunkPromises = chunks.map(async (chunk) => {
      const embedding = await generateEmbedding(chunk.content);
      return prisma.chunk.create({
        data: {
          content: chunk.content,
          chunkIndex: chunk.chunkIndex,
          startChar: chunk.startChar,
          endChar: chunk.endChar,
          embedding,
          fileId: file.id
        }
      });
    });
    await Promise.all(chunkPromises);
    console.log(`✅ File processed successfully: ${uploadedFile.originalname} (${chunks.length} chunks)`);
    return file.id;
  } catch (error) {
    console.error('Error processing file:', error);
    throw new Error('Failed to process file');
  }
}

export async function findSimilarChunks(query: string, limit: number = 5): Promise<any[]> {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);
    
    // Get all chunks with their embeddings
    const chunks = await prisma.chunk.findMany({
      include: {
        file: true
      }
    });
    
    // Calculate similarity scores
    const chunksWithScores = chunks.map((chunk: any) => ({
      ...chunk,
      similarity: calculateCosineSimilarity(queryEmbedding, chunk.embedding)
    }));
    
    // Sort by similarity and return top results
    return chunksWithScores
      .sort((a: any, b: any) => b.similarity - a.similarity)
      .slice(0, limit);
      
  } catch (error) {
    console.error('Error finding similar chunks:', error);
    throw new Error('Failed to find similar chunks');
  }
}

function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (normA * normB);
}

export async function getAllFiles(): Promise<any[]> {
  try {
    return await prisma.file.findMany({
      include: {
        _count: {
          select: {
            chunks: true,
            chatSessions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  } catch (error) {
    console.error('Error getting files:', error);
    throw new Error('Failed to get files');
  }
}

export async function deleteFile(fileId: string): Promise<void> {
  try {
    const file = await prisma.file.findUnique({
      where: { id: fileId }
    });
    
    if (!file) {
      throw new Error('File not found');
    }
    
    // Delete file from filesystem
    try {
      await fs.unlink(file.path);
    } catch (fsError) {
      console.warn('Could not delete file from filesystem:', fsError);
    }
    
    // Delete from database (chunks and conversations will be deleted via cascade)
    await prisma.file.delete({
      where: { id: fileId }
    });
    
  } catch (error) {
    console.error('Error deleting file:', error);
    throw new Error('Failed to delete file');
  }
} 