import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import fs from 'fs/promises';
import { prisma } from '../config/database';
import { generateEmbedding } from '../config/gemini';

export interface TextChunk {
  content: string;
  chunkIndex: number;
  startChar: number;
  endChar: number;
}

export async function extractTextFromFile(filePath: string, mimeType: string): Promise<string> {
  try {
    console.log(`     Reading file from: ${filePath}`);
    const buffer = await fs.readFile(filePath);
    console.log(`     Buffer size: ${buffer.length} bytes`);
    console.log(`     Processing MIME type: ${mimeType}`);

    switch (mimeType) {
      case 'application/pdf':
        console.log(`     Parsing PDF...`);
        const pdfData = await pdf(buffer);
        console.log(`     PDF parsed, text length: ${pdfData.text.length}`);
        return pdfData.text;

      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        console.log(`     Parsing DOCX...`);
        const docxResult = await mammoth.extractRawText({ buffer });
        console.log(`     DOCX parsed, text length: ${docxResult.value.length}`);
        return docxResult.value;

      case 'text/plain':
        console.log(`     Parsing plain text...`);
        const text = buffer.toString('utf-8');
        console.log(`     Plain text length: ${text.length}`);
        return text;

      default:
        throw new Error(`Unsupported file type: ${mimeType}`);
    }
  } catch (error) {
    console.error('❌ Error extracting text from file:', error);
    if (error instanceof Error) {
      console.error('     Error message:', error.message);
      console.error('     Error stack:', error.stack);
    }
    throw error; // Re-throw the original error
  }
}

export async function splitTextIntoChunks(text: string): Promise<TextChunk[]> {
  try {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      separators: ['\n\n', '\n', ' ', '']
    });

    const chunks = await splitter.splitText(text);
    
    return chunks.map((chunk: string, index: number) => {
      const startChar = text.indexOf(chunk);
      const endChar = startChar + chunk.length;
      
      return {
        content: chunk,
        chunkIndex: index,
        startChar,
        endChar
      };
    });
  } catch (error) {
    console.error('Error splitting text into chunks:', error);
    throw new Error('Failed to split text into chunks');
  }
}

export async function findSimilarChunks(
  question: string,
  topK: number,
  fileIds: string[],
  deviceId: string
): Promise<any[]> {
  const questionEmbedding = await generateEmbedding(question);

  const allChunks = await prisma.chunk.findMany({
    where: {
      fileId: {
        in: fileIds,
      },
    },
  });

  const chunksWithSimilarity = allChunks.map(chunk => {
    const similarity = calculateCosineSimilarity(questionEmbedding, chunk.embedding);
    return { ...chunk, similarity };
  });

  chunksWithSimilarity.sort((a, b) => b.similarity - a.similarity);

  return chunksWithSimilarity.slice(0, topK);
}

export function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
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