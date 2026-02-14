import React, { useState, useRef, useEffect } from 'react';
import AnimatedBackground from '../components/AnimatedBackground';
import { chatWithGroq, ChatMessageInput } from '../services/groq';

interface ChatAssistantPageProps {
  onClose: () => void;
}

const ChatAssistantPage: React.FC<ChatAssistantPageProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<ChatMessageInput[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    const text = input.trim();
    if (!text) return;

    const userMessage: ChatMessageInput = {
      role: 'user',
      content: text,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Call Groq directly
      const reply = await chatWithGroq([...messages, userMessage]);

      const assistantMessage: ChatMessageInput = {
        role: 'assistant',
        content: reply || "I'm having trouble connecting to my thought process right now. Please check your internet connection or API key.",
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (e) {
      console.error('Chat error:', e);
      const errorMessage: ChatMessageInput = {
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again.",
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-surface-dark">
      <AnimatedBackground theme="chat" />
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-white/10 bg-surface-dark/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-2xl text-accent-teal">smart_toy</span>
            <h2 className="text-xl font-bold text-text-light">AI Assistant</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-text-light">close</span>
          </button>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-slate-400 mt-12">
              <span className="material-symbols-outlined text-6xl text-accent-teal mb-4">chat</span>
              <p className="text-lg">Start a conversation with your AI assistant</p>
            </div>
          )}
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl ${msg.role === 'user'
                    ? 'bg-accent-teal text-background-dark font-medium'
                    : 'bg-surface-dark/60 border border-white/10 text-text-light'
                  }`}
              >
                <p className="whitespace-pre-wrap">{msg.content ?? ''}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-surface-dark/60 border border-white/10 px-4 py-2 rounded-2xl">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                  <span className="text-slate-400 text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/10 bg-surface-dark/80 backdrop-blur-md">
          <div className="flex gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="flex-1 bg-surface-dark/50 border border-white/10 rounded-lg px-4 py-2 text-text-light placeholder:text-slate-500 resize-none focus:outline-none focus:border-accent-teal/50"
              rows={1}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className="px-4 py-2 bg-accent-teal text-background-dark font-semibold rounded-lg hover:bg-accent-teal/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatAssistantPage;
