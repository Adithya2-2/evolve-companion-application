
import React, { useState } from 'react';
import Header from './Header';
import ReflectionCard from './ReflectionCard';
import JourneyStreakCard from './JourneyStreakCard';
import DiscoveryPathCard from './DiscoveryPathCard';
import AnimatedBackground from './AnimatedBackground';
import CurrentMoodCard from './CurrentMoodCard';
import LogMoodModal from './LogMoodModal';
import MoodLog from './MoodLog';
import { MoodEntry, MoodOption } from '../types/moods';

interface MainContentProps {
  moodHistory: MoodEntry[];
  addMoodEntry: (mood: MoodOption, emotion?: { label: string; confidence: number }) => void;
}

const MainContent: React.FC<MainContentProps> = ({ moodHistory, addMoodEntry }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const latestMoodEntry = moodHistory.length > 0 ? moodHistory[moodHistory.length - 1] : null;

  return (
    <main className="flex-1 relative overflow-hidden flex flex-col">
      <AnimatedBackground theme="dashboard" />

      <div className="relative z-10 flex flex-col h-full p-8 md:p-12 overflow-y-auto">
        <Header moodHistory={moodHistory} />
        <ReflectionCard />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <JourneyStreakCard />
          <DiscoveryPathCard moodHistory={moodHistory} />
          <CurrentMoodCard
            latestMoodEntry={latestMoodEntry}
            onOpenModal={() => setIsModalOpen(true)}
          />
          <MoodLog moodHistory={moodHistory} />
        </div>
      </div>

      <LogMoodModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        addMoodEntry={addMoodEntry}
      />
    </main>
  );
};

export default MainContent;
