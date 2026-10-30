import type { Album, Song } from '../../../types';
import { decodeHtmlEntities, slugify } from '../../../utils/stringUtils';

interface iTunesAlbumResult {
  wrapperType: string;
  collectionType: string;
  artistId: number;
  collectionId: number;
  artistName: string;
  collectionName: string;
  collectionViewUrl?: string;
  artworkUrl100?: string;
  trackCount: number;
  releaseDate?: string;
  primaryGenreName?: string;
  country?: string;
}

interface iTunesTrackResult {
  wrapperType: string;
  kind?: string;
  artistId: number;
  collectionId: number;
  trackId: number;
  artistName: string;
  collectionName: string;
  trackName: string;
  previewUrl?: string;
  artworkUrl100?: string;
  trackTimeMillis?: number;
  trackNumber?: number;
  discNumber?: number;
  releaseDate?: string;
  primaryGenreName?: string;
}

const KNOWN_LANGUAGES = ['Telugu', 'Tamil', 'Hindi', 'Malayalam', 'Kannada', 'English', 'Bengali', 'Punjabi', 'Marathi', 'Gujarati'];

function detectLanguage(title: string, genre?: string): string[] {
  const detected: string[] = [];
  if (genre) {
    const found = KNOWN_LANGUAGES.find(l => l.toLowerCase() === genre.toLowerCase());
    if (found) detected.push(found.toLowerCase());
  }
  for (const lang of KNOWN_LANGUAGES) {
    const regex = new RegExp(`[\\(\\[\\-_\\s]${lang}[\\)\\]\\-_\\s]`, 'i');
    if (regex.test(title) && !detected.includes(lang.toLowerCase())) {
      detected.push(lang.toLowerCase());
    }
  }
  return detected.length > 0 ? detected : ['indian'];
}

function getHighResArtwork(url?: string): string | undefined {
  if (!url) return undefined;
  return url.replace('100x100bb', '1000x1000bb').replace('60x60bb', '1000x1000bb');
}

class SoundtrackService {
  private albumCache = new Map<string, { album: Album; tracks: Song[]; timestamp: number }>();
  private searchCache = new Map<string, { results: Album[]; timestamp: number }>();
  private readonly CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

  /**
   * Universal search for movie soundtrack albums across any query
   */
  async searchMovieSoundtracks(query: string): Promise<Album[]> {
    const cleanQuery = query.trim();
    if (!cleanQuery) return [];

    const cacheKey = cleanQuery.toLowerCase();
    const cached = this.searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.results;
    }

