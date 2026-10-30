import { useState, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { usePlayer } from '../../contexts/PlayerContext';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { Artwork } from '../ui/Artwork';
import { FullPlayer } from './FullPlayer';

export const MiniPlayer = () => {
  const { currentTrack, isPlaying, togglePlay, next, previous, currentTime, duration } = usePlayer();
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const progress = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  // If no song is active, or actively watching a YouTube video, do not block viewport space
  if (!currentTrack || (location.pathname === '/youtube' && searchParams.get('v'))) {
    return null;
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;
    // Swipe UP opens FullPlayer
    if (diff > 40) {
      setIsFullPlayerOpen(true);
    }
    touchStartY.current = null;
  };

  return (
    <>
      <div
        className="glass-card hover-lift"
        onClick={() => setIsFullPlayerOpen(true)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        role="region"
        aria-label="Now Playing Bar"
        style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px 0 10px',
          margin: '0 10px 8px 10px',
          borderRadius: '16px',
          position: 'relative',
          overflow: 'hidden',
          cursor: 'pointer',
          zIndex: 'var(--z-sticky)',
          backgroundColor: 'rgba(18, 18, 22, 0.94)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.7), 0 0 16px rgba(255, 22, 22, 0.12)',
          userSelect: 'none',
        }}
      >
        {/* Sleek Top Track Progress Bar */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2.5px',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            pointerEvents: 'none',
          }}
        >
          <div 
            style={{
              height: '100%',
              width: `${progress}%`,
              backgroundColor: 'var(--brand-red, #ff1616)',
              boxShadow: '0 0 10px rgba(255, 22, 22, 0.9)',
              transition: 'width 0.2s linear',
            }} 
          />
        </div>

        {/* Track Artwork & Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
          <div 
            style={{ 
              position: 'relative', 
              width: '46px', 
              height: '46px', 
              borderRadius: '10px',
              overflow: 'hidden',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.6)',
            }}
          >
            <Artwork src={currentTrack.coverUrl} alt={currentTrack.title} size="100%" radius="md" />
            
            {/* Playing visualizer indicator */}
            {isPlaying && (
              <div 
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2px',
                }}
              >
                {[6, 12, 8, 14].map((h, i) => (
                  <span 
                    key={i}
                    style={{
                      width: '2.5px',
                      height: `${h}px`,
                      backgroundColor: 'var(--brand-red, #ff1616)',
                      borderRadius: '1px',
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1px' }}>
            <div 
              className="line-clamp-1" 
              style={{ 
                fontWeight: 700, 
                color: 'var(--text-primary)', 
                fontSize: '13px',
                letterSpacing: '-0.2px',
              }}
            >
              {currentTrack.title}
            </div>
            <div 
              className="line-clamp-1" 
              style={{ 
                color: 'rgba(255, 255, 255, 0.6)', 
                fontSize: '11px',
                fontWeight: 500,
              }}
            >
              {currentTrack.artistName}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '4px' }} 
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            type="button"
            aria-label="Previous Track"
            onClick={(e) => { e.stopPropagation(); previous(); }} 
            style={{ 
              color: 'rgba(255, 255, 255, 0.7)', 
              background: 'transparent',
              border: 'none',
              padding: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              minWidth: '38px', 
              minHeight: '38px',
              cursor: 'pointer',
              borderRadius: '50%',
            }}
          >
            <SkipBack size={18} fill="currentColor" />
          </button>

          <button 
            type="button"
            aria-label={isPlaying ? "Pause Track" : "Play Track"}
            onClick={(e) => { e.stopPropagation(); togglePlay(); }} 
            style={{ 
              color: '#ffffff',
              backgroundColor: 'var(--brand-red, #ff1616)',
              border: 'none',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isPlaying ? '0 0 16px rgba(255, 22, 22, 0.6)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              flexShrink: 0,
            }}
          >
            {isPlaying ? (
              <Pause size={18} fill="currentColor" />
            ) : (
              <Play size={18} fill="currentColor" style={{ marginLeft: '2px' }} />
            )}
          </button>

          <button 
            type="button"
            aria-label="Next Track"
            onClick={(e) => { e.stopPropagation(); next(); }} 
            style={{ 
              color: 'rgba(255, 255, 255, 0.7)', 
              background: 'transparent',
              border: 'none',
              padding: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              minWidth: '38px', 
              minHeight: '38px',
              cursor: 'pointer',
              borderRadius: '50%',
            }}
          >
            <SkipForward size={18} fill="currentColor" />
          </button>
        </div>
      </div>
      
      {isFullPlayerOpen && (
        <FullPlayer onClose={() => setIsFullPlayerOpen(false)} />
      )}
    </>
  );
};
