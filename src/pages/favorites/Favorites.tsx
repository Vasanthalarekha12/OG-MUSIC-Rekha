import { TrackRow } from '../../components/music/TrackRow';
import { Play, Shuffle, Heart, ArrowLeft } from 'lucide-react';
import { usePlayer } from '../../contexts/PlayerContext';
import { useLibrary } from '../../contexts/LibraryContext';
import { useNavigate } from 'react-router-dom';

export const Favorites = () => {
  const navigate = useNavigate();
  const { playList, toggleShuffle, isShuffle } = usePlayer();
  const { favorites, toggleFavorite } = useLibrary();

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button 
          onClick={() => navigate('/playlists')}
          className="hover-lift"
          style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', border: 'none', cursor: 'pointer' }}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: 'var(--text-4xl)', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
            Favorites
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>{favorites.length} tracks</p>
        </div>
      </div>

      {favorites.length > 0 && (
        <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
          <button 
            className="hover-lift"
            onClick={() => playList(favorites)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--brand-red)', color: '#fff', fontWeight: 700 }}
          >
            <Play fill="currentColor" size={20} />
            Play All
          </button>
          <button 
            className="hover-lift" 
            onClick={() => {
              if (!isShuffle) toggleShuffle();
              playList(favorites);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: 600 }}
          >
            <Shuffle size={20} />
            Shuffle
          </button>
        </div>
      )}

      {favorites.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-secondary)' }}>
          <div style={{ marginBottom: '16px', display: 'inline-block', padding: '24px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)' }}>
            <Heart size={48} />
          </div>
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>No favorites yet</h2>
          <p>Tap the heart on any song to save it here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {favorites.map((song, index) => (
            <TrackRow 
              key={song.id} 
              song={song} 
              index={index}
              isFavorite={true}
              onToggleFavorite={(e) => {
                e.stopPropagation();
                toggleFavorite(song);
              }}
              onPlayOverride={() => playList(favorites, index)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
