import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      mood_entries: {
        id: string;
        user_id: string;
        mood_name: string;
        mood_score: number;
        mood_icon: string;
        mood_description: string;
        emotion_label?: string;
        emotion_confidence?: number;
        timestamp: string;
        created_at: string;
      };
      journal_entries: {
        id: string;
        user_id: string;
        date: string;
        content: string;
        word_count: number;
        char_count: number;
        updated_at: string;
        created_at: string;
      };
    };
  };
}
