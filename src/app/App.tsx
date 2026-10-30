import { useState, useCallback, Component } from 'react';
import type { ReactNode } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from '../router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { PlayerProvider } from '../contexts/PlayerContext';
import { LibraryProvider } from '../contexts/LibraryContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { SettingsProvider } from '../contexts/SettingsContext';
import { CinematicBrandLoader } from '../components/ui/CinematicBrandLoader';

import { FriendsProvider } from '../contexts/FriendsContext';

// Error Boundary Architecture
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          height: '100vh', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          padding: '24px',
          textAlign: 'center'
        }}>
          <h1 style={{ color: 'var(--error)', marginBottom: '16px' }}>Something went wrong.</h1>
          <p style={{ color: 'var(--text-secondary)' }}>We're working on getting this fixed.</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '24px',
              padding: '12px 24px',
              backgroundColor: 'var(--accent-primary)',
              color: '#000',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
            }}
          >
            Reload Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppContent = () => {
  const { isLoading } = useAuth();
  const [loaderFinished, setLoaderFinished] = useState(false);

  const handleFinish = useCallback(() => {
    setLoaderFinished(true);
  }, []);

  return (
    <>
      {!loaderFinished && (
        <CinematicBrandLoader 
          isReady={!isLoading} 
          onFinish={handleFinish} 
        />
      )}
      <RouterProvider router={router} />
    </>
  );
};

export const App = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <SettingsProvider>
            <LibraryProvider>
              <PlayerProvider>
                <FriendsProvider>
                  <AppContent />
                </FriendsProvider>
              </PlayerProvider>
            </LibraryProvider>
          </SettingsProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

