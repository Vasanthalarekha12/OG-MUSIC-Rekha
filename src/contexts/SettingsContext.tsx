import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface SettingsContextType {
  videoQuality: '720p' | '360p';
  setVideoQuality: (q: '720p' | '360p') => void;
  gridDensity: number;
  setGridDensity: (d: number) => void;
  audioQuality: 'ULTRA HD' | 'HD QUALITY' | 'STANDARD';
  setAudioQuality: (q: 'ULTRA HD' | 'HD QUALITY' | 'STANDARD') => void;
  audioEnhancement: boolean;
  setAudioEnhancement: (e: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [videoQuality, setVideoQuality] = useState<'720p' | '360p'>(() => {
    return (localStorage.getItem('og_music_video_quality') as '720p' | '360p') || '720p';
  });

  const [gridDensity, setGridDensity] = useState<number>(() => {
    return parseInt(localStorage.getItem('og_music_grid_density') || '5', 10);
  });

  const [audioQuality, setAudioQuality] = useState<'ULTRA HD' | 'HD QUALITY' | 'STANDARD'>(() => {
    return (localStorage.getItem('og_music_audio_quality') as 'ULTRA HD' | 'HD QUALITY' | 'STANDARD') || 'STANDARD';
  });

  const [audioEnhancement, setAudioEnhancement] = useState<boolean>(() => {
    return localStorage.getItem('og_music_audio_enhancement') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('og_music_video_quality', videoQuality);
  }, [videoQuality]);

  useEffect(() => {
    localStorage.setItem('og_music_grid_density', gridDensity.toString());
    // Also apply it globally so CSS grids can use it
    document.documentElement.style.setProperty('--grid-columns', gridDensity.toString());
  }, [gridDensity]);

  useEffect(() => {
    localStorage.setItem('og_music_audio_quality', audioQuality);
  }, [audioQuality]);

  useEffect(() => {
    localStorage.setItem('og_music_audio_enhancement', audioEnhancement.toString());
  }, [audioEnhancement]);

  return (
    <SettingsContext.Provider value={{ 
      videoQuality, setVideoQuality, 
      gridDensity, setGridDensity,
      audioQuality, setAudioQuality,
      audioEnhancement, setAudioEnhancement
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
};
