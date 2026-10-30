import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Playlist, Song } from '../types';
import { useAuth } from './AuthContext';
import { userLibraryService } from '../services/firebase/dbService';
import { recommendationService } from '../services/recommendationService';

export interface HistoryItem {
  song: Song;
  playedAt: number;
}

interface LibraryContextType {
  favorites: Song[];
  toggleFavorite: (song: Song) => void;
  isFavorite: (songId: string) => boolean;
  
  playlists: Playlist[];
  createPlaylist: (title: string, description?: string) => Promise<Playlist>;
  deletePlaylist: (playlistId: string) => Promise<void>;
  addTrackToPlaylist: (playlistId: string, song: Song) => Promise<void>;
  removeTrackFromPlaylist: (playlistId: string, songId: string) => Promise<void>;
  addSongToPlaylist: (playlistId: string, song: Song) => Promise<void>;

  history: HistoryItem[];
  addToHistory: (song: Song) => void;
  clearHistory: () => Promise<void>;
  removeFromHistory: (timestamp: number) => Promise<void>;

  playCounts: Record<string, number>;
  getMostPlayed: () => { song: Song, count: number }[];

  loading: boolean;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export const LibraryProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  
  const [favorites, setFavorites] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [playCounts, setPlayCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Sync with Firestore or LocalStorage on mount/auth change
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      try {
        if (user) {
          // Load from Firestore
          const [favs, hist, plays, counts] = await Promise.all([
            userLibraryService.getFavorites(user.id),
            userLibraryService.getHistory(user.id),
            userLibraryService.getPlaylists(user.id),
            userLibraryService.getPlayCounts(user.id)
          ]);
          if (isMounted) {
            setFavorites(favs);
            setHistory(hist as HistoryItem[]);
            setPlaylists(plays);
            setPlayCounts(counts);
          }
        } else {
          // Load from LocalStorage
          const localFavs = localStorage.getItem('og_music_favorites');
          const localHist = localStorage.getItem('og_music_history');
          const localPlays = localStorage.getItem('og_music_playlists');
          const localCounts = localStorage.getItem('og_music_playCounts');
          
          if (isMounted) {
            setFavorites(localFavs ? JSON.parse(localFavs) : []);
            setHistory(localHist ? JSON.parse(localHist) : []);
            setPlaylists(localPlays ? JSON.parse(localPlays) : []);
            setPlayCounts(localCounts ? JSON.parse(localCounts) : {});
          }
        }
      } catch (e) {
        console.error('Error loading library data:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => { isMounted = false; };
  }, [user]);

  // Save to LocalStorage whenever state changes (if guest)
  useEffect(() => {
    if (!user && !loading) {
      localStorage.setItem('og_music_favorites', JSON.stringify(favorites));
      localStorage.setItem('og_music_playlists', JSON.stringify(playlists));
      localStorage.setItem('og_music_history', JSON.stringify(history));
      localStorage.setItem('og_music_playCounts', JSON.stringify(playCounts));
    }
  }, [favorites, playlists, history, playCounts, user, loading]);

  const toggleFavorite = useCallback(async (song: Song) => {
    // Optimistic UI update
    const isFav = favorites.some(f => f.id === song.id);
    setFavorites(prev => isFav ? prev.filter(f => f.id !== song.id) : [...prev, song]);
    recommendationService.recordFavorite(song.id, !isFav);

    if (user) {
      try {
        if (isFav) {
          await userLibraryService.removeFavorite(user.id, song.id);
        } else {
          await userLibraryService.addFavorite(user.id, song.id, song);
        }
      } catch (e) {
        console.error('Failed to sync favorite', e);
        // Rollback
        setFavorites(prev => !isFav ? prev.filter(f => f.id !== song.id) : [...prev, song]);
      }
    }
  }, [favorites, user]);

  const isFavorite = useCallback((songId: string) => {
    return favorites.some(f => f.id === songId);
  }, [favorites]);

  const createPlaylist = useCallback(async (title: string, description?: string) => {
    const newPlaylist: Playlist = {
      id: `p_${Date.now()}`,
      userId: user?.id || 'local',
      title,
      name: title,
      description,
      isPublic: false,
      songs: [],
      createdAt: new Date().toISOString()
    };
    
    // Optimistic update
    setPlaylists(prev => [newPlaylist, ...prev]);
    
    if (user) {
      try {
        await userLibraryService.savePlaylist(user.id, newPlaylist);
      } catch (e) {
        console.error('Failed to create playlist', e);
        setPlaylists(prev => prev.filter(p => p.id !== newPlaylist.id)); // rollback
        throw e;
      }
    }
    return newPlaylist;
  }, [user]);

  const deletePlaylist = useCallback(async (playlistId: string) => {
    const original = [...playlists];
    setPlaylists(prev => prev.filter(p => p.id !== playlistId));
    
    if (user) {
      try {
        await userLibraryService.deletePlaylist(user.id, playlistId);
      } catch (e) {
        console.error('Failed to delete playlist', e);
        setPlaylists(original); // rollback
      }
    }
  }, [playlists, user]);

  const addTrackToPlaylist = useCallback(async (playlistId: string, song: Song) => {
    const original = [...playlists];
    recommendationService.recordPlaylistAdd(song);
    const updatedPlaylists = playlists.map(p => {
      if (p.id === playlistId && !p.songs.find(s => s.id === song.id)) {
        return { ...p, songs: [...p.songs, song] };
      }
      return p;
    });
    setPlaylists(updatedPlaylists);

    if (user) {
      try {
        const target = updatedPlaylists.find(p => p.id === playlistId);
        if (target) await userLibraryService.savePlaylist(user.id, target);
      } catch (e) {
        console.error('Failed to add track', e);
        setPlaylists(original);
      }
    }
  }, [playlists, user]);

  const removeTrackFromPlaylist = useCallback(async (playlistId: string, songId: string) => {
    const original = [...playlists];
    const updatedPlaylists = playlists.map(p => {
      if (p.id === playlistId) {
        return { ...p, songs: p.songs.filter(s => s.id !== songId) };
      }
      return p;
    });
    setPlaylists(updatedPlaylists);

    if (user) {
      try {
        const target = updatedPlaylists.find(p => p.id === playlistId);
        if (target) await userLibraryService.savePlaylist(user.id, target);
      } catch (e) {
        console.error('Failed to remove track', e);
        setPlaylists(original);
      }
    }
  }, [playlists, user]);

  const addSongToPlaylist = addTrackToPlaylist;

  const addToHistory = useCallback(async (song: Song) => {
    setHistory(prev => {
      const last = prev[0];
      if (last && last.song.id === song.id && (Date.now() - last.playedAt) < 300000) {
        return prev; // Debounce history saving within 5 mins
      }
      const newItem = { song, playedAt: Date.now() };
      
      // Async Firebase write without blocking UI
      if (user) {
        userLibraryService.addHistory(user.id, newItem).catch(console.error);
        userLibraryService.incrementPlayCount(user.id, song).catch(console.error);
      }
      
      // Update local playcounts
      setPlayCounts(counts => ({
        ...counts,
        [song.id]: (counts[song.id] || 0) + 1
      }));
      
      return [newItem, ...prev].slice(0, 100);
    });
  }, [user]);

  const getMostPlayed = useCallback(() => {
    // Unique songs from history to resolve names/artworks easily
    const songMap = new Map<string, Song>();
    history.forEach(h => {
      if (!songMap.has(h.song.id)) songMap.set(h.song.id, h.song);
    });
    
    return Object.entries(playCounts)
      .filter(([id]) => songMap.has(id)) // Only show if we have the full song object recorded
      .map(([id, count]) => ({ song: songMap.get(id)!, count }))
      .sort((a, b) => b.count - a.count);
  }, [history, playCounts]);

  const clearHistory = useCallback(async () => {
    const original = [...history];
    setHistory([]);
    if (user) {
      try {
        await userLibraryService.clearHistory(user.id);
      } catch (e) {
        setHistory(original);
      }
    }
  }, [history, user]);

  const removeFromHistory = useCallback(async (timestamp: number) => {
    const original = [...history];
    setHistory(prev => prev.filter(h => h.playedAt !== timestamp));
    if (user) {
      try {
        await userLibraryService.removeFromHistory(user.id, timestamp.toString());
      } catch (e) {
        setHistory(original);
      }
    }
  }, [history, user]);

  return (
    <LibraryContext.Provider
      value={{
        favorites,
        toggleFavorite,
        isFavorite,
        playlists,
        createPlaylist,
        deletePlaylist,
        addTrackToPlaylist,
        removeTrackFromPlaylist,
        addSongToPlaylist,
        history,
        addToHistory,
        clearHistory,
        removeFromHistory,
        playCounts,
        getMostPlayed,
        loading
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (context === undefined) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
};
