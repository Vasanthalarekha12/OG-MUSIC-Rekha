export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt?: unknown;
}

export interface Song {
  id: string;
  sourceType?: 'og_music' | 'youtube';
  title: string;
  artistId: string;
  artistName: string;
  albumId?: string;
  albumName?: string;
  albumUrl?: string;
  providerAlbumId?: string;
  artistImageUrl?: string;
  artistUrl?: string;
  providerArtistId?: string;
  primaryArtists?: string;
  genreId?: string;
  genreName?: string;
  moods?: string[];
  languages?: string[];
  coverUrl?: string;
  audioUrl?: string;
  youtubeId?: string;
  videoUrl?: string;
  embedUrl?: string;
  duration?: number;
  originalDuration?: number;
  isPreview?: boolean;
  lyrics?: string;
  releaseDate?: string;
  year?: number; // Phase 4
  trackNumber?: number;
  discNumber?: number; // Phase 4
  isFeatured?: boolean;
  isPublished?: boolean;
  playCount?: number; // Phase 4
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Artist {
  id: string;
  name: string;
  bio?: string;
  imageUrl?: string;
  providerArtistId?: string;
  artistUrl?: string;
  createdAt?: unknown;
}

export interface Album {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  coverUrl?: string;
  releaseYear?: number;
  providerAlbumId?: string;
  albumUrl?: string;
  songCount?: number;
  createdAt?: unknown;
}

export interface Genre {
  id: string;
  name: string;
  imageUrl?: string;
}

export interface Playlist {
  id: string;
  userId: string;
  title: string;
  name?: string; // alias for title
  description?: string;
  coverUrl?: string;
  isPublic: boolean;
  songs: Song[];
  createdAt?: unknown;
}

export interface PlaylistSong {
  playlistId: string;
  songId: string;
  addedAt: unknown;
}

export interface Favorite {
  userId: string;
  songId: string;
  addedAt: unknown;
}

export interface HistoryItem {
  userId: string;
  songId: string;
  playedAt: unknown;
}

export interface QueueItem {
  id: string; // unique instance id
  song: Song;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  isActive: boolean;
}

export interface Video {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration?: number;
  createdAt?: unknown;
}

export interface AdminUser {
  id: string;
  email: string;
  role: 'admin' | 'superadmin';
}

export interface DiscoveryContext {
  type: "mood" | "language" | "genre" | "artist" | "album" | "search" | "playlist" | "queue" | "history";
  id: string;
  label: string;
}

export interface DiscoveryResult {
  items: Song[];
  total: number;
  context: DiscoveryContext;
}
