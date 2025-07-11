export interface File {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    chunks: number;
    conversations: number;
  };
}

export interface Chunk {
  id: string;
  content: string;
  chunkIndex: number;
  startChar: number;
  endChar: number;
  fileId: string;
}

export interface Conversation {
  id:string;
  question: string;
  answer: string;
  createdAt: string;
  fileId?: string;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  createdAt: string;
  context?: string[];
  isError?: boolean;
}

// New type for raw messages received from the API (before transformation)
export type RawApiChatMessage = Omit<ChatMessage, 'type' | 'timestamp'> & {
  role: 'user' | 'assistant';
};

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  files: {
    id: string;
    originalName: string;
  }[];
}

export interface ChatResponse {
  answer: string;
  context: string[];
  fileId?: string;
}

export interface UploadResponse {
  fileId: string;
  filename: string;
  size: number;
}

export interface ChunkedUploadInitResponse {
  chunkSize: number;
  totalChunks: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface ChunkedUploadProgress {
  uploaded: number;
  total: number;
  percentage: number;
}

export interface ChunkedUploadResponse {
  chunkDirName: string;
  progress: ChunkedUploadProgress;
  completed: boolean;
  fileId?: string;
  filename?: string;
  size?: number;
}

export interface ChunkedUploadState {
  isUploading: boolean;
  progress: number;
  currentChunk: number;
  totalChunks: number;
  chunkDirName: string | null;
  error: string | null;
  success: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
} 