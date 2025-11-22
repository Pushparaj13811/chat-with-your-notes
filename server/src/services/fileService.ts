import { prisma } from '../config/database';
import { generateEmbedding } from '../config/gemini';
import { extractTextFromFile, splitTextIntoChunks } from '../utils/textProcessor';
import fs from 'fs/promises';
import { textModel } from '../config/gemini';
import cloudinaryService from './cloudinary';

export interface UploadedFile {
  originalname: string;
  filename: string;
  mimetype: string;
  size: number;
  cloudinaryUrl?: string;
  cloudinaryPublicId?: string;
  path?: string;
  userId?: string;
  deviceId?: string;
}

export async function processAndStoreFile(uploadedFile: UploadedFile): Promise<string> {
  try {
    console.log(`📄 Processing file: ${uploadedFile.originalname}`);
    console.log(`   Cloudinary URL: ${uploadedFile.cloudinaryUrl}`);
    console.log(`   MIME type: ${uploadedFile.mimetype}`);

    // Extract text from file - download from Cloudinary if needed
    let text: string;
    if (uploadedFile.cloudinaryUrl) {
      console.log(`📥 Downloading file from Cloudinary...`);
      // For Cloudinary files, we need to download and process them
      const response = await fetch(uploadedFile.cloudinaryUrl);

      if (!response.ok) {
        throw new Error(`Failed to download file from Cloudinary: ${response.status} ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      console.log(`   Downloaded ${buffer.byteLength} bytes`);

      // Create a proper temp file path with extension
      const ext = uploadedFile.originalname.split('.').pop() || 'tmp';
      const tempDir = process.env.TEMP_UPLOAD_DIR || './temp-uploads';
      const tempPath = `${tempDir}/temp_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

      console.log(`   Temp file: ${tempPath}`);

      // Ensure temp directory exists
      await fs.mkdir(tempDir, { recursive: true }).catch(() => {});

      await fs.writeFile(tempPath, Buffer.from(buffer));
      console.log(`   Extracting text...`);
      text = await extractTextFromFile(tempPath, uploadedFile.mimetype);
      console.log(`   Extracted ${text.length} characters`);
      // Clean up temp file
      await fs.unlink(tempPath).catch(() => {});
    } else if (uploadedFile.path) {
      // For local files
      console.log(`📂 Processing local file...`);
      text = await extractTextFromFile(uploadedFile.path, uploadedFile.mimetype);
    } else {
      throw new Error('No file path or Cloudinary URL provided');
    }
    // Generate 6 questions from the file content (only at upload time)
    console.log(`🤔 Generating questions...`);
    let questions: string[] = [];
    if (text && text.trim().length > 100) {
      const prompt = `You are an expert reader. Analyze the following document and generate 6 thought-provoking, insightful, and contextually relevant questions that a user could ask based on the document's content. Each question should reflect the actual structure, concepts, and ideas presented in the document, and must be no more than 80 characters long. Avoid vague or overly broad questions. Output only the 6 questions as a numbered Markdown list.
      ---
      Document Content:
      ${text.substring(0, 8000)}
      ---`;

      try {
        // Use direct fetch API for question generation (Bun compatibility)
        // Note: Using v1beta API with gemini-2.0-flash-exp (1.5 models are retired)
        const apiKey = process.env.GEMINI_API_KEY || '';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }]
          })
        });

        if (response.ok) {
          const data = await response.json();
          const questionsText = data.candidates[0].content.parts[0].text;
          questions = questionsText
            .split(/\n+/)
            .map((line: string) => line.replace(/^\d+\.|^- /, '').trim())
            .filter((q: string) => q.length > 0)
            .slice(0, 6);
          console.log(`   Generated ${questions.length} questions`);
        } else {
          console.log(`   Question generation failed (${response.status}), continuing without questions`);
          questions = [];
        }
      } catch (err) {
        console.log(`   Question generation failed, continuing without questions`);
        questions = [];
      }
    } else {
      console.log(`   Text too short, skipping question generation`);
    }
    // Split text into chunks
    console.log(`✂️ Splitting text into chunks...`);
    const chunks = await splitTextIntoChunks(text);
    console.log(`   Created ${chunks.length} chunks`);
    // Create file record in database (store questions and device ID)
    console.log(`💾 Creating file record in database...`);
    const file = await prisma.file.create({
      data: {
        filename: uploadedFile.filename,
        originalName: uploadedFile.originalname,
        mimeType: uploadedFile.mimetype,
        size: uploadedFile.size,
        path: uploadedFile.cloudinaryUrl || uploadedFile.path || '',
        cloudinaryUrl: uploadedFile.cloudinaryUrl,
        cloudinaryPublicId: uploadedFile.cloudinaryPublicId,
        userId: uploadedFile.userId,
        deviceId: uploadedFile.deviceId,
        questions: questions.length > 0 ? questions : undefined,
      }
    });
    console.log(`   File record created with ID: ${file.id}`);
    // Process chunks and generate embeddings
    console.log(`🧠 Generating embeddings for ${chunks.length} chunks...`);
    const chunkPromises = chunks.map(async (chunk, index) => {
      try {
        console.log(`   Processing chunk ${index + 1}/${chunks.length}...`);
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
      } catch (error) {
        console.error(`   ❌ Failed to process chunk ${index + 1}:`, error);
        throw error;
      }
    });
    await Promise.all(chunkPromises);
    console.log(`✅ File processed successfully: ${uploadedFile.originalname} (${chunks.length} chunks)`);
    return file.id;
  } catch (error) {
    console.error('Error processing file:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
      console.error('Error message:', error.message);
    }
    throw error; // Re-throw the original error instead of a generic one
  }
}

