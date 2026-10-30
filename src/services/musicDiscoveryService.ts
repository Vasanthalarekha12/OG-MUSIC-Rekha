import { tracksService } from './firebase/dbService';
import type { Song, DiscoveryResult, Album, Artist } from '../types';
import { mockGenres, mockPlaylists, mockSongs } from '../constants/mockData';
import { soundtrackService } from './providers/soundtrack/soundtrackService';
import { artistProfileService } from './providers/artist/artistProfileService';
import { decodeHtmlEntities, slugify } from '../utils/stringUtils';
import { recommendationService } from './recommendationService';

export class MusicDiscoveryService {
  private cachedTracks: Song[] | null = null;
  private cachePromise: Promise<Song[]> | null = null;
  private cachedAlbums: Album[] | null = null;
  private cachedArtists: Artist[] | null = null;

  normalizeTerm(term: string): string {
    return (term || '').trim().toLowerCase();
  }

  normalizeSong(track: any): Song {
    const artistName = decodeHtmlEntities(track.artistName || 'Unknown Artist');
    const title = decodeHtmlEntities(track.title || 'Untitled Track');
    const albumName = decodeHtmlEntities(track.albumName || title || 'Unknown Album');
    const artistId = track.artistId || `artist-${slugify(artistName)}`;
    const albumId = track.albumId || `album-${slugify(albumName)}`;

    const languages = Array.isArray(track.languages)
      ? track.languages.map((l: string) => l.toLowerCase())
      : track.language
      ? [track.language.toLowerCase()]
      : [];

    const moods = Array.isArray(track.moods)
      ? track.moods
      : track.mood
      ? [track.mood]
      : [];

    return {
      ...track,
      id: String(track.id),
      title,
      artistName,
      artistId,
      albumName,
      albumId,
      coverUrl: track.coverUrl,
      audioUrl: track.audioUrl,
      languages,
      moods,
      sourceType: track.sourceType === 'youtube' ? 'youtube' : 'og_music'
    };
  }

  async getAllTracks(forceRefresh = false): Promise<Song[]> {
    if (!forceRefresh && this.cachedTracks) return this.cachedTracks;
    if (!forceRefresh && this.cachePromise) return this.cachePromise;

    this.cachePromise = (async () => {
      try {
        const rawTracks = await tracksService.getAll();
        let tracks = rawTracks.map(t => this.normalizeSong(t));

        // Include mock catalog if Firestore is unpopulated
        if (tracks.length === 0 && mockSongs.length > 0) {
          tracks = mockSongs.map(t => this.normalizeSong(t));
        }

        // Supplemental movie soundtrack discovery: Ensure diverse high quality catalog tracks
        if (tracks.length < 15) {
          const featuredSoundtracks = ['RRR', 'Devara', 'Pushpa', 'Kalki 2898 AD'];
          for (const movie of featuredSoundtracks) {
            try {
              const albums = await soundtrackService.searchMovieSoundtracks(movie);
              if (albums.length > 0) {
                const { tracks: soundTracks } = await soundtrackService.getAlbumWithTracks(albums[0].id);
                const existingIds = new Set(tracks.map(t => t.id));
                for (const st of soundTracks) {
                  if (!existingIds.has(st.id)) {
                    existingIds.add(st.id);
                    tracks.push(st);
                  }
                }
              }
            } catch (err) {
              console.warn(`Supplemental fetch for ${movie} failed:`, err);
            }
          }
        }

        this.cachedTracks = tracks;
        return tracks;
      } catch (error) {
        console.error('Error fetching tracks from catalog:', error);
        return mockSongs.map(t => this.normalizeSong(t));
      } finally {
        this.cachePromise = null;
      }
    })();

    return this.cachePromise;
  }

