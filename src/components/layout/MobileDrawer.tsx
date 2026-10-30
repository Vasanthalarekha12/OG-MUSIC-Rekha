import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Compass, Disc, Mic2, Grid, ListMusic, Heart, Clock, List, Video, Settings, X, LogIn, Users } from 'lucide-react';
import { BrandLogo } from '../ui/BrandLogo';
import { useAuth } from '../../contexts/AuthContext';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const allNavItems = [
  { label: 'Home', path: '/home', icon: <Home size={20} />, group: 'Discover' },
  { label: 'Search', path: '/search', icon: <Search size={20} />, group: 'Discover' },
  { label: 'Explore', path: '/explore', icon: <Compass size={20} />, group: 'Discover' },
  { label: 'Albums', path: '/albums', icon: <Disc size={20} />, group: 'Discover' },
  { label: 'Artists', path: '/artists', icon: <Mic2 size={20} />, group: 'Discover' },
  { label: 'Genres', path: '/genres', icon: <Grid size={20} />, group: 'Discover' },
  { label: 'Playlists', path: '/playlists', icon: <ListMusic size={20} />, group: 'Discover' },
  { label: 'Friends', path: '/friends', icon: <Users size={20} />, group: 'Library' },
  { label: 'Favorites', path: '/favorites', icon: <Heart size={20} />, group: 'Library' },
  { label: 'History', path: '/history', icon: <Clock size={20} />, group: 'Library' },
  { label: 'Queue', path: '/queue', icon: <List size={20} />, group: 'Library' },
  { label: 'YouTube', path: '/youtube', icon: <Video size={20} />, group: 'Library' },
  { label: 'Settings', path: '/settings', icon: <Settings size={20} />, group: 'System' },
];

export const MobileDrawer = ({ isOpen, onClose }: MobileDrawerProps) => {
  const location = useLocation();
  const { user } = useAuth();

  if (!isOpen) return null;

  const groupedNav = allNavItems.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, typeof allNavItems>);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 'var(--z-drawer)',
      display: 'flex',
    }}>
      {/* Backdrop */}
      <div 
        style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }} 
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div 
        style={{
          position: 'relative',
          width: '85%',
          maxWidth: '320px',
          backgroundColor: 'var(--bg-primary)',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '16px',
          paddingTop: 'calc(20px + env(safe-area-inset-top, 0px))',
          paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
          animation: 'slideRightFade 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          overflowY: 'auto'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', paddingLeft: '8px' }}>
          <BrandLogo size="md" />
          <button onClick={onClose} style={{ color: 'var(--text-secondary)', padding: '8px' }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ flex: 1 }}>
          {Object.entries(groupedNav).map(([group, items]) => (
            <div key={group} style={{ marginBottom: '24px' }}>
              <h3 style={{ 
                padding: '0 16px', 
                fontSize: 'var(--text-xs)', 
                fontWeight: 700, 
                color: 'var(--text-muted)', 
                textTransform: 'uppercase', 
                letterSpacing: '0.1em',
                marginBottom: '12px'
              }}>
                {group}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {items.map((item) => {
                  const isActive = location.pathname.startsWith(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-md)',
                        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                        backgroundColor: isActive ? 'var(--surface-active)' : 'transparent',
                        textDecoration: 'none',
                        fontWeight: isActive ? 600 : 500,
                        position: 'relative'
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
          ))}
        </div>

        {/* Mobile Auth / Account link */}
        <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
          <Link
            to={user ? '/settings' : '/login'}
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              textDecoration: 'none',
              color: 'var(--text-primary)'
            }}
          >
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: user ? 'var(--brand-red)' : 'var(--surface-elevated)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'User'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : user ? (
                <span style={{ color: '#fff', fontWeight: 700, fontSize: '14px' }}>
                  {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                </span>
              ) : (
                <LogIn size={18} color="var(--brand-red)" />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="line-clamp-1" style={{ fontSize: '14px', fontWeight: 600 }}>
                {user ? (user.displayName || user.email.split('@')[0]) : 'Sign In'}
              </div>
              <div style={{ fontSize: '12px', color: user ? 'var(--brand-red)' : 'var(--text-secondary)' }}>
                {user ? 'My Profile' : 'Join OG MUSIC'}
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};
