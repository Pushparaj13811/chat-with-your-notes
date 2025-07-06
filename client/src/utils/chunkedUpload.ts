import { 
  initializeChunkedUpload, 
  uploadChunk, 
  getChunkProgress, 
  cancelChunkedUpload 
} from '../services/api';
import type { 
  ChunkedUploadInitResponse, 
  ChunkedUploadResponse, 
  ChunkedUploadState,
  File as FileType 
} from '../types';

/**
 * Split a file into chunks
 */
export function splitFileIntoChunks(file: File, chunkSize: number): Blob[] {
  const chunks: Blob[] = [];
  let start = 0;
  
  while (start < file.size) {
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);
    chunks.push(chunk);
    start = end;
  }
  
  return chunks;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Upload a file using chunked upload
 */
export async function uploadFileInChunks(
  file: File,
  onProgress?: (state: ChunkedUploadState) => void,
  onError?: (error: string) => void,
  onSuccess?: (file: FileType) => void
): Promise<void> {
  const ALLOWED_TYPES = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

  // Validate file
  if (!ALLOWED_TYPES.includes(file.type)) {
    const error = 'Invalid file type. Only PDF, TXT, and DOCX files are allowed.';
    onError?.(error);
    throw new Error(error);
  }

  if (file.size > MAX_FILE_SIZE) {
    const error = `File size exceeds ${formatFileSize(MAX_FILE_SIZE)} limit.`;
    onError?.(error);
    throw new Error(error);
  }

  // Initialize upload state
  const initialState: ChunkedUploadState = {
    isUploading: true,
    progress: 0,
    currentChunk: 0,
    totalChunks: 0,
    chunkDirName: null,
    error: null,
    success: false
  };

  onProgress?.(initialState);

  try {
    // Initialize chunked upload
    const initResponse = await initializeChunkedUpload(
      file.name,
      file.size,
      file.type
    );

    const { chunkSize, totalChunks } = initResponse.data as ChunkedUploadInitResponse;
    
    // Split file into chunks
    const chunks = splitFileIntoChunks(file, chunkSize);
    
    if (chunks.length !== totalChunks) {
      throw new Error('Chunk calculation mismatch');
    }

    // Update state with chunk info
    const chunkState: ChunkedUploadState = {
      ...initialState,
      totalChunks,
      currentChunk: 0
    };
    onProgress?.(chunkState);

    // Upload chunks sequentially
    let chunkDirName: string | null = null;
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      try {
        const response = await uploadChunk(
          chunk,
          i,
          totalChunks,
          file.name,
          file.size,
          file.type
        );

        const uploadResponse = response.data as ChunkedUploadResponse;
        chunkDirName = uploadResponse.chunkDirName;

        // Update progress
        const progressState: ChunkedUploadState = {
          ...chunkState,
          currentChunk: i + 1,
          progress: uploadResponse.progress.percentage,
          chunkDirName
        };
        onProgress?.(progressState);

        // Check if upload is complete
        if (uploadResponse.completed && uploadResponse.fileId) {
          const successState: ChunkedUploadState = {
            ...progressState,
            isUploading: false,
            progress: 100,
            success: true
          };
          onProgress?.(successState);

          // Call success callback with file info
          if (onSuccess && uploadResponse.fileId) {
            const uploadedFile: FileType = {
              id: uploadResponse.fileId,
              filename: uploadResponse.filename || file.name,
              originalName: file.name,
              mimeType: file.type,
              size: uploadResponse.size || file.size,
              path: '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              _count: {
                chunks: 0,
                conversations: 0
              }
            };
            onSuccess(uploadedFile);
          }
          return;
        }

        // Add small delay between chunks to prevent overwhelming the server
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

      } catch (error) {
        // Try to cancel upload on error
        if (chunkDirName) {
          try {
            await cancelChunkedUpload(chunkDirName);
          } catch (cancelError) {
            console.error('Failed to cancel upload:', cancelError);
          }
        }

        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        const errorState: ChunkedUploadState = {
          ...chunkState,
          isUploading: false,
          error: errorMessage,
          success: false
        };
        onProgress?.(errorState);
        onError?.(errorMessage);
        throw error;
      }
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
    const errorState: ChunkedUploadState = {
      ...initialState,
      isUploading: false,
      error: errorMessage,
      success: false
    };
    onProgress?.(errorState);
    onError?.(errorMessage);
    throw error;
  }
}

/**
 * Retry a failed chunk upload
 */
export async function retryChunkUpload(
  chunkDirName: string,
  onProgress?: (state: ChunkedUploadState) => void
): Promise<ChunkedUploadResponse> {
  try {
    const response = await getChunkProgress(chunkDirName);
    const progressData = response.data;
    
    if (onProgress) {
      const state: ChunkedUploadState = {
        isUploading: true,
        progress: progressData.progress.percentage,
        currentChunk: progressData.progress.uploaded,
        totalChunks: progressData.progress.total,
        chunkDirName,
        error: null,
        success: false
      };
      onProgress(state);
    }
    
    return progressData;
  } catch {
    throw new Error('Failed to retry upload');
  }
}

/**
 * Cancel an ongoing chunked upload
 */
export async function cancelUpload(chunkDirName: string): Promise<void> {
  try {
    await cancelChunkedUpload(chunkDirName);
  } catch (error) {
    console.error('Failed to cancel upload:', error);
    throw error;
  }
} 