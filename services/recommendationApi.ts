/**
 * External API clients for content recommendations.
 * Every function now returns rich metadata (genres, full description)
 * so the AI engine can use it for deeper personalization.
 *
 * APIs: OpenLibrary (books), iTunes (podcasts + music), TMDB (movies).
 */

/* ──────────────── Types ──────────────── */

export interface ApiResult {
    type: 'book' | 'movie' | 'podcast' | 'music';
    title: string;
    author: string | null;
    description: string | null;
    url: string | null;
    imageUrl: string | null;
    source: string;
    /** Genres / subjects / categories extracted from the API */
    genres: string[];
    /** Year of release / publication */
    year: string | null;
    /** External ID (ISBN, TMDB id, iTunes trackId) */
    externalId: string | null;
}

/* ──────────────── Open Library (Books) ──────────────── */

/** Subjects that look like genres but are actually noise */
const JUNK_SUBJECTS = new Set([
    'new york times bestseller', 'bestseller', 'bestsellers',
    'paperback', 'hardcover', 'large print', 'large type',
    'edition', 'special edition', 'revised edition',
    'fiction', 'nonfiction', 'non-fiction', 'general',
    'literature', 'american literature', 'english literature',
    'accessible book', 'protected daisy', 'in library',
    'open library staff picks', 'reading program', 'book club',
    'young adult', 'juvenile', 'children', 'children\'s',
    'lending library', 'internet archive wishlist',
    'long now manual for civilization',
]);

/** Clean genre categories we actually want */
const VALID_GENRES: Record<string, string> = {
    'self-help': 'Self-Help', 'self help': 'Self-Help',
    'psychology': 'Psychology', 'philosophy': 'Philosophy',
    'science fiction': 'Sci-Fi', 'sci-fi': 'Sci-Fi',
    'fantasy': 'Fantasy', 'mystery': 'Mystery',
    'thriller': 'Thriller', 'suspense': 'Thriller',
    'romance': 'Romance', 'horror': 'Horror',
    'biography': 'Biography', 'autobiography': 'Biography',
    'biographies': 'Biography', 'memoir': 'Memoir',
    'history': 'History', 'historical fiction': 'Historical Fiction',
    'science': 'Science', 'popular science': 'Science',
    'business': 'Business', 'economics': 'Business',
    'entrepreneurship': 'Business', 'finance': 'Finance',
    'technology': 'Technology', 'computers': 'Technology',
    'art': 'Art', 'music': 'Music', 'poetry': 'Poetry',
    'drama': 'Drama', 'comedy': 'Comedy', 'humor': 'Humor',
    'health': 'Health', 'wellness': 'Wellness',
    'spirituality': 'Spirituality', 'religion': 'Religion',
    'travel': 'Travel', 'adventure': 'Adventure',
    'true crime': 'True Crime', 'crime': 'Crime',
    'cooking': 'Cooking', 'food': 'Food',
    'sports': 'Sports', 'nature': 'Nature',
    'politics': 'Politics', 'sociology': 'Sociology',
    'education': 'Education', 'parenting': 'Parenting',
    'productivity': 'Productivity', 'motivation': 'Motivation',
    'mindfulness': 'Mindfulness', 'meditation': 'Mindfulness',
    'stoicism': 'Philosophy', 'existentialism': 'Philosophy',
    'dystopian': 'Dystopian', 'utopian': 'Dystopian',
    'graphic novel': 'Graphic Novel', 'comics': 'Comics',
};

/** Extract clean genres from raw OpenLibrary subjects */
function cleanGenres(rawSubjects: string[]): string[] {
    const result: string[] = [];
    const seen = new Set<string>();

    for (const raw of rawSubjects) {
        const lower = raw.toLowerCase().trim();

        // Skip junk
        if (JUNK_SUBJECTS.has(lower)) continue;
        if (lower.length < 3 || lower.length > 40) continue;

        // Try direct mapping
        const mapped = VALID_GENRES[lower];
        if (mapped && !seen.has(mapped)) {
            seen.add(mapped);
            result.push(mapped);
        } else {
            // Try partial match (e.g., "science fiction & fantasy" → Sci-Fi)
            for (const [key, val] of Object.entries(VALID_GENRES)) {
                if (lower.includes(key) && !seen.has(val)) {
                    seen.add(val);
                    result.push(val);
                    break;
                }
            }
        }

        if (result.length >= 4) break;
    }

    return result;
}

