import React, { useRef, useEffect, useState } from 'react';

interface HorizontalScrollerProps {
  children: React.ReactNode;
  autoScroll?: boolean;
  speed?: number; // px per frame
}

export const HorizontalScroller: React.FC<HorizontalScrollerProps> = ({ 
  children, 
  autoScroll = false,
  speed = 0.6 
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!autoScroll) return;

    // Respect user's reduced motion accessibility preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const el = scrollRef.current;
    if (!el) return;

    const step = () => {
      if (!isPaused && el) {
        if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 2) {
          el.scrollLeft = 0;
        } else {
          el.scrollLeft += speed;
        }
      }
      animFrameRef.current = requestAnimationFrame(step);
    };

    animFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [autoScroll, isPaused, speed]);

  return (
    <div 
      style={{ position: 'relative', margin: '0 -24px', padding: '0 24px' }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => {
        // Small delay before resuming auto-scroll after touch
        setTimeout(() => setIsPaused(false), 2000);
      }}
    >
      <div 
        ref={scrollRef}
        style={{ 
          display: 'flex', 
          gap: '24px', 
          overflowX: 'auto', 
          scrollSnapType: autoScroll ? 'none' : 'x mandatory',
          paddingBottom: '24px',
          paddingTop: '8px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
        className="no-scrollbar"
      >
        {React.Children.map(children, child => (
          <div style={{ flex: '0 0 auto', scrollSnapAlign: 'start' }}>
            {child}
          </div>
        ))}
      </div>
      <style>
        {`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>
    </div>
  );
};
