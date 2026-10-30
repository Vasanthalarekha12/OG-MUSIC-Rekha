import { YOUTUBE_API_BASE, YOUTUBE_API_KEY } from './youtubeApi';
import type { YouTubeSearchResponse, YouTubeSearchResult } from './youtubeTypes';
import { youtubeCache } from './youtubeCache';
import type { Song } from '../../types';

export const normalizeYouTubeVideo = (item: YouTubeSearchResult): Song => {
  return {
    id: item.id.videoId || item.id.playlistId || item.id.channelId || item.id.kind,
    sourceType: 'youtube',
    title: item.snippet.title,
    artistId: item.snippet.channelId,
    artistName: item.snippet.channelTitle,
    coverUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
    embedUrl: item.id.videoId ? `https://www.youtube.com/embed/${item.id.videoId}` : undefined,
    videoUrl: item.id.videoId ? `https://www.youtube.com/watch?v=${item.id.videoId}` : undefined,
    releaseDate: item.snippet.publishedAt,
  };
};

class YouTubeService {
  async search(query: string, maxResults: number = 24, pageToken?: string): Promise<{ items: Song[], nextPageToken?: string }> {
    if (!YOUTUBE_API_KEY) throw new Error('YouTube API Key is missing.');
    
    const cacheKey = `search_${query}_${maxResults}_${pageToken || ''}`;
    
    const response = await youtubeCache.getOrFetch<YouTubeSearchResponse>(cacheKey, async () => {
      let url = `${YOUTUBE_API_BASE}/search?part=snippet&type=video&videoEmbeddable=true&maxResults=${maxResults}&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}`;
      if (pageToken) url += `&pageToken=${pageToken}`;

      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 403) throw new Error('YouTube API quota exceeded or forbidden (403).');
        if (res.status === 401) throw new Error('YouTube API Key is invalid (401).');
        throw new Error(`YouTube search failed with status: ${res.status}`);
      }
      return await res.json();
    }, { ttlSeconds: 900 }); // 15 minutes

    return {
      items: response.items.map(normalizeYouTubeVideo),
      nextPageToken: response.nextPageToken
    };
  }

  async getTrendingMusic(regionCode: string = 'IN', maxResults: number = 12): Promise<Song[]> {
    if (!YOUTUBE_API_KEY) throw new Error('YouTube API Key is missing.');
    
    const cacheKey = `trending_${regionCode}_${maxResults}`;
    
    const response = await youtubeCache.getOrFetch<YouTubeSearchResponse>(cacheKey, async () => {
      const url = `${YOUTUBE_API_BASE}/search?part=snippet&type=video&videoCategoryId=10&order=viewCount&regionCode=${regionCode}&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Trending search failed: ${res.status}`);
      return await res.json();
    }, { ttlSeconds: 1800 }); // 30 minutes
    
    return response.items.map(normalizeYouTubeVideo);
  }

  async getCategoryMusic(category: string, maxResults: number = 12): Promise<Song[]> {
    if (!YOUTUBE_API_KEY) throw new Error('YouTube API Key is missing.');
    
    // Convert generic category to a targeted YouTube query
    const queryMap: Record<string, string> = {
      'Telugu': 'Telugu hit songs official music video',
      'Workout': 'Workout motivation music',
      'Devotional': 'Devotional songs bhakti',
      'Chill': 'Chill relaxing lo-fi music'
    };
    
    const query = queryMap[category] || `${category} popular songs music video`;
    const cacheKey = `category_${category}_${maxResults}`;
    
    const response = await youtubeCache.getOrFetch<YouTubeSearchResponse>(cacheKey, async () => {
      const url = `${YOUTUBE_API_BASE}/search?part=snippet&type=video&maxResults=${maxResults}&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Category search failed: ${res.status}`);
      return await res.json();
    }, { ttlSeconds: 3600 }); // 1 hour
    
    return response.items.map(normalizeYouTubeVideo);
  }

  async getVideoDetails(videoId: string): Promise<Song | null> {
    if (!videoId) return null;
    const cacheKey = `video_meta_${videoId}`;
    try {
      const song = await youtubeCache.getOrFetch<Song | null>(cacheKey, async () => {
        if (YOUTUBE_API_KEY) {
          try {
            const url = `${YOUTUBE_API_BASE}/videos?part=snippet&id=${encodeURIComponent(videoId)}&key=${YOUTUBE_API_KEY}`;
            const res = await fetch(url);
            if (res.ok) {
              const data = await res.json();
              if (data.items && data.items.length > 0) {
                const item = data.items[0];
                return {
                  id: videoId,
                  sourceType: 'youtube' as const,
                  title: item.snippet.title,
                  artistId: item.snippet.channelId,
                  artistName: item.snippet.channelTitle,
                  coverUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
                  embedUrl: `https://www.youtube.com/embed/${videoId}`,
                  videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
                  releaseDate: item.snippet.publishedAt,
                };
              }
            }
          } catch {
            // fallback to oembed
          }
        }

        try {
          const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}&format=json`;
          const res = await fetch(oembedUrl);
          if (res.ok) {
            const data = await res.json();
            return {
              id: videoId,
              sourceType: 'youtube' as const,
              title: data.title || 'Official Music Video',
              artistId: 'yt-channel',
              artistName: data.author_name || 'Official Channel',
              coverUrl: data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
              embedUrl: `https://www.youtube.com/embed/${videoId}`,
              videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
            };
          }
        } catch {}

        return {
          id: videoId,
          sourceType: 'youtube' as const,
          title: 'Official HD Music Video',
          artistId: 'yt-channel',
          artistName: 'Official Channel',
          coverUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
          videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
        };
      }, { ttlSeconds: 86400 });

      return song;
    } catch {
      return null;
    }
  }
}

export const youtubeService = new YouTubeService();

