import { useNavigate } from 'react-router-dom';
import { Menu, Search, Compass, Users } from 'lucide-react';
import { BrandLogo } from '../ui/BrandLogo';

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export const MobileHeader = ({ onMenuClick }: MobileHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header
      style={{
        height: 'var(--mobile-header-height)',
        backgroundColor: 'rgba(10, 10, 10, 0.82)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        position: 'sticky',
        top: 0,
        zIndex: 'var(--z-sticky)',
        transition: 'background-color 0.3s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button 
          onClick={onMenuClick} 
          aria-label="Open Navigation Menu"
          style={{ 
            color: 'var(--text-primary)',
            background: 'rgba(255, 255, 255, 0.06)',
            border: 'none',
            borderRadius: '12px',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
          }}
        >
          <Menu size={20} />
        </button>
        <div onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>
          <BrandLogo size="sm" />
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => navigate('/friends')}
          aria-label="Friends Listen Together"
          style={{
            color: 'var(--text-secondary)',
            background: 'transparent',
            border: 'none',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            cursor: 'pointer',
          }}
        >
          <Users size={19} />
        </button>

        <button
          onClick={() => navigate('/explore')}
          aria-label="Explore Discoveries"
          style={{
            color: 'var(--text-secondary)',
            background: 'transparent',
            border: 'none',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            cursor: 'pointer',
          }}
        >
          <Compass size={20} />
        </button>

        <button 
          onClick={() => navigate('/search')}
          aria-label="Search Songs, Artists, and Soundtracks"
          style={{ 
            color: 'var(--text-primary)',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <Search size={14} color="var(--brand-red, #ff1616)" />
          <span style={{ color: 'var(--text-secondary)' }}>Search</span>
        </button>
      </div>
    </header>
  );
};
