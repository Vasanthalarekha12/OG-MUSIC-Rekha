import { useState, useEffect, useRef } from 'react';
import { Search, Bell, Menu, Sun, Moon, Laptop } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

interface TopHeaderProps {
  onMenuClick?: () => void;
}

export const TopHeader = ({ onMenuClick }: TopHeaderProps) => {
  const location = useLocation();
  const { user } = useAuth();

  // Helper to format route names
  const getPageTitle = () => {
    const path = location.pathname.split('/')[1];
    if (!path) return 'Home';
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [localQuery, setLocalQuery] = useState(query);
  const debounceRef = useRef<number | null>(null);

  // Sync when route changes externally
  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalQuery(val);
    
    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    debounceRef.current = window.setTimeout(() => {
      if (val.trim()) {
        navigate(`/search?q=${encodeURIComponent(val.trim())}`);
      } else if (location.pathname === '/search') {
        navigate(`/search`);
      }
    }, 400);
  };

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      const val = e.currentTarget.value;
      if (val.trim()) {
        navigate(`/search?q=${encodeURIComponent(val.trim())}`);
      } else {
        navigate(`/search`);
      }
    }
  };

  return (
    <header style={{
      height: 'var(--topbar-height)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      backgroundColor: 'var(--bg-primary)',
      borderBottom: '1px solid var(--border)',
      transition: 'border-color var(--transition-fast)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Mobile Menu Button - Only visible on small screens */}
        <button 
          className="hover-lift d-md-none" 
          onClick={onMenuClick}
          style={{ display: 'none', color: 'var(--text-primary)', padding: '8px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)' }}
        >
          <Menu size={20} />
        </button>

        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.5px' }}>
          {getPageTitle()}
        </h2>
      </div>

      <div style={{ position: 'relative', flex: 1, maxWidth: '400px', margin: '0 32px' }}>
        <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input 
          type="text" 
          placeholder="Search songs, artists, albums..." 
          style={{
            width: '100%',
            backgroundColor: 'var(--surface-hover)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-full)',
            padding: '12px 16px 12px 48px',
            color: 'var(--text-primary)',
            fontSize: 'var(--text-sm)',
            transition: 'all var(--transition-fast)'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--brand-red)';
            e.target.style.boxShadow = '0 0 0 4px var(--brand-red-soft)';
            e.target.style.backgroundColor = 'var(--surface)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--border)';
            e.target.style.boxShadow = 'none';
            e.target.style.backgroundColor = 'var(--surface-hover)';
          }}
          value={localQuery}
          onChange={handleSearchChange}
          onKeyDown={handleSearchSubmit}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', backgroundColor: 'var(--surface-elevated)', borderRadius: 'var(--radius-full)', padding: '4px', border: '1px solid var(--border)' }}>
          <button 
            onClick={() => setTheme('light')}
            style={{ padding: '6px', borderRadius: '50%', backgroundColor: theme === 'light' ? 'var(--surface-hover)' : 'transparent', color: theme === 'light' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
            title="Light Mode"
          >
            <Sun size={16} />
          </button>
          <button 
            onClick={() => setTheme('system')}
            style={{ padding: '6px', borderRadius: '50%', backgroundColor: theme === 'system' ? 'var(--surface-hover)' : 'transparent', color: theme === 'system' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
            title="System Mode"
          >
            <Laptop size={16} />
          </button>
          <button 
            onClick={() => setTheme('dark')}
            style={{ padding: '6px', borderRadius: '50%', backgroundColor: theme === 'dark' ? 'var(--surface-hover)' : 'transparent', color: theme === 'dark' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
            title="Dark Mode"
          >
            <Moon size={16} />
          </button>
        </div>
        
        <button 
          onClick={() => navigate('/history')}
          className="hover-lift" 
          style={{ position: 'relative', padding: '8px', color: 'var(--text-secondary)', borderRadius: '50%', backgroundColor: 'var(--surface-elevated)', border: 'none', cursor: 'pointer' }}
          title="Recent Activity"
        >
          <Bell size={20} />
          <span style={{ position: 'absolute', top: '8px', right: '10px', width: '8px', height: '8px', backgroundColor: 'var(--brand-red)', borderRadius: '50%', border: '2px solid var(--surface-hover)' }} />
        </button>

        {/* Auth Action / Profile Avatar */}
        {user ? (
          <button
            onClick={() => navigate('/settings')}
            className="hover-lift"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 12px 4px 6px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--surface-elevated)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              color: 'var(--text-primary)'
            }}
            title="Account & Settings"
          >
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: 'var(--brand-red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: '12px',
              overflow: 'hidden'
            }}>
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'User'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                (user.displayName || user.email || 'U').charAt(0).toUpperCase()
              )}
            </div>
            <span style={{ fontSize: '13px', fontWeight: 600, maxWidth: '120px' }} className="line-clamp-1">
              {user.displayName || user.email.split('@')[0]}
            </span>
          </button>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="hover-lift"
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--brand-red)',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
              letterSpacing: '0.3px'
            }}
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};
