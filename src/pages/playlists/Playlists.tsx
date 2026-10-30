import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Heart, List, Activity, Plus, ListMusic } from 'lucide-react';
import { PlaylistCard } from '../../components/music/PlaylistCard';
import { MusicGrid } from '../../components/music/MusicGrid';
import { useLibrary } from '../../contexts/LibraryContext';

export const Playlists = () => {
  const navigate = useNavigate();
  const { playlists, createPlaylist } = useLibrary();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    
    setIsCreating(true);
    try {
      const p = await createPlaylist(newTitle.trim(), newDescription.trim());
      setShowCreateModal(false);
      setNewTitle('');
      setNewDescription('');
      navigate(`/playlist/${p.id}`);
    } catch (err) {
      console.error(err);
      alert('Failed to create playlist');
    } finally {
      setIsCreating(false);
    }
  };

  const systemCards = [
    { title: 'History', icon: <Clock size={32} color="var(--brand-red)" />, path: '/history', subtitle: 'Recently played' },
    { title: 'Most Played', icon: <Activity size={32} color="var(--brand-red)" />, path: '/most-played', subtitle: 'Your top tracks' },
    { title: 'Favorites', icon: <Heart size={32} color="var(--brand-red)" fill="var(--brand-red)" />, path: '/favorites', subtitle: 'Songs you love' },
    { title: 'Queue', icon: <List size={32} color="var(--brand-red)" />, path: '/queue', subtitle: 'Up next' }
  ];

  return (
    <div style={{ paddingBottom: '32px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: 'var(--text-4xl)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.5px' }}>
          Library & Playlists
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-lg)' }}>Your personal music collections</p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        marginBottom: '48px'
      }}>
        {systemCards.map((card, i) => (
          <div 
            key={i} 
            className="hover-lift"
            onClick={() => navigate(card.path)}
            style={{ 
              padding: '24px', 
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--surface-elevated)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{
              position: 'absolute',
              right: '-10%',
              bottom: '-10%',
              opacity: 0.05,
              transform: 'scale(3)'
            }}>
              {card.icon}
            </div>
            <div>{card.icon}</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 'var(--text-lg)', color: 'var(--text-primary)' }}>{card.title}</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{card.subtitle}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--text-primary)' }}>My Playlists</h2>
        <button 
          className="hover-lift"
          onClick={() => setShowCreateModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--brand-red)',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: 'var(--radius-full)',
            fontWeight: 700,
            fontSize: 'var(--text-sm)'
          }}
        >
          <Plus size={18} /> CREATE PLAYLIST
        </button>
      </div>

      {playlists.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '64px 20px', 
          backgroundColor: 'var(--surface)', 
          borderRadius: 'var(--radius-lg)',
          border: '1px dashed var(--border)'
        }}>
          <ListMusic size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>No playlists yet</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Create your first playlist to start building your collection.</p>
        </div>
      ) : (
        <MusicGrid>
          {playlists.map(playlist => (
            <PlaylistCard key={playlist.id} playlist={playlist} onClick={() => navigate(`/playlist/${playlist.id}`)} />
          ))}
        </MusicGrid>
      )}

      {showCreateModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.8)', padding: '24px'
        }}>
          <div style={{
            backgroundColor: '#1a1a1a', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '400px',
            animation: 'slideUpFade 0.2s ease-out'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginBottom: '24px' }}>Create Playlist</h2>
            <form onSubmit={handleCreatePlaylist} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px' }}>Name</label>
                <input 
                  type="text" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="My awesome playlist"
                  maxLength={60}
                  required
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: '8px', backgroundColor: '#0a0a0a',
                    border: '1px solid var(--border)', color: '#fff', fontSize: '16px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px' }}>Description (optional)</label>
                <textarea 
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Give your playlist a catchy description"
                  maxLength={200}
                  rows={3}
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: '8px', backgroundColor: '#0a0a0a',
                    border: '1px solid var(--border)', color: '#fff', fontSize: '16px', resize: 'none'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                <button 
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: '24px', backgroundColor: 'transparent', color: '#fff', border: '1px solid var(--border)', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!newTitle.trim() || isCreating}
                  style={{ flex: 1, padding: '12px', borderRadius: '24px', backgroundColor: 'var(--brand-red)', color: '#fff', fontWeight: 600, opacity: (!newTitle.trim() || isCreating) ? 0.5 : 1 }}
                >
                  {isCreating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
