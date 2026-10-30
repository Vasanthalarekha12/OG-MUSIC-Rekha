import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search as SearchIcon, X as ClearIcon } from 'lucide-react';
import { mockGenres } from '../../constants/mockData';
import { TrackRow } from '../../components/music/TrackRow';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Artwork } from '../../components/ui/Artwork';
import { usePlayer } from '../../contexts/PlayerContext';
import { useYouTubeSearch } from '../../services/youtube/youtubeHooks';
import { musicDiscoveryService } from '../../services/musicDiscoveryService';
import type { Song, Artist, Album } from '../../types';

export const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const focusParam = searchParams.get('focus') === 'true';
  const [localQuery, setLocalQuery] = useState(query);
  const inputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'ALL' | 'SONGS' | 'ARTISTS' | 'ALBUMS' | 'PLAYLISTS' | 'YOUTUBE'>('ALL');
  const { playList } = usePlayer();
  const ytSearch = useYouTubeSearch(query);
  
  const [results, setResults] = useState<Song[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = localStorage.getItem('og_music_recent_searches');
    return saved ? JSON.parse(saved) : ['AR Rahman', 'Anirudh', 'Devara', 'RRR'];
  });

  const saveRecentSearch = (q: string) => {
    if (!q.trim()) return;
    setRecentSearches(prev => {
      const updated = [q, ...prev.filter(item => item !== q)].slice(0, 8);
      localStorage.setItem('og_music_recent_searches', JSON.stringify(updated));
      return updated;
    });
  };

  const handleTagClick = (tag: string) => {
    setLocalQuery(tag);
    setSearchParams({ q: tag });
  };

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('og_music_recent_searches');
  };

  const removeRecent = (tag: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches(prev => {
      const updated = prev.filter(t => t !== tag);
      localStorage.setItem('og_music_recent_searches', JSON.stringify(updated));
      return updated;
    });
  };

  // Sync external search param changes (e.g. tag clicks, header search, navigation)
  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  // Autofocus when navigated with ?focus=true
  useEffect(() => {
    if (focusParam && inputRef.current) {
      inputRef.current.focus();
    }
  }, [focusParam]);

  // Debounced URL sync when user types directly in the input
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = localQuery.trim();
      if (trimmed !== query) {
        if (trimmed) {
          setSearchParams({ q: trimmed }, { replace: true });
        } else if (query) {
          setSearchParams({}, { replace: true });
        }
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localQuery, query, setSearchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalQuery(e.target.value);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const trimmed = localQuery.trim();
      if (trimmed) {
        setSearchParams({ q: trimmed }, { replace: true });
        saveRecentSearch(trimmed);
      }
    }
  };

  const handleClear = () => {
    setLocalQuery('');
    setSearchParams({}, { replace: true });
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setResults([]);
        setArtists([]);
        setAlbums([]);
        return;
      }
      try {
        const [tracksRes, artistsRes, albumsRes] = await Promise.all([
          musicDiscoveryService.searchTracks(query),
          musicDiscoveryService.searchArtists(query),
          musicDiscoveryService.searchAlbums(query)
        ]);

        setResults(tracksRes.items);
        setArtists(artistsRes);
        setAlbums(albumsRes);
      } catch (e) {
        console.error('Search error', e);
      }
    };

    const delayTimer = setTimeout(fetchResults, 300);
    return () => clearTimeout(delayTimer);
  }, [query]);

  // Save to recent searches when query changes and results exist
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) saveRecentSearch(query.trim());
    }, 1500);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div style={{ paddingBottom: '32px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: 'var(--text-4xl)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.5px' }}>
          Search
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-lg)' }}>Find your favorite songs, artists, and soundtrack albums.</p>
      </div>

      {/* Editable search input bar for mobile and desktop */}
      <div style={{ position: 'relative', width: '100%', maxWidth: '640px', marginBottom: '28px' }}>
        <div
          style={{
            position: 'absolute',
            left: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            pointerEvents: 'none',
            color: 'var(--brand-red, #ff1616)',
            zIndex: 1
          }}
        >
          <SearchIcon size={20} />
        </div>
        <input
          id="search-page-input"
          ref={inputRef}
          type="search"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          value={localQuery}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          placeholder="Search songs, artists, albums..."
          aria-label="Search songs, artists, and soundtrack albums"
          style={{
            width: '100%',
            backgroundColor: 'var(--surface-elevated, #161618)',
            border: '1px solid var(--border, rgba(255, 255, 255, 0.12))',
            borderRadius: 'var(--radius-full, 9999px)',
            padding: '14px 44px 14px 48px',
            color: 'var(--text-primary, #ffffff)',
            fontSize: '16px', /* 16px prevents iOS Safari from auto-zooming viewport */
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            WebkitAppearance: 'none'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--brand-red, #dc2626)';
            e.target.style.boxShadow = '0 0 0 3px rgba(220, 38, 38, 0.25)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--border, rgba(255, 255, 255, 0.12))';
            e.target.style.boxShadow = 'none';
          }}
        />
        {localQuery && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search input"
            style={{
              position: 'absolute',
              right: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(255, 255, 255, 0.12)',
              border: 'none',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary, #a1a1a1)',
              cursor: 'pointer',
              padding: 0
            }}
          >
            <ClearIcon size={14} />
          </button>
        )}
      </div>

      <div style={{ width: '100%', alignSelf: 'flex-start' }}>
        {query ? (
          <>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
              Search Results for "{query}"
            </h2>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--border)', overflowX: 'auto', paddingBottom: '2px' }} className="no-scrollbar">
              {(['ALL', 'SONGS', 'ARTISTS', 'ALBUMS', 'PLAYLISTS', 'YOUTUBE'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderBottom: activeTab === tab ? '2px solid var(--brand-red)' : '2px solid transparent',
                    color: activeTab === tab ? 'var(--brand-red)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {(activeTab === 'ALL' || activeTab === 'SONGS') && results.length > 0 && (
              <>
                {activeTab === 'ALL' && (
                  <div style={{ marginBottom: '32px' }}>
                    <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>Top Result</h3>
                    <div 
                      className="hover-lift"
                      onClick={() => playList(results, 0, { type: 'search', id: query, label: `Search: ${query}` })}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '24px',
                        padding: '24px',
                        backgroundColor: 'var(--surface-elevated)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--border)',
                        cursor: 'pointer',
                        width: 'fit-content',
                        minWidth: '300px'
                      }}
                    >
                      <Artwork src={results[0].coverUrl} alt={results[0].title} size={96} radius="md" />
                      <div>
                        <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>{results[0].title}</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-lg)' }}>Song • {results[0].artistName}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>Songs</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {(activeTab === 'ALL' ? results.slice(1, 10) : results).map((song, index) => (
                      <TrackRow 
                        key={song.id} 
                        song={song} 
                        index={activeTab === 'ALL' ? index + 1 : index} 
                        onPlayOverride={() => playList(results, activeTab === 'ALL' ? index + 1 : index, { type: 'search', id: query, label: `Search: ${query}` })}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            {(activeTab === 'ALL' || activeTab === 'YOUTUBE') && (
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
                  {results.length > 0 ? 'More from YouTube' : 'YouTube Results'}
                </h3>
                {ytSearch.loading ? (
                  <p style={{ color: 'var(--text-secondary)' }}>Loading YouTube results...</p>
                ) : ytSearch.error ? (
                  <p style={{ color: 'var(--error)' }}>{ytSearch.error}</p>
                ) : ytSearch.data.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {ytSearch.data.map((song, index) => (
                      <TrackRow 
                        key={`yt-${song.id}`} 
                        song={song} 
                        index={index} 
                        onPlayOverride={() => playList(ytSearch.data, index)}
                      />
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-secondary)' }}>No YouTube results found.</p>
                )}
              </div>
            )}

            {(activeTab === 'ALL' || activeTab === 'ARTISTS') && (
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>Artists</h3>
                {artists.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
                    {artists.map(artist => (
                      <div key={artist.id} onClick={() => navigate(`/artist/${artist.id}`)} style={{ cursor: 'pointer', textAlign: 'center' }} className="hover-lift">
                        <div style={{ width: '120px', height: '120px', margin: '0 auto 8px', borderRadius: '50%', overflow: 'hidden' }}>
                          <Artwork src={artist.imageUrl} alt={artist.name} radius="full" fallbackType="artist" />
                        </div>
                        <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{artist.name}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-secondary)' }}>No artists found.</p>
                )}
              </div>
            )}

            {(activeTab === 'ALL' || activeTab === 'ALBUMS') && (
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>Soundtrack Albums</h3>
                {albums.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
                    {albums.map(album => (
                      <div key={album.id} onClick={() => navigate(`/album/${album.id}`)} style={{ cursor: 'pointer' }} className="card-scale">
                        <div style={{ width: '100%', aspectRatio: '1', borderRadius: '8px', overflow: 'hidden', marginBottom: '8px' }}>
                          <Artwork src={album.coverUrl} alt={album.title} radius="md" />
                        </div>
                        <p style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{album.title}</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{album.artistName} {album.releaseYear ? `• ${album.releaseYear}` : ''}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-secondary)' }}>No soundtrack albums found.</p>
                )}
              </div>
            )}

            {(activeTab === 'ALL' || activeTab === 'PLAYLISTS') && (
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>Playlists</h3>
                <p style={{ color: 'var(--text-secondary)' }}>No playlists matching your query.</p>
              </div>
            )}

          </>
        ) : (
          <>
            {recentSearches.length > 0 && (
              <div style={{ marginBottom: '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Recent Searches
                  </h2>
                  <button onClick={clearRecent} style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>Clear all</button>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {recentSearches.map(tag => (
                    <div 
                      key={tag}
                      onClick={() => handleTagClick(tag)}
                      className="hover-lift"
                      style={{
                        padding: '8px 16px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'var(--surface-elevated)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)',
                        fontSize: 'var(--text-sm)',
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      {tag}
                      <button onClick={(e) => removeRecent(tag, e)} style={{ padding: '4px', margin: '-4px', color: 'var(--text-muted)' }}>&times;</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginBottom: '40px' }}>
              <SectionHeader title="Trending Soundtracks & Searches" />
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {['Devara', 'RRR', 'Pushpa 2', 'Kalki 2898 AD', 'Anirudh', 'A.R. Rahman', 'Sid Sriram', 'Interstellar'].map(tag => (
                  <button 
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    className="hover-lift"
                    style={{
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'transparent',
                      border: '1px solid var(--border)',
                      color: 'var(--brand-red)',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 600
                    }}
                  >
                    # {tag}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '40px' }}>
              <SectionHeader title="Genres & Languages" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                {mockGenres.map((genre, index) => {
                  const gradients = [
                    '#8b0000', '#006400', '#00008b', '#d2691e', '#4b0082', '#2f4f4f', '#6200EA', '#D50000'
                  ];
                  const bg = gradients[index % gradients.length];
                  return (
                    <div 
                      key={genre.id}
                      className="hover-lift"
                      onClick={() => navigate(`/genre/${genre.id}`)}
                      style={{
                        height: '100px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: bg,
                        display: 'flex',
                        alignItems: 'flex-end',
                        padding: '16px',
                        cursor: 'pointer',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      <span style={{ color: '#fff', fontWeight: 800, fontSize: 'var(--text-lg)', zIndex: 1 }}>{genre.name}</span>
                      <div style={{ position: 'absolute', right: '-10%', bottom: '-10%', width: '60px', height: '60px', backgroundColor: '#fff', opacity: 0.1, transform: 'rotate(25deg)' }} />
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
