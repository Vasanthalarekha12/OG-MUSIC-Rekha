import { usePlayer } from '../../contexts/PlayerContext';
import type { Song } from '../../types';
import { Play, Pause, Heart, Trash2 } from 'lucide-react';
import { Artwork } from '../ui/Artwork';
import { TrackContextMenu } from './TrackContextMenu';

interface TrackRowProps {
  song: Song;
  index?: number;
  showCover?: boolean;
  showAlbum?: boolean;
  onPlayOverride?: () => void;
  onRemove?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (e: React.MouseEvent) => void;
}

export const TrackRow = ({ song, index, showCover = true, showAlbum = true, onPlayOverride, onRemove, isFavorite, onToggleFavorite }: TrackRowProps) => {
  const { currentTrack, isPlaying, play, togglePlay } = usePlayer();
  const isCurrent = currentTrack?.id === song.id;

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPlayOverride) {
      onPlayOverride();
    } else if (isCurrent) {
      togglePlay();
    } else {
      play(song);
    }
  };

  const currentIsFavorite = isFavorite !== undefined ? isFavorite : song.isFeatured;

  return (
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        borderRadius: 'var(--radius-md)',
        backgroundColor: isCurrent ? 'var(--surface-active)' : 'transparent',
        cursor: 'pointer',
        gap: '16px',
        border: '1px solid transparent',
        borderColor: isCurrent ? 'var(--brand-red-soft)' : 'transparent',
        transition: 'all var(--transition-fast)',
      }}
      onMouseEnter={(e) => {
        if (!isCurrent) e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
      }}
      onMouseLeave={(e) => {
        if (!isCurrent) e.currentTarget.style.backgroundColor = 'transparent';
      }}
      onClick={(e) => {
        if (e.target instanceof Element && (e.target.closest('button') || e.target.closest('[role="menu"]'))) {
          return;
        }
        handlePlayPause(e);
      }}
      onDoubleClick={onPlayOverride ? onPlayOverride : () => play(song)}
    >
      <div style={{ 
        width: '32px', 
        textAlign: 'center', 
        color: isCurrent ? 'var(--brand-red)' : 'var(--text-secondary)', 
        fontSize: 'var(--text-base)',
        fontWeight: 600
      }}>
        {isCurrent ? (
          isPlaying ? <Pause size={18} fill="currentColor" onClick={handlePlayPause}/> : <Play size={18} fill="currentColor" onClick={handlePlayPause}/>
        ) : (
          index !== undefined ? index + 1 : <Play size={18} fill="currentColor" onClick={handlePlayPause}/>
        )}
      </div>

      {showCover && (
        <div style={{ position: 'relative', width: '44px', height: '44px' }}>
          <Artwork src={song.coverUrl} alt={song.title} size="100%" radius="sm" />
          {isCurrent && (
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-sm)'
            }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--brand-red)', boxShadow: 'var(--shadow-brand)' }} />
            </div>
          )}
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="line-clamp-1" style={{ 
          fontWeight: isCurrent ? 700 : 600, 
          color: isCurrent ? 'var(--brand-red)' : 'var(--text-primary)',
          fontSize: 'var(--text-base)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span className="line-clamp-1">{song.title}</span>
        </div>
        <div className="line-clamp-1" style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginTop: '2px' }}>
          {song.artistName}
        </div>
      </div>

      {showAlbum && (
        <div className="line-clamp-1" style={{ flex: 1, color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', display: 'none' /* Hidden by default on mobile */ }}>
          {song.albumName}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--text-secondary)' }}>
        <button className="hover-lift" style={{ 
          padding: '8px', 
          borderRadius: '50%', 
          color: currentIsFavorite ? 'var(--brand-red)' : 'inherit',
          transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
        onClick={onToggleFavorite}
        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.8)'} 
        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}>
           <Heart size={20} fill={currentIsFavorite ? 'currentColor' : 'none'} />
        </button>
        <div style={{ width: '44px', textAlign: 'right', fontSize: 'var(--text-sm)', fontWeight: 500, fontFamily: 'monospace' }}>
          {song.duration ? `${Math.floor(song.duration / 60)}:${(song.duration % 60).toString().padStart(2, '0')}` : '--:--'}
        </div>
        
        {onRemove ? (
          <button className="hover-lift" onClick={(e) => { e.stopPropagation(); onRemove(); }} style={{ padding: '8px', borderRadius: '50%', color: 'var(--error)' }}>
            <Trash2 size={20} />
          </button>
        ) : (
          <TrackContextMenu song={song} />
        )}
      </div>
    </div>
  );
};
