import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { MobileDrawer } from './MobileDrawer';
import { MobileHeader } from './MobileHeader';
import { BottomNavigation } from './BottomNavigation';
import { MiniPlayer } from '../player/MiniPlayer';
import { TopHeader } from './TopHeader';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell = ({ children }: AppShellProps) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      width: '100%',
      overflow: 'hidden',
      backgroundColor: 'var(--bg-primary)'
    }}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <div style={{ flexShrink: 0, width: 'var(--sidebar-width)' }}>
          <Sidebar />
        </div>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <MobileDrawer 
          isOpen={isDrawerOpen} 
          onClose={() => setIsDrawerOpen(false)} 
        />
      )}

      {/* Main Content Area */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        minWidth: 0, /* Crucial for preventing flex children from overflowing */
        position: 'relative'
      }}>
        {isMobile ? <MobileHeader onMenuClick={() => setIsDrawerOpen(true)} /> : <TopHeader />}
        
        <main style={{ 
          flex: 1, 
          overflowY: 'auto', 
          overflowX: 'hidden',
          padding: isMobile ? '16px' : '32px', 
          paddingBottom: isMobile ? 'calc(var(--mobile-nav-height) + var(--miniplayer-height) + 24px)' : 'calc(var(--miniplayer-height) + 32px)' 
        }}>
          {children}
        </main>

        {/* Global Player UI */}
        <div style={{ 
          position: 'absolute', 
          bottom: isMobile ? 'var(--mobile-nav-height)' : 0, 
          left: 0, 
          right: 0,
          zIndex: 50 
        }}>
          <MiniPlayer />
        </div>
        
        {isMobile && <BottomNavigation />}
      </div>
    </div>
  );
};
