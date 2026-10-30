import React, { useRef } from 'react';
import type { Song } from '../../types';

interface History3DSliderProps {
  items: Song[];
  onSelect: (song: Song) => void;
  activeIndex: number;
}

export const History3DSlider: React.FC<History3DSliderProps> = ({ items, onSelect, activeIndex }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const handleWheel = (e: React.WheelEvent) => {
    // Only intercept horizontal wheel or if it's the primary axis
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      e.preventDefault();
      if (e.deltaX > 0 && activeIndex < items.length - 1) {
        onSelect(items[activeIndex + 1]);
      } else if (e.deltaX < 0 && activeIndex > 0) {
        onSelect(items[activeIndex - 1]);
      }
    }
  };

  const handleCardClick = (index: number) => {
    if (index === activeIndex) {
      // already selected, maybe play directly
    } else {
      onSelect(items[index]);
    }
  };

  if (items.length === 0) return null;

  return (
    <div 
      ref={containerRef}
      onWheel={handleWheel}
      style={{
        position: 'relative',
        width: '100%',
        height: '240px',
        perspective: '1200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}
    >
      <div style={{ position: 'relative', width: '200px', height: '200px', transformStyle: 'preserve-3d' }}>
        {items.map((item, index) => {
          const isActive = index === activeIndex;
          const offset = index - activeIndex;
          const sign = Math.sign(offset);
          const absOffset = Math.abs(offset);

          // Calculate transforms
          const translateX = offset * 110;
          const translateZ = isActive ? 50 : -Math.abs(offset) * 100;
          const rotateY = isActive ? 0 : -sign * 35;
          const scale = isActive ? 1.1 : Math.max(0.6, 1 - absOffset * 0.15);
          const opacity = isActive ? 1 : Math.max(0, 1 - absOffset * 0.3);
          const zIndex = 100 - absOffset;

          return (
            <div
              key={item.id + index}
              onClick={() => handleCardClick(index)}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '200px',
                height: '200px',
                borderRadius: '16px',
                overflow: 'hidden',
                transition: 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                opacity: opacity,
                zIndex: zIndex,
                boxShadow: isActive ? '0 15px 35px rgba(220,38,38,0.4)' : '0 10px 20px rgba(0,0,0,0.5)',
                cursor: 'pointer',
                userSelect: 'none',
                pointerEvents: opacity === 0 ? 'none' : 'auto'
              }}
            >
              <img 
                src={item.coverUrl} 
                alt={item.title} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                draggable="false"
              />
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '32px 16px 12px',
                background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%)',
                color: '#fff'
              }}>
                <div style={{ fontSize: '14px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.title}
                </div>
                <div style={{ fontSize: '11px', opacity: 0.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.artistName}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
