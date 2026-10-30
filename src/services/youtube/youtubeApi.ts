// API Config
export const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
export const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

if (!YOUTUBE_API_KEY) {
  console.warn('VITE_YOUTUBE_API_KEY is not configured in the environment.');
}
