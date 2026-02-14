# Supabase Integration Guide

This guide will help you integrate Supabase for persistent storage of mood and journal data.

## 🚀 Prerequisites

1. **Supabase Account**: Create a free account at [supabase.com](https://supabase.com)
2. **Node.js 18+**: Already installed for the frontend

## 📋 Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Give your project a name (e.g., "evolve-growth-app")
4. Wait for the project to be created (takes about 1 minute)

## 🗄️ Step 2: Set Up Database

1. In your Supabase project, go to **SQL Editor**
2. Copy and paste the contents of `supabase/schema.sql` from this project
3. Click **Run** to execute the SQL script
4. This will create:
   - `mood_entries` table for storing mood data
   - `journal_entries` table for storing journal data
   - Row Level Security (RLS) policies for privacy

## 🔑 Step 3: Get API Keys

1. In Supabase, go to **Settings** → **API**
2. Find your **Project URL** and **anon public** key
3. Copy these values

## ⚙️ Step 4: Configure Environment Variables

Create a `.env` file in the **root** of your project:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend Configuration (already exists)
GEMINI_API_KEY=your_gemini_api_key
```

Replace:
- `your_supabase_project_url` with your actual Project URL
- `your_supabase_anon_key` with your actual anon key

## 📦 Step 5: Install Dependencies

```bash
npm install @supabase/supabase-js
```

## 🔄 Step 6: Update Vite Configuration

If you haven't already, update your `vite.config.ts` to handle environment variables:

```typescript
import { defineConfig } from 'vite'

export default defineConfig({
  define: {
    // Add this if not already present
  },
  // ... rest of your config
})
```

## 🚀 Step 7: Run the Application

1. **Start the backend** (if not already running):
   ```bash
   cd backend
   uvicorn main:app --reload
   ```

2. **Start the frontend**:
   ```bash
   npm run dev
   ```

## ✅ Features Enabled

After integration, you'll have:

- **Persistent Storage**: All mood and journal data saved to Supabase
- **User Authentication**: Sign up/sign in functionality
- **Real-time Sync**: Data syncs across devices
- **Privacy**: Row Level Security ensures users only see their own data
- **Offline Support**: Local caching with sync when online

## 🧪 Testing the Integration

1. Open the app in your browser
2. Click "Sign Up" to create a new account
3. Verify you can log in and see your data persist
4. Add some mood entries and journal entries
5. Refresh the page - data should still be there

## 🔧 Troubleshooting

### "Cannot find module '@supabase/supabase-js'"
- Run: `npm install @supabase/supabase-js`
- Restart your dev server

### "Property 'env' does not exist on type 'ImportMeta'"
- Update your `vite.config.ts` to include the `define` configuration
- Restart your dev server

### "Database connection failed"
- Verify your `.env` variables are correct
- Check Supabase project is active
- Ensure SQL schema was applied successfully

## 📚 Additional Notes

- The app uses Row Level Security (RLS) for privacy
- Each user can only access their own data
- The `user_id` field links entries to the authenticated user
- Real-time subscriptions are set up for future features

## 🎉 Next Steps

Once integrated:
1. Your data persists across sessions
2. You can access your data from any device
3. Future features can use this foundation for collaboration
4. All AI insights work with your persistent data
