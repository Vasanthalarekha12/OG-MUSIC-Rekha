import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { User, Song, QueueItem } from '../../types';
import type {
  ListeningRoom,
  RoomInvitation,
  RoomJoinRequest,
  Friendship,
  RoomParticipant
} from '../../types/friends';

// Local storage keys for testing / offline transport
const LS_ROOMS = 'og_music_ls_rooms';
const LS_INVITES = 'og_music_ls_invites';
const LS_REQUESTS = 'og_music_ls_requests';
const LS_FRIENDSHIPS = 'og_music_ls_friendships';

// BroadcastChannel for instant multi-tab / multi-user event synchronization in local/dev
const channel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('og_music_friends_sync_channel')
  : null;

// Local store helpers
function readLocal<T>(key: string): Record<string, T> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeLocal<T>(key: string, data: Record<string, T>) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    if (channel) {
      channel.postMessage({ type: 'SYNC_UPDATE', key });
    }
  } catch {}
}

export class FriendsService {
  // ==========================================
  // INVITATIONS
  // ==========================================

  async createInvitation(host: User, roomTitle: string = 'OG Shared Session'): Promise<RoomInvitation> {
    const inviteToken = 'og-inv-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
    const roomId = 'room_' + host.id;
    const now = Date.now();
    const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days

    const invitation: RoomInvitation = {
      id: inviteToken,
      roomId,
      hostId: host.id,
      hostName: host.displayName || host.email.split('@')[0],
      hostEmail: host.email,
      roomTitle,
      status: 'active',
      createdAt: now,
      expiresAt,
    };

    if (db) {
      try {
        await setDoc(doc(db, 'roomInvitations', inviteToken), invitation);
      } catch (err) {
        console.warn('Firestore invitation write skipped, falling back to local sync:', err);
      }
    }

    // Always mirror to local store for resilience
    const all = readLocal<RoomInvitation>(LS_INVITES);
    all[inviteToken] = invitation;
    writeLocal(LS_INVITES, all);

    return invitation;
  }

  async getInvitation(inviteToken: string): Promise<RoomInvitation | null> {
    if (!inviteToken) return null;

    if (db) {
      try {
        const snap = await getDoc(doc(db, 'roomInvitations', inviteToken));
        if (snap.exists()) {
          const inv = snap.data() as RoomInvitation;
          if (inv.expiresAt < Date.now()) {
            return { ...inv, status: 'expired' };
          }
          return inv;
        }
      } catch (err) {
        console.warn('Firestore invitation lookup fallback:', err);
      }
    }

    const all = readLocal<RoomInvitation>(LS_INVITES);
    const inv = all[inviteToken] || null;
    if (inv && inv.expiresAt < Date.now()) {
      return { ...inv, status: 'expired' };
    }
    return inv;
  }

  async revokeInvitation(inviteToken: string, hostId: string): Promise<void> {
    if (db) {
      try {
        const ref = doc(db, 'roomInvitations', inviteToken);
        const snap = await getDoc(ref);
        if (snap.exists() && (snap.data() as RoomInvitation).hostId === hostId) {
          await updateDoc(ref, { status: 'revoked' });
        }
      } catch (err) {
        console.warn('Firestore revoke error:', err);
      }
    }

    const all = readLocal<RoomInvitation>(LS_INVITES);
    if (all[inviteToken] && all[inviteToken].hostId === hostId) {
      all[inviteToken].status = 'revoked';
      writeLocal(LS_INVITES, all);
    }
  }

  async getSentInvitations(hostId: string): Promise<RoomInvitation[]> {
    if (db) {
      try {
        const q = query(
          collection(db, 'roomInvitations'),
          where('hostId', '==', hostId)
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => d.data() as RoomInvitation);
      } catch (err) {
        console.warn('Firestore sent invitations fallback:', err);
      }
    }

    const all = readLocal<RoomInvitation>(LS_INVITES);
    return Object.values(all).filter(inv => inv.hostId === hostId);
  }

  // ==========================================
  // JOIN REQUESTS & APPROVAL FLOW
  // ==========================================

