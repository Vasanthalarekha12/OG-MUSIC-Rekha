import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { musicDiscoveryService } from '../../services/musicDiscoveryService';
import { useLibrary } from '../../contexts/LibraryContext';
import { usePlayer } from '../../contexts/PlayerContext';
import { Play, Shuffle, ArrowLeft, Trash2, ListMusic } from 'lucide-react';
import { TrackRow } from '../../components/music/TrackRow';
import { Artwork } from '../../components/ui/Artwork';

export const PlaylistDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { playlists, deletePlaylist, removeTrackFromPlaylist } = useLibrary();
  const { playList, toggleShuffle, isShuffle } = usePlayer();

  const [featuredPlaylist, setFeaturedPlaylist] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    musicDiscoveryService.getFeaturedPlaylists().then(fps => {
      const fp = fps.find(p => p.id === id);
      if (fp) setFeaturedPlaylist(fp);
      setLoading(false);
    });
  }, [id]);

  const libraryPlaylist = playlists.find(p => p.id === id);
  const playlist = libraryPlaylist || featuredPlaylist;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-secondary)' }}>
        <p>Loading playlist...</p>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-secondary)' }}>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>Playlist Not Found</h2>
        <button onClick={() => navigate(-1)} style={{ color: 'var(--brand-red)' }}>Go Back</button>
      </div>
    );
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this playlist?')) {
      deletePlaylist(playlist.id);
      navigate('/playlists');
    }
  };

  const handlePlayAll = () => {
    if (playlist.songs && playlist.songs.length > 0) {
      if (isShuffle) toggleShuffle();
      playList(playlist.songs);
    }
  };

  const handleShufflePlay = () => {
    if (playlist.songs && playlist.songs.length > 0) {
      if (!isShuffle) toggleShuffle();
      playList(playlist.songs);
    }
  };

  return (
    <div style={{ paddingBottom: '32px' }}>
      <button 
        onClick={() => navigate(-1)}
        className="hover-lift"
        style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '32px', backgroundColor: 'transparent' }}
      >
        <ArrowLeft size={20} /> Back
      </button>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '32px', marginBottom: '48px' }}>
        <div style={{ width: '232px', height: '232px', flexShrink: 0, boxShadow: 'var(--shadow-xl)', backgroundColor: 'var(--surface-elevated)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {playlist.coverUrl ? (
            <Artwork src={playlist.coverUrl} alt={playlist.name || playlist.title} size="100%" radius="lg" />
          ) : (
            <ListMusic size={64} color="var(--text-muted)" />
          )}
        </div>
        <div>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Playlist
          </div>
          <h1 style={{ fontSize: 'var(--text-6xl)', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '16px', letterSpacing: '-1px' }}>
            {playlist.name || playlist.title}
          </h1>
          <p style={{ fontSize: 'var(--text-lg)', color: 'var(--text-secondary)', marginBottom: '16px', maxWidth: '600px' }}>
            {playlist.description || 'No description provided.'}
          </p>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-muted)' }}>
            Created by {playlist.userId === 'local' ? 'You' : playlist.userId} • {playlist.songs?.length || 0} songs
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
        <button 
          className="hover-lift"
          onClick={handlePlayAll}
          disabled={!playlist.songs?.length}
          style={{ 
            width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--brand-red)', color: 'white', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-brand)',
            opacity: playlist.songs?.length ? 1 : 0.5
          }}
        >
          <Play size={28} fill="currentColor" style={{ marginLeft: '4px' }} />
        </button>
        <button 
          className="hover-lift"
          onClick={handleShufflePlay}
          disabled={!playlist.songs?.length}
          style={{ padding: '16px', borderRadius: '50%', color: 'var(--text-primary)', backgroundColor: 'transparent', opacity: playlist.songs?.length ? 1 : 0.5 }}
        >
          <Shuffle size={24} />
        </button>
        <button 
          className="hover-lift"
          onClick={handleDelete}
          style={{ padding: '16px', borderRadius: '50%', color: 'var(--error)', backgroundColor: 'transparent', marginLeft: 'auto', visibility: libraryPlaylist ? 'visible' : 'hidden' }}
        >
          <Trash2 size={24} />
        </button>
      </div>

      <div>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px', color: 'var(--text-muted)', fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <div style={{ width: '32px', textAlign: 'center' }}>#</div>
          <div style={{ flex: 1, paddingLeft: '16px' }}>Title</div>
          <div style={{ width: '44px', textAlign: 'right' }}>Time</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {playlist.songs && playlist.songs.length > 0 ? (
            playlist.songs.map((song: any, idx: number) => (
              <TrackRow 
                key={`${song.id}-${idx}`}
                song={song}
                index={idx}
                onPlayOverride={() => playList(playlist.songs, idx)}
                onRemove={libraryPlaylist ? () => removeTrackFromPlaylist(playlist.id, song.id) : undefined}
              />
            ))
          ) : (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No songs in this playlist yet. Add songs from anywhere in the app!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
