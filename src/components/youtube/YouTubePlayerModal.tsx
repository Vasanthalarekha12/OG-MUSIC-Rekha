import { useState, useRef } from 'react';
import YouTube from 'react-youtube';
import type { YouTubeProps } from 'react-youtube';
import { X, Play, Pause, Volume2, VolumeX, Maximize, Heart, Plus } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { useLibrary } from '../../contexts/LibraryContext';
import type { Song } from '../../types';

interface YouTubePlayerModalProps {
  video: Song | null;
  onClose: () => void;
}

export const YouTubePlayerModal = ({ video, onClose }: YouTubePlayerModalProps) => {
  const { videoQuality } = useSettings();
  const { toggleFavorite, isFavorite } = useLibrary();
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const playerRef = useRef<any>(null);

  if (!video) return null;

  const onReady: YouTubeProps['onReady'] = (event) => {
    playerRef.current = event.target;
    event.target.playVideo();
    // Attempt to set playback quality based on user settings
    try {
      const q = videoQuality === '720p' ? 'hd720' : 'medium';
      event.target.setPlaybackQuality(q);
    } catch (e) {
      // Quality enforcement not always supported by iframe API
    }
  };

  const onStateChange: YouTubeProps['onStateChange'] = (event) => {
    // 1 = playing, 2 = paused
    setIsPlaying(event.data === 1);
  };

  const togglePlay = () => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    }
  };

  const toggleMute = () => {
    if (playerRef.current) {
      if (isMuted) {
        playerRef.current.unMute();
      } else {
        playerRef.current.mute();
      }
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    const iframe = playerRef.current?.getIframe();
    if (iframe) {
      if (iframe.requestFullscreen) {
        iframe.requestFullscreen();
      }
    }
  };

  const isFav = isFavorite(video.id);

  const opts: YouTubeProps['opts'] = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1,
      controls: 0, // we use custom controls where possible, but YouTube might override on mobile
      modestbranding: 1,
      rel: 0,
      fs: 0,
    },
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      backgroundColor: 'rgba(0,0,0,0.9)',
      display: 'flex',
      flexDirection: 'column',
      animation: 'fadeIn 0.2s ease'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)' }}>
        <div>
          <h2 style={{ color: '#fff', fontSize: 'var(--text-xl)', fontWeight: 800, margin: 0 }} dangerouslySetInnerHTML={{ __html: video.title }} />
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{video.artistName}</p>
        </div>
        <button className="hover-lift" onClick={onClose} style={{ padding: '12px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff' }}>
          <X size={24} />
        </button>
      </div>

      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 48px' }}>
        <div style={{ width: '100%', maxWidth: '1200px', aspectRatio: '16/9', backgroundColor: '#000', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
          <YouTube 
            videoId={video.id} 
            opts={opts} 
            onReady={onReady} 
            onStateChange={onStateChange}
            style={{ width: '100%', height: '100%' }}
            className="youtube-container"
          />
        </div>
      </div>

      <div style={{ padding: '24px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="hover-lift" onClick={togglePlay} style={{ padding: '16px', borderRadius: '50%', backgroundColor: 'var(--brand-red)', color: '#fff' }}>
            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
          </button>
          <button className="hover-lift" onClick={toggleMute} style={{ padding: '12px', color: '#fff', backgroundColor: 'transparent' }}>
            {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="hover-lift" onClick={() => toggleFavorite(video)} style={{ padding: '12px', color: isFav ? 'var(--brand-red)' : '#fff', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}>
            <Heart size={20} fill={isFav ? 'currentColor' : 'none'} />
          </button>
          <button className="hover-lift" onClick={() => alert('Added to Queue (Requires parsing YouTube audio to main player in future phase)')} style={{ padding: '12px', color: '#fff', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}>
            <Plus size={20} />
          </button>
          <button className="hover-lift" onClick={toggleFullscreen} style={{ padding: '12px', color: '#fff', backgroundColor: 'transparent' }}>
            <Maximize size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};
