
import React, { useState, useEffect, useRef } from 'react';
import ChatAssistantPage from '../pages/ChatAssistantPage';

const MESSAGES = [
    "Hi, I'm Pluto! 🌟 Happy to assist you.",
    "Floating through thoughts... ☁️",
    "Mindful moments ahead... ✨",
    "Here to listen and help. 🌿",
    "Breathe in, breathe out... 🧘‍♀️",
    "What's on your mind? 💭",
    "Ready to explore? 🚀",
    "Let's grow together. 🌱"
];

const ChatAssistantButton: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [displayText, setDisplayText] = useState('');
    const [hasShownIntro, setHasShownIntro] = useState(false);

    // Typing animation refs
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const fullTextRef = useRef('');
    const charIndexRef = useRef(0);

    const handleClose = () => setIsOpen(false);

    useEffect(() => {
        if (isHovered && !isOpen) {
            // Pick message
            let nextMsg = '';
            if (!hasShownIntro) {
                nextMsg = MESSAGES[0];
                setHasShownIntro(true);
            } else {
                // Random message from index 1 to end
                const randomIndex = Math.floor(Math.random() * (MESSAGES.length - 1)) + 1;
                nextMsg = MESSAGES[randomIndex];
            }

            fullTextRef.current = nextMsg;
            charIndexRef.current = 0;
            setDisplayText('');

            const typeChar = () => {
                if (charIndexRef.current < fullTextRef.current.length) {
                    setDisplayText(fullTextRef.current.slice(0, charIndexRef.current + 1));
                    charIndexRef.current++;
                    typingTimeoutRef.current = setTimeout(typeChar, 30); // Typing speed
                }
            };

            typeChar();
        } else {
            // Reset on leave
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            setDisplayText('');
        }

        return () => {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, [isHovered, isOpen]); // hasShownIntro is stable enough, intentionally not in deps to avoid reset loops if it changes during hover (it won't)

    return (
        <>
            <div
                className="fixed bottom-8 right-8 z-50 flex items-center justify-end"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Cloud Tooltip with Typing Effect */}
                <div
                    className={`mr-4 transition-all duration-300 transform origin-right ${isHovered && !isOpen && displayText ? 'opacity-100 scale-100 translate-x-0' : 'opacity-0 scale-90 translate-x-4 pointer-events-none'
                        }`}
                >
                    <div className="cloud-tooltip px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 min-w-[180px] flex items-center">
                        <span className="mr-2 text-lg">☁️</span>
                        <span>{displayText}</span>
                        <span className="animate-pulse ml-0.5 opacity-70">|</span>
                    </div>
                </div>

                <button
                    onClick={() => setIsOpen(true)}
                    className="group relative w-16 h-16 flex items-center justify-center rounded-[30%_70%_70%_30%/30%_30%_70%_70%] bg-gradient-to-tr from-accent-teal to-blue-500 shadow-[0_8px_30px_rgb(0,0,0,0.3)] transition-all duration-500 ease-in-out hover:scale-110 hover:rotate-3 animate-float-icon"
                    aria-label="Open Chat Assistant"
                >
                    <div className="absolute inset-0 flex items-center justify-center">
                        {/* New AI Sparkle Icon */}
                        <span className="material-symbols-outlined text-white text-3xl drop-shadow-md animate-pulse-slow">auto_awesome</span>

                        {/* Organic Glow Pulse */}
                        <div className="absolute inset-0 rounded-[30%_70%_70%_30%/30%_30%_70%_70%] bg-white/30 blur-md animate-pulse -z-10" />
                    </div>
                </button>
            </div>
            {isOpen && <ChatAssistantPage onClose={handleClose} />}
        </>
    );
};

export default ChatAssistantButton;
