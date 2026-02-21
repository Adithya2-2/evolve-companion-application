
import React, { useState, useEffect } from 'react';

const QUOTES = [
  { text: "The only journey is the one within.", author: "Rainer Maria Rilke" },
  { text: "Happiness is not something ready made. It comes from your own actions.", author: "Dalai Lama" },
  { text: "You don't have to control your thoughts. You just have to stop letting them control you.", author: "Dan Millman" },
  { text: "Out of suffering have emerged the strongest souls; the most massive characters are seared with scars.", author: "Khalil Gibran" },
  { text: "What mental health needs is more sunlight, more candor, and more unashamed conversation.", author: "Glenn Close" },
  { text: "There is hope, even when your brain tells you there isn't.", author: "John Green" },
  { text: "Your present circumstances don't determine where you can go; they merely determine where you start.", author: "Nido Qubein" },
  { text: "Step out of the history that is holding you back. Step into the new story you are willing to create.", author: "Oprah Winfrey" },
  { text: "Healing takes time, and asking for help is a courageous step.", author: "Mariska Hargitay" },
  { text: "You are allowed to be both a masterpiece and a work in progress, simultaneously.", author: "Sophia Bush" }
];

const QuoteCard: React.FC = () => {
  const [quote, setQuote] = useState(QUOTES[0]);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * QUOTES.length);
    setQuote(QUOTES[randomIndex]);
  }, []);

  return (
    <div className="bg-secondary/10 border border-secondary/20 p-6 rounded-2xl mt-auto relative">
      <div className="absolute -top-3 -left-2 text-secondary opacity-40">
        <span className="material-symbols-outlined text-4xl">format_quote</span>
      </div>
      <blockquote className="relative z-10 text-center">
        <p className="text-text-light/90 italic text-sm leading-relaxed mb-3">"{quote.text}"</p>
        <footer className="text-secondary font-bold text-xs">— {quote.author}</footer>
      </blockquote>
    </div>
  );
};

export default QuoteCard;
