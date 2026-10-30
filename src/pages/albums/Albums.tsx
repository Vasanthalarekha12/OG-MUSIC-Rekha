import { useState, useEffect } from 'react';
import { AlbumCard } from '../../components/music/AlbumCard';
import { MusicGrid } from '../../components/music/MusicGrid';
import { useNavigate } from 'react-router-dom';
import { musicDiscoveryService } from '../../services/musicDiscoveryService';
import type { Album } from '../../types';

export const Albums = () => {
  const navigate = useNavigate();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const data = await musicDiscoveryService.getAlbums();
        setAlbums(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAlbums();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: 'var(--text-4xl)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Albums
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Explore your album collection</p>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading albums...</p>
      ) : albums.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>No albums found.</p>
      ) : (
        <MusicGrid>
          {albums.map(album => (
            <AlbumCard key={album.id} album={album} onClick={() => navigate(`/album/${album.id}`)} />
          ))}
        </MusicGrid>
      )}
    </div>
  );
};
