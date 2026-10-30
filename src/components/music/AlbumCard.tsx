import { Play } from 'lucide-react';
import type { Album } from '../../types';
import { Artwork } from '../ui/Artwork';

interface AlbumCardProps {
  album: Album;
  onClick?: () => void;
}

export const AlbumCard = ({ album, onClick }: AlbumCardProps) => {
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
        <Artwork src={album.coverUrl} alt={album.title} size="100%" radius="md" />
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
          {album.title}
        </h3>
        <p className="line-clamp-1" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontWeight: 500 }}>
          {album.artistName} {album.releaseYear ? `• ${album.releaseYear}` : ''}
        </p>
      </div>
    </div>
  );
};
