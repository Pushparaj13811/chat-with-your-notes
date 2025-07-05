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
      className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-custom-lg border border-borderLight w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative p-6">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
          <FileUpload onFileUploaded={onFileUploaded} />
        </div>
      </div>
    </div>
  );
};

export default UploadModal; 