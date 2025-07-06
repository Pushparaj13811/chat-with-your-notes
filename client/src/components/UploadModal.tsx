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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-all animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative bg-primary-50 rounded-2xl shadow-2xl border border-borderLight w-full max-w-md mx-auto animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: '0 8px 40px 0 rgba(0,0,0,0.18)' }}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors rounded-full p-1.5 focus:outline-none focus:ring-2 focus:ring-primary-400"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="p-8 pt-4">
          <FileUpload onFileUploaded={onFileUploaded} insideModal />
        </div>
      </div>
    </div>
  );
};

export default UploadModal; 