/** Fetch description from OpenLibrary Works API */
async function fetchWorkDescription(workKey: string): Promise<string | null> {
    try {
        const res = await fetch(`https://openlibrary.org${workKey}.json`);
        if (!res.ok) return null;
        const data = await res.json();

        if (typeof data.description === 'string') return data.description;
        if (data.description?.value) return data.description.value;

        // Try excerpts
        if (data.excerpts && data.excerpts.length > 0) {
            return data.excerpts[0].excerpt || null;
        }

        return null;
    } catch {
        return null;
    }
}

export async function searchBooks(query: string, limit = 6): Promise<ApiResult[]> {
    try {
        const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=${limit}&fields=title,author_name,first_sentence,cover_i,key,subject,first_publish_year,isbn`;
        const res = await fetch(url);
        if (!res.ok) return [];
        const data = await res.json();

        const docs = (data.docs || []).slice(0, limit);

        // Fetch descriptions in parallel for top results
        const results = await Promise.all(docs.map(async (doc: any) => {
            const genres = cleanGenres(doc.subject || []);

            // Try first_sentence, then deep-fetch from Works API
            let description: string | null = Array.isArray(doc.first_sentence)
                ? doc.first_sentence[0]
                : doc.first_sentence || null;

            if ((!description || description.length < 30) && doc.key) {
                const deepDesc = await fetchWorkDescription(doc.key);
                if (deepDesc) {
                    // Trim to reasonable length for display
                    description = deepDesc.length > 300
                        ? deepDesc.slice(0, 297) + '...'
                        : deepDesc;
                }
            }

            return {
                type: 'book' as const,
                title: doc.title || 'Unknown Title',
                author: doc.author_name?.[0] || null,
                description,
                url: doc.key ? `https://openlibrary.org${doc.key}` : null,
                imageUrl: doc.cover_i
                    ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
                    : null,
                source: 'OpenLibrary',
                genres,
                year: doc.first_publish_year ? String(doc.first_publish_year) : null,
                externalId: doc.isbn?.[0] || doc.key || null,
            };
        }));

        return results.length > 0 ? results : getCuratedItem('book', query, limit);
    } catch (e) {
        console.error('OpenLibrary search failed, using fallback:', e);
        return getCuratedItem('book', query, limit);
    }
}

/* ──────────────── iTunes Search (Podcasts) ──────────────── */

export async function searchPodcasts(query: string, limit = 6): Promise<ApiResult[]> {
    try {
        const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=podcast&limit=${limit}`;
        const res = await fetch(url);
        if (!res.ok) return getCuratedItem('podcast', query, limit);
        const data = await res.json();

        const results = (data.results || []).slice(0, limit).map((item: any) => {
            const genres: string[] = [];
            if (item.primaryGenreName) genres.push(item.primaryGenreName);
            if (Array.isArray(item.genres)) {
                for (const g of item.genres) {
                    if (!genres.includes(g)) genres.push(g);
                }
            }

            return {
                type: 'podcast' as const,
                title: item.trackName || item.collectionName || 'Unknown',
                author: item.artistName || null,
                description: item.shortDescription || item.description || null,
                url: item.trackViewUrl || item.collectionViewUrl || null,
                imageUrl: item.artworkUrl100?.replace('100x100', '600x600') || null,
                source: 'iTunes',
                genres,
                year: item.releaseDate ? item.releaseDate.slice(0, 4) : null,
                externalId: item.trackId ? String(item.trackId) : null,
            };
        });

        return results.length > 0 ? results : getCuratedItem('podcast', query, limit);
    } catch (e) {
        console.error('iTunes search failed, using fallback:', e);
        return getCuratedItem('podcast', query, limit);
    }
}

/* ──────────────── iTunes Search (Music) ──────────────── */

export async function searchMusic(query: string, limit = 6): Promise<ApiResult[]> {
    try {
        const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=${limit}`;
        const res = await fetch(url);
        if (!res.ok) return getCuratedItem('music', query, limit);
        const data = await res.json();

        const results = (data.results || []).slice(0, limit).map((item: any) => {
            const genres: string[] = [];
            if (item.primaryGenreName) genres.push(item.primaryGenreName);

            return {
                type: 'music' as const,
                title: item.trackName || 'Unknown',
                author: item.artistName || null,
                description: item.collectionName
                    ? `From album: ${item.collectionName}`
                    : null,
                url: item.trackViewUrl || null,
                imageUrl: item.artworkUrl100?.replace('100x100', '600x600') || null,
                source: 'iTunes Music',
                genres,
                year: item.releaseDate ? item.releaseDate.slice(0, 4) : null,
                externalId: item.trackId ? String(item.trackId) : null,
            };
        });

        return results.length > 0 ? results : getCuratedItem('music', query, limit);
    } catch (e) {
        console.error('iTunes Music search failed, using fallback:', e);
        return getCuratedItem('music', query, limit);
    }
}

