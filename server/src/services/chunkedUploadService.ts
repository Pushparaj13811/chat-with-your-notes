import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import path from 'path';
import { ApiError } from '../utils/apiError';

export interface ChunkMetadata {
  fileName: string;
  chunkIndex: number;
  totalChunks: number;
  fileSize: number;
  mimeType: string;
  deviceId: string;
}

export interface ChunkInfo {
  chunkPath: string;
  chunkIndex: number;
  size: number;
}

// Temporary directory for storing chunks
const TEMP_DIR = process.env.TEMP_UPLOAD_DIR || './temp-uploads';
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

/**
 * Ensure temp directory exists
 */
async function ensureTempDir(): Promise<void> {
  try {
    await fs.access(TEMP_DIR);
  } catch {
    await fs.mkdir(TEMP_DIR, { recursive: true });
  }
}

/**
 * Generate unique chunk directory name for a file
 */
function generateChunkDirName(fileName: string, deviceId: string): string {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${sanitizedFileName}_${deviceId}_${timestamp}`;
}

/**
 * Get chunk directory path
 */
function getChunkDirPath(chunkDirName: string): string {
  return path.join(TEMP_DIR, chunkDirName);
}

/**
 * Get chunk file path
 */
function getChunkFilePath(chunkDirPath: string, chunkIndex: number): string {
  return path.join(chunkDirPath, `chunk_${chunkIndex}`);
}

/**
 * Store a chunk in the temporary directory
 */
export async function storeChunk(
  chunk: Buffer,
  metadata: ChunkMetadata
): Promise<{ chunkDirName: string; chunkPath: string }> {
  await ensureTempDir();
  
  const chunkDirName = generateChunkDirName(metadata.fileName, metadata.deviceId);
  const chunkDirPath = getChunkDirPath(chunkDirName);
  const chunkPath = getChunkFilePath(chunkDirPath, metadata.chunkIndex);
  
  // Create chunk directory if it doesn't exist
  try {
    await fs.access(chunkDirPath);
  } catch {
    await fs.mkdir(chunkDirPath, { recursive: true });
  }
  
  // Store chunk metadata
  const metadataPath = path.join(chunkDirPath, 'metadata.json');
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  
  // Write chunk to file
  await fs.writeFile(chunkPath, chunk);
  
  return { chunkDirName, chunkPath };
}

/**
 * Check if all chunks for a file have been uploaded
 */
export async function areAllChunksUploaded(chunkDirName: string): Promise<boolean> {
  const chunkDirPath = getChunkDirPath(chunkDirName);
  
  try {
    // Read metadata to get total chunks
    const metadataPath = path.join(chunkDirPath, 'metadata.json');
    const metadataContent = await fs.readFile(metadataPath, 'utf-8');
    const metadata: ChunkMetadata = JSON.parse(metadataContent);
    
    // Check if all chunks exist
    for (let i = 0; i < metadata.totalChunks; i++) {
      const chunkPath = getChunkFilePath(chunkDirPath, i);
      try {
        await fs.access(chunkPath);
      } catch {
        return false; // Chunk doesn't exist
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error checking chunks:', error);
    return false;
  }
}

/**
 * Get metadata for a chunked upload
 */
export async function getChunkMetadata(chunkDirName: string): Promise<ChunkMetadata | null> {
  const chunkDirPath = getChunkDirPath(chunkDirName);
  const metadataPath = path.join(chunkDirPath, 'metadata.json');
  
  try {
    const metadataContent = await fs.readFile(metadataPath, 'utf-8');
    return JSON.parse(metadataContent);
  } catch (error) {
    console.error('Error reading chunk metadata:', error);
    return null;
  }
}

/**
 * Merge all chunks into a single file
 */
export async function mergeChunks(chunkDirName: string, finalPath: string): Promise<void> {
  const chunkDirPath = getChunkDirPath(chunkDirName);
  const metadata = await getChunkMetadata(chunkDirName);
  
  if (!metadata) {
    throw new ApiError(400, 'Invalid chunk metadata');
  }
  
  // Ensure final directory exists
  const finalDir = path.dirname(finalPath);
  try {
    await fs.access(finalDir);
  } catch {
    await fs.mkdir(finalDir, { recursive: true });
  }
  
  // Create write stream for final file
  const writeStream = createWriteStream(finalPath);
  
  try {
    // Merge chunks in order
    for (let i = 0; i < metadata.totalChunks; i++) {
      const chunkPath = getChunkFilePath(chunkDirPath, i);
      const chunkData = await fs.readFile(chunkPath);
      writeStream.write(chunkData);
    }
  } finally {
    writeStream.end();
  }
  
  // Wait for write stream to finish
  await new Promise<void>((resolve, reject) => {
    writeStream.on('finish', () => resolve());
    writeStream.on('error', reject);
  });
}

/**
 * Clean up temporary chunk files
 */
export async function cleanupChunks(chunkDirName: string): Promise<void> {
  const chunkDirPath = getChunkDirPath(chunkDirName);
  
  try {
    await fs.rm(chunkDirPath, { recursive: true, force: true });
    console.log(`Cleaned up chunks for: ${chunkDirName}`);
  } catch (error) {
    console.error('Error cleaning up chunks:', error);
    // Don't throw error as cleanup failure shouldn't break the upload
  }
}

/**
 * Get upload progress for a chunked upload
 */
export async function getUploadProgress(chunkDirName: string): Promise<{ uploaded: number; total: number; percentage: number }> {
  const chunkDirPath = getChunkDirPath(chunkDirName);
  const metadata = await getChunkMetadata(chunkDirName);
  
  if (!metadata) {
    return { uploaded: 0, total: 0, percentage: 0 };
  }
  
  let uploadedChunks = 0;
  
  // Count existing chunks
  for (let i = 0; i < metadata.totalChunks; i++) {
    const chunkPath = getChunkFilePath(chunkDirPath, i);
    try {
      await fs.access(chunkPath);
      uploadedChunks++;
    } catch {
      // Chunk doesn't exist
    }
  }
  
  const percentage = Math.round((uploadedChunks / metadata.totalChunks) * 100);
  
  return {
    uploaded: uploadedChunks,
    total: metadata.totalChunks,
    percentage
  };
}

/**
 * Clean up old chunk directories (older than 24 hours)
 */
export async function cleanupOldChunks(): Promise<void> {
  try {
    const files = await fs.readdir(TEMP_DIR);
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const file of files) {
      const filePath = path.join(TEMP_DIR, file);
      const stats = await fs.stat(filePath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        await fs.rm(filePath, { recursive: true, force: true });
        console.log(`Cleaned up old chunk directory: ${file}`);
      }
    }
  } catch (error) {
    console.error('Error cleaning up old chunks:', error);
  }
}

/**
 * Calculate optimal chunk size based on file size
 */
export function calculateChunkSize(fileSize: number): number {
  // For files > 100MB, use 10MB chunks
  if (fileSize > 100 * 1024 * 1024) {
    return 10 * 1024 * 1024;
  }
  // For files > 50MB, use 5MB chunks
  if (fileSize > 50 * 1024 * 1024) {
    return 5 * 1024 * 1024;
  }
  // For smaller files, use 2MB chunks
  return 2 * 1024 * 1024;
}

/**
 * Calculate total number of chunks needed
 */
export function calculateTotalChunks(fileSize: number, chunkSize: number): number {
  return Math.ceil(fileSize / chunkSize);
} 