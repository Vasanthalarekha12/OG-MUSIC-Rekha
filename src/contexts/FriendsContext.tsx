import { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { usePlayer } from './PlayerContext';
import { friendsService } from '../services/friends/friendsService';
import type { User, Song } from '../types';
import type {
  ListeningRoom,
  RoomInvitation,
  RoomJoinRequest,
} from '../types/friends';

interface FriendsContextType {
  activeRoom: ListeningRoom | null;
  isHost: boolean;
  isListener: boolean;
  isSynced: boolean;
  syncDrift: number;
  friends: User[];
  pendingRequests: RoomJoinRequest[];
  sentInvitations: RoomInvitation[];
  activeInvitation: RoomInvitation | null;
  inviteLink: string;
  joinRequestStatus: 'idle' | 'pending' | 'accepted' | 'rejected';
  
  createRoom: (roomName?: string) => Promise<ListeningRoom>;
  endActiveRoom: () => Promise<void>;
  leaveActiveRoom: () => Promise<void>;
  kickParticipant: (participantId: string) => Promise<void>;
  generateNewInvite: () => Promise<RoomInvitation>;
  revokeInvite: (token: string) => Promise<void>;
  copyInviteLink: () => Promise<boolean>;
  shareOnWhatsApp: () => void;
  requestJoinRoom: (invite: RoomInvitation) => Promise<void>;
  joinRoomSession: (roomId: string) => Promise<boolean>;
  setJoinRequestStatus: (status: 'idle' | 'pending' | 'accepted' | 'rejected') => void;
  acceptJoinRequest: (req: RoomJoinRequest) => Promise<void>;
  rejectJoinRequest: (req: RoomJoinRequest) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
}

const FriendsContext = createContext<FriendsContextType | undefined>(undefined);

const ACTIVE_ROOM_KEY = 'og_music_active_room_id';

export const FriendsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const player = usePlayer();

  const [activeRoom, setActiveRoom] = useState<ListeningRoom | null>(null);
  const [friends, setFriends] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState<RoomJoinRequest[]>([]);
  const [sentInvitations, setSentInvitations] = useState<RoomInvitation[]>([]);
  const [activeInvitation, setActiveInvitation] = useState<RoomInvitation | null>(null);
  const [joinRequestStatus, setJoinRequestStatus] = useState<'idle' | 'pending' | 'accepted' | 'rejected'>('idle');
  const [isSynced, setIsSynced] = useState(true);
  const [syncDrift, setSyncDrift] = useState(0);

  const isHost = Boolean(activeRoom && user && activeRoom.hostId === user.id);
  const isListener = Boolean(
    activeRoom && user && activeRoom.hostId !== user.id && activeRoom.participants[user.id]
  );

  const isApplyingRemoteSyncRef = useRef(false);

  // Sync listener mode to player to prevent independent queue progression
  useEffect(() => {
    player.setIsListenerMode(isListener);
  }, [isListener, player]);

  // 1. Restore active room from localStorage on mount / user change
  useEffect(() => {
    if (!user) {
      setActiveRoom(null);
      return;
    }
    const savedRoomId = localStorage.getItem(ACTIVE_ROOM_KEY);
    if (savedRoomId) {
      friendsService.getRoom(savedRoomId).then(room => {
        if (room && room.status === 'active') {
          setActiveRoom(room);
        } else {
          localStorage.removeItem(ACTIVE_ROOM_KEY);
        }
      });
    }
  }, [user]);

  // 2. Real-time subscription to activeRoom
  useEffect(() => {
    if (!activeRoom?.id) return;

    const unsub = friendsService.subscribeToRoom(activeRoom.id, (room) => {
      if (!room || room.status === 'ended') {
        setActiveRoom(null);
        localStorage.removeItem(ACTIVE_ROOM_KEY);
      } else {
        // If listener was removed by host
        if (user && room.hostId !== user.id && !room.participants[user.id]) {
          setActiveRoom(null);
          localStorage.removeItem(ACTIVE_ROOM_KEY);
        } else {
          setActiveRoom(room);
        }
      }
    });

    return () => unsub();
  }, [activeRoom?.id, user]);

  // 3. Subscribe to Friends and Pending Requests for current user
  useEffect(() => {
    if (!user) {
      setFriends([]);
      setPendingRequests([]);
      setSentInvitations([]);
      return;
    }

    const unsubFriends = friendsService.subscribeToFriends(user.id, (list) => {
      setFriends(list);
    });

    const unsubReqs = friendsService.subscribeToIncomingRequests(user.id, (reqs) => {
      setPendingRequests(reqs);
    });

    friendsService.getSentInvitations(user.id).then(invs => {
      const active = invs.filter(i => i.status === 'active' && i.expiresAt > Date.now());
      setSentInvitations(active);
      if (active.length > 0) {
        setActiveInvitation(active[0]);
      }
    });

    return () => {
      unsubFriends();
      unsubReqs();
    };
  }, [user]);

  // 4. Heartbeat for room participants
  useEffect(() => {
    if (!activeRoom || !user || activeRoom.status !== 'active') return;

    const currentPlaybackState =
      player.playbackVerifiedState === 'PLAYING'
        ? 'playing'
        : player.playbackVerifiedState === 'BUFFERING' || player.playbackVerifiedState === 'SOURCE_RESOLVING'
        ? 'buffering'
        : player.playbackVerifiedState === 'PAUSED'
        ? 'paused'
        : player.playbackVerifiedState === 'FAILED'
        ? 'failed'
        : 'idle';

    // Immediate heartbeat on mount/change
    friendsService.sendHeartbeat(activeRoom.id, user, currentPlaybackState);

    const interval = setInterval(() => {
      friendsService.sendHeartbeat(activeRoom.id, user, currentPlaybackState);
    }, 15000);

    return () => clearInterval(interval);
  }, [activeRoom?.id, user, player.playbackVerifiedState]);

  // 5. HOST BROADCASTER: Broadcasts playback commands authoritatively
  const lastTrackIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isHost || !activeRoom || !user) {
      player.setOnPlaybackBroadcast(null);
      return;
    }

    // Direct imperative action broadcast hook (fires on PLAY, PAUSE, SEEK, TRACK_CHANGE, QUEUE_CHANGE)
    player.setOnPlaybackBroadcast((cmd) => {
      if (isApplyingRemoteSyncRef.current) return;
      lastTrackIdRef.current = cmd.track?.id || null;
      friendsService.updatePlaybackState(activeRoom.id, user.id, {
        currentTrack: cmd.track,
        playbackState: cmd.type === 'PAUSE' ? 'paused' : 'playing',
        basePosition: cmd.position,
        queue: cmd.queue,
        queueIndex: cmd.queueIndex,
        shuffleEnabled: cmd.shuffle,
        repeatMode: cmd.repeat,
        lastCommandId: `${cmd.type}_${Date.now()}`
      }).catch(err => {
        console.warn('Playback broadcast hook error:', err);
      });
    });

    return () => {
      player.setOnPlaybackBroadcast(null);
    };
  }, [isHost, activeRoom?.id, user, player.setOnPlaybackBroadcast]);

  // 5b. Detect natural track transition when a song ends and player auto-advances
  useEffect(() => {
    if (!isHost || !activeRoom || !user || !player.currentTrack) return;
    if (isApplyingRemoteSyncRef.current) return;

    if (lastTrackIdRef.current && lastTrackIdRef.current !== player.currentTrack.id) {
      lastTrackIdRef.current = player.currentTrack.id;
      friendsService.updatePlaybackState(activeRoom.id, user.id, {
        currentTrack: player.currentTrack,
        playbackState: player.isPlaying ? 'playing' : 'paused',
        basePosition: 0,
        queue: player.queue,
        queueIndex: player.queueIndex,
        shuffleEnabled: player.isShuffle,
        repeatMode: player.repeatMode,
        lastCommandId: `natural_next_${Date.now()}`
      }).catch(() => {});
    } else if (!lastTrackIdRef.current) {
      lastTrackIdRef.current = player.currentTrack.id;
    }
  }, [isHost, activeRoom?.id, user, player.currentTrack, player.isPlaying, player.queue, player.queueIndex, player.isShuffle, player.repeatMode]);

  // 5c. Low-frequency anchor (every 25 seconds during active playback to prevent long-term drift)
  useEffect(() => {
    if (!isHost || !activeRoom || !user || !player.isPlaying || !player.currentTrack) return;

    const interval = setInterval(() => {
      if (isApplyingRemoteSyncRef.current) return;
      friendsService.updatePlaybackState(activeRoom.id, user.id, {
        currentTrack: player.currentTrack,
        playbackState: 'playing',
        basePosition: player.currentTime,
        queue: player.queue,
        queueIndex: player.queueIndex,
        shuffleEnabled: player.isShuffle,
        repeatMode: player.repeatMode,
        lastCommandId: `anchor_${Date.now()}`
      }).catch(() => {});
    }, 25000);

    return () => clearInterval(interval);
  }, [isHost, activeRoom?.id, user, player.isPlaying, player.currentTrack, player.currentTime, player.queue, player.queueIndex, player.isShuffle, player.repeatMode]);

  // 6. LISTENER RECONCILIATION: Follow host playback smoothly without stutter or seek loops
  const lastSyncedTrackIdRef = useRef<string | null>(null);
  const lastSeekTimestampRef = useRef<number>(0);

  useEffect(() => {
    if (!isListener || !activeRoom || !activeRoom.currentTrack) return;

    const remoteTrack: Song = activeRoom.currentTrack;
    const remotePlayState = activeRoom.playbackState;
    const basePos = activeRoom.basePosition || 0;
    const baseTs = activeRoom.baseTimestamp || Date.now();

    const elapsed = remotePlayState === 'playing' ? (Date.now() - baseTs) / 1000 : 0;
    const expectedPos = Math.max(0, basePos + elapsed);

    // Track identity transition
    if (player.currentTrack?.id !== remoteTrack.id || lastSyncedTrackIdRef.current !== remoteTrack.id) {
      lastSyncedTrackIdRef.current = remoteTrack.id;
      isApplyingRemoteSyncRef.current = true;
      player.play(remoteTrack);

      setTimeout(() => {
        if (expectedPos > 0) {
          player.seek(expectedPos, true);
        }
        if (remotePlayState === 'paused') {
          player.pause();
        }
        setTimeout(() => {
          isApplyingRemoteSyncRef.current = false;
        }, 400);
      }, 600);
      return;
    }

    // Play/Pause sync
    if (remotePlayState === 'playing' && !player.isPlaying) {
      isApplyingRemoteSyncRef.current = true;
      player.play();
      setTimeout(() => { isApplyingRemoteSyncRef.current = false; }, 250);
    } else if (remotePlayState === 'paused' && player.isPlaying) {
      isApplyingRemoteSyncRef.current = true;
      player.pause();
      setTimeout(() => { isApplyingRemoteSyncRef.current = false; }, 250);
    }

    // Drift tolerance is 3.5s
    const drift = Math.abs(player.currentTime - expectedPos);
    setSyncDrift(Math.round(drift * 10) / 10);
    setIsSynced(drift <= 3.5);

    const now = Date.now();
    // Only seek if drift > 3.5s AND at least 10s has passed since last seek (to avoid seek-loops)
    if (drift > 3.5 && remotePlayState === 'playing' && (now - lastSeekTimestampRef.current > 10000)) {
      lastSeekTimestampRef.current = now;
      isApplyingRemoteSyncRef.current = true;
      player.seek(expectedPos, true);
      setTimeout(() => { isApplyingRemoteSyncRef.current = false; }, 400);
    }
  }, [
    isListener,
    activeRoom?.stateVersion,
    activeRoom?.currentTrack,
    activeRoom?.playbackState,
    activeRoom?.basePosition,
    activeRoom?.baseTimestamp,
  ]);

  // 6b. Periodic drift monitor for listeners (every 4 seconds)
  const playerCurrentTimeRef = useRef(player.currentTime);
  useEffect(() => {
    playerCurrentTimeRef.current = player.currentTime;
  }, [player.currentTime]);

  useEffect(() => {
    if (!isListener || !activeRoom || !activeRoom.currentTrack || activeRoom.playbackState !== 'playing') {
      return;
    }

    const interval = setInterval(() => {
      if (isApplyingRemoteSyncRef.current) return;
      const basePos = activeRoom.basePosition || 0;
      const baseTs = activeRoom.baseTimestamp || Date.now();
      const elapsed = (Date.now() - baseTs) / 1000;
      const expectedPos = Math.max(0, basePos + elapsed);
      const currentPos = playerCurrentTimeRef.current;
      const drift = Math.abs(currentPos - expectedPos);

      setSyncDrift(Math.round(drift * 10) / 10);
      setIsSynced(drift <= 3.5);

      const now = Date.now();
      if (drift > 3.5 && (now - lastSeekTimestampRef.current > 10000)) {
        lastSeekTimestampRef.current = now;
        isApplyingRemoteSyncRef.current = true;
        player.seek(expectedPos, true);
        setTimeout(() => { isApplyingRemoteSyncRef.current = false; }, 400);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [
    isListener,
    activeRoom?.id,
    activeRoom?.basePosition,
    activeRoom?.baseTimestamp,
    activeRoom?.playbackState,
    player.seek
  ]);

  // ==========================================
  // CONTEXT ACTIONS
  // ==========================================

  const createRoom = async (roomName?: string): Promise<ListeningRoom> => {
    if (!user) throw new Error('You must be signed in to create a listening room.');
    const room = await friendsService.createOrGetRoom(user, roomName);
    setActiveRoom(room);
    localStorage.setItem(ACTIVE_ROOM_KEY, room.id);

    // Also ensure active invitation is available for sharing
    let inv = activeInvitation;
    if (!inv || inv.expiresAt < Date.now()) {
      inv = await friendsService.createInvitation(user);
      setActiveInvitation(inv);
    }
    return room;
  };

  const endActiveRoom = async (): Promise<void> => {
    if (!activeRoom || !user || activeRoom.hostId !== user.id) return;
    await friendsService.endRoom(activeRoom.id, user.id);
    setActiveRoom(null);
    localStorage.removeItem(ACTIVE_ROOM_KEY);
  };

  const leaveActiveRoom = async (): Promise<void> => {
    if (!activeRoom || !user) return;
    await friendsService.leaveRoom(activeRoom.id, user.id);
    setActiveRoom(null);
    localStorage.removeItem(ACTIVE_ROOM_KEY);
  };

  const kickParticipant = async (participantId: string): Promise<void> => {
    if (!activeRoom || !user || activeRoom.hostId !== user.id) return;
    await friendsService.removeParticipant(activeRoom.id, user.id, participantId);
  };

  const generateNewInvite = async (): Promise<RoomInvitation> => {
    if (!user) throw new Error('You must be signed in.');
    const inv = await friendsService.createInvitation(user);
    setActiveInvitation(inv);
    const updated = [inv, ...sentInvitations.filter(i => i.id !== inv.id)];
    setSentInvitations(updated);
    return inv;
  };

  const revokeInvite = async (token: string): Promise<void> => {
    if (!user) return;
    await friendsService.revokeInvitation(token, user.id);
    setSentInvitations(prev => prev.filter(i => i.id !== token));
    if (activeInvitation?.id === token) {
      setActiveInvitation(null);
    }
  };

  const buildShareUrl = (token: string): string => {
    const hostName = user?.displayName || user?.email?.split('@')[0] || 'Host';
    const roomTitle = activeRoom?.name || `${hostName}'s Room`;
    const hostId = user?.id || '';
    const roomId = activeRoom?.id || `room_${hostId}`;
    const params = new URLSearchParams({
      h: hostName,
      r: roomTitle,
      hid: hostId,
      rid: roomId,
    });
    return `${window.location.origin}/friends/invite/${encodeURIComponent(token)}?${params.toString()}`;
  };

  const inviteLink = activeInvitation
    ? buildShareUrl(activeInvitation.id)
    : '';

  const copyInviteLink = async (): Promise<boolean> => {
    try {
      let targetToken = activeInvitation?.id;
      if (!targetToken && user) {
        const newInv = await generateNewInvite();
        targetToken = newInv.id;
      }
      if (!targetToken) return false;

      const linkToCopy = buildShareUrl(targetToken);

      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(linkToCopy);
          return true;
        } catch {
          // Fall through to textarea fallback
        }
      }

      // Safe fallback for older browsers or non-secure contexts
      const textArea = document.createElement('textarea');
      textArea.value = linkToCopy;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch {
      return false;
    }
  };

  const shareOnWhatsApp = async () => {
    let targetToken = activeInvitation?.id;
    if (!targetToken && user) {
      try {
        const newInv = await generateNewInvite();
        targetToken = newInv.id;
      } catch {}
    }
    const link = targetToken
      ? buildShareUrl(targetToken)
      : `${window.location.origin}/friends`;
    const hostName = user?.displayName || 'Your friend';
    const message = `Hey! Join ${hostName} on OG MUSIC and let's listen to music together in real-time. Open this invitation: ${link}`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const joinRoomSession = async (roomId: string): Promise<boolean> => {
    if (!user) return false;

    // Retry fetching room up to 10 times (at 400ms interval = 4s total)
    let room = await friendsService.getRoom(roomId);
    let retries = 10;
    while (retries > 0 && (!room || room.status !== 'active' || !room.participants?.[user.id])) {
      await new Promise(r => setTimeout(r, 400));
      room = await friendsService.getRoom(roomId);
      retries--;
    }

    if (room && room.status === 'active') {
      setActiveRoom(room);
      localStorage.setItem(ACTIVE_ROOM_KEY, room.id);
      return true;
    }
    return false;
  };

  const requestJoinRoom = async (invite: RoomInvitation): Promise<void> => {
    if (!user) throw new Error('Please sign in to request access.');
    setJoinRequestStatus('pending');

    const req = await friendsService.requestToJoin(invite, user);

    // Listen for host's acceptance
    const unsub = friendsService.subscribeToMyRequest(req.roomId, user.id, async (updatedReq) => {
      if (updatedReq?.status === 'accepted') {
        setJoinRequestStatus('accepted');
        unsub();
        await joinRoomSession(invite.roomId);
      } else if (updatedReq?.status === 'rejected') {
        setJoinRequestStatus('rejected');
        unsub();
      }
    });
  };

  const acceptJoinRequest = async (req: RoomJoinRequest): Promise<void> => {
    if (!user) return;
    const updatedRoom = await friendsService.respondToRequest(req, user, true);
    if (updatedRoom) {
      setActiveRoom(updatedRoom);
    }
    setPendingRequests(prev => prev.filter(r => r.id !== req.id));
  };

  const rejectJoinRequest = async (req: RoomJoinRequest): Promise<void> => {
    if (!user) return;
    const updatedRoom = await friendsService.respondToRequest(req, user, false);
    if (updatedRoom) {
      setActiveRoom(updatedRoom);
    }
    setPendingRequests(prev => prev.filter(r => r.id !== req.id));
  };

  const removeFriend = async (friendId: string): Promise<void> => {
    if (!user) return;
    await friendsService.removeFriend(user.id, friendId);
    setFriends(prev => prev.filter(f => f.id !== friendId));
  };

  return (
    <FriendsContext.Provider
      value={{
        activeRoom,
        isHost,
        isListener,
        isSynced,
        syncDrift,
        friends,
        pendingRequests,
        sentInvitations,
        activeInvitation,
        inviteLink,
        joinRequestStatus,
        setJoinRequestStatus,
        joinRoomSession,
        createRoom,
        endActiveRoom,
        leaveActiveRoom,
        kickParticipant,
        generateNewInvite,
        revokeInvite,
        copyInviteLink,
        shareOnWhatsApp,
        requestJoinRoom,
        acceptJoinRequest,
        rejectJoinRequest,
        removeFriend,
      }}
    >
      {children}
    </FriendsContext.Provider>
  );
};

export const useFriends = () => {
  const context = useContext(FriendsContext);
  if (!context) {
    throw new Error('useFriends must be used within a FriendsProvider');
  }
  return context;
};
