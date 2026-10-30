import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db } from './config';
import type { Song, Playlist } from '../../types';

// Generic repository for Firestore (Top-Level)
export class FirestoreRepository<T> {
  private collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  async get(id: string): Promise<T | null> {
    if (!db) return null;
    const docRef = doc(db, this.collectionName, id);
    const snap = await getDoc(docRef);
    return snap.exists() ? (snap.data() as T) : null;
  }

  async getAll(): Promise<T[]> {
    if (!db) return [];
    const querySnapshot = await getDocs(collection(db, this.collectionName));
    return querySnapshot.docs.map(doc => doc.data() as T);
  }

  async set(id: string, data: Partial<T>): Promise<void> {
    if (!db) return;
    await setDoc(doc(db, this.collectionName, id), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  }

  async delete(id: string): Promise<void> {
    if (!db) return;
    await deleteDoc(doc(db, this.collectionName, id));
  }
}

// User-Specific Subcollection Services
export const userLibraryService = {
  // Favorites
  async getFavorites(userId: string): Promise<Song[]> {
    if (!db) return [];
    const q = query(collection(db, 'users', userId, 'favorites'), orderBy('addedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Song);
  },
  async addFavorite(userId: string, trackId: string, trackData: any): Promise<void> {
    if (!db) return;
    await setDoc(doc(db, 'users', userId, 'favorites', trackId), {
      ...trackData,
      addedAt: serverTimestamp()
    }, { merge: true });
  },
  async removeFavorite(userId: string, trackId: string): Promise<void> {
    if (!db) return;
    await deleteDoc(doc(db, 'users', userId, 'favorites', trackId));
  },

  // History
  async getHistory(userId: string, limitCount = 100): Promise<any[]> {
    if (!db) return [];
    const q = query(collection(db, 'users', userId, 'history'), orderBy('playedAt', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  async addHistory(userId: string, historyItem: any): Promise<void> {
    if (!db) return;
    const id = historyItem.playedAt.toString(); // Use timestamp as ID
    await setDoc(doc(db, 'users', userId, 'history', id), historyItem);
  },
  async clearHistory(userId: string): Promise<void> {
    if (!db) return;
    const snap = await getDocs(collection(db, 'users', userId, 'history'));
    const batch = snap.docs.map(d => deleteDoc(d.ref));
    await Promise.all(batch);
  },
  async removeFromHistory(userId: string, historyId: string): Promise<void> {
    if (!db) return;
    await deleteDoc(doc(db, 'users', userId, 'history', historyId));
  },

  // Play Counts
  async getPlayCounts(userId: string): Promise<Record<string, number>> {
    if (!db) return {};
    const q = query(collection(db, 'users', userId, 'playCounts'));
    const snap = await getDocs(q);
    const counts: Record<string, number> = {};
    snap.docs.forEach(d => {
      counts[d.id] = d.data().count || 0;
    });
    return counts;
  },
  async incrementPlayCount(userId: string, song: any): Promise<void> {
    if (!db) return;
    const ref = doc(db, 'users', userId, 'playCounts', song.id);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await setDoc(ref, { count: (snap.data().count || 0) + 1, updatedAt: serverTimestamp() }, { merge: true });
    } else {
      await setDoc(ref, { count: 1, song, updatedAt: serverTimestamp() });
    }
  },

  // Playlists
  async getPlaylists(userId: string): Promise<Playlist[]> {
    if (!db) return [];
    const q = query(collection(db, 'users', userId, 'playlists'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Playlist);
  },
  async savePlaylist(userId: string, playlist: Playlist): Promise<void> {
    if (!db) return;
    await setDoc(doc(db, 'users', userId, 'playlists', playlist.id), {
      ...playlist,
      updatedAt: serverTimestamp()
    }, { merge: true });
  },
  async deletePlaylist(userId: string, playlistId: string): Promise<void> {
    if (!db) return;
    await deleteDoc(doc(db, 'users', userId, 'playlists', playlistId));
  }
};

export const tracksService = new FirestoreRepository<Song>('tracks');
export const publicPlaylistsService = new FirestoreRepository<Playlist>('playlists');
export const albumsService = new FirestoreRepository<any>('albums');
export const artistsService = new FirestoreRepository<any>('artists');
