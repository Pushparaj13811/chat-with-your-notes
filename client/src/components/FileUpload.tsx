// FileUpload.tsx

import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
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
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    const ALLOWED_TYPES = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

    if (file.size > MAX_FILE_SIZE) {
      setUploadState({ isUploading: false, progress: 0, error: 'File size exceeds 10MB limit', success: false });
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadState({ isUploading: false, progress: 0, error: 'Invalid file type. Only PDF, TXT, and DOCX files are allowed.', success: false });
      return;
    }

    setUploadState({ isUploading: true, progress: 0, error: null, success: false });

    try {
      const response = await uploadFile(file);

      if (response.success) {
        for (let i = 0; i <= 100; i += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setUploadState(prev => ({ ...prev, progress: i }));
        }

        setUploadState({ isUploading: false, progress: 100, error: null, success: true });
        onFileUploaded(response.data);
        setTimeout(resetUploadState, 2500);
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
    if (files.length > 0) handleFileUpload(files[0]);
  }, [handleFileUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) handleFileUpload(files[0]);
  }, [handleFileUpload]);

  const triggerFileInput = () => fileInputRef.current?.click();
  const clearError = () => setUploadState(prev => ({ ...prev, error: null }));

  return (
    <div className="rounded-2xl border border-borderLight p-6 shadow-xl bg-white/80 backdrop-blur-md transition-all duration-300 hover:shadow-2xl">
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
            <button onClick={clearError} className="text-red-500 hover:text-red-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer
          transition-all duration-300 ease-in-out group bg-gradient-to-br
          ${isDragOver ? 'from-primary-50 to-white border-primary-200 scale-[1.02]' : 'from-white to-white hover:border-primary-200'}
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
              <p className="text-gray-600 font-medium text-sm">Uploading file...</p>
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
        <p className="text-xs text-gray-400">Only PDF, TXT, or DOCX files under 10MB</p>

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
            <p className="text-xs text-gray-400 text-center">Uploading... {uploadState.progress}%</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
