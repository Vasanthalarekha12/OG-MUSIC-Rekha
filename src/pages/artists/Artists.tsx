import { useState, useEffect } from 'react';
import { ArtistCard } from '../../components/music/ArtistCard';
import { MusicGrid } from '../../components/music/MusicGrid';
import { useNavigate } from 'react-router-dom';
import { musicDiscoveryService } from '../../services/musicDiscoveryService';
import type { Artist } from '../../types';

export const Artists = () => {
  const navigate = useNavigate();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const data = await musicDiscoveryService.getArtists();
        setArtists(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchArtists();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: 'var(--text-4xl)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Artists
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Your favorite artists</p>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading artists...</p>
      ) : artists.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>No artists found.</p>
      ) : (
        <MusicGrid>
          {artists.map(artist => (
            <ArtistCard key={artist.id} artist={artist} onClick={() => navigate(`/artist/${artist.id}`)} />
          ))}
        </MusicGrid>
      )}
    </div>
  );
};
