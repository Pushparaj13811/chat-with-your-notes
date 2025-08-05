import React, { useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import FileList from './components/FileList';
import ChatInterface from './components/ChatInterface';
import UploadModal from './components/UploadModal';
import ChatSessionList from './components/ChatSessionList';
import UserProfile from './components/UserProfile';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProfilePage from './pages/ProfilePage';
import OAuthCallback from './components/auth/OAuthCallback';
import { UploadCloud, Files, History } from 'lucide-react';

// Protected App Component (inside AuthProvider)
const ProtectedApp: React.FC = () => {
  const { isLoading, isAuthenticated } = useAuth();
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-primary-700 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
}

  return (
    <div className="flex h-screen bg-gradient-to-br from-primary-100 to-primary-200 border-primary-200 text-primary-900 font-sans opacity-0 animate-[fadeIn_0.8s_ease-out_forwards]">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col shadow-sidebar overflow-hidden">
        <div className="px-6 pt-8">
          <h1 className="text-xl font-semibold text-primary-700 tracking-tight mb-4">Chat with Your Notes</h1>
        </div>
        
        <div className="px-4 mb-4">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white font-medium shadow-custom-md hover:bg-primary-700 transition-colors text-sm"
          >
            <UploadCloud className="h-5 w-5" />
            Upload Document
          </button>
        </div>

        <nav className="flex flex-row gap-2 px-4">
          <button
            onClick={() => setCurrentView('files')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${currentView === 'files' ? 'bg-primary-50 text-primary-800 shadow-custom-sm' : 'text-gray-500 hover:bg-gray-100'}`}
            aria-current={currentView === 'files' ? 'page' : undefined}
          >
            <Files className="h-5 w-5" />
            Files
          </button>
          <button
            onClick={() => setCurrentView('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${currentView === 'history' ? 'bg-primary-50 text-primary-800 shadow-custom-sm' : 'text-gray-500 hover:bg-gray-100'}`}
            aria-current={currentView === 'history' ? 'page' : undefined}
          >
            <History className="h-5 w-5" />
            History
          </button>
        </nav>
        
        <div className="flex-1 overflow-y-auto px-2 pb-6">
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

        <div className="px-4 pb-6">
          <UserProfile />
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col mt-4">
        <ChatInterface 
          selectedFileIds={selectedFileIdsForSession.length > 0 ? selectedFileIdsForSession : selectedFileIds} 
          chatSessionId={selectedChatSessionId} 
          onSessionCreated={handleSessionCreated} 
        />
      </main>

      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
        onFileUploaded={handleFileUploaded} 
      />

    </div>
  );
};

// Main App with Router
const AppWithAuth: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Authentication routes */}
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/signup" element={<SignupPage />} />
          <Route path="/auth/success" element={<OAuthCallback />} />
          <Route path="/auth/error" element={<OAuthCallback />} />
          
          {/* Profile route */}
          <Route path="/profile" element={<ProfilePage />} />
          
          {/* Main app route */}
          <Route path="/" element={<ProtectedApp />} />
          
          {/* Redirect unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default AppWithAuth;