import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Info, FileWarning, Loader2 } from 'lucide-react';
import { askQuestion, getChatHistory, getFileQuestions } from '../services/api';
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
  const [fileQuestionsMap, setFileQuestionsMap] = useState<Record<string, string[]>>({});
  const [dynamicQuestions, setDynamicQuestions] = useState<string[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch and cache questions for all selected files
  useEffect(() => {
    const fetchQuestions = async () => {
      if (selectedFileIds.length === 0) {
        setDynamicQuestions([]);
        return;
      }
      setQuestionsLoading(true);
      try {
        const newMap: Record<string, string[]> = { ...fileQuestionsMap };
        for (const fileId of selectedFileIds) {
          if (!newMap[fileId]) {
            const questions = await getFileQuestions(fileId);
            newMap[fileId] = questions;
          }
        }
        setFileQuestionsMap(newMap);
        // Combine all questions, deduplicate, and randomize
        const allQuestions = selectedFileIds.flatMap(id => newMap[id] || []);
        const uniqueQuestions = Array.from(new Set(allQuestions));
        const shuffled = uniqueQuestions.sort(() => Math.random() - 0.5);
        setDynamicQuestions(shuffled.slice(0, 6));
      } catch {
        setDynamicQuestions([]);
      } finally {
        setQuestionsLoading(false);
      }
    };
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFileIds.join(",")]);

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
        if (response.success) {
          setMessages(response.data.map((msg: RawApiChatMessage) => {
            const transformedMsg: ChatMessage = {
              id: msg.id,
              content: msg.content,
              createdAt: msg.createdAt,
              type: msg.role === 'user' ? 'user' : 'assistant',
              timestamp: new Date(msg.createdAt),
              ...(msg.context && { context: msg.context }),
              ...(msg.isError && { isError: msg.isError }),
            };
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

  const handleExampleQuestionClick = (question: string) => {
    setInputValue(question);
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) {
        const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
        form.dispatchEvent(submitEvent);
      }
    }, 100);
  };

  const renderMessage = (msg: ChatMessage) => {
    const isUser = msg.type === 'user';
    return (
      <div key={msg.id} className={`flex items-start gap-4 justify-center`}>
        <div
          className={`w-full max-w-3xl p-4 rounded-2xl shadow-custom-md border ${
            isUser
              ? 'bg-gradient-to-br from-primary-100 to-primary-200 border-primary-200 text-primary-900'
              : msg.isError
                ? 'border-red-300 bg-red-50 text-red-900'
                : 'bg-gradient-to-br from-primary-50/60 to-white/80 border-primary-100 text-gray-800'
          }`}
          style={{ boxShadow: '0 2px 16px 0 rgba(99,102,241,0.08)' }}
        >
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
      </div>
    );
  };

  if (selectedFileIds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center bg-primary-50 rounded-xl border border-primary-200  shadow-custom-md p-10">
        <FileWarning className="h-14 w-14 text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-500">No File Selected</h3>
        <p className="text-gray-400 mt-2">Please select a document from the sidebar to start a conversation.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full rounded-tl-lg overflow-hidden border border-borderLight">
      <div className="flex-1 p-8 space-y-6 overflow-y-auto">
        {error && (
          <div className="text-center text-red-500 bg-red-50 p-3 rounded-lg border border-red-100">
            {error}
          </div>
        )}

        {messages.length === 0 && !isLoading && (
          <div className="text-center py-12 animate-fade-in">
            <div className="inline-block bg-gradient-to-br from-primary-50 to-primary-100 rounded-full p-6 shadow-inner shadow-primary-200 mb-6">
              <Bot className="h-16 w-16 text-primary-500 animate-bounce-slow" />
            </div>
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                Welcome to Your Document Assistant! 🤖
              </h2>
              <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                I've analyzed your selected document and I'm ready to help you explore its contents. 
                Ask me anything or try one of these example questions to get started!
              </p>
              <div className="grid grid-cols-1 gap-3 mb-8">
                {questionsLoading ? (
                  <div className="col-span-2 flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 text-primary-500 animate-spin mr-2" />
                    <span className="text-primary-600 font-medium">Generating questions from your document...</span>
                  </div>
                ) : dynamicQuestions.length > 0 ? (
                  dynamicQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleExampleQuestionClick(question)}
                      className="p-4 text-left border-b-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50 hover:rounded-xl transition-all duration-200 group"
                      disabled={isLoading}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center mt-0.5">
                          <span className="text-xs font-semibold text-primary-600">{index + 1}</span>
                        </div>
                        <p className="text-sm text-primary-700 justify-around font-medium leading-relaxed">
                          {question}
                        </p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="col-span-2 text-gray-400 text-center py-8">
                    No dynamic questions available for this document.
                  </div>
                )}
              </div>
              <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-4 border border-primary-100">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-primary-600" />
                  <span className="text-sm font-semibold text-primary-700">Pro tip:</span>
                </div>
                <p className="text-sm text-gray-600">
                  You can ask follow-up questions, request specific sections, or ask me to compare different parts of your document.
                </p>
              </div>
            </div>
          </div>
        )}

        {messages.map(renderMessage)}

        {isLoading && messages.length > 0 && (
          <div className="flex items-start justify-center gap-4">
            <div className="w-full max-w-3xl p-4 rounded-2xl shadow-custom-md border bg-gradient-to-br from-primary-50/60 to-white/80 border-primary-100 text-gray-800">
              <p className="animate-pulse text-gray-400">Thinking...</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <form
        onSubmit={handleSubmit}
        className="relative flex items-center gap-3 p-4 bg-gradient-to-br from-primary-50/60 to-white/80 border border-primary-100 rounded-t-2xl shadow-custom-md max-w-3xl w-full mx-auto"
        style={{ boxShadow: '0 2px 16px 0 rgba(99,102,241,0.08)' }}
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type your message here..."
          className="flex-1 bg-transparent text-lg placeholder:text-primary-300 px-4 py-4 rounded-xl border-none focus:outline-none transition-all shadow-none"
          disabled={isLoading || selectedFileIds.length === 0}
        />
        <button
          type="submit"
          className="absolute right-6 top-1/2 -translate-y-1/2 bg-primary-400 hover:bg-primary-500 text-white rounded-xl p-3 shadow-md transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ boxShadow: '0 2px 8px 0 rgba(99,102,241,0.10)' }}
          disabled={isLoading || !inputValue.trim() || selectedFileIds.length === 0}
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
};

export default ChatInterface; 