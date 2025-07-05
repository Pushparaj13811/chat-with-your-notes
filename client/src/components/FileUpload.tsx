import React, { useState, useCallback, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  X 
} from 'lucide-react';
import { uploadFile } from '../services/api';
import type { File as FileType } from '../types';

interface FileUploadProps {
  onFileUploaded: (file: FileType) => void;
}

interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  success: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUploaded }) => {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    success: false,
  });
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetUploadState = useCallback(() => {
    setUploadState({
      isUploading: false,
      progress: 0,
      error: null,
      success: false,
    });
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    // Validate file
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_TYPES = [
      'application/pdf', 
      'text/plain', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (file.size > MAX_FILE_SIZE) {
      setUploadState({
        isUploading: false,
        progress: 0,
        error: 'File size exceeds 10MB limit',
        success: false,
      });
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadState({
        isUploading: false,
        progress: 0,
        error: 'Invalid file type. Only PDF, TXT, and DOCX files are allowed.',
        success: false,
      });
      return;
    }

    // Start upload
    setUploadState({
      isUploading: true,
      progress: 0,
      error: null,
      success: false,
    });

    try {
      const response = await uploadFile(file);
      
      if (response.success) {
        // Simulate progress
        for (let i = 0; i <= 100; i += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setUploadState(prev => ({
            ...prev,
            progress: i
          }));
        }

        setUploadState({
          isUploading: false,
          progress: 100,
          error: null,
          success: true,
        });

        // Optional: Trigger file list refresh or selection
        onFileUploaded(response.data);

        // Auto-reset after success
        setTimeout(resetUploadState, 2000);
      }
    } catch (error) {
      setUploadState({
        isUploading: false,
        progress: 0,
        error: error instanceof Error ? error.message : 'Upload failed',
        success: false,
      });
    }
  }, [onFileUploaded, resetUploadState]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const clearError = () => {
    setUploadState(prev => ({ ...prev, error: null }));
  };

  return (
    <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200 transition-all duration-300 hover:shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <FileText className="h-7 w-7 text-primary-600" />
          Upload Documents
        </h2>
      </div>

      {/* Error Notification */}
      {uploadState.error && (
        <div className="mb-4 animate-shake">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-red-500" />
              <span className="text-red-700 font-medium">{uploadState.error}</span>
            </div>
            <button 
              onClick={clearError} 
              className="text-gray-500 hover:text-red-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div 
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center 
          transition-all duration-300 group
          ${isDragOver 
            ? 'border-primary-500 bg-primary-50 scale-[1.02]' 
            : 'border-gray-300 hover:border-primary-400'
          }
          ${uploadState.isUploading ? 'opacity-70' : 'opacity-100'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Loading Overlay */}
        {uploadState.isUploading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
            <div className="text-center">
              <Loader2 className="h-12 w-12 text-primary-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-700 font-medium">Processing file...</p>
            </div>
          </div>
        )}

        {/* Success Overlay */}
        {uploadState.success && (
          <div className="absolute inset-0 bg-green-50/90 flex items-center justify-center z-10 rounded-lg">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4 animate-bounce" />
              <p className="text-green-700 text-lg font-bold">File Uploaded Successfully!</p>
            </div>
          </div>
        )}

        <Upload className="h-16 w-16 text-gray-400 mx-auto mb-6 group-hover:text-primary-600 transition-colors" />
        
        <div className="space-y-3">
          <p className="text-xl font-semibold text-gray-900 mb-2">
            Drag and drop your file here
          </p>
          
          <p className="text-sm text-gray-500 mb-4">
            or{' '}
            <button 
              onClick={triggerFileInput}
              className="text-primary-600 hover:text-primary-700 font-semibold underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
            >
              browse files
            </button>
          </p>
          
          <p className="text-xs text-gray-400">
            Supports PDF, TXT, and DOCX files up to 10MB
          </p>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.txt,.docx"
          onChange={handleFileSelect}
          disabled={uploadState.isUploading}
        />

        {/* Progress Bar */}
        {uploadState.isUploading && (
          <div className="mt-6">
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
              <div
                className="bg-primary-600 h-2.5 rounded-full transition-all duration-500 ease-in-out"
                style={{ width: `${uploadState.progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 text-center">
              Uploading... {uploadState.progress}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload; 