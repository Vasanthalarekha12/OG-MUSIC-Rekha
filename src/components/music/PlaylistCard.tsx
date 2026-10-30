import { Play, ListMusic } from 'lucide-react';
import type { Playlist } from '../../types';
import { Artwork } from '../ui/Artwork';

interface PlaylistCardProps {
  playlist: Playlist;
  onClick?: () => void;
}

export const PlaylistCard = ({ playlist, onClick }: PlaylistCardProps) => {
  return (
    <div 
      className="card-scale"
      onClick={onClick}
      style={{ 
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '16px',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--surface-elevated)',
        border: '1px solid var(--border)',
        transition: 'all var(--transition-normal)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
        e.currentTarget.style.borderColor = 'var(--border-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--surface-elevated)';
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
    >
      <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', overflow: 'hidden' }}>
        <Artwork src={playlist.coverUrl} alt={playlist.title} size="100%" radius="md" />
        <div style={{
          position: 'absolute',
          bottom: '8px',
          right: '8px',
          backgroundColor: 'rgba(5,5,5,0.7)',
          backdropFilter: 'blur(8px)',
          padding: '6px 10px',
          borderRadius: 'var(--radius-full)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          color: 'var(--text-primary)',
          fontSize: 'var(--text-xs)',
          fontWeight: 600
        }}>
          <ListMusic size={14} />
          {playlist.songs?.length || 0}
        </div>
        
        {/* Play button overlay */}
        <div 
          className="play-overlay"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0,
            transition: 'opacity var(--transition-fast)',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <button style={{ 
            width: '48px', height: '48px', borderRadius: '50%', 
            backgroundColor: 'var(--brand-red)', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-brand)',
            transform: 'translateY(10px)',
            transition: 'transform var(--transition-normal)'
          }}>
            <Play size={24} fill="currentColor" style={{ marginLeft: '4px' }}/>
          </button>
        </div>
      </div>
      <div>
        <h3 className="line-clamp-1" style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
          {playlist.name || playlist.title}
        </h3>
        <p className="line-clamp-2" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          {playlist.description}
        </p>
      </div>
    </div>
  );
};
