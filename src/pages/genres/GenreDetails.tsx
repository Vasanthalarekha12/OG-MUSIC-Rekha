import { useParams, useNavigate } from 'react-router-dom';
import { mockGenres } from '../../constants/mockData';
import { usePlayer } from '../../contexts/PlayerContext';
import { ArrowLeft, Play, Shuffle } from 'lucide-react';
import { TrackRow } from '../../components/music/TrackRow';
import { ArtistCard } from '../../components/music/ArtistCard';
import { AlbumCard } from '../../components/music/AlbumCard';
import { HorizontalScroller } from '../../components/music/HorizontalScroller';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { useEffect, useState } from 'react';
import { musicDiscoveryService } from '../../services/musicDiscoveryService';
import type { DiscoveryResult, Song, Artist } from '../../types';

export const GenreDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { playList, toggleShuffle } = usePlayer();

  const [discoveryResult, setDiscoveryResult] = useState<DiscoveryResult | null>(null);
  const [loading, setLoading] = useState(true);

  const [popularArtists, setPopularArtists] = useState<Artist[]>([]);

  useEffect(() => {
    if (id) {
      setLoading(true);
      Promise.all([
        musicDiscoveryService.getTracksByGenre(id),
        musicDiscoveryService.getArtists()
      ]).then(([res, artistsData]) => {
        setDiscoveryResult(res);
        setPopularArtists(artistsData);
        setLoading(false);
      }).catch(console.error);
    }
  }, [id]);

  const genre = mockGenres.find(g => g.id === id);
  
  if (!genre) {
    return (
      <div style={{ padding: '48px', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>Genre Not Found</h2>
        <button onClick={() => navigate('/genres')} style={{ padding: '8px 16px', borderRadius: '24px', backgroundColor: 'var(--surface-elevated)', color: 'var(--text-primary)', border: 'none', cursor: 'pointer' }}>Back to Genres</button>
      </div>
    );
  }

  const genreTracks = discoveryResult ? discoveryResult.items : [];
  
  // Aggregate artists and albums based on matching tracks
  const matchingAlbums = genreTracks.reduce((acc: any[], song: Song) => {
    if (song.albumId && !acc.find((a: any) => a.id === song.albumId)) {
      acc.push({ id: song.albumId, title: song.albumName || '', artistId: song.artistId, artistName: song.artistName, coverUrl: song.coverUrl, releaseYear: 2024 });
    }
    return acc;
  }, []);

  const matchingArtists = genreTracks.reduce((acc: Artist[], song: Song) => {
    if (song.artistId && !acc.find((a: Artist) => a.id === song.artistId)) {
      const artist = popularArtists.find(a => a.id === song.artistId);
      if (artist) acc.push(artist);
    }
    return acc;
  }, []);

  const handleShuffle = () => {
    toggleShuffle();
    if (discoveryResult) {
      playList(genreTracks, 0, discoveryResult.context);
    }
  };

  return (
    <div style={{ paddingBottom: '32px' }}>
      <div style={{ marginBottom: '32px', display: 'flex', gap: '24px', alignItems: 'center' }}>
        <button 
          onClick={() => navigate('/genres')}
          className="hover-lift"
          style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', border: 'none', cursor: 'pointer' }}
        >
          <ArrowLeft size={20} />
        </button>
        <div style={{ width: '160px', height: '160px', borderRadius: '16px', overflow: 'hidden', flexShrink: 0, boxShadow: 'var(--shadow-lg)' }}>
          <img 
            src={genre.imageUrl || 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&q=80'} 
            alt={genre.name} 
            onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&q=80'; }}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--brand-red)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>GENRE</span>
          <h1 style={{ fontSize: 'var(--text-4xl)', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '16px', lineHeight: 1.1 }}>{genre.name}</h1>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => discoveryResult && playList(genreTracks, 0, discoveryResult.context)}
              className="hover-lift"
              style={{ backgroundColor: 'var(--brand-red)', color: '#fff', padding: '12px 32px', borderRadius: 'var(--radius-full)', fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', cursor: 'pointer' }}
            >
              <Play size={18} fill="currentColor" /> Play Genre
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

      {loading ? (
        <div style={{ padding: '48px', textAlign: 'center', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Loading tracks...</p>
        </div>
      ) : genreTracks.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)' }}>
          <p style={{ color: 'var(--text-secondary)' }}>No tracks found in this genre.</p>
        </div>
      ) : (
        <div style={{ marginTop: '48px' }}>
          <SectionHeader title="Popular Tracks" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {genreTracks.map((song: Song, idx: number) => (
              <TrackRow 
                key={song.id} 
                song={song} 
                index={idx} 
                onPlayOverride={() => discoveryResult && playList(genreTracks, idx, discoveryResult.context)} 
              />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
            <button 
              onClick={() => navigate(`/search?q=${encodeURIComponent(genre.name + ' songs')}`)}
              className="hover-lift"
              style={{
                backgroundColor: 'var(--surface-elevated)',
                color: 'var(--text-primary)',
                padding: '12px 24px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 600,
                fontSize: 'var(--text-sm)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                letterSpacing: '0.05em'
              }}
            >
              WANT MORE
            </button>
          </div>
        </div>
      )}

      {matchingAlbums.length > 0 && (
        <div style={{ marginTop: '48px' }}>
          <SectionHeader title="Albums" />
          <HorizontalScroller>
            {matchingAlbums.map((album: any) => (
              <div key={album.id} style={{ minWidth: '160px', width: '160px', flex: '0 0 auto' }} className="card-scale">
                <AlbumCard album={album} onClick={() => navigate(`/album/${album.id}`)} />
              </div>
            ))}
          </HorizontalScroller>
        </div>
      )}

      {matchingArtists.length > 0 && (
        <div style={{ marginTop: '48px' }}>
          <SectionHeader title="Artists" />
          <HorizontalScroller>
            {matchingArtists.map((artist: any) => (
              <div 
                key={artist.id} 
                style={{ minWidth: '160px', width: '160px', flex: '0 0 auto', cursor: 'pointer' }} 
                className="card-scale"
                onClick={() => navigate(`/artist/${artist.id}`)}
              >
                <ArtistCard artist={artist} />
              </div>
            ))}
          </HorizontalScroller>
        </div>
      )}
    </div>
  );
};
