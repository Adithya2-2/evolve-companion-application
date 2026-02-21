# Evolve: Update Log
*Date: February 21, 2026*

This document summarizes all the major features, bug fixes, and performance improvements integrated into the project for the current release.

## 1. Dynamic Backgrounds & Customization
- **Light Mode Canvas Integration**: Built and integrated the `WellnessBackgroundLight.tsx` React component. When the "Warm Day" theme is active, the app now uses a beautiful, animated canvas background equipped with a delicate particle and light-blob system to mirror the dark mode experience.
- **AI Background Generator Override**: Revamped the Appearance settings to completely deprecate the static background preset grid and file uploads. Replaced them with a robust "AI Background" prompt system.
- **Stable AI Proxy Integration**: Resolved a bug causing AI image generation to produce "white screens." Swapped failing endpoints to use the highly reliable `pollinations.ai` inference API. The background seamlessly falls back to the dynamic canvas upon errors or timeouts.

## 2. Advanced AI Integration & Fixes
- **Strict Content Categorization**: Enforced strict rules inside the Groq AI JSON prompt payloads to prevent generation hallucinations. The database and front-end now cleanly restrict "type" fields to `book`, `movie`, `podcast`, and `music`.
- **Music DNA Radar Map**: Overhauled the Interests schema to handle musical personalization on its own tier. Created a dedicated "Music DNA" tab in the Radar Map visualization.
- **AI Genre Extraction (`inferItemGenres`)**: Built a brand new AI pipeline to analyze custom search queries and assign them exactly 1 to 3 pre-approved genres (e.g., `Synthwave`, `Indie`) preventing general media genres (like `Sci-Fi`) from bleeding into the user's specific Music DNA map.

## 3. Global User Interface Enhancements
- **Global Legibility Upgrades**: Injected advanced CSS stroke (`-webkit-text-stroke: 0.5px`) into the glassmorphism layout classes. All content maintains perfect contrast and readability even when overlaying high-brightness canvas animations.
- **Beautified Mood Trend Chart**: The chart now displays dedicated numerical "grade" cards (e.g., `8.5/10`) below the primary axis, injecting rich color accents directly related to the detected emotional spectrum.
- **Log Mood Modal Centering**: Rebuilt the layout grid of the mood tracking modal using Flexbox architecture to guarantee precise viewport centering dynamically.
- **Inspirational Quote System**: Deployed a dynamic, randomized quote generator utilizing 10 highly resonant mental-health and philosophical quotes inside `QuoteCard.tsx`.

## 4. Journaling Tool Polish
- **Persistent Bookmarking**: Integrated a hidden `isFavorite` column within the Supabase `journal_entries` table. Added a polished 'Bookmarks' slide-in sidebar on the Journal page to instantly view all curated favorite entries.
- **Calendar Date Picker Fix**: Restructured the date input to leverage a hidden native `<input type="date">` activated via `.showPicker()`, eliminating a localized buggy click-box event.

## 5. Backend Security & Performance Checkup
- **RLS Query Optimization**: Overhauled 27 Row Level Security (RLS) policies within Supabase. Shifted runtime policies from `auth.uid()` to `(select auth.uid())`, drastically boosting database query resolution speed at scale.
- **Security Patches**: Corrected a `function_search_path_mutable` vulnerability within the `handle_new_user` Postgres function by isolating the default `search_path = public`.
- **Indexing Enhancements**: Boosted response speeds regarding chat functionalities by patching a missing index on the `chat_messages(user_id)` foreign key constraint.
