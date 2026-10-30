import { Users, Music, Disc, ListMusic } from 'lucide-react';

export const AdminDashboard = () => {
  const stats = [
    { label: 'Total Songs', value: '1,245', icon: <Music size={24} /> },
    { label: 'Total Albums', value: '128', icon: <Disc size={24} /> },
    { label: 'Total Artists', value: '45', icon: <Users size={24} /> },
    { label: 'Total Playlists', value: '892', icon: <ListMusic size={24} /> },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, marginBottom: '32px', color: 'var(--text-primary)' }}>
        Dashboard
      </h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        {stats.map(stat => (
          <div 
            key={stat.label}
            style={{
              backgroundColor: 'var(--surface)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: 'var(--radius-md)', 
              backgroundColor: 'var(--surface-elevated)',
              color: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {stat.icon}
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '4px' }}>
                {stat.label}
              </div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)' }}>
                {stat.value}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div style={{
        backgroundColor: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        padding: '32px',
        border: '1px solid var(--border)',
        minHeight: '300px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)'
      }}>
        Charts & Analytics placeholder
      </div>
    </div>
  );
};
