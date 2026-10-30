import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

type Theme = 'dark' | 'light' | 'system';
type AppliedTheme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  appliedTheme: AppliedTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('og_music_theme');
    return (saved as Theme) || 'system';
  });

  const [appliedTheme, setAppliedTheme] = useState<AppliedTheme>('dark');

  useEffect(() => {
    localStorage.setItem('og_music_theme', theme);

    const applyTheme = (currentTheme: Theme) => {
      let resolvedTheme: AppliedTheme = 'dark';
      
      if (currentTheme === 'system') {
        resolvedTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
      } else {
        resolvedTheme = currentTheme as AppliedTheme;
      }
      
      setAppliedTheme(resolvedTheme);
      
      if (resolvedTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
      } else {
        document.documentElement.removeAttribute('data-theme'); // default is dark
      }
    };

    applyTheme(theme);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
      const listener = () => applyTheme('system');
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, appliedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
