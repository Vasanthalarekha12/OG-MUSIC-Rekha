import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Song, Album } from '../../types';
import { Artwork } from '../ui/Artwork';
import { Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';

interface HeroCarouselProps {
  items: (Song | Album)[];
  onSelect: (item: Song | Album) => void;
  activeId?: string;
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({ items, onSelect, activeId }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const resumeTimerRef = useRef<number | null>(null);

  // Preference for reduced motion
  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  // Initialize or align activeIndex with activeId if provided
  useEffect(() => {
    if (activeId && items.length > 0) {
      const idx = items.findIndex((it) => it.id === activeId);
      if (idx !== -1) {
        setActiveIndex(idx);
      }
    }
  }, [activeId, items]);

  // Pause with auto-resume timeout
  const pauseWithResumeTimeout = useCallback((timeoutMs: number = 6000) => {
    setIsPaused(true);
    if (resumeTimerRef.current) {
      window.clearTimeout(resumeTimerRef.current);
    }
    resumeTimerRef.current = window.setTimeout(() => {
      setIsPaused(false);
    }, timeoutMs);
  }, []);

  const goToNext = useCallback(() => {
    if (items.length === 0) return;
    setActiveIndex((prev) => (prev + 1) % items.length);
  }, [items.length]);

  const goToPrev = useCallback(() => {
    if (items.length === 0) return;
    setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
  }, [items.length]);

  // Automatic looping interval (smooth medium speed: 3.8s per card)
  useEffect(() => {
    if (prefersReducedMotion || isPaused || items.length <= 1) return;

    const timer = setInterval(() => {
      goToNext();
    }, 3800);

    return () => clearInterval(timer);
  }, [isPaused, prefersReducedMotion, items.length, goToNext]);

  // Cleanup resume timer
  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
    };
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      pauseWithResumeTimeout();
      goToPrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      pauseWithResumeTimeout();
      goToNext();
    }
  };

  // Touch Swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    pauseWithResumeTimeout();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const endX = e.changedTouches[0].clientX;
    const diff = endX - touchStartXRef.current;
    touchStartXRef.current = null;

    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        goToPrev();
      } else {
        goToNext();
      }
    }
  };

  if (!items || items.length === 0) return null;

  // Normalized list: ensure sufficient cards for comfortable coverflow presentation
  const N = items.length;

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Cinematic Featured Music Coverflow"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => pauseWithResumeTimeout(3000)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '560px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        userSelect: 'none',
        outline: 'none',
      }}
    >
      {/* Carousel Top Controls: Pause/Resume Toggle & Step Controls */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 8px 12px',
          zIndex: 40,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              color: 'var(--text-secondary, #A1A1A1)',
            }}
          >
            FEATURED MOMENT ({activeIndex + 1}/{N})
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Pause / Resume Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsPaused((p) => !p);
            }}
            aria-label={isPaused ? 'Resume auto carousel' : 'Pause auto carousel'}
            title={isPaused ? 'Resume autoplay' : 'Pause autoplay'}
            className="hover-lift"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '20px',
              padding: '4px 10px',
              color: isPaused ? 'var(--brand-red, #DC2626)' : 'rgba(255, 255, 255, 0.8)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {isPaused ? <Play size={12} fill="currentColor" /> : <Pause size={12} />}
            <span>{isPaused ? 'Resume' : 'Pause'}</span>
          </button>

          {/* Previous Card */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              pauseWithResumeTimeout();
              goToPrev();
            }}
            aria-label="Previous card"
            className="hover-lift"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <ChevronLeft size={16} />
          </button>

          {/* Next Card */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              pauseWithResumeTimeout();
              goToNext();
            }}
            aria-label="Next card"
            className="hover-lift"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* 3D Coverflow Stage */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '280px',
          perspective: '1100px',
          perspectiveOrigin: '50% 50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transformStyle: 'preserve-3d',
        }}
      >
        {items.map((item, index) => {
          // Calculate minimal circular delta from activeIndex
          let diff = index - activeIndex;
          while (diff > N / 2) diff -= N;
          while (diff < -N / 2) diff += N;

          const isCenter = diff === 0;
          const absDiff = Math.abs(diff);
          const isVisible = absDiff <= 2;

          // Responsive spacing offset
          const spacing = typeof window !== 'undefined' && window.innerWidth < 480 ? 95 : 125;

          // Compute 3D Cover-Flow geometry
          let transformStyle: string;
          let opacity = 0;
          let zIndex = 0;

          if (prefersReducedMotion) {
            transformStyle = isCenter ? 'scale(1)' : 'scale(0.85)';
            opacity = isCenter ? 1 : 0;
            zIndex = isCenter ? 30 : 0;
          } else if (isCenter) {
            // Front & Center Active Card: High scale, forward translation, zero rotation
            transformStyle = 'translate3d(0, 0, 50px) scale(1.15) rotateY(0deg)';
            opacity = 1;
            zIndex = 30;
          } else if (absDiff === 1) {
            // Adjacent cards: angled, pushed back in depth, slightly transparent
            const x = diff * spacing;
            const rotY = diff > 0 ? -22 : 22;
            transformStyle = `translate3d(${x}px, 0, -35px) scale(0.86) rotateY(${rotY}deg)`;
            opacity = 0.65;
            zIndex = 20;
          } else if (absDiff === 2) {
            // Flanking outer cards
            const x = diff * (spacing + 35);
            const rotY = diff > 0 ? -32 : 32;
            transformStyle = `translate3d(${x}px, 0, -80px) scale(0.72) rotateY(${rotY}deg)`;
            opacity = 0.35;
            zIndex = 10;
          } else {
            // Hidden cards waiting around the loop
            const x = diff > 0 ? 320 : -320;
            transformStyle = `translate3d(${x}px, 0, -120px) scale(0.6) rotateY(0deg)`;
            opacity = 0;
            zIndex = 0;
          }

          const isSong = 'audioUrl' in item || 'sourceType' in item;
          const title = item.title;
          const subtitle = isSong ? (item as Song).artistName : (item as Album).artistName;
          const coverUrl = item.coverUrl;
          const isSelected = activeId === item.id;

          return (
            <div
              key={item.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${title} by ${subtitle}`}
              aria-hidden={!isVisible}
              onClick={(e) => {
                e.stopPropagation();
                pauseWithResumeTimeout();
                if (isCenter) {
                  onSelect(item);
                } else {
                  setActiveIndex(index);
                }
              }}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                marginTop: '-120px',
                marginLeft: '-85px',
                width: '170px',
                backgroundColor: 'rgba(20, 20, 24, 0.92)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: isCenter
                  ? '1px solid var(--brand-red, #DC2626)'
                  : isSelected
                  ? '1px solid rgba(220, 38, 38, 0.5)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '18px',
                padding: '12px',
                boxShadow: isCenter
                  ? '0 20px 48px rgba(0, 0, 0, 0.85), 0 0 32px rgba(220, 38, 38, 0.45)'
                  : '0 8px 24px rgba(0, 0, 0, 0.65)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                transform: transformStyle,
                opacity,
                zIndex,
                pointerEvents: isVisible ? 'auto' : 'none',
                transition: prefersReducedMotion
                  ? 'none'
                  : 'transform 0.65s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.65s ease, box-shadow 0.65s ease, border-color 0.4s ease',
                willChange: 'transform, opacity',
              }}
            >
              {/* Artwork Container */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '1/1',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  backgroundColor: '#121214',
                }}
              >
                <Artwork src={coverUrl} alt={title} size="100%" radius="md" />

                {/* Center Card Play Action Indicator */}
                {isCenter && (
                  <div
                    style={{
                      position: 'absolute',
                      right: '8px',
                      bottom: '8px',
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--brand-red, #DC2626)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 16px rgba(220, 38, 38, 0.6)',
                      animation: 'pulseGlow 2.4s infinite ease-in-out',
                    }}
                  >
                    <Play size={16} fill="currentColor" style={{ marginLeft: '2px' }} />
                  </div>
                )}
              </div>

              {/* Title & Artist */}
              <div style={{ minWidth: 0 }}>
                <div
                  className="line-clamp-1"
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: isCenter ? '#FFFFFF' : 'rgba(255, 255, 255, 0.85)',
                    marginBottom: '2px',
                    lineHeight: '1.2',
                  }}
                >
                  {title}
                </div>
                <div
                  className="line-clamp-1"
                  style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    color: isCenter ? 'var(--text-secondary, #A1A1A1)' : 'rgba(255, 255, 255, 0.55)',
                  }}
                >
                  {subtitle}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