    try {
      // Search iTunes Store for albums
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(cleanQuery)}&entity=album&media=music&limit=25`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Album search failed with status: ${res.status}`);
      
      const data = await res.json();
      const rawAlbums: iTunesAlbumResult[] = data.results || [];

      // Filter and map albums
      const albums: Album[] = rawAlbums.map(raw => {
        const coverUrl = getHighResArtwork(raw.artworkUrl100);
        const releaseYear = raw.releaseDate ? new Date(raw.releaseDate).getFullYear() : 2024;
        
        return {
          id: `soundtrack-album-${raw.collectionId}`,
          title: decodeHtmlEntities(raw.collectionName),
          artistId: `artist-${raw.artistId || slugify(raw.artistName)}`,
          artistName: decodeHtmlEntities(raw.artistName),
          coverUrl,
          releaseYear,
          providerAlbumId: String(raw.collectionId),
          albumUrl: raw.collectionViewUrl,
          songCount: raw.trackCount
        };
      });

      this.searchCache.set(cacheKey, { results: albums, timestamp: Date.now() });
      return albums;
    } catch (e) {
      console.error('Error searching soundtrack albums:', e);
      return [];
    }
  }

  /**
   * Fetch canonical album details and its complete ordered tracklist
   */
  async getAlbumWithTracks(albumId: string): Promise<{ album: Album | null; tracks: Song[] }> {
    let rawCollectionId = albumId.replace('soundtrack-album-', '').replace('album-', '');
    
    // Check in-memory cache first
    const cached = this.albumCache.get(rawCollectionId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return { album: cached.album, tracks: cached.tracks };
    }

    try {
      // If collectionId is not purely numeric (e.g., a slugified name), resolve to real numeric collectionId
      if (!/^\d+$/.test(rawCollectionId)) {
        const cleanQuery = rawCollectionId.replace(/-/g, ' ').trim();
        const searchResults = await this.searchMovieSoundtracks(cleanQuery);
        if (searchResults.length > 0 && searchResults[0].providerAlbumId) {
          rawCollectionId = searchResults[0].providerAlbumId;
        } else {
          return { album: null, tracks: [] };
        }
      }

      // Check cache with resolved numeric collectionId
      const numCached = this.albumCache.get(rawCollectionId);
      if (numCached && Date.now() - numCached.timestamp < this.CACHE_TTL_MS) {
        return { album: numCached.album, tracks: numCached.tracks };
      }

      // Retrieve full tracklist from provider (with country=IN for Indian cinema, and global fallback)
      let results: (iTunesAlbumResult | iTunesTrackResult)[] = [];
      try {
        const resIn = await fetch(`https://itunes.apple.com/lookup?id=${encodeURIComponent(rawCollectionId)}&entity=song&limit=200&country=IN`);
        if (resIn.ok) {
          const data = await resIn.json();
          results = data.results || [];
        }
      } catch (e) {}

      if (results.length <= 1) {
        try {
          const resGlobal = await fetch(`https://itunes.apple.com/lookup?id=${encodeURIComponent(rawCollectionId)}&entity=song&limit=200`);
          if (resGlobal.ok) {
            const data = await resGlobal.json();
            if ((data.results || []).length > results.length) {
              results = data.results;
            }
          }
        } catch (e) {}
      }

      if (results.length === 0) {
        return { album: null, tracks: [] };
      }

      const rawAlbum = results.find(r => r.wrapperType === 'collection') as iTunesAlbumResult | undefined;
      const rawTracks = results.filter(r => r.wrapperType === 'track') as iTunesTrackResult[];

      const albumTitle = rawAlbum ? decodeHtmlEntities(rawAlbum.collectionName) : 'Soundtrack Album';
      const albumArtist = rawAlbum ? decodeHtmlEntities(rawAlbum.artistName) : (rawTracks[0]?.artistName || 'Various Artists');
      const albumCover = getHighResArtwork(rawAlbum?.artworkUrl100 || rawTracks[0]?.artworkUrl100);
      const releaseYear = rawAlbum?.releaseDate ? new Date(rawAlbum.releaseDate).getFullYear() : (rawTracks[0]?.releaseDate ? new Date(rawTracks[0].releaseDate).getFullYear() : 2024);

      const canonicalAlbum: Album = {
        id: `soundtrack-album-${rawCollectionId}`,
        title: albumTitle,
        artistId: rawAlbum?.artistId ? `artist-${rawAlbum.artistId}` : `artist-${slugify(albumArtist)}`,
        artistName: albumArtist,
        coverUrl: albumCover,
        releaseYear,
        providerAlbumId: rawCollectionId,
        albumUrl: rawAlbum?.collectionViewUrl,
        songCount: rawTracks.length > 0 ? rawTracks.length : (rawAlbum?.trackCount || 0)
      };

      // Sort ordered tracklist by disc number, then track number
      const sortedRawTracks = [...rawTracks].sort((a, b) => {
        const discA = a.discNumber || 1;
        const discB = b.discNumber || 1;
        if (discA !== discB) return discA - discB;
        return (a.trackNumber || 0) - (b.trackNumber || 0);
      });

      // Deduplicate using stable provider trackId, preserving distinct versions/reprises
      const seenTrackIds = new Set<number>();
      const tracks: Song[] = [];

      for (const track of sortedRawTracks) {
        if (!track.trackId || seenTrackIds.has(track.trackId)) continue;
        seenTrackIds.add(track.trackId);

        const trackTitle = decodeHtmlEntities(track.trackName);
        const trackArtist = decodeHtmlEntities(track.artistName);
        const languages = detectLanguage(trackTitle + ' ' + albumTitle, track.primaryGenreName);
        const coverUrl = getHighResArtwork(track.artworkUrl100) || albumCover;

        // Restore real provider duration based on track.trackTimeMillis
        const duration = track.trackTimeMillis ? Math.round(track.trackTimeMillis / 1000) : 180;

        tracks.push({
          id: `soundtrack-track-${track.trackId}`,
          sourceType: 'og_music',
          title: trackTitle,
          artistId: track.artistId ? `artist-${track.artistId}` : `artist-${slugify(trackArtist)}`,
          artistName: trackArtist,
          albumId: `soundtrack-album-${rawCollectionId}`,
          albumName: albumTitle,
          coverUrl,
          audioUrl: track.previewUrl,
          isPreview: true,
          duration,
          originalDuration: duration,
          trackNumber: track.trackNumber,
          discNumber: track.discNumber,
          releaseDate: track.releaseDate,
          year: track.releaseDate ? new Date(track.releaseDate).getFullYear() : releaseYear,
          languages,
          genreName: track.primaryGenreName,
          providerAlbumId: rawCollectionId,
          providerArtistId: track.artistId ? String(track.artistId) : undefined
        });
      }

      this.albumCache.set(rawCollectionId, { album: canonicalAlbum, tracks, timestamp: Date.now() });
      return { album: canonicalAlbum, tracks };
    } catch (e) {
      console.error(`Failed to fetch album ${albumId}:`, e);
      return { album: null, tracks: [] };
    }
  }
}

export const soundtrackService = new SoundtrackService();