  async requestToJoin(invite: RoomInvitation, user: User): Promise<RoomJoinRequest> {
    if (invite.hostId === user.id) {
      throw new Error('You cannot join your own room as a guest listener.');
    }
    if (invite.status !== 'active') {
      throw new Error(`This invitation is ${invite.status}. Please ask the host for a new link.`);
    }

    const requestId = `${invite.roomId}_${user.id}`;
    const now = Date.now();
    const request: RoomJoinRequest = {
      id: requestId,
      roomId: invite.roomId,
      inviteToken: invite.id,
      hostId: invite.hostId,
      userId: user.id,
      userDisplayName: user.displayName || user.email.split('@')[0],
      userEmail: user.email,
      userPhotoURL: user.photoURL,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    if (db) {
      try {
        await setDoc(doc(db, 'roomJoinRequests', requestId), request);
      } catch (err) {
        console.warn('Firestore request write fallback:', err);
      }
    }

    const all = readLocal<RoomJoinRequest>(LS_REQUESTS);
    all[requestId] = request;
    writeLocal(LS_REQUESTS, all);

    return request;
  }

  async respondToRequest(
    request: RoomJoinRequest,
    host: User,
    accept: boolean
  ): Promise<void> {
    if (request.hostId !== host.id) {
      throw new Error('Unauthorized: Only the room host can approve or reject join requests.');
    }

    const newStatus = accept ? 'accepted' : 'rejected';
    const now = Date.now();

    // 1. Update Request status
    if (db) {
      try {
        await updateDoc(doc(db, 'roomJoinRequests', request.id), {
          status: newStatus,
          updatedAt: now,
        });
      } catch (err) {
        console.warn('Firestore respond request fallback:', err);
      }
    }

    const reqs = readLocal<RoomJoinRequest>(LS_REQUESTS);
    if (reqs[request.id]) {
      reqs[request.id].status = newStatus;
      reqs[request.id].updatedAt = now;
      writeLocal(LS_REQUESTS, reqs);
    }

    if (accept) {
      // 2. Add as participant to the room
      const room = await this.getRoom(request.roomId);
      if (room) {
        const participant: RoomParticipant = {
          id: request.userId,
          displayName: request.userDisplayName,
          email: request.userEmail,
          photoURL: request.userPhotoURL,
          role: 'listener',
          joinedAt: now,
          lastHeartbeat: now,
        };
        const updatedParticipants = {
          ...room.participants,
          [request.userId]: participant,
        };

        await this.saveRoom({
          ...room,
          participants: updatedParticipants,
          updatedAt: now,
        });
      }

      // 3. Establish permanent Friendship
      await this.createFriendship(host, {
        id: request.userId,
        displayName: request.userDisplayName,
        email: request.userEmail,
        photoURL: request.userPhotoURL,
      });
    }
  }

  subscribeToIncomingRequests(
    hostId: string,
    callback: (requests: RoomJoinRequest[]) => void
  ): () => void {
    if (db) {
      try {
        const q = query(
          collection(db, 'roomJoinRequests'),
          where('hostId', '==', hostId)
        );
        return onSnapshot(q, (snapshot) => {
          const list = snapshot.docs.map(d => d.data() as RoomJoinRequest);
          callback(list.filter(r => r.status === 'pending'));
        }, (err) => {
          console.warn('Firestore request subscription fallback to local:', err);
        });
      } catch {}
    }

    // Local / Dev subscription
    const update = () => {
      const all = readLocal<RoomJoinRequest>(LS_REQUESTS);
      const hostRequests = Object.values(all).filter(
        r => r.hostId === hostId && r.status === 'pending'
      );
      callback(hostRequests);
    };

    update();
    const handler = (e: MessageEvent) => {
      if (e.data?.key === LS_REQUESTS || e.data?.type === 'SYNC_UPDATE') {
        update();
      }
    };
    if (channel) channel.addEventListener('message', handler);
    window.addEventListener('storage', update);

    return () => {
      if (channel) channel.removeEventListener('message', handler);
      window.removeEventListener('storage', update);
    };
  }

  subscribeToMyRequest(
    roomId: string,
    userId: string,
    callback: (request: RoomJoinRequest | null) => void
  ): () => void {
    const requestId = `${roomId}_${userId}`;

    if (db) {
      try {
        return onSnapshot(doc(db, 'roomJoinRequests', requestId), (snap) => {
          if (snap.exists()) {
            callback(snap.data() as RoomJoinRequest);
          } else {
            callback(null);
          }
        });
      } catch {}
    }

    const update = () => {
      const all = readLocal<RoomJoinRequest>(LS_REQUESTS);
      callback(all[requestId] || null);
    };

    update();
    const handler = () => update();
    if (channel) channel.addEventListener('message', handler);
    window.addEventListener('storage', update);

    return () => {
      if (channel) channel.removeEventListener('message', handler);
      window.removeEventListener('storage', update);
    };
  }

  // ==========================================
  // FRIENDSHIPS (ACCEPTED FRIENDS)
  // ==========================================

  async createFriendship(userA: User, userB: User): Promise<void> {
    const sortedIds = [userA.id, userB.id].sort();
    const friendshipId = `${sortedIds[0]}_${sortedIds[1]}`;
    const now = Date.now();

    const friendship: Friendship = {
      id: friendshipId,
      users: [userA.id, userB.id],
      userA: {
        id: userA.id,
        displayName: userA.displayName || userA.email.split('@')[0],
        email: userA.email,
        photoURL: userA.photoURL,
      },
      userB: {
        id: userB.id,
        displayName: userB.displayName || userB.email.split('@')[0],
        email: userB.email,
        photoURL: userB.photoURL,
      },
      status: 'accepted',
      createdAt: now,
      updatedAt: now,
    };

    if (db) {
      try {
        await setDoc(doc(db, 'friendships', friendshipId), friendship, { merge: true });
      } catch (err) {
        console.warn('Firestore friendship write fallback:', err);
      }
    }

    const all = readLocal<Friendship>(LS_FRIENDSHIPS);
    all[friendshipId] = friendship;
    writeLocal(LS_FRIENDSHIPS, all);
  }

  async removeFriend(userId: string, friendId: string): Promise<void> {
    const sortedIds = [userId, friendId].sort();
    const friendshipId = `${sortedIds[0]}_${sortedIds[1]}`;

    if (db) {
      try {
        await deleteDoc(doc(db, 'friendships', friendshipId));
      } catch {}
    }

    const all = readLocal<Friendship>(LS_FRIENDSHIPS);
    delete all[friendshipId];
    writeLocal(LS_FRIENDSHIPS, all);
  }

  subscribeToFriends(
    userId: string,
    callback: (friends: User[]) => void
  ): () => void {
    if (db) {
      try {
        const q = query(
          collection(db, 'friendships'),
          where('users', 'array-contains', userId)
        );
        return onSnapshot(q, (snap) => {
          const list = snap.docs.map(d => d.data() as Friendship);
          const friends: User[] = list
            .filter(f => f.status === 'accepted')
            .map(f => {
              const other = f.userA.id === userId ? f.userB : f.userA;
              return {
                id: other.id,
                displayName: other.displayName,
                email: other.email,
                photoURL: other.photoURL,
              };
            });
          callback(friends);
        });
      } catch {}
    }

    const update = () => {
      const all = readLocal<Friendship>(LS_FRIENDSHIPS);
      const friends: User[] = Object.values(all)
        .filter(f => f.users.includes(userId) && f.status === 'accepted')
        .map(f => {
          const other = f.userA.id === userId ? f.userB : f.userA;
          return {
            id: other.id,
            displayName: other.displayName,
            email: other.email,
            photoURL: other.photoURL,
          };
        });
      callback(friends);
    };

    update();
    const handler = () => update();
    if (channel) channel.addEventListener('message', handler);
    window.addEventListener('storage', update);

    return () => {
      if (channel) channel.removeEventListener('message', handler);
      window.removeEventListener('storage', update);
    };
  }

  // ==========================================
  // LISTENING ROOMS (REAL-TIME PLAYBACK SYNC)
  // ==========================================

  async getRoom(roomId: string): Promise<ListeningRoom | null> {
    if (!roomId) return null;

    if (db) {
      try {
        const snap = await getDoc(doc(db, 'listeningRooms', roomId));
        if (snap.exists()) {
          return snap.data() as ListeningRoom;
        }
      } catch {}
    }

    const all = readLocal<ListeningRoom>(LS_ROOMS);
    return all[roomId] || null;
  }

  async saveRoom(room: ListeningRoom): Promise<void> {
    if (db) {
      try {
        await setDoc(doc(db, 'listeningRooms', room.id), room, { merge: true });
      } catch (err) {
        console.warn('Firestore save room error:', err);
      }
    }

    const all = readLocal<ListeningRoom>(LS_ROOMS);
    all[room.id] = room;
    writeLocal(LS_ROOMS, all);
  }

  async createOrGetRoom(
    host: User,
    roomName: string = `${host.displayName || host.email.split('@')[0]}'s Room`
  ): Promise<ListeningRoom> {
    const roomId = 'room_' + host.id;
    const existing = await this.getRoom(roomId);

    if (existing && existing.status === 'active') {
      return existing;
    }

    const now = Date.now();
    const hostParticipant: RoomParticipant = {
      id: host.id,
      displayName: host.displayName || host.email.split('@')[0],
      email: host.email,
      photoURL: host.photoURL,
      role: 'host',
      joinedAt: now,
      lastHeartbeat: now,
    };

    const newRoom: ListeningRoom = {
      id: roomId,
      name: roomName,
      hostId: host.id,
      hostName: host.displayName || host.email.split('@')[0],
      hostPhotoURL: host.photoURL,
      status: 'active',
      currentTrack: null,
      playbackState: 'paused',
      basePosition: 0,
      baseTimestamp: now,
      stateVersion: 1,
      queue: [],
      queueIndex: -1,
      participants: {
        [host.id]: hostParticipant,
      },
      createdAt: now,
      updatedAt: now,
    };

    await this.saveRoom(newRoom);
    return newRoom;
  }

  async updatePlaybackState(
    roomId: string,
    hostId: string,
    update: {
      currentTrack?: Song | null;
      playbackState?: 'playing' | 'paused';
      basePosition?: number;
      queue?: QueueItem[];
      queueIndex?: number;
    }
  ): Promise<void> {
    const room = await this.getRoom(roomId);
    if (!room || room.status !== 'active') return;
    if (room.hostId !== hostId) {
      throw new Error('Unauthorized: Only the host may broadcast playback updates.');
    }

    const now = Date.now();
    const updatedRoom: ListeningRoom = {
      ...room,
      currentTrack: update.currentTrack !== undefined ? update.currentTrack : room.currentTrack,
      playbackState: update.playbackState !== undefined ? update.playbackState : room.playbackState,
      basePosition: update.basePosition !== undefined ? update.basePosition : room.basePosition,
      baseTimestamp: now,
      stateVersion: room.stateVersion + 1,
      queue: update.queue !== undefined ? update.queue : room.queue,
      queueIndex: update.queueIndex !== undefined ? update.queueIndex : room.queueIndex,
      updatedAt: now,
    };

    await this.saveRoom(updatedRoom);
  }

  async sendHeartbeat(roomId: string, user: User): Promise<void> {
    const room = await this.getRoom(roomId);
    if (!room || !room.participants[user.id]) return;

    room.participants[user.id].lastHeartbeat = Date.now();
    await this.saveRoom(room);
  }

  async leaveRoom(roomId: string, userId: string): Promise<void> {
    const room = await this.getRoom(roomId);
    if (!room) return;

    if (room.hostId === userId) {
      // Host leaves -> room ends
      await this.endRoom(roomId, userId);
      return;
    }

    const updatedParticipants = { ...room.participants };
    delete updatedParticipants[userId];
    await this.saveRoom({
      ...room,
      participants: updatedParticipants,
      updatedAt: Date.now(),
    });
  }

  async removeParticipant(roomId: string, hostId: string, participantId: string): Promise<void> {
    const room = await this.getRoom(roomId);
    if (!room || room.hostId !== hostId) return;

    const updatedParticipants = { ...room.participants };
    delete updatedParticipants[participantId];
    await this.saveRoom({
      ...room,
      participants: updatedParticipants,
      updatedAt: Date.now(),
    });
  }

  async endRoom(roomId: string, hostId: string): Promise<void> {
    const room = await this.getRoom(roomId);
    if (!room || room.hostId !== hostId) return;

    await this.saveRoom({
      ...room,
      status: 'ended',
      playbackState: 'paused',
      updatedAt: Date.now(),
    });
  }

  subscribeToRoom(
    roomId: string,
    callback: (room: ListeningRoom | null) => void
  ): () => void {
    if (db) {
      try {
        return onSnapshot(doc(db, 'listeningRooms', roomId), (snap) => {
          if (snap.exists()) {
            callback(snap.data() as ListeningRoom);
          } else {
            callback(null);
          }
        });
      } catch {}
    }

    const update = () => {
      const all = readLocal<ListeningRoom>(LS_ROOMS);
      callback(all[roomId] || null);
    };

    update();
    const handler = (e: MessageEvent) => {
      if (e.data?.key === LS_ROOMS || e.data?.type === 'SYNC_UPDATE') {
        update();
      }
    };
    if (channel) channel.addEventListener('message', handler);
    window.addEventListener('storage', update);

    return () => {
      if (channel) channel.removeEventListener('message', handler);
      window.removeEventListener('storage', update);
    };
  }
}

export const friendsService = new FriendsService();
