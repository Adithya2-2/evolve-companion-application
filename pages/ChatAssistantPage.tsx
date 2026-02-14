import React, { useState, useRef, useEffect } from 'react';
import AnimatedBackground from '../components/AnimatedBackground';
import { chatWithGroq, ChatMessageInput, UserChatContext } from '../services/groq';
import { useAuth } from '../contexts/AuthContext';
import { fetchRecentMoodEntries, fetchRecentJournalEntries, fetchUserInterests, fetchChatHistory, saveChatMessage } from '../services/database';
import { extractJournalKeywords } from '../utils/suggestionEngine';

interface ChatAssistantPageProps {
  onClose: () => void;
}

const ChatAssistantPage: React.FC<ChatAssistantPageProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessageInput[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userContext, setUserContext] = useState<UserChatContext | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load User Context and Chat History
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      try {
        // 1. Load Context Data
        const [moods, journals, interests] = await Promise.all([
          fetchRecentMoodEntries(user.id, 7),
          fetchRecentJournalEntries(user.id, 14),
          fetchUserInterests(user.id)
        ]);

        const recentKeywords = extractJournalKeywords(journals.map(j => j.content));
        const recentEmotions = [...new Set(moods.filter(m => m.emotion?.label).map(m => m.emotion!.label))].slice(0, 5);
        const currentMood = moods[0]?.emotion?.label || moods[0]?.mood.name;

        setUserContext({
          journal: { recentKeywords, recentEmotions },
          interests: interests.map(i => i.name),
          currentMood
        });

        // 2. Load Chat History
        const history = await fetchChatHistory(user.id, 50); // Fetch last 50 messages
        if (history.length > 0) {
          setMessages(history.map(h => ({ role: h.role, content: h.content })));
        }

      } catch (err) {
        console.error('Failed to load chat data:', err);
      }
    };

    if (user) {
      loadData();
    }
  }, [user]);

  const handleSendMessage = async () => {
    const text = input.trim();
    if (!text || !user) return;

    const userMessage: ChatMessageInput = {
      role: 'user',
      content: text,
    };

    // Optimistic update
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Persist User Message
    saveChatMessage(user.id, 'user', text).catch(e => console.error("Failed to save user msg:", e));

    try {
      // Call Groq with history AND context
      const reply = await chatWithGroq([...messages, userMessage], userContext);

      const responseContent = reply || "I'm having trouble connecting to my thought process right now. Please check your internet connection or API key.";

      const assistantMessage: ChatMessageInput = {
        role: 'assistant',
        content: responseContent,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Persist Assistant Message
      saveChatMessage(user.id, 'assistant', responseContent).catch(e => console.error("Failed to save bot msg:", e));

    } catch (e) {
      console.error('Chat error:', e);
      const errorMessage: ChatMessageInput = {
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again.",
      };
      setMessages(prev => [...prev, errorMessage]);
      saveChatMessage(user.id, 'assistant', errorMessage.content).catch(e => console.error("Failed to save error msg:", e));
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
    <div className="fixed inset-0 z-50 flex flex-col animate-chameleon text-slate-800 dark:text-slate-100 transition-colors duration-500">
      {/* Dynamic Overlay for extra soothing effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-white/20 dark:via-black/10 dark:to-black/30 pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-white/40 dark:border-white/10 bg-white/30 dark:bg-slate-900/30 backdrop-blur-md shadow-sm transition-colors duration-300">
          <div className="flex items-center gap-3">
            <div className="group relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center shadow-lg animate-float-icon cursor-help transition-all hover:scale-105">
              <span className="material-symbols-outlined text-white text-3xl drop-shadow-sm group-hover:hidden">filter_drama</span>
              <span className="material-symbols-outlined text-white text-3xl drop-shadow-sm hidden group-hover:block animate-pulse">sentiment_satisfied_alt</span>

              {/* Tooltip on Hover */}
              <div className="absolute left-14 top-0 w-48 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50">
                <div className="cloud-tooltip p-4 text-xs">
                  <strong className="block text-sky-600 dark:text-sky-400 mb-1 text-sm font-bold">Hi, I'm Pluto! 🌟</strong>
                  Happy to assist you on your journey.
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-wide drop-shadow-sm font-family-playfair">Pluto</h2>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium tracking-wider">Mindful Cloud Companion</p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/20 dark:bg-white/10 hover:bg-white/40 dark:hover:bg-white/20 transition-colors backdrop-blur-sm shadow-sm"
          >
            <span className="material-symbols-outlined text-slate-700 dark:text-slate-200">close</span>
          </button>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
          {messages.length === 0 && (
            <div className="text-center text-slate-600 dark:text-slate-300 mt-20 flex flex-col items-center animate-fade-in-up">
              <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 bg-white/40 dark:bg-white/10 rounded-full blur-xl animate-pulse"></div>
                <div className="relative w-full h-full rounded-[30%_70%_70%_30%/30%_30%_70%_70%] bg-gradient-to-tr from-sky-300 to-indigo-400 flex items-center justify-center shadow-2xl animate-float-icon">
                  <span className="material-symbols-outlined text-5xl text-white">filter_drama</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-2 font-family-playfair text-slate-800 dark:text-white">I'm Pluto.</h3>
              <p className="text-sm font-medium opacity-90 max-w-xs mx-auto leading-relaxed">
                Your personal headspace cloud. I'm here to listen, support, and float through thoughts with you.
              </p>
              {userContext?.currentMood && (
                <div className="mt-6 inline-flex items-center gap-2 bg-white/40 dark:bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/50 dark:border-white/20 shadow-sm animate-fade-in">
                  <span className="material-symbols-outlined text-sm text-sky-600 dark:text-sky-300">mood</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Sensing: {userContext.currentMood}</span>
                </div>
              )}
            </div>
          )}
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] md:max-w-md px-5 py-3 shadow-sm transition-all duration-300 ${msg.role === 'user'
                    ? 'bubble-user'
                    : 'bubble-bot'
                  }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed text-[15px] font-medium">{msg.content ?? ''}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 px-4 py-2 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm animate-spin text-sky-600 dark:text-sky-400">progress_activity</span>
                  <span className="text-slate-600 dark:text-slate-300 text-sm font-medium">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/40 dark:border-white/10 bg-white/30 dark:bg-slate-900/40 backdrop-blur-md shadow-inner-lg">
          <div className="bg-white/60 dark:bg-slate-800/60 border border-white/50 dark:border-white/10 rounded-2xl p-2 flex flex-col gap-2 backdrop-blur-sm shadow-sm transition-colors duration-300">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="w-full bg-transparent border-none text-slate-800 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 resize-none focus:outline-none focus:ring-0 px-3 py-2 min-h-[44px] max-h-[120px] font-medium"
              rows={1}
              disabled={isLoading}
            />
            <div className="flex justify-between items-center px-2 pb-1">
              <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                <span className="material-symbols-outlined text-[14px]">history</span>
                <span>Memory Active</span>
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                className="p-2 bg-gradient-to-tr from-sky-500 to-indigo-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
              >
                <span className="material-symbols-outlined text-xl">send</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatAssistantPage;
