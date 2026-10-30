import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, Compass, Disc, Mic2, Grid, ListMusic, Heart, Clock, List, Video, Settings, LogIn, Users } from 'lucide-react';
import { BrandLogo } from '../ui/BrandLogo';
import { useAuth } from '../../contexts/AuthContext';

const discoverNav = [
  { label: 'Home', path: '/home', icon: <Home size={20} /> },
  { label: 'Search', path: '/search', icon: <Search size={20} /> },
  { label: 'Explore', path: '/explore', icon: <Compass size={20} /> },
  { label: 'Albums', path: '/albums', icon: <Disc size={20} /> },
  { label: 'Artists', path: '/artists', icon: <Mic2 size={20} /> },
  { label: 'Genres', path: '/genres', icon: <Grid size={20} /> },
  { label: 'Playlists', path: '/playlists', icon: <ListMusic size={20} /> },
];

const libraryNav = [
  { label: 'Friends', path: '/friends', icon: <Users size={20} /> },
  { label: 'Favorites', path: '/favorites', icon: <Heart size={20} /> },
  { label: 'History', path: '/history', icon: <Clock size={20} /> },
  { label: 'Queue', path: '/queue', icon: <List size={20} /> },
  { label: 'YouTube', path: '/youtube', icon: <Video size={20} /> },
];

const systemNav = [
  { label: 'Settings', path: '/settings', icon: <Settings size={20} /> },
];

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const renderNavGroup = (title: string, items: typeof discoverNav) => (
    <div style={{ marginBottom: '28px' }}>
      <h3 style={{ 
        padding: '0 16px', 
        fontSize: 'var(--text-xs)', 
        fontWeight: 700, 
        color: 'var(--text-muted)', 
        textTransform: 'uppercase', 
        letterSpacing: '0.1em',
        marginBottom: '10px'
      }}>
        {title}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {items.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '11px 16px',
                borderRadius: 'var(--radius-md)',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'var(--surface-active)' : 'transparent',
                textDecoration: 'none',
                fontWeight: isActive ? 600 : 500,
                position: 'relative',
                transition: 'all var(--transition-fast)'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = 'var(--text-primary)';
                  e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {isActive && (
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: '20%',
                  bottom: '20%',
                  width: '3px',
                  backgroundColor: 'var(--brand-red)',
                  borderRadius: '0 4px 4px 0',
                  boxShadow: '0 0 8px var(--brand-red-glow)'
                }} />
              )}
              <span style={{ color: isActive ? 'var(--brand-red)' : 'inherit', display: 'flex' }}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );

  return (
    <aside 
      style={{
        width: 'var(--sidebar-width)',
        backgroundColor: 'var(--bg-primary)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '20px 16px',
        overflowY: 'auto',
      }}
      className="no-scrollbar"
    >
      <div style={{ marginBottom: '32px', paddingLeft: '8px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <BrandLogo size="lg" linkHome />
        <div style={{ 
          fontSize: '10px', 
          fontWeight: 700, 
          letterSpacing: '2px', 
          color: 'var(--text-muted)', 
          marginTop: '6px', 
          textTransform: 'uppercase' 
        }}>
          Cinematic Sound System
        </div>
      </div>

      <div style={{ flex: 1 }}>
        {renderNavGroup('Discover', discoverNav)}
        {renderNavGroup('Library', libraryNav)}
        {renderNavGroup('System', systemNav)}
      </div>
      
      {/* User Profile / Auth Action */}
      <div 
        onClick={() => navigate(user ? '/settings' : '/login')}
        style={{ 
          marginTop: '20px', 
          padding: '12px 14px', 
          borderTop: '1px solid var(--border)', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          cursor: 'pointer',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          transition: 'all 0.2s ease'
        }} 
        className="hover-lift"
        role="button"
        tabIndex={0}
        aria-label={user ? 'User Account Settings' : 'Sign in to OG MUSIC'}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            navigate(user ? '/settings' : '/login');
          }
        }}
      >
        <div style={{ 
          width: '36px', 
          height: '36px', 
          borderRadius: 'var(--radius-full)', 
          backgroundColor: user ? 'var(--brand-red)' : 'var(--surface-elevated)', 
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          {user?.photoURL ? (
            <img src={user.photoURL} alt={user.displayName || 'User'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : user ? (
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '14px' }}>
              {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
            </span>
          ) : (
            <LogIn size={16} color="var(--brand-red)" />
          )}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="line-clamp-1" style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
            {user ? (user.displayName || user.email.split('@')[0]) : 'Sign In'}
          </div>
          <div className="line-clamp-1" style={{ fontSize: 'var(--text-xs)', color: user ? 'var(--brand-red)' : 'var(--text-secondary)' }}>
            {user ? 'My Profile & Audio' : 'Join OG MUSIC'}
          </div>
        </div>
      </div>
    </aside>
  );
};

