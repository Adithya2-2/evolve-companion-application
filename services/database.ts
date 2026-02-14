import { supabase, Database } from '../lib/supabase';
import { MoodEntry, MoodOption } from '../types/moods';
import { JournalEntry } from '../types/journal';
import { UserInterest, ContentSuggestion, ContentType } from '../types/interests';

// Mood Entries
export const fetchMoodEntries = async (userId: string): Promise<MoodEntry[]> => {
  const { data, error } = await supabase
    .from('mood_entries')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Error fetching mood entries:', error);
    throw error;
  }

  return data?.map(entry => ({
    mood: {
      name: entry.mood_name,
      icon: entry.mood_icon,
      description: entry.mood_description,
      score: entry.mood_score
    } as MoodOption,
    emotion: entry.emotion_label ? {
      label: entry.emotion_label,
      confidence: entry.emotion_confidence || 0
    } : undefined,
    timestamp: new Date(entry.timestamp)
  })) || [];
};

export const insertMoodEntry = async (
  userId: string,
  mood: MoodOption,
  emotion?: { label: string; confidence: number }
): Promise<MoodEntry> => {
  const { data, error } = await supabase
    .from('mood_entries')
    .insert({
      user_id: userId,
      mood_name: mood.name,
      mood_score: mood.score,
      mood_icon: mood.icon,
      mood_description: mood.description,
      emotion_label: emotion?.label,
      emotion_confidence: emotion?.confidence
    })
    .select()
    .single();

  if (error) {
    console.error('Error inserting mood entry:', error);
    throw error;
  }

  return {
    mood,
    emotion,
    timestamp: new Date(data.timestamp)
  };
};

export const deleteMoodEntry = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('mood_entries')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting mood entry:', error);
    throw error;
  }
};

// Journal Entries
export const fetchJournalEntries = async (userId: string): Promise<JournalEntry[]> => {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching journal entries:', error);
    throw error;
  }

  return data?.map(entry => ({
    date: entry.date,
    content: entry.content,
    wordCount: entry.word_count,
    charCount: entry.char_count,
    updatedAt: new Date(entry.updated_at)
  })) || [];
};

export const fetchJournalEntryByDate = async (userId: string, date: string): Promise<JournalEntry | null> => {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle();

  if (error) {
    console.error('Error fetching journal entry by date:', error);
    throw error;
  }

  if (!data) return null;

  return {
    date: data.date,
    content: data.content,
    wordCount: data.word_count,
    charCount: data.char_count,
    updatedAt: new Date(data.updated_at),
  };
};

export const upsertJournalEntry = async (
  userId: string,
  date: string,
  content: string,
  wordCount: number,
  charCount: number
): Promise<JournalEntry> => {
  const { data, error } = await supabase
    .from('journal_entries')
    .upsert({
      user_id: userId,
      date,
      content,
      word_count: wordCount,
      char_count: charCount,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error upserting journal entry:', error);
    throw error;
  }

  return {
    date: data.date,
    content: data.content,
    wordCount: data.word_count,
    charCount: data.char_count,
    updatedAt: new Date(data.updated_at)
  };
};

export const deleteJournalEntry = async (date: string): Promise<void> => {
  const { error } = await supabase
    .from('journal_entries')
    .delete()
    .eq('date', date)
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

  if (error) {
    console.error('Error deleting journal entry:', error);
    throw error;
  }
};

// User Authentication
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    console.error('Error getting current user:', error);
    return null;
  }

  return user;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Error signing in:', error);
    throw error;
  }

  return data;
};

export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error('Error signing up:', error);
    throw error;
  }

  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Subscribe to real-time changes
export const subscribeToMoodEntries = (
  userId: string,
  callback: (payload: any) => void
) => {
  return supabase
    .channel('mood_entries')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'mood_entries',
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .subscribe();
};

export const subscribeToJournalEntries = (
  userId: string,
  callback: (payload: any) => void
) => {
  return supabase
    .channel('journal_entries')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'journal_entries',
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .subscribe();
};

// ──────────────────────────────────────────────
// Discovery Progress
// ──────────────────────────────────────────────
export const fetchDiscoveryProgress = async (
  userId: string,
  date: string
): Promise<string[]> => {
  const { data, error } = await supabase
    .from('user_discovery_progress')
    .select('completed_task_ids')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle();

  if (error) {
    console.error('Error fetching discovery progress:', error);
    return [];
  }

  return data?.completed_task_ids ?? [];
};

export const saveDiscoveryProgress = async (
  userId: string,
  date: string,
  completedTaskIds: string[]
): Promise<void> => {
  const { error } = await supabase
    .from('user_discovery_progress')
    .upsert(
      { user_id: userId, date, completed_task_ids: completedTaskIds },
      { onConflict: 'user_id,date' }
    );

  if (error) {
    console.error('Error saving discovery progress:', error);
  }
};

// ──────────────────────────────────────────────
// User Settings
// ──────────────────────────────────────────────
export const fetchUserSettings = async (
  userId: string
): Promise<Record<string, unknown> | null> => {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user settings:', error);
    return null;
  }

  return data;
};

