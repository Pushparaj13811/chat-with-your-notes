import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Trash2, Loader2, ServerCrash, Inbox, CheckSquare, Square } from 'lucide-react';
import { getFiles, deleteFile } from '../services/api';
import type { File as FileType } from '../types';

interface FileListProps {
    selectedFileIds: string[];
    onSelectionChange: (fileIds: string[]) => void;
    onFileUploaded: () => void;
}

const FileList: React.FC<FileListProps> = ({ selectedFileIds, onSelectionChange, onFileUploaded }) => {
    const [files, setFiles] = useState<FileType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchFiles = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getFiles();
            if (response.success) {
                setFiles(response.data);
            } else {
                setError(response.message || 'Failed to load files');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFiles();
    }, [fetchFiles, onFileUploaded]);
    
    const handleFileSelect = (file: FileType) => {
        const isSelected = selectedFileIds.includes(file.id);
        let newSelectionIds: string[];

        if (isSelected) {
            newSelectionIds = selectedFileIds.filter(id => id !== file.id);
        } else {
            newSelectionIds = [...selectedFileIds, file.id];
        }
        onSelectionChange(newSelectionIds);
    };

    const handleDeleteFile = async (e: React.MouseEvent, fileId: string) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this file and all its conversations? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await deleteFile(fileId);
            if (response.success) {
                setFiles(prev => prev.filter(file => file.id !== fileId));
                // onFileDeleted(); // Removed: No longer needed here
            } else {
                alert('Failed to delete file.');
            }
        } catch {
            alert('An error occurred while deleting the file.');
        }
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="text-center py-6">
                    <Loader2 className="h-7 w-7 text-primary-600 animate-spin mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Loading documents...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="text-center py-6 px-3 bg-red-50 rounded-lg border border-red-200">
                    <ServerCrash className="h-7 w-7 text-red-500 mx-auto mb-2" />
                    <p className="font-semibold text-red-700 text-sm">Failed to load documents</p>
                    <p className="text-xs text-red-600 mb-3">{error}</p>
                    <button onClick={fetchFiles} className="text-xs text-primary-600 font-semibold hover:underline">
                        Try again
                    </button>
                </div>
            );
        }

        if (files.length === 0) {
            return (
                <div className="text-center py-6 px-3 border-2 border-dashed border-gray-200 rounded-lg">
                    <Inbox className="h-7 w-7 text-gray-400 mx-auto mb-2" />
                    <p className="font-semibold text-gray-700 text-sm">No documents yet</p>
                    <p className="text-xs text-gray-500">Upload a file to get started.</p>
                </div>
            );
        }

        return (
            <div className="space-y-2">
                {files.map((file) => {
                    const isSelected = selectedFileIds.includes(file.id);
                    return (
                        <div
                            key={file.id}
                            className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all duration-200 group 
                                ${isSelected ? 'bg-primary-50 border border-primary-300 text-primary-800 shadow-custom-sm' : 'bg-white border border-borderLight hover:bg-gray-50 hover:border-gray-200 text-gray-700'}
                            `}
                            onClick={() => handleFileSelect(file)}
                        >
                            {isSelected ? <CheckSquare className="h-5 w-5 text-primary-600 flex-shrink-0" /> : <Square className="h-5 w-5 text-gray-400 flex-shrink-0" />}
                            <FileText className={`h-5 w-5 ${isSelected ? 'text-primary-600' : 'text-gray-500'} flex-shrink-0`} />
                            <div className="flex-1 min-w-0">
                                <h3 className="font-medium truncate">
                                    {file.originalName}
                                </h3>
                            </div>
                            <button
                                onClick={(e) => handleDeleteFile(e, file.id)}
                                className="ml-auto p-1.5 text-gray-400 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                                title="Delete file"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="bg-white rounded-lg p-3 h-full flex flex-col shadow-custom-sm">
            <h2 className="text-base font-semibold text-gray-800 mb-3 flex-shrink-0">Your Documents</h2>
            <div className="flex-grow overflow-y-auto pr-1">
                {renderContent()}
            </div>
        </div>
    );
};

export default FileList; 