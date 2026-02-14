
import React, { useState } from 'react';
import ChatAssistantPage from '../pages/ChatAssistantPage';

const ChatAssistantButton: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    const handleClose = () => setIsOpen(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="group fixed bottom-8 right-8 z-50 w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent-teal shadow-2xl transition-transform duration-300 ease-out hover:scale-110 animate-fade-in-up animate-pulse-glow"
                style={{ animationDelay: '1s' }}
                aria-label="Open Chat Assistant"
            >
                <div className="absolute inset-0 flex items-center justify-center">
                    <svg
                        width="40"
                        height="40"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-background-dark"
                    >
                        {/* Body */}
                        <path d="M15 18v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                        {/* Head */}
                        <circle cx="12" cy="7" r="4"></circle>
                        {/* Eyes */}
                        <circle cx="10.5" cy="7.5" r=".5" fill="currentColor"></circle>
                        <circle cx="13.5" cy="7.5" r=".5" fill="currentColor"></circle>
                        {/* Waving Hand */}
                        <path d="M18 13.5a1.5 1.5 0 1 1 3 0v4l-3-2v-2z" className="animate-wave"></path>
                    </svg>
                </div>
            </button>
            {isOpen && <ChatAssistantPage onClose={handleClose} />}
        </>
    );
};

export default ChatAssistantButton;
