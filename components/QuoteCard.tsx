
import React from 'react';

const QuoteCard: React.FC = () => {
  return (
    <div className="bg-secondary/10 border border-secondary/20 p-6 rounded-2xl mt-auto relative">
      <div className="absolute -top-3 -left-2 text-secondary opacity-40">
        <span className="material-symbols-outlined text-4xl">format_quote</span>
      </div>
      <blockquote className="relative z-10">
        <p className="text-text-light/90 italic text-sm leading-relaxed mb-3">"The only journey is the one within."</p>
        <footer className="text-secondary font-bold text-xs">— Rainer Maria Rilke</footer>
      </blockquote>
    </div>
  );
};

export default QuoteCard;
