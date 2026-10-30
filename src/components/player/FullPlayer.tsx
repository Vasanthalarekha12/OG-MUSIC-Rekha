import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../../contexts/PlayerContext';
import { useLibrary } from '../../contexts/LibraryContext';
import { X, Play, Pause, SkipBack, SkipForward, Heart, Settings2, Layers, Video, Shuffle, Download, Loader2, Repeat, Repeat1 } from 'lucide-react';
import { Artwork } from '../ui/Artwork';
import { PlayerWaveform } from './PlayerWaveform';
import { MusicParticles } from './MusicParticles';
import { QueuePanel } from './QueuePanel';
import { EqualizerPanel } from './EqualizerPanel';
import { TrackContextMenu } from '../music/TrackContextMenu';
import { downloadService } from '../../services/download/downloadService';

interface FullPlayerProps {
  onClose: () => void;
}

export const FullPlayer: React.FC<FullPlayerProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const { 
    currentTrack, 
    isPlaying, 
    togglePlay, 
    pause,
    next, 
    previous, 
    currentTime,
    duration,
    queueIndex,
    queue,
    isShuffle,
    toggleShuffle,
    repeatMode,
    toggleRepeat,
    loading,
    error
  } = usePlayer();

  const { isFavorite, toggleFavorite } = useLibrary();

  const [showQueue, setShowQueue] = useState(false);
  const [showEQ, setShowEQ] = useState(false);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadMsg, setDownloadMsg] = useState<string | null>(null);

  const downloadStatus = downloadService.getDownloadStatus(currentTrack);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentTrack || isDownloading) return;

    if (!downloadStatus.canDownload) {
      setDownloadMsg(downloadStatus.reason || 'Protected Stream — Stream In-App');
      setTimeout(() => setDownloadMsg(null), 3500);
      return;
    }

    setIsDownloading(true);
    setDownloadMsg('Downloading...');
    const res = await downloadService.downloadSong(currentTrack);
    setIsDownloading(false);
    setDownloadMsg(res.success ? 'Downloaded!' : res.message);
    setTimeout(() => setDownloadMsg(null), 3500);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY === null || touchStartX === null) return;
    
    const touchEndY = e.changedTouches[0].clientY;
    const touchEndX = e.changedTouches[0].clientX;
    const yDiff = touchEndY - touchStartY;
    const xDiff = touchEndX - touchStartX;

    // Prevent scrolling or false triggers
    if (Math.abs(xDiff) > Math.abs(yDiff) && Math.abs(xDiff) > 50) {
      if (xDiff > 0) previous(); // Swipe Right -> Previous
      else next(); // Swipe Left -> Next
    } else if (Math.abs(yDiff) > Math.abs(xDiff) && yDiff > 50) {
      onClose(); // Swipe Down -> Close
    }

    setTouchStartY(null);
    setTouchStartX(null);
  };

  const handleVideoClick = () => {
    if (!currentTrack) return;
    const targetTimestamp = Math.max(0, Math.floor(currentTime));
    pause(); // Pause audio so both don't play simultaneously
    onClose();

    const targetYtId = (currentTrack.youtubeId && /^[a-zA-Z0-9_-]{11}$/.test(currentTrack.youtubeId))
      ? currentTrack.youtubeId
      : (/^[a-zA-Z0-9_-]{11}$/.test(currentTrack.id) ? currentTrack.id : null);

    if (targetYtId) {
      navigate(`/youtube?v=${encodeURIComponent(targetYtId)}&t=${targetTimestamp}`, {
        state: { video: { ...currentTrack, youtubeId: targetYtId }, timestamp: targetTimestamp }
      });
    } else {
      navigate(`/youtube?q=${encodeURIComponent(currentTrack.title + ' ' + currentTrack.artistName)}&trackId=${encodeURIComponent(currentTrack.id)}&t=${targetTimestamp}`, {
        state: { track: currentTrack, timestamp: targetTimestamp }
      });
    }
  };

  if (!currentTrack) return null;

  const playerContent = (
    <div 
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        backgroundColor: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideUpFade 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        height: '100dvh',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        overflow: 'hidden'
      }}
    >
      {/* Immersive Background */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${currentTrack.coverUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(80px) brightness(0.25)',
          opacity: 0.9,
          zIndex: -2,
        }}
      />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,10,10,0.4) 0%, rgba(10,10,10,0.95) 100%)', zIndex: -1 }} />

      {/* Atmospheric Particles (Subtle OG RED) */}
      <MusicParticles />

      {/* Mobile Swipe Dismiss Handle */}
      <div 
        onClick={onClose}
        style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          padding: '10px 0 2px', 
          cursor: 'pointer',
          zIndex: 30,
        }}
      >
        <div 
          style={{ 
            width: '42px', 
            height: '4.5px', 
            borderRadius: '4px', 
            backgroundColor: 'rgba(255, 255, 255, 0.35)' 
          }} 
        />
      </div>

      {/* Top Bar */}
      <header style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '8px 20px', 
        zIndex: 20, 
        flexShrink: 0,
        minHeight: '48px'
      }}>
        <button 
          onClick={onClose} 
          aria-label="Minimize player" 
          className="hover-lift" 
          style={{ color: '#fff', minWidth: '40px', minHeight: '40px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}
        >
          <X size={26} strokeWidth={1.75} />
        </button>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0, padding: '0 12px' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase' }}>
            PLAYING FROM QUEUE ({queueIndex >= 0 ? queueIndex + 1 : 1}/{queue.length > 0 ? queue.length : 1})
          </div>
          <div className="line-clamp-1" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
            {currentTrack.albumName || 'MARUDHAM OG MUSIC'}
          </div>
        </div>
        <div style={{ minWidth: '40px', minHeight: '40px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <TrackContextMenu song={currentTrack} />
        </div>
      </header>

      {/* Responsive Content Body */}
      <div className="fullplayer-content">
        {/* Artwork Section */}
        <div className="fullplayer-artwork-section">
          <div 
            className="fullplayer-artwork-box"
            style={{ 
              width: '100%', 
              maxWidth: '380px',
              aspectRatio: '1/1',
              boxShadow: `0 24px 50px rgba(0, 0, 0, 0.8), 0 8px 30px rgba(220, 38, 38, ${isPlaying ? 0.3 : 0})`,
              transform: isPlaying ? 'scale(1)' : 'scale(0.96)',
              transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease',
              borderRadius: '24px',
              overflow: 'hidden',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#111',
              flexShrink: 0,
              position: 'relative'
            }}
          >
            <Artwork src={currentTrack.coverUrl} alt={currentTrack.title} size="100%" style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
            {loading && (
              <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 size={36} className="animate-spin" color="var(--brand-red)" />
              </div>
            )}
          </div>
        </div>

        {/* Controls Section */}
        <div className="fullplayer-controls-section">
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Error Message if any */}
            {error && (
              <div style={{ fontSize: '12px', color: '#ff4d4d', backgroundColor: 'rgba(255, 77, 77, 0.1)', padding: '6px 12px', borderRadius: '8px', textAlign: 'center' }}>
                {error}
              </div>
            )}

            {/* Track Title and Favorite */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ minWidth: 0, flex: 1, paddingRight: '12px' }}>
                <h1 className="line-clamp-2" style={{ fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: 800, color: '#fff', marginBottom: '2px', letterSpacing: '-0.3px', lineHeight: '1.2' }}>
                  {currentTrack.title}
                </h1>
                <h2 className="line-clamp-1" style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  {currentTrack.artistName}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px' }}>
                  <span 
                    style={{ 
                      fontSize: '9px', 
                      fontWeight: 800, 
                      letterSpacing: '0.8px', 
                      textTransform: 'uppercase', 
                      backgroundColor: 'rgba(255, 22, 22, 0.18)', 
                      color: 'var(--brand-red, #ff1616)', 
                      border: '1px solid rgba(255, 22, 22, 0.35)', 
                      padding: '2px 6px', 
                      borderRadius: '4px' 
                    }}
                  >
                    OG MASTER
                  </span>
                  <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.45)', fontWeight: 600 }}>
                    24-BIT / 48kHz LOSSLESS
                  </span>
                </div>
              </div>
              <button 
                onClick={() => toggleFavorite(currentTrack)}
                aria-label={isFavorite(currentTrack.id) ? "Remove from favorites" : "Add to favorites"}
                style={{ 
                  color: isFavorite(currentTrack.id) ? 'var(--brand-red)' : '#fff', 
                  minWidth: '44px',
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.2s, transform 0.2s'
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.85)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <Heart size={26} strokeWidth={1.75} fill={isFavorite(currentTrack.id) ? 'currentColor' : 'none'} />
              </button>
            </div>

            {/* Waveform / Progress Slider */}
            <div style={{ margin: '2px 0' }}>
              <PlayerWaveform height={22} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '6px' }}>
                <span>{Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')}</span>
                <span>{duration ? `${Math.floor(duration / 60)}:${(Math.floor(duration % 60)).toString().padStart(2, '0')}` : '--:--'}</span>
              </div>
            </div>

            {/* Main Transport Controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
              <button 
                onClick={toggleShuffle} 
                className="hover-lift" 
                aria-label="Shuffle" 
                style={{ color: isShuffle ? 'var(--brand-red)' : 'var(--text-secondary)', minWidth: '40px', minHeight: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Shuffle size={20} strokeWidth={1.75} />
              </button>

              <button 
                aria-label="Previous track" 
                className="hover-lift" 
                onClick={previous} 
                style={{ color: '#fff', minWidth: '48px', minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <SkipBack size={32} strokeWidth={1.5} />
              </button>
              
              <button 
                aria-label={isPlaying ? "Pause" : "Play"}
                onClick={togglePlay} 
                style={{ 
                  width: '64px', 
                  height: '64px', 
                  borderRadius: '50%', 
                  backgroundColor: 'var(--brand-red)', 
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isPlaying ? '0 8px 24px rgba(220, 38, 38, 0.45)' : '0 4px 16px rgba(0, 0, 0, 0.4)',
                  transform: isPlaying ? 'scale(1.05)' : 'scale(1)',
                  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
              >
                {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" style={{ marginLeft: '4px' }} />}
              </button>
              
              <button 
                aria-label="Next track" 
                className="hover-lift" 
                onClick={next} 
                style={{ color: '#fff', minWidth: '48px', minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <SkipForward size={32} strokeWidth={1.5} />
              </button>

              <button 
                onClick={toggleRepeat} 
                className="hover-lift" 
                aria-label={`Repeat ${repeatMode}`} 
                style={{ color: repeatMode !== 'off' ? 'var(--brand-red)' : 'var(--text-secondary)', minWidth: '40px', minHeight: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {repeatMode === 'one' ? <Repeat1 size={20} strokeWidth={1.75} /> : <Repeat size={20} strokeWidth={1.75} />}
              </button>
            </div>

            {/* Secondary Controls: Video, Download, EQ, Queue */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button 
                  onClick={handleVideoClick}
                  className="hover-lift"
                  aria-label="Watch video on YouTube"
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    color: '#fff', 
                    backgroundColor: 'rgba(255,255,255,0.12)', 
                    borderRadius: '24px', 
                    fontSize: '12px', 
                    fontWeight: 700, 
                    padding: '6px 14px', 
                    minHeight: '36px',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}
                >
                  <Video size={15} strokeWidth={2} />
                  Video
                </button>

                {/* Download Button */}
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={isDownloading}
                  title={downloadStatus.canDownload ? 'Download high-quality audio file' : (downloadStatus.reason || 'Protected streaming track')}
                  className="hover-lift"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: downloadStatus.canDownload ? '#fff' : 'rgba(255, 255, 255, 0.75)',
                    backgroundColor: downloadStatus.canDownload ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
                    borderRadius: '24px',
                    fontSize: '12px',
                    fontWeight: 600,
                    padding: '6px 14px',
                    minHeight: '36px',
                    border: downloadStatus.canDownload ? '1px solid rgba(220, 38, 38, 0.4)' : '1px solid rgba(255,255,255,0.08)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {isDownloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                  <span>{downloadMsg || (downloadStatus.canDownload ? 'Download' : 'Streaming Only')}</span>
                </button>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button 
                  onClick={() => setShowEQ(true)} 
                  className="hover-lift" 
                  aria-label="Equalizer" 
                  style={{ color: showEQ ? 'var(--brand-red)' : 'var(--text-secondary)', minWidth: '40px', minHeight: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Settings2 size={20} strokeWidth={1.75} />
                </button>
                <button 
                  onClick={() => setShowQueue(true)} 
                  className="hover-lift" 
                  aria-label="Queue" 
                  style={{ color: showQueue ? 'var(--brand-red)' : 'var(--text-secondary)', minWidth: '40px', minHeight: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Layers size={20} strokeWidth={1.75} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showQueue && <QueuePanel onClose={() => setShowQueue(false)} />}
      {showEQ && <EqualizerPanel onClose={() => setShowEQ(false)} />}
    </div>
  );

  return createPortal(playerContent, document.body);
};
