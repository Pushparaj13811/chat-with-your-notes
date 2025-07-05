import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Info, FileWarning } from 'lucide-react';
import { askQuestion, getChatHistory } from '../services/api';
import type { ChatMessage, RawApiChatMessage } from '../types';
import Accordion from './Accordion';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

interface ChatInterfaceProps {
  selectedFileIds: string[];
  chatSessionId: string | null;
  onSessionCreated: (sessionId: string) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ selectedFileIds, chatSessionId, onSessionCreated }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openContextId, setOpenContextId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!chatSessionId) {
        setMessages([]);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const response = await getChatHistory(chatSessionId);
        console.log("Raw chat history response:", response.data);
        if (response.success) {
          setMessages(response.data.map((msg: RawApiChatMessage) => {
            console.log("Raw msg.role from API:", msg.role); // Log 1
            const transformedMsg: ChatMessage = {
              id: msg.id,
              content: msg.content,
              createdAt: msg.createdAt,
              type: msg.role === 'user' ? 'user' : 'assistant',
              timestamp: new Date(msg.createdAt),
              ...(msg.context && { context: msg.context }), // Conditionally include context
              ...(msg.isError && { isError: msg.isError }), // Conditionally include isError
            };
            console.log("Transformed msg.type:", transformedMsg.type); // Log 2
            return transformedMsg;
          }));
        } else {
          setError(response.message || "Failed to load history.");
        }
      } catch {
        setError("An error occurred while fetching history.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [chatSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading || selectedFileIds.length === 0) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await askQuestion(inputValue, selectedFileIds, chatSessionId);
      if (response.success) {
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          type: 'assistant',
          content: response.data.answer,
          timestamp: new Date(),
          createdAt: new Date().toISOString(),
          context: response.data.context,
        };
        setMessages(prev => [...prev, assistantMessage]);

        if (!chatSessionId && response.data.chatSessionId) {
          onSessionCreated(response.data.chatSessionId);
        }
      } else {
        throw new Error(response.message || 'Failed to get a response.');
      }
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: 'assistant',
        content: err instanceof Error ? err.message : 'An unknown error occurred.',
        timestamp: new Date(),
        createdAt: new Date().toISOString(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccordionToggle = (id: string) => {
    setOpenContextId(prevId => (prevId === id ? null : id));
  };

  const renderMessage = (msg: ChatMessage) => {
    const isUser = msg.type === 'user';
    console.log(`Message ID: ${msg.id}, Type: ${msg.type}, isUser: ${isUser}`); // Log 3
    const Icon = isUser ? User : Bot;

    return (
      <div key={msg.id} className={`flex items-start gap-4 ${isUser ? 'justify-end' : ''}`}>
        {/* AI icon on the left for AI messages */}
        {!isUser && (
          <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${msg.isError ? 'bg-red-100' : 'bg-primary-50'}`}>
            <Icon className={`h-6 w-6 ${msg.isError ? 'text-red-600' : 'text-primary-700'}`} />
          </div>
        )}
        <div className={`w-full max-w-3xl p-4 rounded-2xl shadow-chat-bubble ${isUser
            ? 'bg-primary-600 text-white rounded-bl-3xl rounded-tr-3xl rounded-br-md' // User message: right-aligned, pointed bottom-right
            : `bg-white border border-borderLight text-gray-800 rounded-br-3xl rounded-tl-3xl rounded-bl-md ${msg.isError ? 'border-red-300 bg-red-50 text-red-900' : ''}` // AI message: left-aligned, pointed bottom-left
          }`}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{msg.content}</p>
          ) : (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                {msg.content}
              </ReactMarkdown>
            </div>

          )}
          {msg.context && msg.context.length > 0 && (
            <div className="mt-3 pt-3 border-t border-borderLight text-xs text-gray-600">
              <div className="flex items-center gap-2 mb-2 px-1">
                <Info className="h-4 w-4 text-primary-600" />
                <span className="font-semibold text-primary-700">Context used:</span>
              </div>
              <div className="space-y-1">
                {msg.context.map((contextItem, index) => {
                  const contextId = `${msg.id}-context-${index}`;
                  return (
                    <Accordion
                      key={contextId}
                      title={`Context Chunk ${index + 1}`}
                      isOpen={openContextId === contextId}
                      onToggle={() => handleAccordionToggle(contextId)}
                    >
                      <div className="p-2 bg-backgroundLight rounded-md whitespace-pre-wrap leading-relaxed text-gray-800">
                        {contextItem}
                      </div>
                    </Accordion>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        {/* User icon on the right for user messages */}
        {isUser && (
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center">
            <Icon className="h-6 w-6 text-white" />
          </div>
        )}
      </div>
    );
  };

  if (selectedFileIds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center bg-white rounded-lg border border-borderLight shadow-custom-md p-6">
        <FileWarning className="h-14 w-14 text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-700">No File Selected</h3>
        <p className="text-gray-500 mt-2">Please select a document from the sidebar to start a conversation.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-custom-lg overflow-hidden">
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {error && (
          <div className="text-center text-red-500 bg-red-100 p-3 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {messages.length === 0 && !isLoading && (
          <div className="text-center py-10">
            <Bot className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">
              Ask me anything about the selected document!
            </p>
          </div>
        )}

        {messages.map(renderMessage)}

        {isLoading && messages.length > 0 && (
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center bg-primary-50">
              <Bot className="h-6 w-6 text-primary-700" />
            </div>
            <div className="w-full max-w-3xl p-4 rounded-2xl bg-white border border-borderLight text-gray-800 rounded-br-3xl rounded-tl-3xl rounded-bl-md shadow-chat-bubble">
              <p className="animate-pulse text-gray-600">Thinking...</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-borderLight bg-gray-50 flex items-center gap-3 shadow-custom-sm"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask a question about your document..."
          className="flex-1 py-2 px-4 bg-gray-100 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          disabled={isLoading || selectedFileIds.length === 0}
        />
        <button
          type="submit"
          className="bg-primary-600 text-white p-2.5 rounded-full shadow-custom-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading || !inputValue.trim() || selectedFileIds.length === 0}
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
};

export default ChatInterface; 