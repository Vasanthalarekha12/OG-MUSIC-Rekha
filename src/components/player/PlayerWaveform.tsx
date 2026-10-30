import React, { useRef, useMemo, useState } from 'react';
import { usePlayer } from '../../contexts/PlayerContext';

interface PlayerWaveformProps {
  height?: number;
}

export const PlayerWaveform: React.FC<PlayerWaveformProps> = ({ height = 48 }) => {
  const { currentTrack, currentTime, duration, seek } = usePlayer();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Generate deterministic waveform based on track ID
  const bars = useMemo(() => {
    if (!currentTrack) return [];
    
    const numBars = 70; // Increased for thinner bars
    const hashStr = currentTrack.id.split('').reduce((acc, char) => acc + char.charCodeAt(0).toString(), '');
    
    // Seeded random generator
    let seed = parseInt(hashStr.slice(0, 8)) || 123456789;
    const random = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    const result = [];
    for (let i = 0; i < numBars; i++) {
      // Create a visually pleasing waveform shape (lower at edges, higher in middle, with some randomness)
      const envelope = Math.sin(Math.PI * (i / (numBars - 1)));
      const value = 0.2 + (random() * 0.8 * envelope);
      result.push(value);
    }
    return result;
  }, [currentTrack]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    handleSeekUpdate(e);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    handleSeekUpdate(e);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleSeekUpdate = (e: React.PointerEvent) => {
    if (!containerRef.current || duration === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    seek(percentage * duration);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) : 0;

  return (
    <div 
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        height: `${height}px`,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '4px', // Increased gap to thin out lines
        cursor: 'pointer',
        touchAction: 'none' // Prevent scrolling while dragging
      }}
    >
      {bars.map((val, i) => {
        const barPercent = i / (bars.length - 1);
        const isActive = barPercent <= progressPercent;
        
        return (
          <div 
            key={i}
            style={{
              flex: 1,
              height: `${val * 100}%`,
              backgroundColor: isActive ? 'rgba(220, 38, 38, 0.8)' : 'rgba(255, 255, 255, 0.1)',
              borderRadius: '1px',
              transition: 'background-color 0.1s, height 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        );
      })}
    </div>
  );
};
