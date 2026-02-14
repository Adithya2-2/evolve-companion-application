from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import logging
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3004"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str

class MoodEntry(BaseModel):
    mood: str
    score: int
    timestamp: str
    emotion_label: str = ""
    emotion_confidence: float = 0.0

class JournalEntry(BaseModel):
    date: str
    content: str
    wordCount: int
    charCount: int
    updatedAt: str

class AnalysisRequest(BaseModel):
    mood_history: list[MoodEntry]
    journal_history: list[JournalEntry]
    type: str = "detailed"  # Can be "simplified" or "detailed"

class AnalysisResponse(BaseModel):
    weekly_summary: str
    mood_analysis: str
    insights: list[str]

# 1. Setup the Gemini API securely
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    logger.error("GEMINI_API_KEY is missing. Please check your .env file.")
else:
    genai.configure(api_key=GEMINI_API_KEY)

# --- STARTUP CHECK: List available models ---
@app.on_event("startup")
async def check_models():
    if GEMINI_API_KEY:
        try:
            logger.info("Checking available models for this API Key...")
            available_models = []
            for m in genai.list_models():
                if 'generateContent' in m.supported_generation_methods:
                    available_models.append(m.name)
            logger.info(f"Available Models: {available_models}")
        except Exception as e:
            logger.error(f"Failed to list models: {e}")
# ---------------------------------------------

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_mood_and_journal(req: AnalysisRequest):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")

    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Prepare data for analysis
        mood_summary = "Recent Moods:\n"
        for entry in req.mood_history[-7:]:  # Last 7 entries
            mood_summary += f"- {entry.timestamp}: {entry.mood} (score: {entry.score})\n"
        
        journal_summary = "Recent Journal Entries:\n"
        for entry in req.journal_history[-7:]:  # Last 7 entries
            journal_summary += f"- {entry.date}: {entry.content[:200]}...\n"
        
        # Generate different content based on type
        if req.type == "simplified":
            # Simplified summary for the weekly summary card
            summary_prompt = f"""
            Based on this mood and journal data, provide a brief, compassionate 2-3 sentence weekly summary:
            
            {mood_summary}
            {journal_summary}
            
            Keep it concise, warm, and encouraging. Focus on the overall emotional journey.
            """
            
            summary_response = model.generate_content(summary_prompt)
            weekly_summary = summary_response.text if summary_response.parts else "This week had its moments of growth and reflection."
            
            # Return simplified response
            return AnalysisResponse(
                weekly_summary=weekly_summary,
                mood_analysis="",
                insights=[]
            )
        
        else:  # detailed analysis
            # Generate weekly summary
            summary_prompt = f"""
            Based on this mood and journal data from the past week, provide a compassionate weekly summary:
            
            {mood_summary}
            
            {journal_summary}
            
            Focus on patterns, emotional journey, and gentle observations. Be supportive and insightful.
            """
            
            summary_response = model.generate_content(summary_prompt)
            weekly_summary = summary_response.text if summary_response.parts else "Unable to generate summary this week."
            
            # Generate mood analysis
            analysis_prompt = f"""
            Analyze these mood patterns and provide detailed insights:
            
            {mood_summary}
            
            Consider:
            1. Overall emotional trends
            2. Triggers or patterns
            3. Areas of growth
            4. Recommendations for well-being
            
            Be specific and actionable but gentle. Provide deeper psychological insights.
            """
            
            analysis_response = model.generate_content(analysis_prompt)
            mood_analysis = analysis_response.text if analysis_response.parts else "Unable to analyze mood patterns."
            
            # Generate key insights
            insights_prompt = f"""
            Based on this data, extract 3-5 key insights for personal growth:
            
            {mood_summary}
            {journal_summary}
            
            Format as a list of actionable insights.
            """
            
            insights_response = model.generate_content(insights_prompt)
            insights_text = insights_response.text if insights_response.parts else "No insights available."
            insights = [insight.strip() for insight in insights_text.split('\n') if insight.strip() and insight.strip().startswith('-')]
            
            return AnalysisResponse(
                weekly_summary=weekly_summary,
                mood_analysis=mood_analysis,
                insights=insights[:5]  # Limit to 5 insights
            )
        
    except Exception as e:
        logger.error(f"Analysis Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Analysis Error: {str(e)}")

@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")

    try:
        # *** CHANGED TO 'gemini-pro' (Most stable model) ***
        model = genai.GenerativeModel('gemini-2.5-flash')

        response = model.generate_content(
            req.message,
            generation_config=genai.types.GenerationConfig(
                temperature=0.7,
                top_k=40,
                top_p=0.95,
                max_output_tokens=1024,
            )
        )

        if response.parts:
            reply = response.text
        else:
            # Handle cases where safety filters block the response
            logger.warning(f"Response blocked or empty. Feedback: {response.prompt_feedback}")
            reply = "I'm sorry, I couldn't generate a response for that request."

        return ChatResponse(reply=reply)

    except Exception as e:
        logger.error(f"Gemini Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"AI Service Error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)