export async function findSimilarChunks(query: string, limit: number = 5, fileIds: string[] = [], deviceId?: string): Promise<any[]> {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    // Build where clause for chunks
    const whereClause: any = {
      fileId: {
        in: fileIds,
      },
    };

    // If device ID is provided, ensure files belong to the device
    if (deviceId && fileIds.length > 0) {
      const deviceFiles = await prisma.file.findMany({
        where: {
          id: { in: fileIds },
          deviceId: deviceId
        },
        select: { id: true }
      });
      
      const deviceFileIds = deviceFiles.map(f => f.id);
      whereClause.fileId.in = deviceFileIds;
    }

    // Get chunks with their embeddings
    const chunks = await prisma.chunk.findMany({
      where: whereClause,
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

export async function getAllFiles(userId?: string, deviceId?: string): Promise<any[]> {
  try {
    const whereClause: any = {
      OR: []
    };
    
    if (userId) {
      whereClause.OR.push({ userId: userId });
    }
    
    if (deviceId) {
      whereClause.OR.push({ deviceId: deviceId });
    }
    
    if (whereClause.OR.length === 0) {
      throw new Error('Either userId or deviceId must be provided');
    }
    
    return await prisma.file.findMany({
      where: whereClause,
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

export async function deleteFile(fileId: string, userId?: string, deviceId?: string): Promise<void> {
  try {
    const whereClause: any = {
      id: fileId,
      OR: []
    };
    
    if (userId) {
      whereClause.OR.push({ userId: userId });
    }
    
    if (deviceId) {
      whereClause.OR.push({ deviceId: deviceId });
    }
    
    if (whereClause.OR.length === 0) {
      throw new Error('Either userId or deviceId must be provided');
    }
    
    const file = await prisma.file.findFirst({
      where: whereClause
    });

    if (!file) {
      throw new Error('File not found or access denied');
    }

    // Delete file from Cloudinary if it exists there
    if (file.cloudinaryPublicId) {
      try {
        await cloudinaryService.delete(file.cloudinaryPublicId, 'raw');
      } catch (cloudinaryError) {
        console.warn('Could not delete file from Cloudinary:', cloudinaryError);
      }
    } else if (file.path) {
      // Delete file from filesystem for backward compatibility
      try {
        await fs.unlink(file.path);
      } catch (fsError) {
        console.warn('Could not delete file from filesystem:', fsError);
      }
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