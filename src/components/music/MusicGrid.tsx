import React from 'react';

interface MusicGridProps {
  children: React.ReactNode;
}

export const MusicGrid: React.FC<MusicGridProps> = ({ children }) => {
  return (
    <div className="music-grid-density">
      {children}
    </div>
  );
};
