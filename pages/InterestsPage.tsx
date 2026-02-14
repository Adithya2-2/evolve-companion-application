
import React from 'react';
import AnimatedBackground from '../components/AnimatedBackground';
import AddMaterialCard from '../components/AddMaterialCard';
import GenreInterests from '../components/GenreInterests';
import InterestRadarMap from '../components/InterestRadarMap';
import SmartAnalysis from '../components/SmartAnalysis';
import SuggestionsPanel from '../components/SuggestionsPanel';

const InterestsPage: React.FC = () => {
    return (
        <main className="flex-1 relative overflow-hidden flex flex-col bg-surface-darker">
            <AnimatedBackground theme="adventure" />

            <div className="relative z-10 flex flex-col h-full p-6 md:p-8 overflow-y-auto">
                {/* Header */}
                <header className="flex justify-between items-center mb-6 animate-title-reveal [animation-delay:0.1s]">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-text-light flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary text-3xl material-symbols-fill">
                                explore
                            </span>
                            My Interests
                        </h1>
                        <p className="text-slate-400 mt-1">Discover, track, and expand your intellectual evolution.</p>
                    </div>
                </header>

                <div className="flex flex-col gap-6">
                    {/* Top row: Saved Collection */}
                    <div className="animate-title-reveal [animation-delay:0.2s]">
                        <AddMaterialCard />
                    </div>

                    {/* Main suggestion panel */}
                    <div className="animate-title-reveal [animation-delay:0.3s]">
                        <SuggestionsPanel />
                    </div>

                    {/* Bottom row: Interests + Radar + Insights */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        <div className="lg:col-span-3 flex flex-col gap-6">
                            <div className="animate-title-reveal [animation-delay:0.4s]">
                                <GenreInterests />
                            </div>
                            <div className="animate-title-reveal [animation-delay:0.6s]">
                                <SmartAnalysis />
                            </div>
                        </div>
                        <div className="lg:col-span-2 animate-title-reveal [animation-delay:0.5s]">
                            <InterestRadarMap />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default InterestsPage;