import type { Artist } from '../../types';
import { Artwork } from '../ui/Artwork';

interface ArtistCardProps {
  artist: Artist;
  onClick?: () => void;
}

export const ArtistCard = ({ artist, onClick }: ArtistCardProps) => {
  return (
    <div 
      className="card-scale"
      onClick={onClick}
      style={{ 
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        padding: '24px 16px',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--surface-elevated)',
        border: '1px solid transparent',
        transition: 'all var(--transition-normal)',
        textAlign: 'center'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--surface-elevated)';
      }}
    >
      <div style={{ width: '100%', aspectRatio: '1/1', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', boxShadow: '0 8px 16px rgba(0,0,0,0.5)' }}>
          <Artwork src={artist.imageUrl} alt={artist.name} size="100%" radius="full" />
        </div>
      </div>
      <div>
        <h3 className="line-clamp-1" style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)' }}>
          {artist.name}
        </h3>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
          Artist
        </p>
      </div>
    </div>
  );
};