export const saveUserSettings = async (
  userId: string,
  settings: Record<string, unknown>
): Promise<void> => {
  const { error } = await supabase
    .from('user_settings')
    .upsert(
      { user_id: userId, ...settings, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );

  if (error) {
    console.error('Error saving user settings:', error);
  }
};

// ──────────────────────────────────────────────
// User Interests
// ──────────────────────────────────────────────
export const fetchUserInterests = async (userId: string): Promise<UserInterest[]> => {
  const { data, error } = await supabase
    .from('user_interests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user interests:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    category: row.category as UserInterest['category'],
    name: row.name,
    score: Number(row.score) || 0.5,
    interestType: row.type || 'genre',
    status: row.status || null,
    metadata: row.metadata || {},
    createdAt: new Date(row.created_at),
  }));
};

export const upsertUserInterest = async (
  userId: string,
  category: string,
  name: string,
  score = 0.5,
  interestType: 'genre' | 'item' = 'genre',
  status?: string | null,
  metadata?: Record<string, any>
): Promise<void> => {
  const row: Record<string, any> = { user_id: userId, category, name, score, type: interestType };
  if (status !== undefined) row.status = status;
  if (metadata !== undefined) row.metadata = metadata;
  const { error } = await supabase
    .from('user_interests')
    .upsert(row, { onConflict: 'user_id,category,name' });
  if (error) console.error('Error upserting interest:', error);
};

export const deleteUserInterest = async (id: string): Promise<void> => {
  const { error } = await supabase.from('user_interests').delete().eq('id', id);
  if (error) console.error('Error deleting interest:', error);
};

// ──────────────────────────────────────────────
// Content Suggestions
// ──────────────────────────────────────────────
export const fetchContentSuggestions = async (
  userId: string,
  filterType?: ContentType
): Promise<ContentSuggestion[]> => {
  let query = supabase
    .from('content_suggestions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_dismissed', false)
    .order('created_at', { ascending: false })
    .limit(30);

  if (filterType) {
    query = query.eq('type', filterType);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching suggestions:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    type: row.type as ContentType,
    title: row.title,
    author: row.author,
    description: row.description,
    url: row.url,
    imageUrl: row.image_url,
    reason: row.reason,
    rationaleText: row.rationale_text || null,
    benefitText: row.benefit_text || null,
    dominantMood: row.dominant_mood,
    source: row.source,
    metadata: row.metadata || {},
    isSaved: row.is_saved ?? false,
    isDismissed: row.is_dismissed ?? false,
    createdAt: new Date(row.created_at),
  }));
};

export const insertContentSuggestions = async (
  userId: string,
  suggestions: Omit<ContentSuggestion, 'id' | 'createdAt'>[]
): Promise<void> => {
  const rows = suggestions.map(s => ({
    user_id: userId,
    type: s.type,
    title: s.title,
    author: s.author,
    description: s.description,
    url: s.url,
    image_url: s.imageUrl,
    reason: s.reason,
    rationale_text: s.rationaleText,
    benefit_text: s.benefitText,
    dominant_mood: s.dominantMood,
    source: s.source,
    metadata: s.metadata || {},
    is_saved: false,
    is_dismissed: false,
  }));

  const { error } = await supabase.from('content_suggestions').insert(rows);
  if (error) console.error('Error inserting suggestions:', error);
};

export const toggleSuggestionSaved = async (id: string, saved: boolean): Promise<void> => {
  const { error } = await supabase
    .from('content_suggestions')
    .update({ is_saved: saved })
    .eq('id', id);
  if (error) console.error('Error toggling suggestion saved:', error);
};

export const dismissSuggestion = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('content_suggestions')
    .update({ is_dismissed: true })
    .eq('id', id);
  if (error) console.error('Error dismissing suggestion:', error);
};

export const clearSuggestions = async (userId: string): Promise<void> => {
  const { error } = await supabase
    .from('content_suggestions')
    .delete()
    .eq('user_id', userId)
    .eq('is_saved', false);
  if (error) console.error('Error clearing suggestions:', error);
};

// ──────────────────────────────────────────────
// Helpers for suggestion engine
// ──────────────────────────────────────────────
export const fetchRecentMoodEntries = async (
  userId: string,
  days = 5
): Promise<MoodEntry[]> => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const { data, error } = await supabase
    .from('mood_entries')
    .select('*')
    .eq('user_id', userId)
    .gte('timestamp', cutoff.toISOString())
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Error fetching recent mood entries:', error);
    return [];
  }

  return (data || []).map(entry => ({
    mood: {
      name: entry.mood_name,
      icon: entry.mood_icon,
      description: entry.mood_description,
      score: entry.mood_score,
    } as MoodOption,
    emotion: entry.emotion_label ? {
      label: entry.emotion_label,
      confidence: entry.emotion_confidence || 0,
    } : undefined,
    timestamp: new Date(entry.timestamp),
  }));
};

export const fetchRecentJournalEntries = async (
  userId: string,
  days = 5
): Promise<JournalEntry[]> => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .gte('date', cutoff.toISOString().split('T')[0])
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching recent journal entries:', error);
    return [];
  }

  return (data || []).map(entry => ({
    date: entry.date,
    content: entry.content,
    wordCount: entry.word_count,
    charCount: entry.char_count,
    updatedAt: new Date(entry.updated_at),
  }));
};