/* ──────────────── OMDB (Movies) ──────────────── */

const OMDB_BASE = 'https://www.omdbapi.com';

function getOmdbKey(): string | undefined {
    // @ts-ignore
    return import.meta.env.VITE_OMDB_API_KEY;
}

export async function searchMovies(
    query: string,
    _apiKeyIgnored?: string, // kept for signature compatibility but ignored
    limit = 6
): Promise<ApiResult[]> {
    const apiKey = getOmdbKey();
    if (!apiKey || apiKey.includes('REPLACE')) return getCuratedMovies(query, limit);

    try {
        const url = `${OMDB_BASE}/?s=${encodeURIComponent(query)}&apikey=${apiKey}&type=movie`;
        const res = await fetch(url);
        if (!res.ok) return getCuratedMovies(query, limit);

        const data = await res.json();
        if (data.Response === 'False') return getCuratedMovies(query, limit);

        const results = (data.Search || []).slice(0, limit);

        // Fetch detailed info for each movie to get Plot and Genre
        const detailedResults = await Promise.all(results.map(async (m: any) => {
            try {
                const detailRes = await fetch(`${OMDB_BASE}/?i=${m.imdbID}&apikey=${apiKey}&plot=short`);
                const detail = await detailRes.json();

                return {
                    type: 'movie' as const,
                    title: detail.Title || m.Title,
                    author: detail.Director !== 'N/A' ? detail.Director : null,
                    description: detail.Plot !== 'N/A' ? detail.Plot : null,
                    url: `https://www.imdb.com/title/${m.imdbID}/`,
                    imageUrl: (m.Poster && m.Poster !== 'N/A') ? m.Poster : null,
                    source: 'OMDB',
                    genres: detail.Genre ? detail.Genre.split(', ') : [],
                    year: detail.Year || m.Year,
                    externalId: m.imdbID
                };
            } catch {
                return null;
            }
        }));

        return detailedResults.filter((Boolean) as any);

    } catch (e) {
        console.error('OMDB search failed:', e);
        return getCuratedMovies(query, limit);
    }
}

/* ──────── Curated fallback (Guaranteed Content) ──────── */

