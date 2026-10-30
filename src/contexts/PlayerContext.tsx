import { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import YouTube from 'react-youtube';
import type { YouTubePlayer } from 'react-youtube';
import type { Song, QueueItem, DiscoveryContext } from '../types';

import { useLibrary } from './LibraryContext';
import { recommendationService } from '../services/recommendationService';
import { useSettings } from './SettingsContext';
import { audioEngine } from '../audio/AudioEngine';
import { musicDiscoveryService } from '../services/musicDiscoveryService';
import { fullTrackResolver } from '../services/audio/fullTrackResolver';

interface PlayerContextType {
  currentTrack: Song | null;
  currentContext: DiscoveryContext | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  queue: QueueItem[];
  queueIndex: number;
  isShuffle: boolean;
  repeatMode: 'off' | 'all' | 'one';
  loading: boolean;
  buffering: boolean;
  error: string | null;
  
  play: (song?: Song, context?: DiscoveryContext) => void;
  playList: (songs: Song[], startIndex?: number, context?: DiscoveryContext) => void;
  pause: () => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  playbackRate: number;
  setPlaybackRate: (rate: number) => void;
  eqGains: number[];
  setEqGains: (gains: number[]) => void;
  eqEnabled: boolean;
  setEqEnabled: (enabled: boolean) => void;
  preAmp: number;
  setPreAmp: (gain: number) => void;
  loudnessEnabled: boolean;
  setLoudnessEnabled: (enabled: boolean) => void;
  webAudioSupported: boolean;
  isListenerMode: boolean;
  setIsListenerMode: (enabled: boolean) => void;
  addToQueue: (song: Song) => void;
  playNext: (song: Song) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
  reorderQueue: (startIndex: number, endIndex: number) => void;
  jumpToQueue: (index: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const { addToHistory } = useLibrary();
  const { audioEnhancement, setAudioEnhancement } = useSettings();
  
  const [currentTrack, setCurrentTrack] = useState<Song | null>(null);
  const [currentContext, setCurrentContext] = useState<DiscoveryContext | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  
  const [loading, setLoading] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [playbackRate, setPlaybackRate] = useState(1);
  const [eqGains, setEqGainsState] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('og_music_eq_gains');
      return saved ? JSON.parse(saved) : [0, 0, 0, 0, 0];
    } catch {
      return [0, 0, 0, 0, 0];
    }
  });
  const [eqEnabled, setEqEnabledState] = useState<boolean>(() => {
    return localStorage.getItem('og_music_eq_enabled') !== 'false';
  });
  const [preAmp, setPreAmpState] = useState<number>(() => {
    try {
      return parseFloat(localStorage.getItem('og_music_preamp') || '0');
    } catch {
      return 0;
    }
  });
  const [loudnessEnabled, setLoudnessEnabledState] = useState<boolean>(() => {
    return localStorage.getItem('og_music_audio_enhancement') === 'true' || audioEnhancement;
  });
  const [webAudioSupported, setWebAudioSupported] = useState(true);
  const [isListenerMode, setIsListenerMode] = useState(false);

  const ytPlayerRef = useRef<YouTubePlayer | null>(null);
  const recordedTrackIdRef = useRef<string | null>(null);

  // Initialize Audio Engine
  useEffect(() => {
    const audio = audioEngine.audio;

    const onLoadedMetadata = () => {
      const canonicalDur = currentTrack?.originalDuration || currentTrack?.duration;
      if (canonicalDur && canonicalDur > 30) {
        setDuration(canonicalDur);
      } else if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
      setLoading(false);
    };
    
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    
    const onWaiting = () => setBuffering(true);
    const onCanPlay = () => {
      setBuffering(false);
      setLoading(false);
    };
    const onError = () => {
      // If audio has no src or was cleared, ignore
      if (!audio.src || audio.src === window.location.href) return;
      if (audio.error && (audio.error.code === 20 || audio.error.code === 1)) return; // Aborted
      if (currentTrack?.sourceType === 'youtube') return;

      // If failed with CORS restriction, retry cleanly without crossOrigin
      if (audio.crossOrigin) {
        audio.removeAttribute('crossOrigin');
        setWebAudioSupported(false);
        audio.load();
        audio.play().catch(() => {});
        return;
      }

      setError('Playback failed — Audio source unavailable');
      setLoading(false);
      setBuffering(false);
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('error', onError);
    };
  }, [currentTrack]);

  // Sync volume and mute
  useEffect(() => {
    audioEngine.audio.volume = volume;
    audioEngine.audio.muted = isMuted;
    if (ytPlayerRef.current) {
      if (isMuted) {
        ytPlayerRef.current.mute();
      } else {
        ytPlayerRef.current.unMute();
        ytPlayerRef.current.setVolume(volume * 100);
      }
    }
  }, [volume, isMuted]);

  // Sync playback rate
  useEffect(() => {
    audioEngine.audio.playbackRate = playbackRate;
    if (ytPlayerRef.current) {
      ytPlayerRef.current.setPlaybackRate(playbackRate);
    }
  }, [playbackRate]);

  // Setters for EQ, PreAmp and Audio Enhancement
  const setEqGains = useCallback((gains: number[]) => {
    setEqGainsState(gains);
    try {
      localStorage.setItem('og_music_eq_gains', JSON.stringify(gains));
    } catch {}
    audioEngine.setEqBands(gains);
  }, []);

  const setEqEnabled = useCallback((enabled: boolean) => {
    setEqEnabledState(enabled);
    localStorage.setItem('og_music_eq_enabled', enabled ? 'true' : 'false');
    audioEngine.setEqEnabled(enabled);
  }, []);

  const setPreAmp = useCallback((gain: number) => {
    setPreAmpState(gain);
    localStorage.setItem('og_music_preamp', gain.toString());
    audioEngine.setPreAmp(gain);
  }, []);

  const setLoudnessEnabled = useCallback((enabled: boolean) => {
    setLoudnessEnabledState(enabled);
    setAudioEnhancement(enabled);
    localStorage.setItem('og_music_audio_enhancement', enabled ? 'true' : 'false');
    audioEngine.setAudioEnhancement(enabled);
  }, [setAudioEnhancement]);

  // Sync initial AudioEngine state
  useEffect(() => {
    audioEngine.setEqBands(eqGains);
    audioEngine.setEqEnabled(eqEnabled);
    audioEngine.setPreAmp(preAmp);
    audioEngine.setAudioEnhancement(loudnessEnabled);
  }, []);

  // Polling for YouTube time updates (since iframe API doesn't have timeupdate event)
  useEffect(() => {
    let interval: number;
    if (isPlaying && currentTrack?.sourceType === 'youtube') {
      interval = window.setInterval(async () => {
        if (ytPlayerRef.current) {
          try {
            const time = await ytPlayerRef.current.getCurrentTime();
            setCurrentTime(time);
            const dur = await ytPlayerRef.current.getDuration();
            if (dur && duration !== dur) setDuration(dur);
          } catch(e) {}
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTrack, duration]);

  // History Recording: Record after 10 seconds OR 20% of track duration
  useEffect(() => {
    if (!currentTrack) {
      recordedTrackIdRef.current = null;
      return;
    }
    
    if (isPlaying && currentTrack.id !== recordedTrackIdRef.current) {
      const threshold = duration > 0 ? Math.min(10, duration * 0.2) : 10;
      if (currentTime >= threshold) {
        recordedTrackIdRef.current = currentTrack.id;
        addToHistory(currentTrack);
        recommendationService.recordPlay(currentTrack);
      }
    }
  }, [isPlaying, currentTrack, currentTime, duration, addToHistory]);

  const playDirectAudio = useCallback((song: Song) => {
    if (ytPlayerRef.current) ytPlayerRef.current.pauseVideo();
    
    if (!song.audioUrl) {
      console.error('Audio unavailable for this track');
      setError('Audio unavailable for this track');
      setIsPlaying(false);
      setLoading(false);
      return;
    }
    
    // Attempt Web Audio initialization upon user playback
    audioEngine.initWebAudio().then(ok => {
      setWebAudioSupported(ok);
    });

    // Handle CORS
    const isCorsSupported = song.audioUrl.includes('itunes.apple.com') ||
                            song.audioUrl.includes('cloudinary') ||
                            song.audioUrl.includes('firebasestorage') ||
                            song.audioUrl.startsWith('/');
    if (isCorsSupported) {
      audioEngine.audio.crossOrigin = 'anonymous';
    } else {
      audioEngine.audio.removeAttribute('crossOrigin');
      setWebAudioSupported(false);
    }

    audioEngine.audio.src = song.audioUrl;
    audioEngine.audio.load();
    audioEngine.audio.play().catch(e => {
      if (e.name === 'AbortError') return;
      if (e.name === 'NotAllowedError') {
        setError('Autoplay restricted: Press play to start');
      } else {
        console.error('Playback failed', e);
        setError('Playback failed — Audio source unavailable');
      }
      setIsPlaying(false);
    });
  }, []);

  const loadAndPlayTrack = useCallback(async (song: Song) => {
    setCurrentTrack(song);
    setError(null);
    setLoading(true);
    setCurrentTime(0);
    setDuration(song.duration || 0);
    recommendationService.recordPlay(song);
    
    // 1. If song is already a YouTube track or has an associated full YouTube ID
    const directYtId = (song.youtubeId && /^[a-zA-Z0-9_-]{11}$/.test(song.youtubeId))
      ? song.youtubeId
      : (/^[a-zA-Z0-9_-]{11}$/.test(song.id) ? song.id : null);

    if (directYtId) {
      song.youtubeId = directYtId;
      song.sourceType = 'youtube';
      setCurrentTrack({ ...song, youtubeId: directYtId, sourceType: 'youtube' });
      audioEngine.audio.pause();
      audioEngine.audio.removeAttribute('src');
      audioEngine.audio.load();
      if (ytPlayerRef.current) {
        ytPlayerRef.current.loadVideoById(directYtId);
        setIsPlaying(true);
      }
      return;
    }

    // 2. If track is an iTunes preview (30s) or has no full audio stream:
    // Automatically resolve to the full-length official song stream so it never cuts off!
    if (fullTrackResolver.isPreviewAudio(song)) {
      try {
        const resolvedYtId = await fullTrackResolver.resolveFullTrack(song);
        if (resolvedYtId) {
          song.youtubeId = resolvedYtId;
          song.sourceType = 'youtube';
          setCurrentTrack({ ...song, youtubeId: resolvedYtId, sourceType: 'youtube' });
          audioEngine.audio.pause();
          audioEngine.audio.removeAttribute('src');
          audioEngine.audio.load();
          if (ytPlayerRef.current) {
            ytPlayerRef.current.loadVideoById(resolvedYtId);
            setIsPlaying(true);
            setLoading(false);
          }
          return;
        }
      } catch (err) {
        console.warn('Full track resolution fallback:', err);
      }
    }

    // 3. Fallback to direct full audio
    playDirectAudio(song);
  }, [playDirectAudio]);

  const play = useCallback((song?: Song, context?: DiscoveryContext) => {
    if (song) {
      if (context) setCurrentContext(context);
      // Play a specific song
      const existingIndex = queue.findIndex(q => q.song.id === song.id);
      if (existingIndex >= 0) {
        setQueueIndex(existingIndex);
        loadAndPlayTrack(song);
      } else {
        const initialQueue = [
          { id: Date.now().toString(), song }
        ];
        setQueue(initialQueue);
        setQueueIndex(0);
        loadAndPlayTrack(song);

        // Pre-populate meaningful continuation queue (related album, artist, or recommendations)
        musicDiscoveryService.getContinuationTracks(song, new Set([song.id])).then(continuation => {
          if (continuation.length > 0) {
            setQueue(prev => {
              const currentIds = new Set(prev.map(item => item.song.id));
              const additions = continuation
                .filter(t => !currentIds.has(t.id))
                .map(t => ({ id: `${Date.now()}_${Math.random()}`, song: t }));
              return [...prev, ...additions];
            });
          }
        }).catch(() => {});
      }
    } else {
      // Resume
      if (currentTrack?.sourceType === 'youtube') {
        if (ytPlayerRef.current) ytPlayerRef.current.playVideo();
      } else {
        audioEngine.audio.play().catch(() => setError('Playback failed'));
      }
    }
  }, [queue, currentTrack, loadAndPlayTrack]);

  const playList = useCallback((songs: Song[], startIndex: number = 0, context?: DiscoveryContext) => {
    if (songs.length === 0) return;
    const newQueue = songs.map(song => ({ id: Date.now().toString() + Math.random(), song }));
    setQueue(newQueue);
    setQueueIndex(startIndex);
    if (context) setCurrentContext(context);
    loadAndPlayTrack(newQueue[startIndex].song);

    // If playlist has only 1 track, asynchronously fetch continuation tracks
    if (songs.length === 1) {
      const singleSong = songs[0];
      musicDiscoveryService.getContinuationTracks(singleSong, new Set([singleSong.id])).then(continuation => {
        if (continuation.length > 0) {
          setQueue(prev => {
            const currentIds = new Set(prev.map(item => item.song.id));
            const additions = continuation
              .filter(t => !currentIds.has(t.id))
              .map(t => ({ id: `${Date.now()}_${Math.random()}`, song: t }));
            return [...prev, ...additions];
          });
        }
      }).catch(() => {});
    }
  }, [loadAndPlayTrack]);

  const pause = useCallback(() => {
    if (currentTrack?.sourceType === 'youtube') {
      if (ytPlayerRef.current) ytPlayerRef.current.pauseVideo();
    } else {
      audioEngine.audio.pause();
    }
    setIsPlaying(false);
  }, [currentTrack]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      if (currentTrack?.sourceType === 'youtube') {
        if (ytPlayerRef.current) ytPlayerRef.current.playVideo();
      } else {
        audioEngine.audio.play().catch(() => setError('Playback failed'));
      }
    }
  }, [isPlaying, pause, currentTrack]);

  const next = useCallback(() => {
    if (isListenerMode) {
      console.info('Next track is controlled authoritatively by the room host.');
      return;
    }
    if (queue.length === 0) return;

    if (currentTrack && currentTime < 20 && duration > 30) {
      recommendationService.recordSkip(currentTrack);
    }
    
    if (isShuffle) {
      if (queue.length > 1) {
        let nextIdx = queueIndex;
        let attempts = 0;
        while (nextIdx === queueIndex && attempts < 10) {
          nextIdx = Math.floor(Math.random() * queue.length);
          attempts++;
        }
        setQueueIndex(nextIdx);
        loadAndPlayTrack(queue[nextIdx].song);
        return;
      }
    }

    if (queueIndex < queue.length - 1) {
      const nextIdx = queueIndex + 1;
      setQueueIndex(nextIdx);
      loadAndPlayTrack(queue[nextIdx].song);
    } else if (repeatMode === 'all' && queue.length > 0) {
      setQueueIndex(0);
      loadAndPlayTrack(queue[0].song);
    } else {
      // Queue exhausted — resolve continuation tracks dynamically instead of repeating
      if (currentTrack) {
        const existingIds = new Set(queue.map(q => q.song.id));
        musicDiscoveryService.getContinuationTracks(currentTrack, existingIds).then(continuation => {
          if (continuation.length > 0) {
            const additions = continuation.map(t => ({ id: `${Date.now()}_${Math.random()}`, song: t }));
            setQueue(prev => [...prev, ...additions]);
            setQueueIndex(queue.length);
            loadAndPlayTrack(additions[0].song);
          } else {
            pause();
            setCurrentTime(0);
          }
        }).catch(() => {
          pause();
          setCurrentTime(0);
        });
      } else {
        pause();
        setCurrentTime(0);
      }
    }
  }, [isListenerMode, queue, queueIndex, isShuffle, repeatMode, pause, currentTrack, currentTime, duration, loadAndPlayTrack]);

  const seek = useCallback((time: number) => {
    if (currentTrack?.sourceType === 'youtube') {
      if (ytPlayerRef.current) ytPlayerRef.current.seekTo(time, true);
      setCurrentTime(time);
    } else {
      audioEngine.audio.currentTime = time;
      setCurrentTime(time);
    }
  }, [currentTrack]);

  const previous = useCallback(() => {
    if (isListenerMode) {
      console.info('Previous track is controlled authoritatively by the room host.');
      return;
    }
    if (currentTime > 3) {
      seek(0);
      return;
    }
    
    if (queueIndex > 0) {
      const prevIdx = queueIndex - 1;
      setQueueIndex(prevIdx);
      loadAndPlayTrack(queue[prevIdx].song);
    } else if (repeatMode === 'all' && queue.length > 0) {
      const lastIdx = queue.length - 1;
      setQueueIndex(lastIdx);
      loadAndPlayTrack(queue[lastIdx].song);
    } else {
      seek(0);
    }
  }, [isListenerMode, currentTime, queue, queueIndex, repeatMode, loadAndPlayTrack, seek]);

  // Handle Audio 'ended' event needing fresh closure state
  useEffect(() => {
    const audio = audioEngine.audio;
    
    const onEnded = () => {
      if (currentTrack) {
        recommendationService.recordCompletion(currentTrack, duration || 30, duration || 30);
      }
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play().catch(console.error);
      } else if (!isListenerMode) {
        next();
      }
    };
    
    audio.addEventListener('ended', onEnded);
    return () => audio.removeEventListener('ended', onEnded);
  }, [next, repeatMode, currentTrack, duration, isListenerMode]);

  const setVolume = useCallback((val: number) => setVolumeState(Math.max(0, Math.min(1, val))), []);
  const toggleMute = useCallback(() => setIsMuted(prev => !prev), []);
  const toggleShuffle = useCallback(() => setIsShuffle(prev => !prev), []);
  
  const toggleRepeat = useCallback(() => {
    setRepeatMode(prev => prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off');
  }, []);

  const addToQueue = useCallback((song: Song) => {
    setQueue(prev => [...prev, { id: Date.now().toString() + Math.random(), song }]);
  }, []);

  const playNext = useCallback((song: Song) => {
    setQueue(prev => {
      const newQueue = [...prev];
      newQueue.splice(queueIndex + 1, 0, { id: Date.now().toString() + Math.random(), song });
      return newQueue;
    });
  }, [queueIndex]);

  const removeFromQueue = useCallback((id: string) => {
    setQueue(prev => prev.filter(item => item.id !== id));
  }, []);

  const clearQueue = useCallback(() => {
    if (currentTrack && queue[queueIndex]) {
      setQueue([queue[queueIndex]]);
      setQueueIndex(0);
    } else {
      setQueue([]);
      setQueueIndex(-1);
    }
  }, [currentTrack, queue, queueIndex]);

  const jumpToQueue = useCallback((index: number) => {
    if (queue[index]) {
      setQueueIndex(index);
      loadAndPlayTrack(queue[index].song);
    }
  }, [queue]);

  const reorderQueue = useCallback((startIndex: number, endIndex: number) => {
    setQueue(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  }, []);

  // Sync MediaSession API
  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artistName,
        album: currentTrack.albumName || 'OG MUSIC',
        artwork: [
          { src: currentTrack.coverUrl || '', sizes: '512x512', type: 'image/jpeg' }
        ]
      });
      navigator.mediaSession.setActionHandler('play', () => togglePlay());
      navigator.mediaSession.setActionHandler('pause', () => togglePlay());
      navigator.mediaSession.setActionHandler('previoustrack', () => previous());
      navigator.mediaSession.setActionHandler('nexttrack', () => next());
    }
  }, [currentTrack, togglePlay, previous, next]);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        currentContext,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        queue,
        queueIndex,
        isShuffle,
        repeatMode,
        loading,
        buffering,
        error,
        play,
        playList,
        pause,
        togglePlay,
        next,
        previous,
        seek,
        setVolume,
        toggleMute,
        playbackRate,
        setPlaybackRate,
        eqGains,
        setEqGains,
        eqEnabled,
        setEqEnabled,
        preAmp,
        setPreAmp,
        loudnessEnabled,
        setLoudnessEnabled,
        webAudioSupported,
        isListenerMode,
        setIsListenerMode,
        addToQueue,
        playNext,
        removeFromQueue,
        clearQueue,
        reorderQueue,
        jumpToQueue,
        toggleShuffle,
        toggleRepeat,
      }}
    >
      {/* Background YouTube Audio Stream Engine */}
      <div style={{ position: 'fixed', left: '-9999px', top: '-9999px', width: '200px', height: '200px', pointerEvents: 'none', zIndex: -100 }}>
        <YouTube
          videoId={
            (currentTrack?.youtubeId && /^[a-zA-Z0-9_-]{11}$/.test(currentTrack.youtubeId))
              ? currentTrack.youtubeId
              : (currentTrack?.id && /^[a-zA-Z0-9_-]{11}$/.test(currentTrack.id) ? currentTrack.id : '')
          }
          opts={{
            height: '200',
            width: '200',
            playerVars: {
              autoplay: 1,
              controls: 0,
              disablekb: 1,
              fs: 0,
              modestbranding: 1,
              playsinline: 1,
            },
          }}
          onReady={(e) => {
            ytPlayerRef.current = e.target;
            e.target.setVolume(volume * 100);
            if (isMuted) e.target.mute();
          }}
          onStateChange={(e) => {
            // 1=playing, 2=paused, 0=ended, 3=buffering
            if (e.data === 1) {
              setIsPlaying(true);
              setLoading(false);
              setBuffering(false);
            } else if (e.data === 2) {
              setIsPlaying(false);
            } else if (e.data === 0) {
              if (repeatMode === 'one') {
                e.target.seekTo(0);
                e.target.playVideo();
              } else if (!isListenerMode) {
                next();
              }
            } else if (e.data === 3) {
              setBuffering(true);
            }
          }}
          onError={(e) => {
            // Ignore error 2 (invalid parameters) if we just loaded an empty ID on startup
            if (e.data === 2) return;
            if (currentTrack?.audioUrl) {
              console.warn('YouTube stream fallback to direct audio for track:', currentTrack.title);
              playDirectAudio(currentTrack);
            } else {
              setError('Playback unavailable');
            }
          }}
        />
      </div>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
