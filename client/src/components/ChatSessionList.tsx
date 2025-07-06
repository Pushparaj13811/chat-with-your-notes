import React, { useEffect, useState, useCallback } from 'react';
import { getAllChatSessions, deleteChatSession } from '../services/api';
import type { ChatSession } from '../types';
import { MessageSquare, PlusCircle, Trash2, Inbox } from 'lucide-react';

interface ChatSessionListProps {
  onSelectSession: (sessionId: string | null, fileIds: string[]) => void;
  selectedSessionId: string | null;
  onNewChat: () => void;
  onSessionDeleted: (deletedSessionId: string) => void;
}

const ChatSessionList: React.FC<ChatSessionListProps> = ({ onSelectSession, selectedSessionId, onNewChat, onSessionDeleted }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getAllChatSessions();
      if (response.success) {
        setSessions([...response.data].sort((a: ChatSession, b: ChatSession) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } else {
        setError(response.message || 'Failed to fetch chat sessions.');
      }
    } catch (err) {
      setError('An error occurred while fetching chat sessions.');
      console.error('Failed to fetch chat sessions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getAllChatSessions]); // Dependency array for useCallback

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleSessionClick = (session: ChatSession) => {
    const fileIds = session.files.map(f => f.id);
    onSelectSession(session.id, fileIds);
  };

  const handleDeleteClick = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation(); // Prevent session selection when deleting
    if (window.confirm('Are you sure you want to delete this chat session and all its messages?')) {
      try {
        const response = await deleteChatSession(sessionId);
        if (response.success) {
          setSessions(prevSessions => prevSessions.filter(session => session.id !== sessionId));
          onSessionDeleted(sessionId);
        } else {
          alert(response.message || 'Failed to delete chat session.');
        }
      } catch (err) {
        alert('An error occurred while deleting the chat session.');
        console.error('Error deleting chat session:', err);
      }
    }
  };

  return (
    <div className="rounded-xl p-4 h-full flex flex-col">
      <h2 className="text-base font-semibold text-gray-700 mb-4 flex-shrink-0">Chat Sessions</h2>
      <button
        onClick={onNewChat}
        className="flex items-center justify-center gap-2 w-full px-4 py-2 mb-6 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-custom-md text-sm font-medium"
      >
        <PlusCircle className="h-5 w-5" />
        New Chat
      </button>
      <div className="flex-1 overflow-hidden space-y-3">
        {isLoading && (
          <div className="text-center py-6">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary-600 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Loading sessions...</p>
          </div>
        )}
        {error && (
          <div className="text-center py-6 px-3 bg-red-50 rounded-lg border border-red-200">
            <div className="h-7 w-7 text-red-500 mx-auto mb-2">!</div>
            <p className="font-semibold text-red-700 text-sm">Error loading sessions</p>
            <p className="text-xs text-red-600 mb-3">{error}</p>
            <button onClick={fetchSessions} className="text-xs text-primary-600 font-semibold hover:underline">
              Try again
            </button>
          </div>
        )}
        {!isLoading && sessions.length === 0 && (
          <div className="text-center py-6 px-3 border-2 border-dashed border-gray-200 rounded-lg">
            <Inbox className="h-7 w-7 text-gray-300 mx-auto mb-2" />
            <p className="font-semibold text-gray-500 text-sm">No chat sessions yet</p>
            <p className="text-xs text-gray-400">Start a new chat to create your first session.</p>
          </div>
        )}
        {
          sessions.map(session => (
            <div
              key={session.id}
              onClick={() => handleSessionClick(session)}
              className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all duration-200 group 
                ${selectedSessionId === session.id ? 'bg-primary-50 border border-primary-200 text-primary-800 shadow-custom-sm' : 'bg-white border border-borderLight hover:bg-gray-50 hover:border-gray-200 text-gray-700'}
              `}
              style={{ minHeight: '56px' }}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <MessageSquare className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium truncate min-w-0">{session.title || 'Untitled Session'}</span>
                {session.files.length > 0 && (
                  <span className="text-xs text-gray-400 flex-shrink-0 truncate">
                    ({session.files.map(f => f.originalName).join(', ')})
                  </span>
                )}
              </div>  
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteClick(e, session.id); }}
                className="ml-2 text-gray-400 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors flex-shrink-0"
                title="Delete session"
                tabIndex={0}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        }
      </div>
    </div>
  );
};

export default ChatSessionList; 