import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Compass, Library, Settings } from 'lucide-react';

export const BottomNavigation = () => {
  const location = useLocation();

  const navItems = [
    { label: 'Home', path: '/home', icon: Home },
    { label: 'Search', path: '/search', icon: Search },
    { label: 'Explore', path: '/explore', icon: Compass },
    { label: 'Library', path: '/favorites', icon: Library },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <nav 
      aria-label="Mobile Bottom Navigation"
      style={{
        height: 'var(--bottom-nav-height)',
        backgroundColor: 'rgba(10, 10, 12, 0.88)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        position: 'relative',
        zIndex: 40,
        boxShadow: '0 -8px 24px rgba(0, 0, 0, 0.5)'
      }}
    >
      {navItems.map((item) => {
        const IconComponent = item.icon;
        const isActive = location.pathname.startsWith(item.path);
        
        return (
          <Link
            key={item.path}
            to={item.path}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              color: isActive ? 'var(--brand-red, #ff1616)' : 'rgba(255, 255, 255, 0.55)',
              textDecoration: 'none',
              position: 'relative',
              flex: 1,
              height: '100%',
              padding: '6px 0',
              transition: 'color 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {/* Active Pill Indicator */}
            {isActive && (
              <div 
                style={{ 
                  position: 'absolute', 
                  top: '0px', 
                  width: '28px', 
                  height: '3px', 
                  backgroundColor: 'var(--brand-red, #ff1616)', 
                  boxShadow: '0 0 10px rgba(255, 22, 22, 0.85)', 
                  borderRadius: '0 0 4px 4px' 
                }} 
              />
            )}

            <div 
              style={{ 
                transform: isActive ? 'scale(1.1)' : 'scale(1)', 
                transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)' 
              }}
            >
              <IconComponent size={21} strokeWidth={isActive ? 2.4 : 1.8} />
            </div>

            <span 
              style={{ 
                fontSize: '10px', 
                fontWeight: isActive ? 700 : 500,
                letterSpacing: '0.2px',
                transition: 'font-weight 0.2s ease',
              }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};
