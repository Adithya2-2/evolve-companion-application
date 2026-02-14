
import React from 'react';

const ReflectionCard: React.FC = () => {
  return (
    <div className="relative w-full h-[450px] rounded-3xl overflow-hidden mb-8 group cursor-pointer shadow-2xl border border-white/10">
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" 
        style={{ backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuDKg066nqKjMNvJaoXAgiQ3KTn-OCmT2cC9LOsvSqP5Pc6dWS_RnN1jCenAl513vFO01THgrZCmu9Yi0rzCWxZj5rehWP9sY6somnnyjXPZAK2fOoIU0a_EbZzdIeApcOtrhAVhDnemRXSsq-kcwtAhR4kR3PXFMSndimrnQz94FRC0bhHsXMLzz7NNQL6nwRWq3IW9532yo1S5gGfsJ7kdeXenV6FDy1vBIW09eFMNFL-h5iKKldRhtf14ojxDrv1N0AJFkO7nNQ")` }}
        aria-label="Abstract calming landscape with geometric shapes floating in a gradient sky"
      ></div>
      <div className="absolute inset-0 bg-gradient-to-t from-background-dark/80 via-background-dark/20 to-transparent"></div>
      <div className="absolute bottom-0 left-0 p-8 w-full flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
        <div className="max-w-md">
          <h3 className="text-text-light text-3xl font-bold mb-2">Ready to reflect?</h3>
          <p className="text-slate-300 text-base leading-relaxed">Take a moment to center yourself. A 5-minute reflection can improve your sleep quality by 30%.</p>
        </div>
        <button className="group bg-primary hover:bg-secondary text-background-dark font-bold py-3.5 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-[0_0_20px_rgba(255,159,67,0.4)] flex items-center gap-2 whitespace-nowrap">
          <span>Start Daily Check-in</span>
          <span className="material-symbols-outlined transition-transform duration-300 group-hover:translate-x-1">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};

export default ReflectionCard;
