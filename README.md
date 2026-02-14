# Evolve - Personal Growth Companion

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

An intelligent personal growth companion that tracks your emotional journey through AI-powered emotion recognition, mood tracking, journaling, and personalized insights.

## ✨ Features

### 🎯 Emotion Recognition
- **Real-time Camera Analysis**: Capture emotions using your device camera
- **Image Upload Support**: Analyze emotions from uploaded photos
- **AI-Powered Detection**: Browser-side facial emotion recognition
- **Confidence Scoring**: Get reliability scores for emotion predictions

### 🤖 AI-Powered Insights
- **Automated Weekly Summaries**: Get compassionate weekly overviews of your emotional journey
- **Mood Pattern Analysis**: AI analyzes your mood trends and identifies patterns
- **Personalized Recommendations**: Receive actionable insights for personal growth
- **Automatic Analysis**: Insights update automatically as you track your data
- **Intelligent Chatbot**: Ask questions and get guidance from your AI companion

### 📊 Mood Tracking
- **Visual Mood History**: Track emotional patterns over time
- **Emotion-to-Mood Mapping**: Automatic conversion from emotions to mood categories
- **Interactive Charts**: Visualize mood trends and patterns
- **Smart Insights**: Get personalized recommendations based on mood data

### 📝 Journal Integration
- **Emotion-Enhanced Journaling**: Add emotion context to your journal entries
- **Daily Reflections**: Guided prompts for self-discovery
- **Audio Journal Support**: Record voice entries for convenience
- **Mood-Based Suggestions**: Receive tailored journaling prompts

### 🎨 Beautiful UI
- **Dark Theme**: Easy on the eyes for extended use
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Smooth Animations**: Delightful micro-interactions
- **Material Icons**: Consistent and intuitive iconography

## 🎯 How to Use

### Tracking Your Journey
1. **Log Moods**: Click on mood options to track how you're feeling
2. **Capture Emotions**: Use camera or upload photos for emotion detection
3. **Journal Daily**: Write about your day with AI-powered prompts
4. **View Insights**: Check the Insights page for AI analysis and weekly summaries

### AI Features
- **Chat Assistant**: Click the chat button to talk with your AI companion
- **Automatic Analysis**: AI analyzes your data daily and provides insights
- **Weekly Summaries**: Get comprehensive overviews every week
- **Personal Growth Tips**: Receive actionable recommendations based on your patterns

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** - For React frontend
- **Python 3.9+** - For chatbot backend
- **Camera Access** - For emotion capture functionality

### Installation

### Frontend
1. **Clone and install frontend dependencies:**
   ```bash
   npm install
   ```

### Backend (Chatbot)
2. **Install Python dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   pip install google-generativeai
   ```

3. **Set up environment:**
   ```bash
   # Copy .env.example to .env and add your Gemini API key
   cp .env.example .env
   # Edit .env and set GEMINI_API_KEY=your_key_here
   ```

### Running the Application

#### Start backend (chatbot)
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Start frontend
```bash
npm run dev
```

- Open the local URL printed by Vite (e.g., http://localhost:3000)
- Click the chat button to talk to the AI assistant powered by Gemini.

## 📖 Usage Guide

### Using Emotion Recognition

1. **Via Mood Logger:**
   - Click "Log Mood" button
   - Choose "Use Camera" or "Upload Photo"
   - Allow camera permissions (if using camera)
   - Capture or upload your photo
   - View detected emotion and confidence
   - Mood will be automatically logged

2. **Via Journal Page:**
   - Navigate to Journal section
   - Find the "Emotion Scan" card
   - Click "Use Camera" or "Upload Photo"
   - Analyze your emotion
   - Results will be displayed in the card

### Supported Emotions
- Happy, Sad, Angry, Fear, Disgust, Surprise, Neutral

### Mood Mapping
- Happy → Happy
- Sad → Sad
- Angry → Angry
- Fearful → Anxious
- Disgusted → Anxious
- Surprised → Joyful
- Neutral → Calm

## 🔧 Development

### Project Structure
```
├── components/          # React components
│   ├── CameraCapture.tsx    # Camera interface
│   ├── ImageUpload.tsx      # File upload interface
│   ├── EmotionScanCard.tsx  # Journal page integration
│   └── LogMoodModal.tsx     # Mood logger integration
├── pages/              # Page components
├── utils/              # Utility functions
│   └── emotionAnalyzer.ts  # Browser-side emotion recognition
├── types/              # TypeScript type definitions
└── public/            # Static assets
```

## 🛠️ Troubleshooting

### Frontend Issues
- **Emotion not detected**: Ensure camera permission is granted and use a clear photo of a face
- **Performance issues**: Close other applications and ensure stable internet connection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments
- [React](https://reactjs.org/) for the frontend framework
- [Tailwind CSS](https://tailwindcss.com/) for styling
