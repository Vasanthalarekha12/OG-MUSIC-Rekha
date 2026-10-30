import { useState, useEffect, useRef } from 'react';
import { Search, Play, AlertCircle, Video, ArrowLeft, Headphones, Heart, Share2, ExternalLink, Sparkles, Check } from 'lucide-react';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { YOUTUBE_API_KEY } from '../../services/youtube/youtubeApi';
import { youtubeService } from '../../services/youtube/youtubeService';
import { useYouTubeTrending, useYouTubeSearch } from '../../services/youtube/youtubeHooks';
import type { Song } from '../../types';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import ReactYouTube from 'react-youtube';

import { usePlayer } from '../../contexts/PlayerContext';
import { useLibrary } from '../../contexts/LibraryContext';
import { fullTrackResolver } from '../../services/audio/fullTrackResolver';
import './YouTube.css';

const isValidYouTubeId = (id: string | null): boolean => Boolean(id && /^[a-zA-Z0-9_-]{11}$/.test(id));

export const YouTubePage = () => {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  
  const { currentTrack, pause, play } = usePlayer();
  const { isFavorite, toggleFavorite } = useLibrary();
  const trending = useYouTubeTrending('IN', 24);
  const searchResults = useYouTubeSearch(submittedQuery, 24);
  
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const videoId = searchParams.get('v');
  const queryParam = searchParams.get('q');
  const rawTime = searchParams.get('t') || (location.state?.timestamp != null ? String(location.state.timestamp) : '0');
  const targetTimestamp = Math.max(0, parseFloat(rawTime) || 0);

  const [activeVideo, setActiveVideo] = useState<Song | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const hasSoughtRef = useRef<boolean>(false);

  // Auto-search if queryParam provided from audio switch
  useEffect(() => {
    if (queryParam && !videoId) {
      setQuery(queryParam);
      setSubmittedQuery(queryParam);
    }
  }, [queryParam, videoId]);

  // When search returns for an audio transition, auto-play the best matching video at the timestamp
  useEffect(() => {
    if (!videoId && queryParam && searchResults.data.length > 0) {
      const topMatch = searchResults.data[0];
      navigate(`/youtube?v=${encodeURIComponent(topMatch.id)}&t=${targetTimestamp}`, {
        replace: true,
        state: { video: topMatch, timestamp: targetTimestamp }
      });
    }
  }, [videoId, queryParam, searchResults.data, targetTimestamp, navigate]);

  // Fallback: If videoId is an internal ID (e.g. soundtrack-track-xxx) rather than an 11-char YouTube ID, resolve it!
  useEffect(() => {
    if (!videoId) return;
    if (isValidYouTubeId(videoId)) return;

    let isCancelled = false;
    setIsResolving(true);

    const candidateTrack = location.state?.video || location.state?.track || (currentTrack?.id === videoId ? currentTrack : currentTrack);

    if (candidateTrack?.youtubeId && isValidYouTubeId(candidateTrack.youtubeId)) {
      navigate(`/youtube?v=${encodeURIComponent(candidateTrack.youtubeId)}&t=${targetTimestamp}`, {
        replace: true,
        state: { video: candidateTrack, timestamp: targetTimestamp }
      });
      return;
    }

    if (candidateTrack && (candidateTrack.title || candidateTrack.artistName)) {
      fullTrackResolver.resolveFullTrack(candidateTrack).then((resolvedId) => {
        if (!isCancelled && resolvedId && isValidYouTubeId(resolvedId)) {
          navigate(`/youtube?v=${encodeURIComponent(resolvedId)}&t=${targetTimestamp}`, {
            replace: true,
            state: { video: { ...candidateTrack, youtubeId: resolvedId }, timestamp: targetTimestamp }
          });
        } else if (!isCancelled) {
          setIsResolving(false);
          setQuery(`${candidateTrack.title} ${candidateTrack.artistName}`);
          setSubmittedQuery(`${candidateTrack.title} ${candidateTrack.artistName}`);
        }
      }).catch(() => {
        if (!isCancelled) setIsResolving(false);
      });
    } else {
      setIsResolving(false);
      navigate('/youtube', { replace: true });
    }

    return () => { isCancelled = true; };
  }, [videoId, location.state, currentTrack, targetTimestamp, navigate]);

  useEffect(() => {
    let isCancelled = false;
    hasSoughtRef.current = false;
    if (videoId && isValidYouTubeId(videoId)) {
      pause(); // Ensure background audio engine pauses so video audio is exclusive
      if (location.state?.video) {
        setActiveVideo(location.state.video);
      } else if (location.state?.track) {
        setActiveVideo(location.state.track);
      } else if (currentTrack?.youtubeId === videoId || currentTrack?.id === videoId) {
        setActiveVideo(currentTrack);
      } else {
        const found = trending.data.find(v => v.id === videoId) || searchResults.data.find(v => v.id === videoId);
        if (found) {
          setActiveVideo(found);
        } else {
          youtubeService.getVideoDetails(videoId).then((details: Song | null) => {
            if (!isCancelled && details) {
              setActiveVideo(details);
            }
          });
        }
      }
    } else if (!videoId) {
      setActiveVideo(null);
    }
    return () => { isCancelled = true; };
  }, [videoId, location.state, currentTrack, trending.data, searchResults.data, pause]);

  const handleVideoClick = (video: Song) => {
    pause();
    setActiveVideo(video);
    navigate(`/youtube?v=${video.id}`, { state: { video } });
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleShare = () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    } catch (e) {}
  };

  const handleSwitchToAudio = () => {
    if (!activeVideo) return;
    play(activeVideo);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !YOUTUBE_API_KEY) return;
    setSubmittedQuery(query.trim() + ' music');
    if (videoId) {
      navigate('/youtube');
    }
  };

  if (!YOUTUBE_API_KEY) {
    return (
      <div style={{ paddingBottom: '32px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: 'var(--text-4xl)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.5px' }}>
            YouTube Music
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-lg)' }}>Discover and play videos directly from YouTube</p>
        </div>

        <div style={{ 
          padding: '48px', 
          backgroundColor: 'var(--surface)', 
          borderRadius: 'var(--radius-lg)', 
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(255,22,22,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
            <AlertCircle size={32} color="var(--brand-red)" />
          </div>
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>
            YouTube API Key Required
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-lg)', maxWidth: '500px', marginBottom: '32px', lineHeight: 1.6 }}>
            To enable YouTube discovery, you need to configure an official YouTube Data API v3 key in your environment variables.
          </p>
          <div style={{ textAlign: 'left', backgroundColor: 'var(--bg-primary)', padding: '24px', borderRadius: 'var(--radius-md)', width: '100%', maxWidth: '500px', border: '1px solid var(--border)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginBottom: '12px', fontWeight: 600 }}>1. Create an .env.local file in the project root</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginBottom: '12px', fontWeight: 600 }}>2. Add the following line:</p>
            <code style={{ display: 'block', padding: '16px', backgroundColor: 'var(--surface-elevated)', borderRadius: 'var(--radius-sm)', color: 'var(--brand-red)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>
              VITE_YOUTUBE_API_KEY=your_api_key_here
            </code>
          </div>
        </div>
      </div>
    );
  }

  const renderVideoGrid = (videos: Song[]) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
      {videos.map((video, idx) => (
        <div 
          key={`${video.id}-${idx}`}
          onClick={() => handleVideoClick(video)}
          className="hover-lift"
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '12px',
            backgroundColor: 'var(--surface)',
            padding: '16px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            cursor: 'pointer'
          }}
        >
          <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <img src={video.coverUrl} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s ease' }} className="play-overlay">
              <Play size={48} color="#fff" fill="#fff" />
            </div>
          </div>
          <div>
            <h3 style={{ color: 'var(--text-primary)', fontSize: 'var(--text-base)', fontWeight: 700, margin: '0 0 4px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} dangerouslySetInnerHTML={{ __html: video.title }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: 0 }}>
              {video.artistName}
            </p>
          </div>
        </div>
      ))}
    </div>
  );

  const recommendedVideos = searchResults.data.length > 0 ? searchResults.data : trending.data;

  if (videoId) {
    const isFav = activeVideo ? isFavorite(activeVideo.id) : false;

    return (
      <div className="youtube-page-root">
        {/* Navigation & Search Bar */}
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={() => navigate('/youtube')}
            className="hover-lift"
            title="Back to YouTube Discovery"
            aria-label="Back to YouTube Discovery"
            style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'var(--surface, #141418)', border: '1px solid var(--border, rgba(255,255,255,0.08))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary, #fff)', cursor: 'pointer', flexShrink: 0 }}
          >
            <ArrowLeft size={20} />
          </button>
          
          <form onSubmit={handleSearch} style={{ position: 'relative', width: '100%', maxWidth: '640px' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted, #888)' }} />
            <input 
              type="text" 
              placeholder="Search YouTube songs, artists, videos..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 18px 12px 46px',
                borderRadius: '9999px',
                backgroundColor: 'var(--surface, #141418)',
                border: `1px solid ${query ? 'var(--brand-red, #dc2626)' : 'var(--border, rgba(255,255,255,0.08))'}`,
                color: 'var(--text-primary, #fff)',
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box',
              }}
            />
          </form>
        </div>

        {/* Watch Grid: Player Column (Left) + Up Next (Right) */}
        <div className="youtube-watch-grid">
          {/* Primary Column */}
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {/* 16:9 Responsive Player Box */}
            <div className="youtube-player-container">
              {isValidYouTubeId(videoId) ? (
                <ReactYouTube 
                  videoId={videoId!} 
                  opts={{
                    height: '100%',
                    width: '100%',
                    playerVars: { 
                      autoplay: 1, 
                      modestbranding: 1, 
                      rel: 0,
                      playsinline: 1,
                      start: Math.floor(targetTimestamp),
                    }
                  }}
                  onReady={(e) => {
                    ytPlayerRef.current = e.target;
                    if (targetTimestamp > 0 && !hasSoughtRef.current) {
                      hasSoughtRef.current = true;
                      try {
                        e.target.seekTo(targetTimestamp, true);
                      } catch (err) {}
                    }
                    e.target.playVideo();
                  }}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                  className="youtube-container"
                />
              ) : (
                <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', color: 'var(--text-secondary)' }}>
                  <div style={{ width: '40px', height: '40px', border: '3px solid rgba(220,38,38,0.2)', borderTopColor: 'var(--brand-red)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary, #fff)' }}>
                    {isResolving ? 'Resolving Official HD Music Video...' : 'Loading Official HD Music Video...'}
                  </p>
                </div>
              )}
            </div>

            {/* Video Details Card */}
            {activeVideo && (
              <div className="youtube-details-card">
                <h1 className="youtube-details-title" dangerouslySetInnerHTML={{ __html: activeVideo.title }} />
                
                <div className="youtube-channel-row">
                  <div className="youtube-channel-info">
                    <div className="youtube-channel-avatar">
                      {activeVideo.artistName ? activeVideo.artistName.charAt(0).toUpperCase() : 'V'}
                    </div>
                    <div className="youtube-channel-text">
                      <p className="youtube-channel-name">{activeVideo.artistName || 'Official Channel'}</p>
                      <span className="youtube-channel-badge">
                        <Check size={12} strokeWidth={3} /> Official Video • 1080p HD
                      </span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="youtube-actions-bar">
                    <button 
                      type="button"
                      onClick={handleSwitchToAudio}
                      className="youtube-action-btn primary"
                      title="Switch to background audio player"
                    >
                      <Headphones size={15} /> Audio Mode
                    </button>
                    <button 
                      type="button"
                      onClick={() => toggleFavorite(activeVideo)}
                      className={`youtube-action-btn ${isFav ? 'active' : ''}`}
                      title={isFav ? "Remove from Favorites" : "Save to Favorites"}
                    >
                      <Heart size={15} fill={isFav ? "var(--brand-red, #dc2626)" : "none"} /> {isFav ? 'Liked' : 'Like'}
                    </button>
                    <button 
                      type="button"
                      onClick={handleShare}
                      className="youtube-action-btn"
                      title="Share link"
                    >
                      <Share2 size={15} /> {copiedLink ? 'Copied!' : 'Share'}
                    </button>
                    <button 
                      type="button"
                      onClick={() => window.open(`https://youtube.com/watch?v=${videoId}`, '_blank')}
                      className="youtube-action-btn"
                      title="Open on official YouTube site"
                    >
                      <ExternalLink size={15} /> YouTube
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Secondary Column: Up Next */}
          <div className="youtube-upnext-panel">
            <div className="youtube-upnext-header">
              <h2 className="youtube-upnext-title">
                <Sparkles size={18} color="var(--brand-red, #dc2626)" /> Up Next
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted, #888)', fontWeight: 600 }}>
                {recommendedVideos.filter(v => v.id !== videoId).length} tracks
              </span>
            </div>

            <div className="youtube-upnext-list">
              {recommendedVideos.filter(v => v.id !== videoId).map((video, idx) => (
                <div 
                  key={`upnext-${video.id}-${idx}`}
                  onClick={() => handleVideoClick(video)}
                  className="youtube-upnext-card"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleVideoClick(video); }}
                >
                  <div className="youtube-upnext-thumb">
                    <img src={video.coverUrl} alt={video.title} loading="lazy" />
                    <div className="youtube-upnext-play-overlay">
                      <Play size={24} color="#ffffff" fill="#ffffff" />
                    </div>
                  </div>
                  <div className="youtube-upnext-content">
                    <h3 className="youtube-upnext-item-title" dangerouslySetInnerHTML={{ __html: video.title }} />
                    <p className="youtube-upnext-item-channel">{video.artistName}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '32px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: 'var(--text-4xl)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Video size={36} color="var(--brand-red)" /> YouTube
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-lg)' }}>Search official music videos</p>
      </div>

      <form onSubmit={handleSearch} style={{ position: 'relative', width: '100%', maxWidth: '600px', marginBottom: '40px' }}>
        <Search size={24} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input 
          type="text" 
          placeholder="Search YouTube..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '20px 20px 20px 60px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--surface)',
            border: `1px solid ${query ? 'var(--brand-red)' : 'var(--border)'}`,
            color: 'var(--text-primary)',
            fontSize: 'var(--text-lg)',
            outline: 'none',
            boxShadow: query ? '0 0 0 1px var(--brand-red)' : 'var(--shadow-md)',
            transition: 'all 0.2s ease',
          }}
        />
      </form>

      {searchResults.loading && (
        <div style={{ padding: '48px', textAlign: 'center' }}>
          <div className="loading-spinner" style={{ width: '40px', height: '40px', border: '3px solid rgba(255,22,22,0.2)', borderTopColor: 'var(--brand-red)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Searching YouTube...</p>
        </div>
      )}
      
      {searchResults.error && (
        <div style={{ padding: '24px', backgroundColor: 'rgba(255,22,22,0.1)', border: '1px solid var(--brand-red)', borderRadius: 'var(--radius-md)', color: 'var(--brand-red)', marginBottom: '24px' }}>
          {searchResults.error}
        </div>
      )}

      {searchResults.data.length > 0 && !searchResults.loading && (
        <div style={{ marginBottom: '48px' }}>
          <SectionHeader title="Search Results" />
          {renderVideoGrid(searchResults.data)}
        </div>
      )}

      {searchResults.data.length === 0 && !searchResults.loading && trending.data.length > 0 && (
        <div>
          <SectionHeader title="Trending in Music" />
          {renderVideoGrid(trending.data)}
        </div>
      )}
    </div>
  );
};
export const YouTube = YouTubePage;
