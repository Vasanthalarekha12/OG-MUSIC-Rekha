import { useLibrary } from '../../contexts/LibraryContext';
import { Activity, ArrowLeft } from 'lucide-react';
import { TrackRow } from '../../components/music/TrackRow';
import { useNavigate } from 'react-router-dom';

export const MostPlayed = () => {
  const { getMostPlayed } = useLibrary();
  const navigate = useNavigate();

  const mostPlayedList = getMostPlayed().slice(0, 50); // top 50

  return (
    <div style={{ paddingBottom: '32px' }}>
      <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button 
          onClick={() => navigate('/playlists')}
          className="hover-lift"
          style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', border: 'none', cursor: 'pointer' }}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: 'var(--text-4xl)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.5px' }}>
            Most Played
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-lg)' }}>Your all-time top tracks</p>
        </div>
      </div>

      {mostPlayedList.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 20px', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border)' }}>
          <Activity size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>No data yet</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Keep listening to build your most played list.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {mostPlayedList.map((item, idx) => {
            return (
              <div key={item.song.id} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '24px', textAlign: 'center', fontWeight: 700, color: 'var(--text-muted)' }}>
                  {idx + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <TrackRow song={item.song} />
                </div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', width: '80px', textAlign: 'right', fontWeight: 600 }}>
                  {item.count} plays
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
