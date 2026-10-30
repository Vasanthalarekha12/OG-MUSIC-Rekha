import { useLibrary } from '../../contexts/LibraryContext';
import { usePlayer } from '../../contexts/PlayerContext';
import { Clock, Play, Trash2, Heart, Plus, ArrowLeft } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import type { HistoryItem } from '../../contexts/LibraryContext';
import { useNavigate } from 'react-router-dom';
export const History = () => {
  const { history, clearHistory, removeFromHistory, toggleFavorite, isFavorite } = useLibrary();
  const { playNext, playList } = usePlayer();
  const navigate = useNavigate();

  // Group by date
  const groupedHistory = history.reduce((acc: Record<string, HistoryItem[]>, item) => {
    const date = new Date(item.playedAt);
    let label = '';
    
    if (isToday(date)) {
      label = 'TODAY';
    } else if (isYesterday(date)) {
      label = 'YESTERDAY';
    } else {
      label = format(date, 'MMMM d, yyyy');
    }
    
    if (!acc[label]) acc[label] = [];
    acc[label].push(item);
    return acc;
  }, {});

  return (
    <div style={{ paddingBottom: '32px' }}>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={() => navigate('/playlists')}
            className="hover-lift"
            style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', border: 'none', cursor: 'pointer' }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: 'var(--text-4xl)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.5px' }}>
              Listening History
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-lg)' }}>Tracks you've played recently</p>
          </div>
        </div>
        {history.length > 0 && (
          <button 
            className="hover-lift"
            onClick={clearHistory}
            style={{ 
              padding: '8px 16px', 
              borderRadius: 'var(--radius-full)', 
              backgroundColor: 'transparent', 
              border: '1px solid var(--border)', 
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Trash2 size={16} /> CLEAR HISTORY
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 20px', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border)' }}>
          <Clock size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>No history yet</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Start playing some music to see it here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {Object.entries(groupedHistory).map(([label, items]) => (
            <section key={label}>
              <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '16px', letterSpacing: '0.1em' }}>
                {label}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {items.map((item, idx) => {
                  const fav = isFavorite(item.song.id);
                  return (
                    <div 
                      key={`${item.playedAt}-${idx}`}
                      className="hover-lift"
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '16px', 
                        padding: '12px 16px', 
                        backgroundColor: 'var(--surface)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid transparent',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--surface-hover)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--surface)'}
                    >
                      <img src={item.song.coverUrl} alt={item.song.title} style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.song.title}</div>
                        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.song.artistName}</div>
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', width: '60px', textAlign: 'right' }}>
                        {format(new Date(item.playedAt), 'h:mm a')}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button onClick={() => toggleFavorite(item.song)} style={{ padding: '8px', color: fav ? 'var(--brand-red)' : 'var(--text-secondary)' }}>
                          <Heart size={18} fill={fav ? 'currentColor' : 'none'} />
                        </button>
                        <button onClick={() => playNext(item.song)} title="Play Next" style={{ padding: '8px', color: 'var(--text-secondary)' }}>
                          <Plus size={18} />
                        </button>
                        <button onClick={() => {
                          const historySongs = history.map(h => h.song);
                          const idx = history.findIndex(h => h.playedAt === item.playedAt);
                          playList(historySongs, idx >= 0 ? idx : 0, { type: 'history', id: 'history', label: 'History' });
                        }} style={{ padding: '8px', color: 'var(--text-primary)', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}>
                          <Play size={18} fill="currentColor" />
                        </button>
                        <button onClick={() => removeFromHistory(item.playedAt)} title="Remove" style={{ padding: '8px', color: 'var(--text-muted)' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};
