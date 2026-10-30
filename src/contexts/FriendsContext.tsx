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

  const lastBroadcastRef = useRef<{
    trackId: string | null;
    playing: boolean;
    pos: number;
    time: number;
    queueIndex: number;
  }>({ trackId: null, playing: false, pos: 0, time: 0, queueIndex: -1 });

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

    const interval = setInterval(() => {
      friendsService.sendHeartbeat(activeRoom.id, user);
    }, 15000);

    return () => clearInterval(interval);
  }, [activeRoom?.id, user]);

  // 5. HOST BROADCASTER: When host changes song or play/pause/seek, update the room
  useEffect(() => {
    if (!isHost || !activeRoom || !user) {
      player.setOnPlaybackBroadcast(null);
      return;
    }

    // Direct imperative action broadcast hook
    player.setOnPlaybackBroadcast((cmd) => {
      if (isApplyingRemoteSyncRef.current) return;
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

    // Avoid broadcasting state updates that originated from remote sync
    if (isApplyingRemoteSyncRef.current) return;

    const currentTrackId = player.currentTrack?.id || null;
    const isPlaying = player.isPlaying;
    const pos = player.currentTime;
    const qIndex = player.queueIndex;
    const now = Date.now();

    const trackChanged = currentTrackId !== lastBroadcastRef.current.trackId;
    const playStateChanged = isPlaying !== lastBroadcastRef.current.playing;
    const queueIndexChanged = qIndex !== lastBroadcastRef.current.queueIndex;

    // Detect seek jumps (deviation from continuous linear timeline)
    const expectedLinearPos = lastBroadcastRef.current.playing
      ? lastBroadcastRef.current.pos + (now - lastBroadcastRef.current.time) / 1000
      : lastBroadcastRef.current.pos;
    const isSeekJump = Math.abs(pos - expectedLinearPos) > 3;

    if (trackChanged || playStateChanged || queueIndexChanged || isSeekJump) {
      lastBroadcastRef.current = {
        trackId: currentTrackId,
        playing: isPlaying,
        pos,
        time: now,
        queueIndex: qIndex,
      };

      friendsService.updatePlaybackState(activeRoom.id, user.id, {
        currentTrack: player.currentTrack,
        playbackState: isPlaying ? 'playing' : 'paused',
        basePosition: pos,
        queue: player.queue,
        queueIndex: qIndex,
        shuffleEnabled: player.isShuffle,
        repeatMode: player.repeatMode,
        lastCommandId: `auto_${now}`
      }).catch(err => {
        console.warn('Playback broadcast error:', err);
      });
    }

    return () => {
      player.setOnPlaybackBroadcast(null);
    };
  }, [
    isHost,
    activeRoom?.id,
    player.currentTrack,
    player.isPlaying,
    player.currentTime,
    player.queue,
    player.queueIndex,
    player.isShuffle,
    player.repeatMode,
    player.setOnPlaybackBroadcast,
    user
  ]);

  // 6. LISTENER RECONCILIATION: When listener is in room, follow host playback
  useEffect(() => {
    if (!isListener || !activeRoom || !activeRoom.currentTrack) return;

    const remoteTrack: Song = activeRoom.currentTrack;
    const remotePlayState = activeRoom.playbackState;
    const basePos = activeRoom.basePosition;
    const baseTs = activeRoom.baseTimestamp;

    // Calculate authoritative expected position
    const elapsed = remotePlayState === 'playing' ? (Date.now() - baseTs) / 1000 : 0;
    const expectedPos = Math.max(0, basePos + elapsed);

    // Track identity sync
    if (player.currentTrack?.id !== remoteTrack.id) {
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
        }, 300);
      }, 500);
      return;
    }

    // Play/Pause sync
    if (remotePlayState === 'playing' && !player.isPlaying) {
      isApplyingRemoteSyncRef.current = true;
      player.play();
      setTimeout(() => { isApplyingRemoteSyncRef.current = false; }, 200);
    } else if (remotePlayState === 'paused' && player.isPlaying) {
      isApplyingRemoteSyncRef.current = true;
      player.pause();
      setTimeout(() => { isApplyingRemoteSyncRef.current = false; }, 200);
    }

    // Controlled drift reconciliation (do not hard-seek within 2.5s window)
    const drift = Math.abs(player.currentTime - expectedPos);
    setSyncDrift(Math.round(drift * 10) / 10);
    setIsSynced(drift < 2.5);

    if (drift > 2.5 && remotePlayState === 'playing') {
      isApplyingRemoteSyncRef.current = true;
      player.seek(expectedPos, true);
      setTimeout(() => { isApplyingRemoteSyncRef.current = false; }, 300);
    }
  }, [
    isListener,
    activeRoom?.stateVersion,
    activeRoom?.currentTrack,
    activeRoom?.playbackState,
    activeRoom?.basePosition,
    activeRoom?.baseTimestamp,
  ]);

  // 6b. Continuous drift checker for listeners (every 3 seconds)
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
      const basePos = activeRoom.basePosition;
      const baseTs = activeRoom.baseTimestamp;
      const elapsed = (Date.now() - baseTs) / 1000;
      const expectedPos = Math.max(0, basePos + elapsed);
      const currentPos = playerCurrentTimeRef.current;
      const drift = Math.abs(currentPos - expectedPos);
      
      setSyncDrift(Math.round(drift * 10) / 10);
      setIsSynced(drift < 2.5);

      if (drift > 2.5) {
        isApplyingRemoteSyncRef.current = true;
        player.seek(expectedPos, true);
        setTimeout(() => { isApplyingRemoteSyncRef.current = false; }, 300);
      }
    }, 3000);

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

  const requestJoinRoom = async (invite: RoomInvitation): Promise<void> => {
    if (!user) throw new Error('Please sign in to request access.');
    setJoinRequestStatus('pending');

    const req = await friendsService.requestToJoin(invite, user);

    // Listen for host's acceptance
    const unsub = friendsService.subscribeToMyRequest(req.roomId, user.id, async (updatedReq) => {
      if (updatedReq?.status === 'accepted') {
        setJoinRequestStatus('accepted');
        unsub();
        // Load the room with retry to ensure host write propagation
        let room = await friendsService.getRoom(invite.roomId);
        if (!room) {
          await new Promise(r => setTimeout(r, 400));
          room = await friendsService.getRoom(invite.roomId);
        }
        if (room && room.status === 'active') {
          setActiveRoom(room);
          localStorage.setItem(ACTIVE_ROOM_KEY, room.id);
        }
      } else if (updatedReq?.status === 'rejected') {
        setJoinRequestStatus('rejected');
        unsub();
      }
    });
  };

  const acceptJoinRequest = async (req: RoomJoinRequest): Promise<void> => {
    if (!user) return;
    await friendsService.respondToRequest(req, user, true);
    setPendingRequests(prev => prev.filter(r => r.id !== req.id));
  };

  const rejectJoinRequest = async (req: RoomJoinRequest): Promise<void> => {
    if (!user) return;
    await friendsService.respondToRequest(req, user, false);
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
