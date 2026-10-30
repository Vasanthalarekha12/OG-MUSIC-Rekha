import { Link, useLocation } from 'react-router-dom';
import { Home, Music, Disc, Mic2, Grid, ListMusic, Video, Image, Users, Database, Settings } from 'lucide-react';

const adminNavItems = [
  { label: 'Dashboard', path: '/admin', icon: <Home size={20} /> },
  { label: 'Songs', path: '/admin/songs', icon: <Music size={20} /> },
  { label: 'Albums', path: '/admin/albums', icon: <Disc size={20} /> },
  { label: 'Artists', path: '/admin/artists', icon: <Mic2 size={20} /> },
  { label: 'Genres', path: '/admin/genres', icon: <Grid size={20} /> },
  { label: 'Playlists', path: '/admin/playlists', icon: <ListMusic size={20} /> },
  { label: 'Videos', path: '/admin/videos', icon: <Video size={20} /> },
  { label: 'Banners', path: '/admin/banners', icon: <Image size={20} /> },
  { label: 'Users', path: '/admin/users', icon: <Users size={20} /> },
  { label: 'Media', path: '/admin/media', icon: <Database size={20} /> },
  { label: 'Settings', path: '/admin/settings', icon: <Settings size={20} /> },
];

export const AdminSidebar = () => {
  const location = useLocation();

  return (
    <aside
      style={{
        width: '260px',
        height: '100vh',
        backgroundColor: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 16px',
        overflowY: 'auto',
      }}
    >
      <div style={{ marginBottom: '32px', paddingLeft: '8px' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '1px', color: 'var(--text-primary)' }}>
          ADMIN PANEL
        </h1>
      </div>

      <div style={{ flex: 1 }}>
        {adminNavItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 16px',
                borderRadius: 'var(--radius-md)',
                color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'var(--accent-glow)' : 'transparent',
                transition: 'all var(--transition-fast)',
                textDecoration: 'none',
                fontWeight: isActive ? 600 : 500,
                marginBottom: '4px',
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
};
