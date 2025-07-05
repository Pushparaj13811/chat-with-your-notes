import { useState, useCallback } from 'react';
import FileList from './components/FileList';
import ChatInterface from './components/ChatInterface';
import UploadModal from './components/UploadModal';
import ChatSessionList from './components/ChatSessionList';
import { UploadCloud, Files, History } from 'lucide-react';

function App() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [selectedChatSessionId, setSelectedChatSessionId] = useState<string | null>(null);
  const [selectedFileIdsForSession, setSelectedFileIdsForSession] = useState<string[]>([]);
  const [refreshFileList, setRefreshFileList] = useState(false);
  const [currentView, setCurrentView] = useState<'files' | 'history'>('files');

  const handleFileSelectionChange = useCallback((newSelectedIds: string[]) => {
    setSelectedFileIds(newSelectedIds);
    setSelectedChatSessionId(null);
    setSelectedFileIdsForSession(newSelectedIds);
  }, []);

  const handleSessionCreated = useCallback((sessionId: string) => {
    setSelectedChatSessionId(sessionId);
  }, []);

  const handleSelectSession = useCallback((sessionId: string | null, fileIds: string[]) => {
    setSelectedChatSessionId(sessionId);
    setSelectedFileIdsForSession(fileIds);
    setSelectedFileIds(fileIds); 
    setCurrentView('files');
  }, []);

  const handleNewChat = useCallback(() => {
    setSelectedChatSessionId(null);
    setSelectedFileIds([]);
    setSelectedFileIdsForSession([]);
    setCurrentView('files');
  }, []);

  const handleFileUploaded = useCallback(() => {
    setRefreshFileList(prev => !prev);
  }, []);

  const handleDeleteSession = useCallback((deletedSessionId: string) => {
    if (selectedChatSessionId === deletedSessionId) {
      setSelectedChatSessionId(null);
      setSelectedFileIds([]);
      setSelectedFileIdsForSession([]);
      setCurrentView('files');
    }
  }, [selectedChatSessionId, setSelectedFileIds, setSelectedFileIdsForSession, setCurrentView]);

  return (
    <div className="flex h-screen bg-backgroundLight font-sans text-gray-800">
      {/* Sidebar */}
      <div className="w-72 bg-white border-r border-borderLight flex flex-col shadow-sidebar rounded-r-xl overflow-hidden">
        <div className="p-4 border-b border-borderLight">
          <h1 className="text-2xl font-bold text-primary-700">Chat with Your Notes</h1>
        </div>
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 border-b border-borderLight flex justify-between gap-2">
            <button
              onClick={() => setCurrentView('files')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-colors ${currentView === 'files' ? 'bg-primary-100 text-primary-800 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Files className="h-5 w-5" />
              Files
            </button>
            <button
              onClick={() => setCurrentView('history')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-colors ${currentView === 'history' ? 'bg-primary-100 text-primary-800 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <History className="h-5 w-5" />
              History
            </button>
          </div>
          <div className="p-4 border-b border-borderLight">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors shadow-custom-md"
            >
              <UploadCloud className="h-5 w-5" />
              Upload Document
            </button>
          </div>
          <div className="flex-1 overflow-y-auto pt-2 pb-4 px-4">
            {currentView === 'files' ? (
              <FileList 
                key={refreshFileList ? 'refresh' : 'no-refresh'} 
                selectedFileIds={selectedFileIds} 
                onSelectionChange={handleFileSelectionChange} 
                onFileUploaded={handleFileUploaded} 
              />
            ) : (
              <ChatSessionList 
                onSelectSession={handleSelectSession}
                selectedSessionId={selectedChatSessionId}
                onNewChat={handleNewChat}
                onSessionDeleted={handleDeleteSession}
              />
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col p-6">
        <ChatInterface 
          selectedFileIds={selectedFileIdsForSession.length > 0 ? selectedFileIdsForSession : selectedFileIds} 
          chatSessionId={selectedChatSessionId} 
          onSessionCreated={handleSessionCreated} 
        />
      </div>

      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
        onFileUploaded={handleFileUploaded} 
      />
    </div>
  );
}

export default App;
