import { useState } from 'react';
import { X, Plus, Music } from 'lucide-react';
import { useLibrary } from '../../contexts/LibraryContext';
import type { Song } from '../../types';

interface AddToPlaylistModalProps {
  song: Song | null;
  onClose: () => void;
}

export const AddToPlaylistModal = ({ song, onClose }: AddToPlaylistModalProps) => {
  const { playlists, createPlaylist, addSongToPlaylist } = useLibrary();
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  if (!song) return null;

  const handleCreateAndAdd = async () => {
    if (!newPlaylistName.trim()) return;
    setIsCreating(true);
    try {
      const newPlaylist = await createPlaylist(newPlaylistName.trim(), 'Created by you');
      await addSongToPlaylist(newPlaylist.id, song);
      setNewPlaylistName('');
      onClose();
    } catch (e) {
      console.error(e);
      alert('Failed to create playlist');
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddToExisting = async (playlistId: string) => {
    try {
      await addSongToPlaylist(playlistId, song);
      onClose();
    } catch (e) {
      console.error(e);
      alert('Failed to add to playlist');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      animation: 'fadeIn 0.2s ease'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '400px',
        border: '1px solid var(--border)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Add to Playlist</h3>
          <button className="hover-lift" onClick={onClose} style={{ color: 'var(--text-secondary)' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '400px', overflowY: 'auto' }} className="no-scrollbar">
          {isCreating ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input 
                type="text" 
                autoFocus
                placeholder="New Playlist Name" 
                value={newPlaylistName}
                onChange={e => setNewPlaylistName(e.target.value)}
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--brand-red)',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setIsCreating(false)} style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--surface)', color: 'var(--text-primary)', fontWeight: 600 }}>Cancel</button>
                <button onClick={handleCreateAndAdd} disabled={!newPlaylistName.trim()} style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--brand-red)', color: '#fff', fontWeight: 600, opacity: !newPlaylistName.trim() ? 0.5 : 1 }}>Create</button>
              </div>
            </div>
          ) : (
            <button 
              className="hover-lift"
              onClick={() => setIsCreating(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                backgroundColor: 'var(--surface)',
                border: '1px dashed var(--border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontWeight: 600,
                textAlign: 'left'
              }}
            >
              <div style={{ backgroundColor: 'var(--surface-elevated)', padding: '8px', borderRadius: 'var(--radius-sm)' }}>
                <Plus size={20} />
              </div>
              Create New Playlist
            </button>
          )}

          {!isCreating && playlists.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>
                Your Playlists
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {playlists.map(playlist => (
                  <button
                    key={playlist.id}
                    className="hover-lift"
                    onClick={() => handleAddToExisting(playlist.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      textAlign: 'left',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--surface)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {playlist.coverUrl ? (
                        <img src={playlist.coverUrl} alt={playlist.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                      ) : (
                        <Music size={20} color="var(--text-muted)" />
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{playlist.name}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{playlist.songs.length} songs</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
