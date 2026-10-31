import type { Song, QueueItem } from './index';

export interface RoomParticipant {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
  role: 'host' | 'listener';
  joinedAt: number;
  lastHeartbeat: number;
  playbackState?: 'idle' | 'buffering' | 'playing' | 'paused' | 'failed';
}

export interface ListeningRoom {
  id: string;
  name: string;
  hostId: string;
  hostName: string;
  hostPhotoURL?: string;
  status: 'active' | 'ended';
  currentTrack: Song | null;
  playbackState: 'playing' | 'paused';
  basePosition: number; // authoritative position in seconds
  baseTimestamp: number; // ms timestamp when basePosition was authoritative
  stateVersion: number;
  queue: QueueItem[];
  queueIndex: number;
  participants: Record<string, RoomParticipant>;
  memberUids?: string[];
  trackId?: string;
  providerId?: string;
  trackTitle?: string;
  artistName?: string;
  albumId?: string;
  shuffleEnabled?: boolean;
  repeatMode?: 'off' | 'all' | 'one';
  lastCommandId?: string;
  maxCapacity?: number; // Default 10
  createdAt: number;
  updatedAt: number;
}

export interface RoomInvitation {
  id: string; // unique inviteToken
  roomId: string;
  hostId: string;
  hostName: string;
  hostEmail: string;
  roomTitle: string;
  status: 'active' | 'revoked' | 'expired';
  createdAt: number;
  expiresAt: number;
}

export interface RoomJoinRequest {
  id: string; // `${roomId}_${userId}`
  roomId: string;
  inviteToken: string;
  hostId: string;
  userId: string;
  userDisplayName: string;
  userEmail: string;
  userPhotoURL?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
  updatedAt: number;
}

export interface Friendship {
  id: string; // sorted `userA_userB`
  users: [string, string];
  userA: {
    id: string;
    displayName: string;
    email: string;
    photoURL?: string;
  };
  userB: {
    id: string;
    displayName: string;
    email: string;
    photoURL?: string;
  };
  status: 'accepted' | 'blocked';
  createdAt: number;
  updatedAt: number;
}
