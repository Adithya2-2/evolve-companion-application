# Evolve - Personal Growth Companion



[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite)](https://vitejs.dev/)
[![Groq AI](https://img.shields.io/badge/AI-Groq-orange)](https://groq.com/)
[![Supabase](https://img.shields.io/badge/Backend-Supabase-green?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Style-Tailwind-38B2AC?logo=tailwindcss)](https://tailwindcss.com/)

</div>

---

**Evolve** is an intelligent personal growth companion that tracks your emotional journey through AI-powered emotion recognition, mood tracking, journaling, and personalized insights. It leverages the speed of **Groq AI** to provide instant, meaningful feedback and the reliability of **Supabase** for secure data storage.

## ✨ Key Features

### 🤖 AI-Powered Intelligence (Groq Llama 3.3)
- **Instant Chat Companion**: Have natural, supportive conversations with an AI that remembers your context.
- **Deep Emotional Analysis**: Get psychological insights based on your mood history and journal entries.
- **Weekly Summaries**: Receive a compassionate weekly overview of your emotional trends.
- **Smart Suggestions**: Get curated books, movies, podcasts, and music tailored to your current emotional state.

### 🎯 Emotion Recognition
- **Real-time Camera Analysis**: Detects 7 core emotions (Happy, Sad, Angry, Fear, Disgust, Surprise, Neutral) using facial landmarks.
- **Image Upload**: Analyze emotions from existing photos.
- **Privacy First**: All facial analysis happens **locally in your browser** using TensorFlow.js/Face-API; no images are sent to the server.

### 📝 Smart Journaling
- **Emotion-Tagged Entries**: Every entry is linked to your detected or logged mood.
- **Audio Journaling**: Record your thoughts securely; speech-to-text integration (future).
- **Guided Reflection**: AI-generated prompts to help you explore your feelings.

### 🗺️ Discovery Path
- **Personalized Growth Tasks**: A gamified journey of self-improvement activities.
- **Science-Backed Activities**: Tasks designed to boost well-being (e.g., "3 Good Things", "Mindful Breathing").
- **Progress Tracking**: Visualize your growth with streaks and completion stats.

### 📊 Data Visualization & Insights
- **Mood Radar**: See your emotional balance on a radar chart.
- **Trend Lines**: Track how your mood changes over days and weeks.
- **Interest Graph**: Visualize your developing interests based on your journaling.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Framer Motion (animations), Lucide React (icons)
- **AI/LLM**: Groq API (`llama-3.3-70b-versatile`)
- **Backend/Auth**: Supabase (PostgreSQL, Auth, Storage)
- **ML (Client-side)**: face-api.js (TensorFlow.js)
- **Charts**: Recharts

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A [Groq](https://groq.com/) API Key (Free tier available)
- A [Supabase](https://supabase.com/) Project (Free tier available)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Adithya2-2/evolve-companion-application.git
   cd evolve-companion-application
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   # Supabase Configuration
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

   # AI Configuration
   VITE_GROQ_API_KEY=your_groq_api_key

   # Optional: External Content APIs (Fallbacks provided if missing)
   VITE_OMDB_API_KEY=your_omdb_key
   ```

4. **Start the Development Server**
   ```bash
   npm run dev
   ```

---

## 📂 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── SuggestionsPanel.tsx   # AI Content recommendations
│   ├── WeeklySummaryCard.tsx  # AI Weekly analysis
│   ├── DiscoveryPathCard.tsx  # Gamified growth tasks
│   ├── AudioJournalCard.tsx   # Voice recording component
│   └── ...
├── services/            # API integrations
│   ├── groq.ts          # Groq AI implementation
│   ├── supabase.ts      # Database & Auth client
│   └── recommendationApi.ts # External content APIs
├── utils/               # Helper logic
│   ├── emotionAnalyzer.ts   # Face-API logic
│   └── suggestionEngine.ts  # Recommendation algorithms
├── types/               # TypeScript interfaces
└── App.tsx              # Main application entry
```

---

## 🤝 Contributing

Contributions are welcome!
1. Fork the repo
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 📚 Code Integration Wiki

For a deep dive into the architecture, AI data flows, and component logic, please read our **[Code Wiki](docs/CODE_WIKI.md)**.
It covers:
- Emotion Analysis Engine (Face-API)
- Suggestion Algorithms (Groq + Fallbacks)
- State Management & Data Patterns

---

<div align="center">
Built with ❤️ for Personal Growth
</div>
