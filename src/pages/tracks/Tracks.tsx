import { musicDiscoveryService } from '../../services/musicDiscoveryService';
import type { Song } from '../../types';
import { TrackRow } from '../../components/music/TrackRow';
import { ListFilter, ArrowDownUp, Search } from 'lucide-react';
import { useLibrary } from '../../contexts/LibraryContext';
import { useState, useMemo, useEffect } from 'react';

export const Tracks = () => {
  const { isFavorite, toggleFavorite } = useLibrary();
  const [searchQuery, setSearchQuery] = useState('');
  
  const [allTracks, setAllTracks] = useState<Song[]>([]);

  useEffect(() => {
    musicDiscoveryService.getAllTracks().then(setAllTracks).catch(console.error);
  }, []);

  const filteredSongs = useMemo(() => {
    if (!searchQuery) return allTracks;
    return allTracks.filter(s => 
      (s.title && s.title.toLowerCase().includes(searchQuery.toLowerCase())) || 
      (s.artistName && s.artistName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery, allTracks]);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-4xl)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
            All Tracks
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>{filteredSongs.length} songs in your library</p>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search tracks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                backgroundColor: 'var(--surface-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-full)',
                padding: '10px 16px 10px 40px',
                color: 'var(--text-primary)',
                outline: 'none',
                width: '200px'
              }}
            />
          </div>
          <button className="glass hover-lift" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: 'var(--radius-full)', color: 'var(--text-secondary)' }}>
            <ArrowDownUp size={18} />
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>Sort</span>
          </button>
          <button className="glass hover-lift" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: 'var(--radius-full)', color: 'var(--text-secondary)' }}>
            <ListFilter size={18} />
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>Filter</span>
          </button>
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        padding: '0 16px 12px 16px', 
        color: 'var(--text-muted)', 
        fontSize: 'var(--text-xs)', 
        textTransform: 'uppercase', 
        letterSpacing: '0.05em',
        borderBottom: '1px solid var(--border)',
        marginBottom: '16px'
      }}>
        <div style={{ width: '40px' }}>#</div>
        <div style={{ flex: 1 }}>Title</div>
        <div style={{ flex: 1, display: 'none' /* hidden mobile */ }}>Album</div>
        <div style={{ width: '120px', textAlign: 'right', paddingRight: '48px' }}>Time</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {filteredSongs.map((song, index) => (
          <TrackRow 
            key={song.id} 
            song={song} 
            index={index} 
            isFavorite={isFavorite(song.id)}
            onToggleFavorite={(e) => {
              e.stopPropagation();
              toggleFavorite(song);
            }}
          />
        ))}
        {filteredSongs.length === 0 && (
          <p style={{ color: 'var(--text-secondary)', padding: '24px 0', textAlign: 'center' }}>No tracks found.</p>
        )}
      </div>
    </div>
  );
};
