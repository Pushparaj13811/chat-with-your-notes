import axios from 'axios';
import { getOrCreateDeviceId } from '../utils/deviceManager';
import type { ChatSession } from '../types';

const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  withCredentials: true, // Important for cookies
});

// Request interceptor to add device ID header
api.interceptors.request.use((config) => {
  const deviceId = getOrCreateDeviceId();
  if (deviceId) {
    config.headers['X-Device-ID'] = deviceId;
  }
  return config;
});

// Response interceptor to handle device authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && error.response?.data?.message?.includes('Device not authenticated')) {
      // Clear device ID and regenerate
      localStorage.removeItem('chat_notes_device_id');
      const newDeviceId = getOrCreateDeviceId();
      
      // Retry the request with new device ID
      if (error.config) {
        error.config.headers['X-Device-ID'] = newDeviceId;
        return api.request(error.config);
      }
    }
    return Promise.reject(error);
  }
);

// Generic API response type
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
  stack?: string;
}

// File upload
export const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000,
      validateStatus: (status) => status >= 200 && status < 300
    });
    
    return response.data;
  } catch (error) {
    // Standardize error response
    if (axios.isAxiosError(error)) {
      if (error.response) {
        throw new Error(
          error.response.data.message || 
          'File upload failed. Please try again.'
        );
      } else if (error.request) {
        throw new Error('No response from server. Please check your connection.');
      }
    }
    
    throw new Error('Error setting up file upload. Please try again.');
  }
};

// Chunked upload functions
export const initializeChunkedUpload = async (fileName: string, fileSize: number, mimeType: string) => {
  try {
    const response = await api.post('/upload-initialize', {
      fileName,
      fileSize,
      mimeType
    });
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        throw new Error(
          error.response.data.message || 
          'Failed to initialize upload. Please try again.'
        );
      } else if (error.request) {
        throw new Error('No response from server. Please check your connection.');
      }
    }
    
    throw new Error('Error initializing upload. Please try again.');
  }
};

export const uploadChunk = async (
  chunk: Blob,
  chunkIndex: number,
  totalChunks: number,
  fileName: string,
  fileSize: number,
  mimeType: string
) => {
  const formData = new FormData();
  formData.append('chunk', chunk);
  formData.append('chunkIndex', chunkIndex.toString());
  formData.append('totalChunks', totalChunks.toString());
  formData.append('fileName', fileName);
  formData.append('fileSize', fileSize.toString());
  formData.append('mimeType', mimeType);
  
  try {
    const response = await api.post('/upload-chunk', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // Longer timeout for chunk uploads
      validateStatus: (status) => status >= 200 && status < 300
    });
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        throw new Error(
          error.response.data.message || 
          'Chunk upload failed. Please try again.'
        );
      } else if (error.request) {
        throw new Error('No response from server. Please check your connection.');
      }
    }
    
    throw new Error('Error uploading chunk. Please try again.');
  }
};

export const getChunkProgress = async (chunkDirName: string) => {
  try {
    const response = await api.get(`/upload-progress/${chunkDirName}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        throw new Error(
          error.response.data.message || 
          'Failed to get upload progress.'
        );
      } else if (error.request) {
        throw new Error('No response from server. Please check your connection.');
      }
    }
    
    throw new Error('Error getting upload progress. Please try again.');
  }
};

export const cancelChunkedUpload = async (chunkDirName: string) => {
  try {
    const response = await api.delete(`/upload-cancel/${chunkDirName}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        throw new Error(
          error.response.data.message || 
          'Failed to cancel upload.'
        );
      } else if (error.request) {
        throw new Error('No response from server. Please check your connection.');
      }
    }
    
    throw new Error('Error canceling upload. Please try again.');
  }
};

// Get all files
export const getFiles = async () => {
  try {
    const response = await api.get('/files');
    console.log('Get files response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching files:', error);
    throw error;
  }
};

// Delete file
export const deleteFile = async (fileId: string) => {
  try {
    const response = await api.delete(`/files/${fileId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

// Ask question
export const askQuestion = async (
  question: string,
  fileIds: string[],
  chatSessionId: string | null
) => {
  const response = await api.post('/ask', {
    question,
    fileIds,
    chatSessionId,
  });
  return response.data;
};

// Get chat history
export const getChatHistory = async (chatSessionId: string) => {
  try {
    const response = await api.get(`/history/${chatSessionId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching chat history:', error);
    throw error;
  }
};

// Get all chat sessions
export const getAllChatSessions = async (): Promise<ApiResponse<ChatSession[]>> => {
  const response = await api.get('/sessions');
  return response.data;
};

export const deleteChatSession = async (chatSessionId: string): Promise<ApiResponse<null>> => {
  const response = await api.delete(`/sessions/${chatSessionId}`);
  return response.data;
};

// Fetch dynamic questions for a file
export const getFileQuestions = async (fileId: string): Promise<string[]> => {
  const response = await api.get(`/files/${fileId}/questions`);
  if (response.data && response.data.data && Array.isArray(response.data.data.questions)) {
    return response.data.data.questions;
  }
  return [];
};

// Memory management functions
export const summarizeSession = async (chatSessionId: string): Promise<ApiResponse<{ summary: string }>> => {
  const response = await api.post(`/sessions/${chatSessionId}/summarize`);
  return response.data;
};

export const clearSessionMemory = async (chatSessionId: string): Promise<ApiResponse<null>> => {
  const response = await api.delete(`/sessions/${chatSessionId}/memory`);
  return response.data;
};

export const getSessionMemoryStats = async (chatSessionId: string): Promise<ApiResponse<unknown>> => {
  const response = await api.get(`/sessions/${chatSessionId}/memory-stats`);
  return response.data;
};

export default api; 