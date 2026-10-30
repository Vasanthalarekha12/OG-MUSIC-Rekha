import { useEffect, useState } from 'react';
import { usePlayer } from '../../contexts/PlayerContext';
import { useYouTubeTrending, useYouTubeCategory } from '../../services/youtube/youtubeHooks';
import { Play, Heart, Clock, List, ListMusic } from 'lucide-react';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { HorizontalScroller } from '../../components/music/HorizontalScroller';
import { TrackRow } from '../../components/music/TrackRow';
import { AlbumCard } from '../../components/music/AlbumCard';
import { ArtistCard } from '../../components/music/ArtistCard';
import { PlaylistCard } from '../../components/music/PlaylistCard';
import { MusicGrid } from '../../components/music/MusicGrid';
import { HeroCarousel } from '../../components/music/HeroCarousel';
import { useNavigate } from 'react-router-dom';

import { musicDiscoveryService } from '../../services/musicDiscoveryService';
import { recommendationService } from '../../services/recommendationService';
import type { Song, Artist } from '../../types';

import { useLibrary } from '../../contexts/LibraryContext';

export const Home = () => {
  const { play, playList, queue } = usePlayer();
  const { history, favorites, playlists } = useLibrary();
  const navigate = useNavigate();
  
  const [trendingTracks, setTrendingTracks] = useState<Song[]>([]);
  const [popularArtists, setPopularArtists] = useState<Artist[]>([]);
  const [featuredPlaylists, setFeaturedPlaylists] = useState<any[]>([]);
  const [recommendationHeadline, setRecommendationHeadline] = useState<string>('Trending & Discovery');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tracks, artists, playlistsData] = await Promise.all([
          musicDiscoveryService.getAllTracks(),
          musicDiscoveryService.getArtists(),
          musicDiscoveryService.getFeaturedPlaylists()
        ]);
        const recResult = recommendationService.getPersonalizedRecommendations(tracks, 10);
        setTrendingTracks(recResult.tracks.slice(0, 8));
        setRecommendationHeadline(recResult.headline);
        setPopularArtists(artists.slice(0, 10));
        setFeaturedPlaylists(playlistsData.slice(0, 5));
        if (recResult.tracks.length > 0) setHeroTrackFallback(recResult.tracks[0]);
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
  }, [history.length, favorites.length]);

  const [heroTrackFallback, setHeroTrackFallback] = useState<Song | null>(null);

  // Deduplicate history for the scroller
  const uniqueHistory = history.reduce((acc, item) => {
    if (!acc.find(s => s.id === item.song.id)) {
      acc.push(item.song);
    }
    return acc;
  }, [] as Song[]);
  
  const recentlyPlayed = uniqueHistory.slice(0, 15);
  
  // Choose hero track based on history or fallback to catalog
  const heroTrack = recentlyPlayed.length > 0 ? recentlyPlayed[0] : heroTrackFallback;

  const carouselItems = recentlyPlayed.length >= 3 
    ? recentlyPlayed 
    : (trendingTracks.length > 0 ? trendingTracks : (heroTrack ? [heroTrack] : []));

  const ytTrending = useYouTubeTrending('IN', 10);
  const ytMusicVideos = useYouTubeCategory('latest hits music videos', 10);

  const handleStartListening = () => {
    if (recentlyPlayed.length > 0) {
      playList(recentlyPlayed, 0, {
        type: 'history',
        id: 'home-history',
        label: 'Home History'
      });
    } else if (heroTrackFallback) {
      playList([heroTrackFallback], 0, {
        type: 'history',
        id: 'home-history',
        label: 'Home History'
      });
    }
  };



  return (
    <div style={{ paddingBottom: '32px' }}>
      {/* Hero Section */}
      <section style={{ 
        position: 'relative', 
        borderRadius: 'var(--radius-xl)', 
        overflow: 'hidden',
        marginBottom: 'clamp(24px, 4vw, 40px)',
        minHeight: 'clamp(240px, 35vh, 320px)',
        display: 'flex',
        alignItems: 'center',
        padding: 'clamp(20px, 5vw, 40px)'
      }}>
        {/* Background Image & Overlays */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${heroTrack?.coverUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(24px) brightness(0.6)',
          transform: 'scale(1.1)',
          zIndex: 0
        }} />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, var(--bg-primary) 0%, rgba(0,0,0,0.5) 100%)',
          zIndex: 1
        }} />
        {/* Subtle red atmospheric lighting */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 80% 50%, var(--brand-red-soft) 0%, transparent 50%)',
          zIndex: 2
        }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', gap: '40px', flexWrap: 'wrap' }}>
          <div style={{ maxWidth: '500px', flex: '1 1 300px' }}>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--brand-red)', letterSpacing: '0.15em', marginBottom: '16px', textTransform: 'uppercase' }}>
              MARUDHAM OG MUSIC
            </div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '16px', lineHeight: 1.1, letterSpacing: '-1px' }}>
            Your music. <br/> Your mood. <br/> Your world.
          </h1>
          <p style={{ fontSize: 'var(--text-lg)', color: 'var(--text-secondary)', marginBottom: '32px', fontWeight: 500, maxWidth: '400px' }}>
            Dive into premium curated sounds designed for the ultimate listening experience.
          </p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <button 
              className="hover-lift"
              onClick={handleStartListening}
              style={{
                backgroundColor: 'var(--brand-red)',
                color: '#fff',
                padding: '14px 28px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
                fontSize: 'var(--text-sm)',
                boxShadow: 'var(--shadow-brand)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                letterSpacing: '0.05em'
              }}
            >
              <Play size={18} fill="currentColor" />
              START LISTENING
            </button>
            <button 
              className="hover-lift"
              onClick={() => navigate('/explore')}
              style={{
                backgroundColor: 'var(--surface-elevated)',
                color: 'var(--text-primary)',
                padding: '14px 28px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 600,
                fontSize: 'var(--text-sm)',
                border: '1px solid var(--border)',
                letterSpacing: '0.05em'
              }}
            >
              EXPLORE LIBRARY
            </button>
          </div>
          </div>
          
          <div style={{ flex: '1 1 320px', maxWidth: '540px', width: '100%', minWidth: 0 }}>
            <HeroCarousel 
              items={carouselItems} 
              activeId={heroTrack?.id}
              onSelect={(item) => {
                const song = item as Song;
                play(song, {
                  type: 'history',
                  id: 'home-hero',
                  label: 'Home Hero'
                });
              }} 
            />
          </div>
        </div>
      </section>

      {/* Quick Access */}
      <section style={{ marginBottom: '40px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '16px'
        }}>
          {[
            { title: 'Liked Songs', count: `${favorites.length} tracks`, icon: <Heart size={20} color="var(--brand-red)" fill="var(--brand-red)" />, path: '/favorites' },
            { title: 'Recently Played', count: `${history.length} tracks`, icon: <Clock size={20} color="var(--text-primary)" />, path: '/history' },
            { title: 'Queue', count: `${queue.length} tracks`, icon: <List size={20} color="var(--text-primary)" />, path: '/queue' },
            { title: 'Your Playlists', count: `${playlists.length} playlists`, icon: <ListMusic size={20} color="var(--text-primary)" />, path: '/playlists' },
          ].map((item, i) => (
            <div 
              key={i} 
              className="hover-lift"
              onClick={() => navigate(item.path)}
              style={{ 
                padding: '16px', 
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                cursor: 'pointer'
              }}
            >
              <div style={{ 
                width: '40px', height: '40px', 
                borderRadius: 'var(--radius-md)', 
                backgroundColor: 'var(--surface-elevated)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center' 
              }}>
                {item.icon}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{item.title}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '2px' }}>{item.count}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recently Played */}
      {recentlyPlayed.length > 0 && (
        <section style={{ marginBottom: '48px' }}>
          <SectionHeader title="Recently Played" subtitle="Jump back in" actionText="View all" actionLink="/history" />
          <HorizontalScroller>
            {recentlyPlayed.map((song) => (
              <div key={song.id} style={{ minWidth: '160px', width: '160px', flex: '0 0 auto' }} className="card-scale">
                <AlbumCard 
                  album={{ id: song.albumId || song.id, title: song.albumName || song.title, artistId: song.artistId, artistName: song.artistName, coverUrl: song.coverUrl, releaseYear: 2023 }}
                  onClick={() => play(song)}
                />
              </div>
            ))}
          </HorizontalScroller>
        </section>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '48px', marginBottom: '48px' }}>
        <section>
          <SectionHeader 
            title={recommendationHeadline} 
            subtitle={recommendationHeadline === 'Made For You' ? 'Ranked from your listening activity' : 'What everyone is listening to right now'} 
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {trendingTracks.map((song, index) => (
              <TrackRow 
                key={song.id} 
                song={song} 
                index={index} 
                showAlbum={false} 
                onPlayOverride={() => playList(trendingTracks, index, { type: 'playlist', id: 'home-trending', label: 'Trending Tracks' })}
              />
            ))}
          </div>
        </section>
      </div>

      <section style={{ marginBottom: '48px' }}>
        <SectionHeader title="Popular Artists" subtitle="Explore top creators" actionText="View all" actionLink="/artists" />
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

      <section style={{ marginBottom: '48px' }}>
        <SectionHeader title="Featured Playlists" subtitle="Curated for you" actionText="View all" actionLink="/playlists" />
        <MusicGrid>
          {featuredPlaylists.map((playlist) => (
            <div key={playlist.id} onClick={() => navigate(`/playlist/${playlist.id}`)} style={{ cursor: 'pointer' }}>
              <PlaylistCard playlist={playlist} />
            </div>
          ))}
        </MusicGrid>
      </section>

      {/* YouTube Trending Section */}
      <section style={{ marginBottom: '48px' }}>
        <SectionHeader title="Trending on YouTube" subtitle="Top hits right now" actionText="Watch more" actionLink="/youtube" />
        {ytTrending.loading ? (
          <div style={{ display: 'flex', gap: '16px', overflow: 'hidden' }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ width: '280px', height: '160px', backgroundColor: 'var(--surface-elevated)', borderRadius: 'var(--radius-md)', flexShrink: 0, animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
        ) : ytTrending.data.length > 0 ? (
          <div style={{ position: 'relative', padding: '20px 0', overflow: 'hidden' }}>
            <div style={{ display: 'flex', perspective: '1000px', transformStyle: 'preserve-3d', gap: '24px', paddingLeft: '24px', paddingRight: '24px', overflowX: 'auto', scrollbarWidth: 'none' }} className="no-scrollbar">
              {ytTrending.data.map((video) => (
                <div 
                  key={`yt-home-${video.id}`} 
                  style={{ 
                    width: '280px', 
                    flex: '0 0 auto', 
                    cursor: 'pointer',
                    transition: 'all 0.5s ease',
                    transform: 'translateZ(-10px) rotateY(10deg)',
                  }} 
                  className="card-scale-3d"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateZ(20px) rotateY(0deg)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateZ(-10px) rotateY(10deg)';
                  }}
                  onClick={() => navigate(`/youtube?v=${video.id}`)}
                >
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '8px', boxShadow: '0 10px 20px rgba(0,0,0,0.5)' }}>
                    <img src={video.coverUrl} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s ease' }} className="play-overlay">
                      <Play size={32} color="#fff" fill="#fff" />
                    </div>
                  </div>
                  <h4 style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)', fontWeight: 600, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: '0 0 4px 0' }} dangerouslySetInnerHTML={{ __html: video.title }} />
                  <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', margin: 0 }}>{video.artistName}</p>
                </div>
              ))}
            </div>
            <style>
              {`
                .card-scale-3d:hover .play-overlay {
                  opacity: 1 !important;
                }
                .no-scrollbar::-webkit-scrollbar { display: none; }
              `}
            </style>
          </div>
        ) : null}
      </section>

      {/* YouTube Music Videos */}
      <section style={{ marginBottom: '48px' }}>
        <SectionHeader title="Hot Music Videos" subtitle="Latest visual hits" actionText="Watch more" actionLink="/youtube" />
        {ytMusicVideos.loading ? (
          <div style={{ display: 'flex', gap: '16px', overflow: 'hidden' }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ width: '280px', height: '160px', backgroundColor: 'var(--surface-elevated)', borderRadius: 'var(--radius-md)', flexShrink: 0, animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
        ) : ytMusicVideos.data.length > 0 ? (
          <HorizontalScroller>
            {ytMusicVideos.data.map((video) => (
              <div 
                key={`yt-mv-${video.id}`} 
                style={{ width: '280px', flex: '0 0 auto', cursor: 'pointer' }} 
                className="card-scale"
                onClick={() => navigate(`/youtube?v=${video.id}`)}
              >
                <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '8px' }}>
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
