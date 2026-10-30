
import { usePlayer } from '../../contexts/PlayerContext';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { HorizontalScroller } from '../../components/music/HorizontalScroller';
import { TrackRow } from '../../components/music/TrackRow';
import { AlbumCard } from '../../components/music/AlbumCard';
import { ArtistCard } from '../../components/music/ArtistCard';
import { PlaylistCard } from '../../components/music/PlaylistCard';
import { useYouTubeCategory } from '../../services/youtube/youtubeHooks';
import { Play, ArrowLeft } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { musicDiscoveryService } from '../../services/musicDiscoveryService';
import type { DiscoveryResult, Song, Artist, Album } from '../../types';

const moodGenres = [
  'Melody', 'Mass', 'Romantic', 'Devotional', 'Happy', 'Sad', 
  'Energetic', 'Peaceful', 'Workout', 'Chill', 'Instrumental', 
  'Party', 'Classical', 'Folk'
];
const languageGenres = [
  'Telugu', 'Tamil', 'Hindi', 'English', 'Malayalam', 'Kannada', 
  'Bengali', 'Marathi', 'Punjabi', 'Gujarati', 'Odia', 'Assamese', 
  'Urdu', 'Bhojpuri'
];

export const Explore = () => {
  const { playList } = usePlayer();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const indiaCharts = useYouTubeCategory('India top music videos', 10);
  const devotionalHits = useYouTubeCategory('Devotional', 10);

  const activeMood = searchParams.get('mood');
  const activeLanguage = searchParams.get('language');

  const [discoveryResult, setDiscoveryResult] = useState<DiscoveryResult | null>(null);
  const [loadingDiscovery, setLoadingDiscovery] = useState(false);

  const [trendingTracks, setTrendingTracks] = useState<Song[]>([]);
  const [popularArtists, setPopularArtists] = useState<Artist[]>([]);
  const [popularAlbums, setPopularAlbums] = useState<Album[]>([]);
  const [featuredPlaylists, setFeaturedPlaylists] = useState<any[]>([]);

  useEffect(() => {
    if (activeMood && activeLanguage) {
      setLoadingDiscovery(true);
      musicDiscoveryService.getTracksByMoodAndLanguage(activeMood, activeLanguage).then(res => {
        setDiscoveryResult(res);
        setLoadingDiscovery(false);
      });
    } else if (activeMood) {
      setLoadingDiscovery(true);
      musicDiscoveryService.getTracksByMood(activeMood).then(res => {
        setDiscoveryResult(res);
        setLoadingDiscovery(false);
      });
    } else if (activeLanguage) {
      setLoadingDiscovery(true);
      musicDiscoveryService.getTracksByLanguage(activeLanguage).then(res => {
        setDiscoveryResult(res);
        setLoadingDiscovery(false);
      });
    } else {
      setDiscoveryResult(null);
    }
  }, [activeMood, activeLanguage]);

  useEffect(() => {
    const fetchBaseData = async () => {
      try {
        const [tracks, artists, albums, playlists] = await Promise.all([
          musicDiscoveryService.getAllTracks(),
          musicDiscoveryService.getArtists(),
          musicDiscoveryService.getAlbums(),
          musicDiscoveryService.getFeaturedPlaylists()
        ]);
        setTrendingTracks(tracks);
        setPopularArtists(artists);
        setPopularAlbums(albums);
        setFeaturedPlaylists(playlists);
      } catch (e) {
        console.error(e);
      }
    };
    fetchBaseData();
  }, []);

  if (activeMood || activeLanguage) {
    const title = (activeLanguage && activeMood) 
      ? `${activeLanguage} • ${activeMood}` 
      : (activeLanguage || activeMood);
    
    const matchingTracks = discoveryResult ? discoveryResult.items : [];

    const matchingAlbums = matchingTracks.reduce((acc: any[], song: Song) => {
      if (song.albumId && !acc.find((a: any) => a.id === song.albumId)) {
        acc.push({ id: song.albumId, title: song.albumName || '', artistId: song.artistId, artistName: song.artistName, coverUrl: song.coverUrl, releaseYear: 2024 });
      }
      return acc;
    }, []);

    const matchingArtists = matchingTracks.reduce((acc: Artist[], song: Song) => {
      if (song.artistId && !acc.find((a: Artist) => a.id === song.artistId)) {
        // Find it in the fetched artists state (we will add state for it)
        const artist = popularArtists.find(a => a.id === song.artistId);
        if (artist) acc.push(artist);
      }
      return acc;
    }, []);

    return (
      <div style={{ paddingBottom: '32px' }}>
        <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={() => navigate('/explore')}
            className="hover-lift"
            style={{ 
              width: '40px', height: '40px', 
              borderRadius: '50%', 
              backgroundColor: 'var(--surface-elevated)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-primary)',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: 'var(--text-4xl)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px', letterSpacing: '-0.5px' }}>
              {title}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-lg)' }}>
              Explore {title?.toLowerCase()} music and artists.
            </p>
          </div>
        </div>

        {loadingDiscovery ? (
          <div style={{ padding: '48px', textAlign: 'center', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Loading {title} songs...</p>
          </div>
        ) : matchingTracks.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)' }}>
            <p style={{ color: 'var(--text-secondary)' }}>No {title} songs found</p>
          </div>
        ) : (
          <>
            <section style={{ marginBottom: '40px' }}>
              <SectionHeader title="Tracks" actionText="Play All" actionLink="#" onActionClick={(e) => { e.preventDefault(); playList(matchingTracks, 0, discoveryResult!.context); }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {matchingTracks.map((song: Song, i: number) => (
                  <TrackRow 
                    key={song.id} 
                    song={song} 
                    index={i} 
                    onPlayOverride={() => playList(matchingTracks, i, discoveryResult!.context)}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
                <button 
                  onClick={() => navigate(`/search?q=${encodeURIComponent(title + ' songs')}`)}
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
            </section>

            {matchingAlbums.length > 0 && (
              <section style={{ marginBottom: '40px' }}>
                <SectionHeader title="Albums" />
                <HorizontalScroller>
                  {matchingAlbums.map((album: any) => (
                    <div key={album.id} style={{ minWidth: '160px', width: '160px', flex: '0 0 auto' }} className="card-scale">
                      <AlbumCard album={album} onClick={() => navigate(`/album/${album.id}`)} />
                    </div>
                  ))}
                </HorizontalScroller>
              </section>
            )}

            {matchingArtists.length > 0 && (
              <section style={{ marginBottom: '40px' }}>
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
              </section>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '32px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: 'var(--text-4xl)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.5px' }}>
          Explore
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-lg)' }}>
          Discover new sounds, top charts, and curated playlists.
        </p>
      </div>

      <section style={{ marginBottom: '40px' }}>
        <SectionHeader title="Trending Music" subtitle="Most popular right now" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {trendingTracks.slice(0, 6).map((song, i) => (
            <TrackRow 
              key={song.id} 
              song={song} 
              index={i} 
              onPlayOverride={() => playList(trendingTracks, i, { type: 'playlist', id: 'explore-trending', label: 'Explore Trending' })}
            />
          ))}
        </div>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <SectionHeader title="Top Artists" subtitle="Trending creators" actionText="View all" actionLink="/artists" />
        <HorizontalScroller>
          {popularArtists.map((artist) => (
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
      </section>

      <section style={{ marginBottom: '40px' }}>
        <SectionHeader title="Top Albums" subtitle="New and hot releases" actionText="View all" actionLink="/albums" />
        <HorizontalScroller>
          {popularAlbums.map((album) => (
            <div key={album.id} style={{ minWidth: '160px', width: '160px', flex: '0 0 auto' }} className="card-scale">
              <AlbumCard 
                album={album}
                onClick={() => navigate(`/album/${album.id}`)}
              />
            </div>
          ))}
        </HorizontalScroller>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <SectionHeader title="Popular Playlists" subtitle="Curated for your vibe" actionText="View all" actionLink="/playlists" />
        <HorizontalScroller>
          {featuredPlaylists.map((playlist) => (
            <div 
              key={playlist.id} 
              style={{ minWidth: '180px', width: '180px', flex: '0 0 auto', cursor: 'pointer' }} 
              className="card-scale"
              onClick={() => navigate(`/playlist/${playlist.id}`)}
            >
              <PlaylistCard playlist={playlist} />
            </div>
          ))}
        </HorizontalScroller>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        <section>
          <SectionHeader title="Moods & Feelings" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {moodGenres.map(genre => (
              <button 
                key={genre} 
                className="hover-lift" 
                onClick={() => setSearchParams({ mood: genre })}
                style={{
                  padding: '12px 24px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--surface-elevated)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  border: '1px solid var(--border)',
                  cursor: 'pointer'
                }}>
                {genre}
              </button>
            ))}
          </div>
        </section>

        <section>
          <SectionHeader title="Languages" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {languageGenres.map(genre => (
              <button 
                key={genre} 
                className="hover-lift" 
                onClick={() => setSearchParams({ language: genre })}
                style={{
                  padding: '12px 24px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--surface-elevated)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  border: '1px solid var(--border)',
                  cursor: 'pointer'
                }}>
                {genre}
              </button>
            ))}
          </div>
        </section>
      </div>

      <section style={{ marginBottom: '40px' }}>
        <SectionHeader title="India Video Charts" subtitle="Top charting videos" actionText="Watch all" actionLink="/youtube" />
        {indiaCharts.loading ? (
          <div style={{ display: 'flex', gap: '16px', overflow: 'hidden' }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ width: '280px', height: '160px', backgroundColor: 'var(--surface-elevated)', borderRadius: 'var(--radius-md)', flexShrink: 0, animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
        ) : indiaCharts.data.length > 0 ? (
          <HorizontalScroller>
            {indiaCharts.data.map((video) => (
              <div key={`yt-ind-${video.id}`} style={{ width: '280px', flex: '0 0 auto' }} className="card-scale">
                <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 'var(--radius-md)', overflow: 'hidden', cursor: 'pointer', marginBottom: '8px' }}>
                  <img src={video.coverUrl} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s ease' }} className="play-overlay">
                    <Play size={32} color="#fff" fill="#fff" />
                  </div>
                </div>
                <h4 style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)', fontWeight: 600, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: '0 0 4px 0' }} dangerouslySetInnerHTML={{ __html: video.title }} />
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', margin: 0 }}>{video.artistName}</p>
              </div>
            ))}
          </HorizontalScroller>
        ) : null}
      </section>

      <section style={{ marginBottom: '40px' }}>
        <SectionHeader title="Devotional Highlights" subtitle="Spiritual sounds" actionText="Watch all" actionLink="/youtube" />
        {devotionalHits.loading ? (
          <div style={{ display: 'flex', gap: '16px', overflow: 'hidden' }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ width: '280px', height: '160px', backgroundColor: 'var(--surface-elevated)', borderRadius: 'var(--radius-md)', flexShrink: 0, animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
        ) : devotionalHits.data.length > 0 ? (
          <HorizontalScroller>
            {devotionalHits.data.map((video) => (
              <div key={`yt-dev-${video.id}`} style={{ width: '280px', flex: '0 0 auto' }} className="card-scale">
                <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 'var(--radius-md)', overflow: 'hidden', cursor: 'pointer', marginBottom: '8px' }}>
                  <img src={video.coverUrl} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s ease' }} className="play-overlay">
                    <Play size={32} color="#fff" fill="#fff" />
                  </div>
                </div>
                <h4 style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)', fontWeight: 600, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: '0 0 4px 0' }} dangerouslySetInnerHTML={{ __html: video.title }} />
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', margin: 0 }}>{video.artistName}</p>
              </div>
            ))}
          </HorizontalScroller>
        ) : null}
      </section>

    </div>
  );
};
