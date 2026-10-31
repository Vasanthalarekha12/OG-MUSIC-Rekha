import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Users,
  Radio,
  Share2,
  Copy,
  Check,
  UserCheck,
  UserPlus,
  Trash2,
  Volume2,
  Headphones,
  Crown,
  AlertCircle,
  Music2,
  LogOut,
  RefreshCw,
  MessageCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFriends } from '../../contexts/FriendsContext';
import { usePlayer } from '../../contexts/PlayerContext';
import { friendsService } from '../../services/friends/friendsService';
import type { RoomInvitation } from '../../types/friends';
import './Friends.css';

export const Friends = () => {
  const { token } = useParams<{ token?: string }>();
  const [searchParams] = useSearchParams();
  const inviteToken = token || searchParams.get('invite');
  const navigate = useNavigate();
  const player = usePlayer();

  const { user } = useAuth();
  const {
    activeRoom,
    isHost,
    isSynced,
    syncDrift,
    friends,
    pendingRequests,
    sentInvitations,
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
  } = useFriends();

  const [activeTab, setActiveTab] = useState<'room' | 'friends' | 'requests' | 'invite'>('room');
  const [copied, setCopied] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [guestInvite, setGuestInvite] = useState<RoomInvitation | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // If there's an incoming route parameter or ?invite= query parameter, resolve the invitation
  useEffect(() => {
    if (!inviteToken) {
      setGuestInvite(null);
      return;
    }

    let isMounted = true;
    setInviteError(null);

    friendsService.getInvitation(inviteToken, searchParams).then((inv) => {
      if (!isMounted) return;
      if (!inv) {
        setInviteError('Invitation not found or has been removed.');
      } else if (inv.status === 'revoked') {
        setInviteError('This invitation has been revoked by the host.');
      } else if (inv.status === 'expired') {
        setInviteError('This invitation link has expired.');
      } else {
        setGuestInvite(inv);
      }
    }).catch(() => {
      if (isMounted) {
        setInviteError('Failed to verify invitation. Please check your network.');
      }
    });

    return () => { isMounted = false; };
  }, [inviteToken, searchParams]);

  // Automatically navigate into the room as soon as admission is approved
  useEffect(() => {
    if (joinRequestStatus === 'accepted' || (activeRoom && guestInvite && activeRoom.id === guestInvite.roomId)) {
      setGuestInvite(null);
      setActiveTab('room');
      if (token) {
        navigate('/friends', { replace: true });
      }
    }
  }, [joinRequestStatus, activeRoom, guestInvite, token, navigate]);

  const handleCopy = async () => {
    const success = await copyInviteLink();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleStartRoom = async () => {
    try {
      setIsCreatingRoom(true);
      await createRoom();
    } finally {
      setIsCreatingRoom(false);
    }
  };

  // If user is not logged in:
  if (!user) {
    const returnPath = inviteToken
      ? `/friends/invite/${encodeURIComponent(inviteToken)}${window.location.search || ''}`
      : '/friends';

    try {
      if (inviteToken) {
        sessionStorage.setItem('og_pending_invite_url', returnPath);
      }
    } catch {}

    return (
      <div className="friends-page-container">
        <div className="friends-hero-banner">
          <h1 className="friends-hero-title">
            <Users size={32} color="var(--brand-red, #dc2626)" /> Friends — Listen Together
          </h1>
          <p className="friends-hero-subtitle">
            Synchronize your music stream in real-time with friends. Wherever they are, listen to the exact same beat.
          </p>
        </div>

        <div className="friends-card" style={{ maxWidth: '480px', margin: '40px auto', textAlign: 'center' }}>
          <div className="friends-empty-icon" style={{ margin: '0 auto' }}>
            <Users size={28} />
          </div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#fff' }}>
            {guestInvite ? `Join ${guestInvite.hostName}'s Room` : 'Sign in to Connect with Friends'}
          </h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {guestInvite
              ? `You received an invitation to join "${guestInvite.roomTitle}" hosted by ${guestInvite.hostName}. Sign in to send your request.`
              : 'Create listening rooms, share synchronized audio sessions, and invite friends via WhatsApp.'}
          </p>
          <button
            type="button"
            className="og-btn-primary"
            style={{ width: '100%', marginTop: '8px' }}
            onClick={() => navigate('/login', { state: { from: returnPath } })}
          >
            Sign In to Join Room
          </button>
        </div>
      </div>
    );
  }

  // If viewing an invitation as a guest user:
  if (guestInvite && joinRequestStatus !== 'accepted' && (!activeRoom || activeRoom.id !== guestInvite.roomId)) {
    const isHostOfInvite = guestInvite.hostId === user.id;

    return (
      <div className="friends-page-container">
        <div className="friends-hero-banner">
          <h1 className="friends-hero-title">
            <Radio size={30} color="var(--brand-red, #dc2626)" /> Room Invitation
          </h1>
          <p className="friends-hero-subtitle">
            You were invited to a synchronized listening session on OG MUSIC.
          </p>
        </div>

        <div className="friends-card" style={{ maxWidth: '520px', margin: '20px auto', textAlign: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div className="participant-avatar" style={{ width: '64px', height: '64px', fontSize: '1.4rem' }}>
              {guestInvite.hostName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#fff' }}>{guestInvite.roomTitle}</h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Hosted by <strong>{guestInvite.hostName}</strong>
              </p>
            </div>
          </div>

          {inviteError && (
            <div style={{ padding: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', color: '#f87171', fontSize: '0.9rem' }}>
              <AlertCircle size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: '-3px' }} />
              {inviteError}
            </div>
          )}

          {isHostOfInvite ? (
            <div>
              <p style={{ color: 'var(--brand-red)', fontWeight: 600 }}>This is your own listening room invitation.</p>
              <button type="button" className="og-btn-primary" onClick={() => navigate('/friends')}>
                Open Your Listening Room
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
              {joinRequestStatus === 'idle' && (
                <button
                  type="button"
                  className="og-btn-primary"
                  onClick={() => requestJoinRoom(guestInvite)}
                >
                  <UserPlus size={18} /> Request to Join Room
                </button>
              )}

              {joinRequestStatus === 'pending' && (
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ width: '28px', height: '28px', border: '3px solid rgba(220,38,38,0.2)', borderTopColor: 'var(--brand-red)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 10px' }} />
                  <p style={{ margin: 0, fontWeight: 600, color: '#fff' }}>Request Sent to Host</p>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Waiting for {guestInvite.hostName} to approve your admission...
                  </span>
                </div>
              )}

              {joinRequestStatus === 'rejected' && (
                <div style={{ padding: '14px', background: 'rgba(239,68,68,0.12)', borderRadius: '12px', color: '#f87171' }}>
                  <p style={{ margin: 0, fontWeight: 600 }}>Admission Request Declined</p>
                  <span style={{ fontSize: '0.82rem' }}>The host declined your request to join this session.</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="friends-page-container">
      {/* Hero Banner */}
      <div className="friends-hero-banner">
        <h1 className="friends-hero-title">
          <Users size={32} color="var(--brand-red, #dc2626)" /> Friends — Listen Together
        </h1>
        <p className="friends-hero-subtitle">
          Real-time synchronized listening room with approved friends. Play, pause, seek, and groove together in sync.
        </p>
      </div>

      {/* Tabs */}
      <div className="friends-nav-tabs">
        <button
          type="button"
          className={`friends-tab-btn ${activeTab === 'room' ? 'active' : ''}`}
          onClick={() => setActiveTab('room')}
        >
          <Radio size={16} /> Listen Together
          {activeRoom && <span className="status-pulse-dot" style={{ width: '6px', height: '6px' }} />}
        </button>

        <button
          type="button"
          className={`friends-tab-btn ${activeTab === 'friends' ? 'active' : ''}`}
          onClick={() => setActiveTab('friends')}
        >
          <UserCheck size={16} /> My Friends
          <span className="friends-badge">{friends.length}</span>
        </button>

        <button
          type="button"
          className={`friends-tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          <UserPlus size={16} /> Incoming Requests
          {pendingRequests.length > 0 && (
            <span className="friends-badge" style={{ background: 'var(--brand-red)' }}>
              {pendingRequests.length}
            </span>
          )}
        </button>

        <button
          type="button"
          className={`friends-tab-btn ${activeTab === 'invite' ? 'active' : ''}`}
          onClick={() => setActiveTab('invite')}
        >
          <Share2 size={16} /> Share Invitation
        </button>
      </div>

      {/* TAB 1: LISTEN TOGETHER (ACTIVE ROOM / CREATE ROOM) */}
      {activeTab === 'room' && (
        <div className="friends-grid-layout two-col">
          {/* Main Room Card */}
          <div className={`friends-card ${activeRoom ? 'active-room-box' : ''}`}>
            <div className="friends-card-header">
              <div>
                <h2 className="friends-card-title">
                  <Radio size={20} color="var(--brand-red)" />
                  {activeRoom ? activeRoom.name : 'Start a Listening Session'}
                </h2>
                {activeRoom && (
                  <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {isHost ? (
                      <span>You are hosting this session</span>
                    ) : (
                      <span>Hosted by <strong style={{ color: '#fff' }}>{activeRoom.hostName || 'Room Host'}</strong></span>
                    )}
                  </p>
                )}
              </div>
              {activeRoom && (
                <div className="active-room-status-badge">
                  <span className="status-pulse-dot" /> LIVE SESSION
                </div>
              )}
            </div>

            {activeRoom ? (
              <>
                {/* Mobile Autoplay Primer / Audio Unlock Banner */}
                {!isHost && !player.isAudioUnlocked && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.25) 0%, rgba(185, 28, 28, 0.15) 100%)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    boxShadow: '0 4px 16px rgba(220, 38, 38, 0.15)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Volume2 size={22} color="#f87171" />
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>Enable Synchronized Audio</p>
                        <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#cbd5e1' }}>Tap once to authorize mobile Safari & Chrome background audio playback</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="og-btn-primary hover-lift"
                      style={{ padding: '8px 16px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
                      onClick={() => player.unlockAudio()}
                    >
                      Enable Room Audio
                    </button>
                  </div>
                )}

                {/* Live Role Badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', minWidth: 0, maxWidth: '100%' }}>
                    {isHost ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.15)', padding: '4px 10px', borderRadius: '8px', whiteSpace: 'nowrap' }}>
                        <Crown size={14} /> HOST CONTROLLER
                      </span>
                    ) : (
                      <>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: '#38bdf8', background: 'rgba(56,189,248,0.15)', padding: '4px 10px', borderRadius: '8px', whiteSpace: 'nowrap' }}>
                          <Headphones size={14} /> LISTENER ({isSynced ? 'SYNCED' : `DRIFT ±${syncDrift}s`})
                        </span>
                        {!player.isPlaying && activeRoom.playbackState === 'playing' && (
                          <button
                            type="button"
                            className="og-btn-primary hover-lift"
                            style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                            onClick={() => player.unlockAudio()}
                          >
                            <Volume2 size={13} /> Tap to Sync Audio
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  {isHost ? (
                    <button type="button" className="og-btn-danger" onClick={endActiveRoom} style={{ flexShrink: 0 }}>
                      <LogOut size={14} /> End Room
                    </button>
                  ) : (
                    <button type="button" className="og-btn-danger" onClick={leaveActiveRoom} style={{ flexShrink: 0 }}>
                      <LogOut size={14} /> Leave Room
                    </button>
                  )}
                </div>

                {/* Local Volume Control for Participants */}
                {!isHost && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <Volume2 size={16} color="var(--brand-red)" />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', fontWeight: 600 }}>My Volume</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={player.volume}
                      onChange={(e) => player.setVolume(parseFloat(e.target.value))}
                      style={{ flex: 1, accentColor: 'var(--brand-red, #ff1616)', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.8rem', color: '#fff', width: '36px', textAlign: 'right', fontWeight: 700 }}>
                      {Math.round(player.volume * 100)}%
                    </span>
                  </div>
                )}

                {/* Shared Playing Track */}
                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Now Playing in Room
                  </span>
                  {activeRoom.currentTrack ? (
                    <div className="shared-track-preview" style={{ marginTop: '8px' }}>
                      <img
                        src={activeRoom.currentTrack.coverUrl || '/placeholder.png'}
                        alt={activeRoom.currentTrack.title}
                        className="shared-track-cover"
                      />
                      <div className="shared-track-info">
                        <p className="shared-track-title">{activeRoom.currentTrack.title}</p>
                        <p className="shared-track-artist">{activeRoom.currentTrack.artistName}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                          {(() => {
                            if (isHost) {
                              switch (player.playbackVerifiedState) {
                                case 'PLAYING':
                                  return (
                                    <span style={{ fontSize: '0.78rem', color: '#4ade80', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <Volume2 size={13} /> Broadcasting in Sync (Verified)
                                    </span>
                                  );
                                case 'BUFFERING':
                                  return (
                                    <span style={{ fontSize: '0.78rem', color: '#facc15', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <RefreshCw size={13} /> Buffering Audio Stream...
                                    </span>
                                  );
                                case 'SOURCE_RESOLVING':
                                  return (
                                    <span style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <RefreshCw size={13} /> Resolving Audio Source...
                                    </span>
                                  );
                                case 'SOURCE_READY':
                                  return (
                                    <span style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <Check size={13} /> Stream Ready
                                    </span>
                                  );
                                case 'PAUSED':
                                  return (
                                    <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      ⏸️ Room Paused by You
                                    </span>
                                  );
                                case 'FAILED':
                                  return (
                                    <span style={{ fontSize: '0.78rem', color: '#ef4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <AlertCircle size={13} /> Stream Error (Tap track to retry)
                                    </span>
                                  );
                                default:
                                  return (
                                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                                      Track Selected
                                    </span>
                                  );
                              }
                            } else {
                              if (activeRoom.playbackState === 'paused') {
                                return (
                                  <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    ⏸️ Paused by Host
                                  </span>
                                );
                              }
                              if (!player.isAudioUnlocked) {
                                return (
                                  <span style={{ fontSize: '0.78rem', color: '#f87171', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <AlertCircle size={13} /> Audio Locked — Tap "Enable Room Audio"
                                  </span>
                                );
                              }
                              switch (player.playbackVerifiedState) {
                                case 'PLAYING':
                                  return (
                                    <span style={{ fontSize: '0.78rem', color: '#4ade80', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <Volume2 size={13} /> Playing in Verified Sync ({isSynced ? 'In Sync' : `Drift ±${syncDrift}s`})
                                    </span>
                                  );
                                case 'BUFFERING':
                                  return (
                                    <span style={{ fontSize: '0.78rem', color: '#facc15', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <RefreshCw size={13} /> Buffering Stream...
                                    </span>
                                  );
                                case 'SOURCE_RESOLVING':
                                  return (
                                    <span style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <RefreshCw size={13} /> Resolving Track Stream...
                                    </span>
                                  );
                                case 'SOURCE_READY':
                                  return (
                                    <span style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <Check size={13} /> Ready to Play
                                    </span>
                                  );
                                case 'FAILED':
                                  return (
                                    <span style={{ fontSize: '0.78rem', color: '#ef4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <AlertCircle size={13} /> Autoplay Blocked
                                      <button
                                        type="button"
                                        onClick={() => player.unlockAudio()}
                                        style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '2px 8px', fontSize: '0.72rem', cursor: 'pointer', marginLeft: '6px' }}
                                      >
                                        Tap to Play
                                      </button>
                                    </span>
                                  );
                                default:
                                  return (
                                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                                      Waiting for stream...
                                    </span>
                                  );
                              }
                            }
                          })()}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="now-playing-placeholder">
                      <Music2 size={24} style={{ margin: '0 auto 6px', display: 'block' }} />
                      {isHost ? 'Play any song to start broadcasting to your listeners!' : 'Waiting for host to pick a song...'}
                    </div>
                  )}
                </div>

                {/* Participants */}
                <div>
                  {/* Real Multi-User Participant Metrics */}
                  {(() => {
                    const participantsList = Object.values(activeRoom.participants || {});
                    const acceptedMembersCount = participantsList.length;
                    const onlineMembersCount = participantsList.filter(p => Date.now() - (p.lastHeartbeat || 0) < 30000).length;
                    const playingMembersCount = participantsList.filter(p => p.playbackState === 'playing' || (p.role === 'host' && activeRoom.playbackState === 'playing')).length;

                    return (
                      <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px', margin: '4px 0 12px' }}>
                          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '8px 10px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Accepted</div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>{acceptedMembersCount} / {activeRoom.maxCapacity || 10}</div>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '8px 10px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Online Now</div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                              <span className="status-pulse-dot" style={{ width: '6px', height: '6px', background: '#22c55e' }} />
                              {onlineMembersCount}
                            </div>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '8px 10px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>In Audio Sync</div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#38bdf8' }}>{playingMembersCount}</div>
                          </div>
                          {isHost && (
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '8px 10px', textAlign: 'center' }}>
                              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending</div>
                              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: pendingRequests.length > 0 ? '#ef4444' : '#94a3b8' }}>{pendingRequests.length}</div>
                            </div>
                          )}
                        </div>

                        <div className="participants-grid">
                          {participantsList.map((p) => {
                            const isOnline = Date.now() - (p.lastHeartbeat || 0) < 30000;
                            return (
                              <div key={p.id} className="participant-chip">
                                <div className="participant-left">
                                  <div className="participant-avatar" style={{ position: 'relative' }}>
                                    {p.displayName ? p.displayName.charAt(0).toUpperCase() : 'U'}
                                    <span style={{
                                      position: 'absolute',
                                      bottom: '-2px',
                                      right: '-2px',
                                      width: '8px',
                                      height: '8px',
                                      borderRadius: '50%',
                                      background: isOnline ? '#22c55e' : '#64748b',
                                      border: '2px solid #000'
                                    }} />
                                  </div>
                                  <div style={{ minWidth: 0 }}>
                                    <p className="participant-name">{p.displayName || (p.email ? p.email.split('@')[0] : 'Member')}</p>
                                    <span className="participant-role">
                                      {p.role === 'host' ? '👑 Host' : '🎧 Listener'} • {isOnline ? 'Active' : 'Idle'}
                                      {p.playbackState && p.playbackState !== 'idle' ? ` • ${p.playbackState.toUpperCase()}` : ''}
                                    </span>
                                  </div>
                                </div>
                                {isHost && p.id !== user.id && (
                                  <button
                                    type="button"
                                    className="hover-lift"
                                    title="Remove participant"
                                    onClick={() => kickParticipant(p.id)}
                                    style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '4px' }}
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </>
            ) : (
              <div className="friends-empty-state">
                <div className="friends-empty-icon">
                  <Radio size={28} />
                </div>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem' }}>No Active Listening Room</h3>
                <p className="friends-empty-text">
                  Create a listening room to broadcast your music in real-time. Share your link with friends to listen together.
                </p>
                <button
                  type="button"
                  className="og-btn-primary"
                  onClick={handleStartRoom}
                  disabled={isCreatingRoom}
                >
                  <Radio size={16} /> {isCreatingRoom ? 'Creating Room...' : 'Start Listening Room'}
                </button>
              </div>
            )}
          </div>

          {/* Quick Share / Join Column */}
          <div className="friends-card">
            <h3 className="friends-card-title">
              <Share2 size={18} color="var(--brand-red)" /> Invite Friends
            </h3>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Share this exclusive invitation with friends on WhatsApp or copy the link directly.
            </p>

            <div className="invite-url-box">
              <span className="invite-url-text">{inviteLink || 'Generating your link...'}</span>
              <button
                type="button"
                className="hover-lift"
                onClick={handleCopy}
                title="Copy link"
                style={{ background: 'transparent', border: 'none', color: copied ? '#4ade80' : '#fff', cursor: 'pointer', padding: '4px' }}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button type="button" className="og-btn-whatsapp" onClick={shareOnWhatsApp}>
                <MessageCircle size={18} /> Share on WhatsApp
              </button>
              <button type="button" className="og-btn-secondary" onClick={handleCopy}>
                {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Link Copied!' : 'Copy Invitation Link'}
              </button>
            </div>

            {/* Quick Friend Invitations */}
            {friends.length > 0 && (
              <div style={{ marginTop: '12px' }}>
                <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                  Quick Invite Accepted Friends
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {friends.slice(0, 3).map((f) => (
                    <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="participant-avatar" style={{ width: '28px', height: '28px', fontSize: '0.75rem' }}>
                          {f.displayName ? f.displayName.charAt(0).toUpperCase() : 'F'}
                        </div>
                        <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>{f.displayName}</span>
                      </div>
                      <button
                        type="button"
                        className="og-btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                        onClick={shareOnWhatsApp}
                      >
                        Invite
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MY FRIENDS */}
      {activeTab === 'friends' && (
        <div className="friends-card">
          <div className="friends-card-header">
            <h2 className="friends-card-title">
              <UserCheck size={20} color="var(--brand-red)" /> Accepted Friends ({friends.length})
            </h2>
            <button type="button" className="og-btn-secondary" onClick={() => setActiveTab('invite')}>
              <UserPlus size={16} /> Invite New Friend
            </button>
          </div>

          {friends.length === 0 ? (
            <div className="friends-empty-state">
              <div className="friends-empty-icon">
                <UserCheck size={28} />
              </div>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem' }}>No Friends Yet</h3>
              <p className="friends-empty-text">
                When you invite friends to listen together and approve their requests, they will permanently appear here.
              </p>
              <button type="button" className="og-btn-primary" onClick={() => setActiveTab('invite')}>
                <Share2 size={16} /> Share Invite Link
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
              {friends.map((f) => (
                <div key={f.id} className="participant-chip" style={{ padding: '14px' }}>
                  <div className="participant-left">
                    <div className="participant-avatar" style={{ width: '42px', height: '42px', fontSize: '1.1rem' }}>
                      {f.displayName ? f.displayName.charAt(0).toUpperCase() : 'F'}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p className="participant-name" style={{ fontSize: '0.95rem' }}>{f.displayName}</p>
                      <span className="participant-role">{f.email}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      className="hover-lift"
                      title="Remove Friend"
                      onClick={() => removeFriend(f.id)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: INCOMING REQUESTS */}
      {activeTab === 'requests' && (
        <div className="friends-card">
          <div className="friends-card-header">
            <h2 className="friends-card-title">
              <UserPlus size={20} color="var(--brand-red)" /> Admission Requests ({pendingRequests.length})
            </h2>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="friends-empty-state">
              <div className="friends-empty-icon">
                <Check size={28} />
              </div>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem' }}>No Pending Requests</h3>
              <p className="friends-empty-text">
                All requests to join your listening sessions have been reviewed. Share your link to invite more listeners!
              </p>
            </div>
          ) : (
            <div className="requests-list">
              {pendingRequests.map((req) => (
                <div key={req.id} className="request-card">
                  <div className="request-user-info">
                    <div className="participant-avatar" style={{ width: '44px', height: '44px' }}>
                      {req.userDisplayName ? req.userDisplayName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>
                        {req.userDisplayName}
                      </p>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{req.userEmail}</span>
                    </div>
                  </div>

                  <div className="request-actions">
                    <button
                      type="button"
                      className="og-btn-primary"
                      style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                      onClick={() => acceptJoinRequest(req)}
                    >
                      <Check size={16} /> Accept & Admit
                    </button>
                    <button
                      type="button"
                      className="og-btn-danger"
                      onClick={() => rejectJoinRequest(req)}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SHARE INVITATION */}
      {activeTab === 'invite' && (
        <div className="friends-card" style={{ maxWidth: '640px', margin: '0 auto', width: '100%' }}>
          <div className="friends-card-header">
            <h2 className="friends-card-title">
              <Share2 size={20} color="var(--brand-red)" /> Shareable Invitation Link
            </h2>
            <button
              type="button"
              className="og-btn-secondary"
              onClick={generateNewInvite}
              title="Generate a new secure token"
            >
              <RefreshCw size={14} /> New Link
            </button>
          </div>

          <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Send this protected link to any friend. When they open it, you will receive an incoming request to approve before they can listen in your room.
          </p>

          <div className="invite-url-box">
            <span className="invite-url-text">{inviteLink || 'Generating invitation link...'}</span>
            <button
              type="button"
              className="hover-lift"
              onClick={handleCopy}
              style={{ background: 'transparent', border: 'none', color: copied ? '#4ade80' : '#fff', cursor: 'pointer', padding: '4px' }}
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button type="button" className="og-btn-whatsapp" style={{ flex: 1 }} onClick={shareOnWhatsApp}>
              <MessageCircle size={18} /> Send via WhatsApp
            </button>
            <button type="button" className="og-btn-primary" style={{ flex: 1 }} onClick={handleCopy}>
              {copied ? <Check size={18} /> : <Copy size={18} />} {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>

          {sentInvitations.length > 0 && (
            <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
              <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '10px' }}>
                Active Shareable Links
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {sentInvitations.map((inv) => (
                  <div key={inv.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                    <div style={{ minWidth: 0, flex: 1, paddingRight: '12px' }}>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#fff', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {inv.id}
                      </p>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Expires: {new Date(inv.expiresAt).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="og-btn-danger"
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      onClick={() => revokeInvite(inv.id)}
                    >
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
