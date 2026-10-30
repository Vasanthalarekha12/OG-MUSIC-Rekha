import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlayer } from '../../contexts/PlayerContext';
import { ArrowLeft, Play, Shuffle } from 'lucide-react';
import { TrackRow } from '../../components/music/TrackRow';
import { AlbumCard } from '../../components/music/AlbumCard';
import { HorizontalScroller } from '../../components/music/HorizontalScroller';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Artwork } from '../../components/ui/Artwork';
import { musicDiscoveryService } from '../../services/musicDiscoveryService';
import type { Artist, Album, Song } from '../../types';

export const ArtistDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { playList } = usePlayer();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [artistTracks, setArtistTracks] = useState<Song[]>([]);
  const [artistAlbums, setArtistAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtistDetails = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const [artistData, tracksData, albumsData] = await Promise.all([
          musicDiscoveryService.getArtistById(id),
          musicDiscoveryService.getArtistTracks(id),
          musicDiscoveryService.getArtistAlbums(id)
        ]);
        setArtist(artistData);
        setArtistTracks(tracksData);
        setArtistAlbums(albumsData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchArtistDetails();
  }, [id]);

  if (loading) {
    return <div style={{ padding: '48px', color: 'var(--text-secondary)' }}>Loading artist details...</div>;
  }

  if (!artist) {
    return (
      <div style={{ padding: '48px', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>Artist Not Found</h2>
        <button onClick={() => navigate('/artists')} style={{ padding: '8px 16px', borderRadius: '24px', backgroundColor: 'var(--surface-elevated)', color: 'var(--text-primary)', border: 'none', cursor: 'pointer' }}>Back to Artists</button>
      </div>
    );
  }

  const handleShuffle = () => {
    if (artistTracks.length === 0) return;
    const shuffled = [...artistTracks].sort(() => Math.random() - 0.5);
    playList(shuffled, 0, { type: 'artist', id: artist.id, label: `${artist.name} (Shuffle)` });
  };

  const handlePlayPopular = () => {
    if (artistTracks.length === 0) return;
    playList(artistTracks, 0, { type: 'artist', id: artist.id, label: artist.name });
  };

  return (
    <div style={{ paddingBottom: '32px' }}>
      <div style={{ marginBottom: '32px', display: 'flex', gap: '24px', alignItems: 'center' }}>
        <button 
          onClick={() => navigate('/artists')}
          className="hover-lift"
          style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', border: 'none', cursor: 'pointer' }}
        >
          <ArrowLeft size={20} />
        </button>
        <div style={{ width: '160px', height: '160px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, boxShadow: 'var(--shadow-lg)' }}>
          <Artwork src={artist.imageUrl} alt={artist.name} radius="full" fallbackType="artist" />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--brand-red)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>ARTIST</span>
          <h1 style={{ fontSize: 'var(--text-4xl)', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '16px', lineHeight: 1.1 }}>{artist.name}</h1>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={handlePlayPopular}
              className="hover-lift"
              style={{ backgroundColor: 'var(--brand-red)', color: '#fff', padding: '12px 32px', borderRadius: 'var(--radius-full)', fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', cursor: 'pointer' }}
            >
              <Play size={18} fill="currentColor" /> Play Popular
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

      {artistTracks.length > 0 && (
        <div style={{ marginTop: '48px' }}>
          <SectionHeader title="Popular Songs" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {artistTracks.map((song, idx) => (
              <TrackRow 
                key={song.id} 
                song={song} 
                index={idx} 
                onPlayOverride={() => playList(artistTracks, idx, { type: 'artist', id: artist.id, label: artist.name })} 
              />
            ))}
          </div>
        </div>
      )}

      {artistAlbums.length > 0 && (
        <div style={{ marginTop: '48px' }}>
          <SectionHeader title="Albums" />
          <HorizontalScroller>
            {artistAlbums.map((album) => (
              <div key={album.id} style={{ minWidth: '160px', width: '160px', flex: '0 0 auto' }} className="card-scale">
                <AlbumCard album={album} onClick={() => navigate(`/album/${album.id}`)} />
              </div>
            ))}
          </HorizontalScroller>
        </div>
      )}
    </div>
  );
};
