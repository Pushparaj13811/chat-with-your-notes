import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, X, Pause, Play, RotateCcw } from 'lucide-react';
import { uploadFileInChunks, formatFileSize, cancelUpload } from '../utils/chunkedUpload';
import type { File as FileType, ChunkedUploadState } from '../types';

interface ChunkedFileUploadProps {
  onFileUploaded: (file: FileType) => void;
  insideModal?: boolean;
}

const ChunkedFileUpload: React.FC<ChunkedFileUploadProps> = ({ onFileUploaded, insideModal = false }) => {
  const [uploadState, setUploadState] = useState<ChunkedUploadState>({
    isUploading: false,
    progress: 0,
    currentChunk: 0,
    totalChunks: 0,
    chunkDirName: null,
    error: null,
    success: false,
  });
  const [isDragOver, setIsDragOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetUploadState = useCallback(() => {
    setUploadState({
      isUploading: false,
      progress: 0,
      currentChunk: 0,
      totalChunks: 0,
      chunkDirName: null,
      error: null,
      success: false,
    });
    setIsPaused(false);
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
    const ALLOWED_TYPES = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

    if (file.size > MAX_FILE_SIZE) {
      setUploadState(prev => ({ 
        ...prev, 
        error: `File size exceeds ${formatFileSize(MAX_FILE_SIZE)} limit`, 
        success: false 
      }));
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadState(prev => ({ 
        ...prev, 
        error: 'Invalid file type. Only PDF, TXT, and DOCX files are allowed.', 
        success: false 
      }));
      return;
    }

    try {
      await uploadFileInChunks(
        file,
        (state) => setUploadState(state),
        (error) => setUploadState(prev => ({ ...prev, error, success: false })),
        (file) => {
          onFileUploaded(file);
          setTimeout(resetUploadState, 2500);
        }
      );
    } catch (error) {
      // Error is handled by the onError callback
      console.error('Upload error:', error);
    }
  }, [onFileUploaded, resetUploadState]);

  const handlePauseResume = useCallback(async () => {
    if (isPaused) {
      // Resume upload (for now, just toggle pause state)
      setIsPaused(false);
    } else {
      // Pause upload
      setIsPaused(true);
    }
  }, [isPaused]);

  const handleCancel = useCallback(async () => {
    if (uploadState.chunkDirName) {
      try {
        await cancelUpload(uploadState.chunkDirName);
        resetUploadState();
      } catch (error) {
        console.error('Failed to cancel upload:', error);
      }
    } else {
      resetUploadState();
    }
  }, [uploadState.chunkDirName, resetUploadState]);

  const handleRetry = useCallback(() => {
    setUploadState(prev => ({ ...prev, error: null }));
  }, []);

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
    if (files.length > 0) handleFileUpload(files[0]);
  }, [handleFileUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) handleFileUpload(files[0]);
  }, [handleFileUpload]);

  const triggerFileInput = () => fileInputRef.current?.click();
  const clearError = () => setUploadState(prev => ({ ...prev, error: null }));

  return (
    <div className={insideModal
      ? ''
      : 'rounded-2xl border border-borderLight p-6 shadow-xl backdrop-blur-md transition-all duration-300 hover:shadow-2xl'}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
          <FileText className="h-6 w-6 text-primary-600" />
          Upload Documents
        </h2>
      </div>

      {/* Error Notification */}
      {uploadState.error && (
        <div className="mb-4 animate-shake">
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <AlertCircle className="h-5 w-5" />
              {uploadState.error}
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleRetry}
                className="text-red-500 hover:text-red-700 p-1"
                title="Retry"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button onClick={clearError} className="text-red-500 hover:text-red-700 p-1">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer
          transition-all duration-300 ease-in-out group bg-gradient-to-br
          ${isDragOver ? 'from-primary-50 to-primary-100 border-primary-200 scale-[1.02]' : 'from-primary-50 to-primary-100 hover:border-primary-200'}
          ${uploadState.isUploading ? 'opacity-60' : 'opacity-100'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        {/* Loading Overlay */}
        {uploadState.isUploading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10 rounded-xl">
            <div className="text-center">
              <Loader2 className="h-10 w-10 text-primary-600 animate-spin mx-auto mb-2" />
              <p className="text-gray-600 font-medium text-sm">
                Uploading chunk {uploadState.currentChunk} of {uploadState.totalChunks}...
              </p>
              <p className="text-gray-500 text-xs mt-1">{uploadState.progress}% complete</p>
            </div>
          </div>
        )}

        {/* Success Overlay */}
        {uploadState.success && (
          <div className="absolute inset-0 bg-green-50/90 flex items-center justify-center z-10 rounded-xl">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2 animate-bounce" />
              <p className="text-green-700 text-base font-semibold">Upload Successful!</p>
            </div>
          </div>
        )}

        <Upload className="h-14 w-14 text-gray-300 mx-auto mb-4 group-hover:text-primary-600 transition-colors" />
        <p className="text-lg font-medium text-gray-700 mb-1">Drag & Drop files here</p>
        <p className="text-sm text-gray-400 mb-2">
          or{' '}
          <span
            onClick={triggerFileInput}
            className="text-primary-600 font-semibold underline cursor-pointer hover:text-primary-700"
          >
            browse
          </span>{' '}
          from your device
        </p>
        <p className="text-xs text-gray-400">PDF, TXT, or DOCX files up to 100MB</p>

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
          <div className="mt-5">
            <div className="w-full bg-gray-100 rounded-full h-2 mb-1 overflow-hidden">
              <div
                className="bg-primary-600 h-2 transition-all duration-500 ease-in-out"
                style={{ width: `${uploadState.progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Chunk {uploadState.currentChunk} of {uploadState.totalChunks}</span>
              <span>{uploadState.progress}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Upload Controls */}
      {uploadState.isUploading && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            onClick={handlePauseResume}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {isPaused ? (
              <>
                <Play className="h-4 w-4" />
                Resume
              </>
            ) : (
              <>
                <Pause className="h-4 w-4" />
                Pause
              </>
            )}
          </button>
          
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default ChunkedFileUpload; 