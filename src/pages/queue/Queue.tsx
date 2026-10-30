import { useState } from 'react';
import { usePlayer } from '../../contexts/PlayerContext';
import { useLibrary } from '../../contexts/LibraryContext';
import { useNavigate } from 'react-router-dom';
import { TrackRow } from '../../components/music/TrackRow';
import { Trash2, Shuffle, Save, ArrowLeft } from 'lucide-react';

export const Queue = () => {
  const { currentTrack, queue, queueIndex, clearQueue, removeFromQueue, jumpToQueue, toggleShuffle, isShuffle } = usePlayer();
  const { createPlaylist, addTrackToPlaylist } = useLibrary();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);

  const upcomingTracks = queue.slice(queueIndex + 1);

  const handleSaveAsPlaylist = async () => {
    if (queue.length === 0) return;
    
    setIsSaving(true);
    try {
      const playlistName = `Queue ${new Date().toLocaleDateString()}`;
      const playlist = await createPlaylist(playlistName, 'Saved from queue');
      
      // We can't await inside a map easily with parallel writes to the same local state,
      // but in a real DB we'd batch this. Since addTrackToPlaylist handles state properly, we can loop.
      for (const item of queue) {
        await addTrackToPlaylist(playlist.id, item.song);
      }
      
      navigate(`/playlist/${playlist.id}`);
    } catch (e) {
      console.error(e);
      alert('Failed to save queue as playlist');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={() => navigate('/playlists')}
            className="hover-lift"
            style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', border: 'none', cursor: 'pointer' }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: 'var(--text-4xl)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Queue
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>{upcomingTracks.length} upcoming tracks</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button 
            className="hover-lift" 
            onClick={toggleShuffle}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isShuffle ? 'var(--brand-red)' : 'var(--text-secondary)' }}
          >
            <Shuffle size={18} />
            <span style={{ fontSize: 'var(--text-sm)' }}>Shuffle</span>
          </button>
          <button 
            className="hover-lift" 
            onClick={handleSaveAsPlaylist}
            disabled={isSaving || queue.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', opacity: (isSaving || queue.length === 0) ? 0.5 : 1 }}
          >
            <Save size={18} />
            <span style={{ fontSize: 'var(--text-sm)' }}>{isSaving ? 'Saving...' : 'Save as Playlist'}</span>
          </button>
          <button 
            className="hover-lift" 
            onClick={clearQueue}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}
          >
            <Trash2 size={18} />
            <span style={{ fontSize: 'var(--text-sm)' }}>Clear</span>
          </button>
        </div>
      </div>

      {currentTrack && (
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '16px' }}>
            Now Playing
          </h2>
          <TrackRow song={currentTrack} />
        </div>
      )}

      <div>
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
          Up Next
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {upcomingTracks.length > 0 ? upcomingTracks.map((item, index) => {
            const actualIndex = queueIndex + 1 + index;
            return (
              <TrackRow 
                key={item.id} 
                song={item.song} 
                index={index} 
                onPlayOverride={() => jumpToQueue(actualIndex)}
                onRemove={() => removeFromQueue(item.id)}
              />
            );
          }) : (
            <p style={{ color: 'var(--text-secondary)', padding: '24px 0' }}>No upcoming tracks in the queue.</p>
          )}
        </div>
      </div>
    </div>
  );
};