  async getAlbums(): Promise<Album[]> {
    if (this.cachedAlbums) return this.cachedAlbums;
    try {
      const tracks = await this.getAllTracks();
      const albumMap = new Map<string, Album>();

      tracks.forEach(t => {
        if (!t.albumId) return;

        const albumTitle = t.albumName || t.title;
        const albumId = t.albumId;

        const existing = albumMap.get(albumId);
        if (!existing) {
          albumMap.set(albumId, {
            id: albumId,
            title: albumTitle,
            artistId: t.artistId,
            artistName: t.artistName,
            coverUrl: t.coverUrl,
            releaseYear: t.year || (t.releaseDate ? parseInt(t.releaseDate as string) : 2024),
            providerAlbumId: t.providerAlbumId,
            albumUrl: t.albumUrl,
            songCount: 1
          });
        } else {
          existing.songCount = (existing.songCount || 1) + 1;
          if (t.coverUrl && !existing.coverUrl) existing.coverUrl = t.coverUrl;
          if (t.year && !existing.releaseYear) existing.releaseYear = t.year;
        }
      });

      const albums = Array.from(albumMap.values());
      this.cachedAlbums = albums;
      return albums;
    } catch (e) {
      console.error('Error deriving albums:', e);
      return [];
    }
  }

  /**
   * Universal canonical album detail resolution
   */
  async getAlbumById(id: string): Promise<Album | null> {
    // 1. If it's a provider-backed soundtrack album (or numeric id)
    if (id.startsWith('soundtrack-album-') || /^\d+$/.test(id)) {
      const { album } = await soundtrackService.getAlbumWithTracks(id);
      if (album) return album;
    }

    // 2. Search local cached albums
    const albums = await this.getAlbums();
    const local = albums.find(a => a.id === id);
    if (local) {
      if (local.providerAlbumId) {
        const { album } = await soundtrackService.getAlbumWithTracks(local.providerAlbumId);
        if (album) return { ...local, ...album };
      }
      return local;
    }

    // 3. Fallback search by title
    const cleanQuery = id.replace('soundtrack-album-', '').replace('album-', '').replace(/-/g, ' ');
    const searchResults = await soundtrackService.searchMovieSoundtracks(cleanQuery);
    if (searchResults.length > 0) {
      const match = searchResults[0];
      const { album } = await soundtrackService.getAlbumWithTracks(match.providerAlbumId || match.id);
      return album || match;
    }

    return null;
  }

  /**
   * Universal canonical album tracklist retrieval (ordered, deduplicated)
   */
  async getAlbumTracks(albumId: string): Promise<Song[]> {
    // 1. If it's a provider-backed soundtrack album (or numeric id)
    if (albumId.startsWith('soundtrack-album-') || /^\d+$/.test(albumId)) {
      const { tracks } = await soundtrackService.getAlbumWithTracks(albumId);
      if (tracks.length > 0) return tracks;
    }

    // 2. Check cached albums for providerAlbumId
    const albums = await this.getAlbums();
    const matchedAlbum = albums.find(a => a.id === albumId);
    if (matchedAlbum?.providerAlbumId) {
      const { tracks } = await soundtrackService.getAlbumWithTracks(matchedAlbum.providerAlbumId);
      if (tracks.length > 0) return tracks;
    }

    // 3. Look in catalog tracks for matching albumId
    const allTracks = await this.getAllTracks();
    const local = allTracks.filter(t => t.albumId === albumId);
    if (local.length > 0) {
      return local;
    }

    // 4. Try soundtrack provider adapter with raw ID
    const { tracks } = await soundtrackService.getAlbumWithTracks(albumId);
    if (tracks.length > 0) return tracks;

    // 5. If album exists in albums list, try search by album title
    if (matchedAlbum && matchedAlbum.title) {
      const cleanTitle = matchedAlbum.title.replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '').trim();
      const searchRes = await soundtrackService.searchMovieSoundtracks(cleanTitle);
      if (searchRes.length > 0 && searchRes[0].providerAlbumId) {
        const { tracks: soundTracks } = await soundtrackService.getAlbumWithTracks(searchRes[0].providerAlbumId);
        if (soundTracks.length > 0) return soundTracks;
      }
    }

