import { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { Music } from 'lucide-react';

interface ArtworkProps {
  src?: string;
  alt: string;
  size?: number | string;
  className?: string;
  radius?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  aspectRatio?: string;
  fallbackType?: 'music' | 'artist';
  style?: CSSProperties;
}

const getInitials = (name: string): string => {
  if (!name) return 'OG';
  const clean = name.replace(/[^\w\s]/gi, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'OG';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const Artwork: React.FC<ArtworkProps> = ({ 
  src, 
  alt, 
  size = '100%', 
  className = '', 
  radius = 'md',
  aspectRatio = '1/1',
  fallbackType,
  style
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Reset states when image source changes
  useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
  }, [src]);

  const borderRadius = `var(--radius-${radius})`;
  const isArtist = fallbackType === 'artist' || radius === 'full';

  return (
    <div 
      className={className}
      style={{
        ...style,
        width: size,
        height: size === '100%' ? '100%' : size,
        aspectRatio,
        borderRadius,
        backgroundColor: 'var(--surface-elevated)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)'
      }}
    >
      {!isLoaded && !hasError && src && (
        <div style={{ position: 'absolute', inset: 0, animation: 'pulseGlow 2s infinite' }} />
      )}
      
      {src && !hasError ? (
        <img 
          src={src} 
          alt={alt}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity var(--transition-normal)'
          }}
        />
      ) : isArtist ? (
        <div 
          style={{ 
            width: '100%', 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.4) 0%, rgba(20, 20, 25, 0.98) 100%)',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: typeof size === 'number' ? `${Math.max(14, Math.round(size * 0.34))}px` : '18px',
            letterSpacing: '1px',
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.7)'
          }}
          aria-hidden="true"
        >
          {getInitials(alt)}
        </div>
      ) : (
        <Music size={typeof size === 'number' ? size * 0.4 : 32} />
      )}
    </div>
  );
};