const CURATED_CONTENT: Record<string, Record<string, ApiResult[]>> = {
    book: {
        comfort: [
            { type: 'book', title: 'The Boy, the Mole, the Fox and the Horse', author: 'Charlie Mackesy', description: 'A beautifully illustrated book exploring friendship and kindness.', url: null, imageUrl: 'https://covers.openlibrary.org/b/id/8447473-M.jpg', source: 'Curated', genres: ['Self-Help', 'Art'], year: '2019', externalId: '9780062976581' },
            { type: 'book', title: 'The House in the Cerulean Sea', author: 'TJ Klune', description: 'magical island, dangerous children, and a care worker who finds a family.', url: null, imageUrl: 'https://covers.openlibrary.org/b/id/10587635-M.jpg', source: 'Curated', genres: ['Fantasy', 'Fiction'], year: '2020', externalId: '9781250217288' }
        ],
        growth: [
            { type: 'book', title: 'Atomic Habits', author: 'James Clear', description: 'Tiny changes, remarkable results. A guide to building good habits.', url: null, imageUrl: 'https://covers.openlibrary.org/b/id/8568466-M.jpg', source: 'Curated', genres: ['Self-Help', 'Business'], year: '2018', externalId: '9780735211292' },
            { type: 'book', title: 'Mindset', author: 'Carol S. Dweck', description: 'The new psychology of success. How we can learn to fulfill our potential.', url: null, imageUrl: 'https://covers.openlibrary.org/b/id/8253139-M.jpg', source: 'Curated', genres: ['Psychology'], year: '2006', externalId: '9780345472328' }
        ],
        calm: [
            { type: 'book', title: 'Siddhartha', author: 'Hermann Hesse', description: 'A synthesis of Eastern and Western philosophies concerning the path to the soul.', url: null, imageUrl: 'https://covers.openlibrary.org/b/id/7361453-M.jpg', source: 'Curated', genres: ['Fiction', 'Philosophy'], year: '1922', externalId: null }
        ],
        default: [
            { type: 'book', title: 'Man\'s Search for Meaning', author: 'Viktor E. Frankl', description: 'A psychologist\'s experience in the concentration camps and his psychotherapeutic practice.', url: null, imageUrl: 'https://covers.openlibrary.org/b/id/351608-M.jpg', source: 'Curated', genres: ['Psychology', 'History'], year: '1946', externalId: null }
        ]
    },
    podcast: {
        growth: [
            { type: 'podcast', title: 'Huberman Lab', author: 'Andrew Huberman', description: 'Discusses neuroscience and how our brain and its connections control our perceptions.', url: null, imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts116/v4/4a/c3/97/4ac39763-706a-a10c-309d-16be99434860/mza_11674311804961868744.jpg/600x600bb.jpg', source: 'Curated', genres: ['Science', 'Health'], year: '2021', externalId: null },
            { type: 'podcast', title: 'The Daily Stoic', author: 'Ryan Holiday', description: 'A daily podcast to help you live your best life using Stoic wisdom.', url: null, imageUrl: null, source: 'Curated', genres: ['Philosophy'], year: '2018', externalId: null }
        ],
        comfort: [
            { type: 'podcast', title: 'On Being', author: 'Krista Tippett', description: 'Examining what it calls the "animating questions at the center of human life".', url: null, imageUrl: null, source: 'Curated', genres: ['Society', 'Philosophy'], year: '2003', externalId: null }
        ],
        default: [
            { type: 'podcast', title: 'TED Talks Daily', author: 'TED', description: 'Every weekday, TED Talks Daily brings you the latest talks in audio.', url: null, imageUrl: null, source: 'Curated', genres: ['Education'], year: '2023', externalId: null }
        ]
    },
    music: {
        calm: [
            { type: 'music', title: 'Weightless', author: 'Marconi Union', description: 'Ambient track designed to reduce anxiety.', url: null, imageUrl: null, source: 'Curated', genres: ['Ambient'], year: '2011', externalId: null },
            { type: 'music', title: 'Gymnopédie No.1', author: 'Erik Satie', description: 'Classical piano piece known for its calming effect.', url: null, imageUrl: null, source: 'Curated', genres: ['Classical'], year: '1888', externalId: null }
        ],
        energy: [
            { type: 'music', title: 'Happy', author: 'Pharrell Williams', description: 'Upbeat soul song.', url: null, imageUrl: null, source: 'Curated', genres: ['Pop', 'Soul'], year: '2013', externalId: null }
        ],
        default: [
            { type: 'music', title: 'Clair de Lune', author: 'Claude Debussy', description: 'Classic impressionist piano suite.', url: null, imageUrl: null, source: 'Curated', genres: ['Classical'], year: '1905', externalId: null }
        ]
    }
};

function getCuratedItem(type: 'book' | 'podcast' | 'music', query: string, limit: number): ApiResult[] {
    const section = CURATED_CONTENT[type];
    if (!section) return [];

    // Simple heuristic: check if query matches key words
    const lq = query.toLowerCase();

    let candidates: ApiResult[] = [];
    if (lq.includes('calm') || lq.includes('stress')) candidates = section.calm || [];
    else if (lq.includes('energy') || lq.includes('happy')) candidates = section.energy || [];
    else if (lq.includes('growth') || lq.includes('focus')) candidates = section.growth || [];
    else if (lq.includes('comfort') || lq.includes('sad')) candidates = section.comfort || [];

    if (candidates.length === 0) candidates = section.default || [];

    // If really nothing, try all
    if (candidates.length === 0) {
        candidates = Object.values(section).flat();
    }

    return candidates.slice(0, limit);
}

const CURATED_MOVIES: Record<string, ApiResult[]> = {
    comfort: [
        { type: 'movie', title: 'The Secret Life of Walter Mitty', author: 'Ben Stiller', description: 'A daydreamer embarks on a real-life adventure — uplifting and visually stunning.', url: 'https://www.imdb.com/title/tt0359950/', imageUrl: 'https://m.media-amazon.com/images/M/MV5BNjBlOGFkMDktNDg2OC00MTRhLTg3YmEtMGI1OGI5MjgxNGE2XkEyXkFqcGc@._V1_.jpg', source: 'Curated', genres: ['Adventure', 'Comedy', 'Drama'], year: '2013', externalId: null },
        { type: 'movie', title: 'Soul', author: 'Pete Docter', description: 'A music teacher has a near-death experience and discovers the meaning of life.', url: 'https://www.imdb.com/title/tt2948372/', imageUrl: 'https://m.media-amazon.com/images/M/MV5BZGE1MDg5M2MtNTkyZS00MTY5LTg1YzUtZTlhZmM1Y2EwNmFmXkEyXkFqcGc@._V1_.jpg', source: 'Curated', genres: ['Animation', 'Comedy', 'Fantasy'], year: '2020', externalId: null },
    ],
    adventure: [
        { type: 'movie', title: 'Into the Wild', author: 'Sean Penn', description: 'Based on a true story of a young man who abandoned everything to find freedom.', url: 'https://www.imdb.com/title/tt0758758/', imageUrl: 'https://m.media-amazon.com/images/M/MV5BMTAwNDEyODU1MjheQTJeQWpwZ15BbWU2MDc3NDQwNw@@._V1_.jpg', source: 'Curated', genres: ['Adventure', 'Biography', 'Drama'], year: '2007', externalId: null },
        { type: 'movie', title: 'The Shawshank Redemption', author: 'Frank Darabont', description: 'A banker sentenced to life finds unexpected ways to survive with hope.', url: 'https://www.imdb.com/title/tt0111161/', imageUrl: 'https://m.media-amazon.com/images/M/MV5BMDAyY2FhYjctNDc5OS00MDNlLThiMGUtY2UxYWVkNGY2ZjljXkEyXkFqcGc@._V1_.jpg', source: 'Curated', genres: ['Drama'], year: '1994', externalId: null },
    ],
    calm: [
        { type: 'movie', title: 'My Neighbor Totoro', author: 'Hayao Miyazaki', description: 'Two sisters discover a magical forest spirit in rural Japan — peaceful and heartwarming.', url: 'https://www.imdb.com/title/tt0096283/', imageUrl: 'https://m.media-amazon.com/images/M/MV5BYWM3MDE3YjEtMzIzZC00ODE5LThjZGYtZGFjODFiMjI0MGQ5XkEyXkFqcGc@._V1_.jpg', source: 'Curated', genres: ['Animation', 'Family', 'Fantasy'], year: '1988', externalId: null },
    ],
    comedy: [
        { type: 'movie', title: 'The Grand Budapest Hotel', author: 'Wes Anderson', description: 'A quirky, colourful heist adventure set in a fictional European hotel.', url: 'https://www.imdb.com/title/tt2278388/', imageUrl: 'https://m.media-amazon.com/images/M/MV5BMzM5NjUxOTEyMl5BMl5BanBnXkFtZTgwNjEyMDM0MDE@._V1_.jpg', source: 'Curated', genres: ['Adventure', 'Comedy', 'Crime'], year: '2014', externalId: null },
    ],
    default: [
        { type: 'movie', title: 'Interstellar', author: 'Christopher Nolan', description: 'A team of explorers travel through a wormhole in space to ensure humanity\'s survival.', url: 'https://www.imdb.com/title/tt0816692/', imageUrl: 'https://m.media-amazon.com/images/M/MV5BYzdjMDAxZGItMjI2My00ODA1LTlkNzItOWFjMDU5ZDJlYWY3XkEyXkFqcGc@._V1_.jpg', source: 'Curated', genres: ['Adventure', 'Drama', 'Science Fiction'], year: '2014', externalId: null },
        { type: 'movie', title: 'Good Will Hunting', author: 'Gus Van Sant', description: 'A janitor at MIT has a gift for mathematics but needs help finding direction in life.', url: 'https://www.imdb.com/title/tt0119217/', imageUrl: 'https://m.media-amazon.com/images/M/MV5BOTI0MzcxMTYtZDVkMy00NjY1LTgyMTYtZmUxN2M3NmQ2NWJhXkEyXkFqcGc@._V1_.jpg', source: 'Curated', genres: ['Drama', 'Romance'], year: '1997', externalId: null },
    ],
};

function getCuratedMovies(query: string, limit: number): ApiResult[] {
    const lq = query.toLowerCase();
    for (const [key, movies] of Object.entries(CURATED_MOVIES)) {
        if (lq.includes(key)) return movies.slice(0, limit);
    }
    return (CURATED_MOVIES.default || []).slice(0, limit);
}