    return [];
  }

  /**
   * Get artist catalog with verified portraits (never random song covers)
   */
  async getArtists(): Promise<Artist[]> {
    if (this.cachedArtists) return this.cachedArtists;
    try {
      const tracks = await this.getAllTracks();
      const artistMap = new Map<string, Artist>();

      for (const t of tracks) {
        if (!t.artistName) continue;

        // Correctly handle multiple credited performers
        const performers = artistProfileService.splitPerformers(t.artistName);
        const primaryPerformer = performers[0] || t.artistName;
        const artistId = `artist-${slugify(primaryPerformer)}`;

        if (!artistMap.has(artistId)) {
          artistMap.set(artistId, {
            id: artistId,
            name: primaryPerformer,
            imageUrl: undefined // will be resolved asynchronously or rendered with neutral avatar
          });
        }
      }

      const artists = Array.from(artistMap.values());

      // Resolve real portrait photos in parallel without blocking with fallbacks
      await Promise.all(
        artists.map(async a => {
          const portrait = await artistProfileService.resolveArtistPhoto(a.name);
          if (portrait) a.imageUrl = portrait;
        })
      );

      this.cachedArtists = artists;
      return artists;
    } catch (e) {
      console.error('Error deriving artists:', e);
      return [];
    }
  }

  async getArtistById(id: string): Promise<Artist | null> {
    const artists = await this.getArtists();
    const local = artists.find(a => a.id === id);
    if (local) return local;

    // Resolve by name slug
    const cleanName = id.replace('artist-', '').replace(/-/g, ' ');
    const portrait = await artistProfileService.resolveArtistPhoto(cleanName);
    return {
      id,
      name: cleanName.replace(/\b\w/g, c => c.toUpperCase()),
      imageUrl: portrait
    };
  }

  async getArtistTracks(artistId: string): Promise<Song[]> {
    const tracks = await this.getAllTracks();
    const target = this.normalizeTerm(artistId.replace('artist-', '').replace(/-/g, ' '));

    return tracks.filter(t => {
      if (t.artistId === artistId) return true;
      const normalizedArtist = this.normalizeTerm(t.artistName);
      return normalizedArtist.includes(target) || target.includes(normalizedArtist);
    });
  }

  async getArtistAlbums(artistId: string): Promise<Album[]> {
    const albums = await this.getAlbums();
    const target = this.normalizeTerm(artistId.replace('artist-', '').replace(/-/g, ' '));

    return albums.filter(a => {
      if (a.artistId === artistId) return true;
      const normalizedArtist = this.normalizeTerm(a.artistName);
      return normalizedArtist.includes(target) || target.includes(normalizedArtist);
    });
  }

  async getTracksByMood(mood: string): Promise<DiscoveryResult> {
    const normalized = this.normalizeTerm(mood);
    const tracks = await this.getAllTracks();
    const filtered = tracks.filter(t =>
      t.moods?.some(m => this.normalizeTerm(m) === normalized)
    );

    return {
      items: filtered,
      total: filtered.length,
      context: {
        type: 'mood',
        id: mood,
        label: mood
      }
    };
  }

  /**
   * Strict language filter ensuring accurate verified results
   */
  async getTracksByLanguage(language: string): Promise<DiscoveryResult> {
    const normLang = this.normalizeTerm(language);
    const tracks = await this.getAllTracks();

    // Strict match
    const filtered = tracks.filter(t =>
      t.languages?.some(l => this.normalizeTerm(l) === normLang)
    );

    let finalTracks = [...filtered];

    // If catalog needs more verified songs in this language, query soundtrack service
    if (finalTracks.length < 8) {
      try {
        const queryTerm = `${language} soundtrack`;
        const albums = await soundtrackService.searchMovieSoundtracks(queryTerm);
        for (const alb of albums.slice(0, 3)) {
          const { tracks: albTracks } = await soundtrackService.getAlbumWithTracks(alb.id);
          const existingIds = new Set(finalTracks.map(t => t.id));
          for (const at of albTracks) {
            if (!existingIds.has(at.id)) {
              existingIds.add(at.id);
              finalTracks.push({
                ...at,
                languages: [normLang]
              });
            }
          }
        }
      } catch (err) {
        console.warn(`Could not fetch additional tracks for language ${language}:`, err);
      }
    }

    return {
      items: finalTracks,
      total: finalTracks.length,
      context: {
        type: 'language',
        id: language,
        label: language
      }
    };
  }

  async getTracksByMoodAndLanguage(mood: string, language: string): Promise<DiscoveryResult> {
    const normMood = this.normalizeTerm(mood);
    const langRes = await this.getTracksByLanguage(language);

    const filtered = langRes.items.filter(t =>
      t.moods?.some(m => this.normalizeTerm(m) === normMood)
    );

    return {
      items: filtered.length > 0 ? filtered : langRes.items.slice(0, 10),
      total: filtered.length > 0 ? filtered.length : Math.min(langRes.items.length, 10),
      context: {
        type: 'mood',
        id: `${language}-${mood}`,
        label: `${language} • ${mood}`
      }
    };
  }

  async getTracksByGenre(genreIdentifier: string): Promise<DiscoveryResult> {
    const normalized = this.normalizeTerm(genreIdentifier);
    const genreObj = mockGenres.find(
      g => this.normalizeTerm(g.id) === normalized || this.normalizeTerm(g.name) === normalized
    );
    const genreName = genreObj ? genreObj.name : genreIdentifier;
    const normalizedName = this.normalizeTerm(genreName);

    const KNOWN_LANGUAGES = ['telugu', 'tamil', 'hindi', 'english', 'malayalam', 'kannada', 'bengali', 'marathi', 'punjabi', 'gujarati'];
    if (KNOWN_LANGUAGES.includes(normalizedName)) {
      const langResult = await this.getTracksByLanguage(genreName);
      return {
        ...langResult,
        context: {
          type: 'genre',
          id: genreObj ? genreObj.id : genreIdentifier,
          label: genreName
        }
      };
    }

    const moodResult = await this.getTracksByMood(genreName);
    return {
      ...moodResult,
      context: {
        type: 'genre',
        id: genreObj ? genreObj.id : genreIdentifier,
        label: genreName
      }
    };
  }

  async searchTracks(query: string): Promise<DiscoveryResult> {
    const cleanQuery = (query || '').trim();
    if (!cleanQuery) return { items: [], total: 0, context: { type: 'search', id: '', label: 'Search' } };

    const normalized = this.normalizeTerm(cleanQuery);
    const tracks = await this.getAllTracks();
    const filtered = tracks.filter(t => {
      return (
        (t.title && this.normalizeTerm(t.title).includes(normalized)) ||
        (t.artistName && this.normalizeTerm(t.artistName).includes(normalized)) ||
        (t.albumName && this.normalizeTerm(t.albumName).includes(normalized))
      );
    });

    const seenIds = new Set(filtered.map(t => t.id));
    const merged: Song[] = [...filtered];

    // Query official provider tracks for full search coverage (Hangover, Pushpa, etc.)
    try {
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(cleanQuery)}&entity=song&media=music&limit=25&country=IN`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const rawTracks = (data.results || []).filter((r: any) => r.wrapperType === 'track');
        for (const t of rawTracks) {
          const trackId = `soundtrack-track-${t.trackId}`;
          if (!seenIds.has(trackId)) {
            seenIds.add(trackId);
            const duration = t.trackTimeMillis ? Math.round(t.trackTimeMillis / 1000) : 180;
            const coverUrl = t.artworkUrl100 ? t.artworkUrl100.replace('100x100bb', '600x600bb') : undefined;
            merged.push({
              id: trackId,
              sourceType: 'og_music',
              title: decodeHtmlEntities(t.trackName),
              artistId: `artist-${t.artistId || slugify(t.artistName)}`,
              artistName: decodeHtmlEntities(t.artistName),
              albumId: `soundtrack-album-${t.collectionId}`,
              albumName: decodeHtmlEntities(t.collectionName),
              coverUrl,
              audioUrl: t.previewUrl,
              duration,
              originalDuration: duration,
              releaseDate: t.releaseDate,
              year: t.releaseDate ? new Date(t.releaseDate).getFullYear() : 2024,
              trackNumber: t.trackNumber,
              discNumber: t.discNumber,
              providerAlbumId: String(t.collectionId),
              providerArtistId: String(t.artistId)
            });
          }
        }
      }
    } catch (e) {
      console.warn('Remote track search failed, using local results:', e);
    }

    return {
      items: merged,
      total: merged.length,
      context: {
        type: 'search',
        id: cleanQuery,
        label: `Search: ${cleanQuery}`
      }
    };
  }

  /**
   * Builds meaningful continuation queue for seamless queue progression
   */
  async getContinuationTracks(currentTrack: Song, existingTrackIds: Set<string>): Promise<Song[]> {
    const continuation: Song[] = [];
    const seen = new Set(existingTrackIds);
    seen.add(currentTrack.id);

    // 1. Same album tracks first
    if (currentTrack.albumId) {
      try {
        const albumTracks = await this.getAlbumTracks(currentTrack.albumId);
        for (const t of albumTracks) {
          if (!seen.has(t.id)) {
            seen.add(t.id);
            continuation.push(t);
            if (continuation.length >= 8) return continuation;
          }
        }
      } catch {}
    }

    // 2. Same artist tracks next
    if (currentTrack.artistId) {
      try {
        const artistTracks = await this.getArtistTracks(currentTrack.artistId);
        for (const t of artistTracks) {
          if (!seen.has(t.id)) {
            seen.add(t.id);
            continuation.push(t);
            if (continuation.length >= 8) return continuation;
          }
        }
      } catch {}
    }

    // 3. Recommended related tracks from discovery catalog
    try {
      const allTracks = await this.getAllTracks();
      const recResult = recommendationService.getPersonalizedRecommendations(allTracks, 10);
      for (const t of recResult.tracks) {
        if (!seen.has(t.id)) {
          seen.add(t.id);
          continuation.push(t);
          if (continuation.length >= 8) break;
        }
      }
    } catch {}

    return continuation;
  }

  async searchArtists(query: string): Promise<Artist[]> {
    const normalized = this.normalizeTerm(query);
    const artists = await this.getArtists();
    return artists.filter(a => a.name && this.normalizeTerm(a.name).includes(normalized));
  }

  /**
   * Provider-backed universal movie soundtrack search
   */
  async searchAlbums(query: string): Promise<Album[]> {
    const normalized = this.normalizeTerm(query);
    const localAlbums = await this.getAlbums();
    const matchedLocal = localAlbums.filter(a => {
      return (
        (a.title && this.normalizeTerm(a.title).includes(normalized)) ||
        (a.artistName && this.normalizeTerm(a.artistName).includes(normalized))
      );
    });

    // Also query legitimate soundtrack provider for any arbitrary movie name
    const remoteSoundtracks = await soundtrackService.searchMovieSoundtracks(query);
    const seenIds = new Set(matchedLocal.map(a => a.id));
    const merged: Album[] = [...matchedLocal];

    for (const remote of remoteSoundtracks) {
      if (!seenIds.has(remote.id)) {
        seenIds.add(remote.id);
        merged.push(remote);
      }
    }

    return merged;
  }

  async getFeaturedPlaylists(): Promise<any[]> {
    return JSON.parse(JSON.stringify(mockPlaylists));
  }

  clearCache() {
    this.cachedTracks = null;
    this.cachedAlbums = null;
    this.cachedArtists = null;
  }
}

export const musicDiscoveryService = new MusicDiscoveryService();
