import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlayer } from '../../contexts/PlayerContext';
import { ArrowLeft, Play, Shuffle } from 'lucide-react';
import { TrackRow } from '../../components/music/TrackRow';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { musicDiscoveryService } from '../../services/musicDiscoveryService';
import type { Album, Song } from '../../types';

export const AlbumDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { playList } = usePlayer();
  const [album, setAlbum] = useState<Album | null>(null);
  const [albumTracks, setAlbumTracks] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlbumDetails = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const [albumData, tracksData] = await Promise.all([
          musicDiscoveryService.getAlbumById(id),
          musicDiscoveryService.getAlbumTracks(id)
        ]);
        setAlbum(albumData);
        setAlbumTracks(tracksData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchAlbumDetails();
  }, [id]);

  if (loading) {
    return <div style={{ padding: '48px', color: 'var(--text-secondary)' }}>Loading album details...</div>;
  }

  if (!album) {
    return (
      <div style={{ padding: '48px', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>Album Not Found</h2>
        <button onClick={() => navigate('/albums')} style={{ padding: '8px 16px', borderRadius: '24px', backgroundColor: 'var(--surface-elevated)', color: 'var(--text-primary)', border: 'none', cursor: 'pointer' }}>Back to Albums</button>
      </div>
    );
  }

  const handleShuffle = () => {
    if (albumTracks.length === 0) return;
    const shuffled = [...albumTracks].sort(() => Math.random() - 0.5);
    playList(shuffled, 0, { type: 'album', id: album.id, label: `${album.title} (Shuffle)` });
  };

  const handlePlayAlbum = () => {
    if (albumTracks.length === 0) return;
    playList(albumTracks, 0, { type: 'album', id: album.id, label: album.title });
  };

  return (
    <div style={{ paddingBottom: '32px' }}>
      <div style={{ marginBottom: '32px', display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        <button 
          onClick={() => navigate('/albums')}
          className="hover-lift"
          style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', border: 'none', cursor: 'pointer' }}
        >
          <ArrowLeft size={20} />
        </button>
        <div style={{ width: '200px', height: '200px', borderRadius: '16px', overflow: 'hidden', flexShrink: 0, boxShadow: 'var(--shadow-lg)' }}>
          <img src={album.coverUrl} alt={album.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', minHeight: '200px' }}>
          <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--brand-red)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>ALBUM</span>
          <h1 style={{ fontSize: 'var(--text-4xl)', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '8px', lineHeight: 1.1 }}>{album.title}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-lg)', marginBottom: '16px', fontWeight: 600 }}>{album.artistName} • {album.releaseYear} • {albumTracks.length} tracks</p>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={handlePlayAlbum}
              className="hover-lift"
              style={{ backgroundColor: 'var(--brand-red)', color: '#fff', padding: '12px 32px', borderRadius: 'var(--radius-full)', fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', cursor: 'pointer' }}
            >
              <Play size={18} fill="currentColor" /> Play Album
            </button>
            <button 
              onClick={handleShuffle}
              className="hover-lift"
              style={{ backgroundColor: 'var(--surface-elevated)', color: 'var(--text-primary)', padding: '12px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}
            >
              <Shuffle size={18} />
            </button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '48px' }}>
        <SectionHeader title="Tracks" />
        {albumTracks.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', padding: '16px 0' }}>No tracks available for this album.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {albumTracks.map((song, idx) => (
              <TrackRow 
                key={song.id} 
                song={song} 
                index={idx} 
                onPlayOverride={() => playList(albumTracks, idx, { type: 'album', id: album.id, label: album.title })} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
