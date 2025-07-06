import React from 'react';
import { X } from 'lucide-react';
import FileUpload from './FileUpload';
import type { File as FileType } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileUploaded: (file: FileType) => void;
}

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onFileUploaded }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-custom-lg border border-borderLight w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative p-8">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <FileUpload onFileUploaded={onFileUploaded} />
        </div>
      </div>
    </div>
  );
};

export default UploadModal; 