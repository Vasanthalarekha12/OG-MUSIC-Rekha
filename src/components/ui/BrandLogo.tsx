import React from 'react';
import { Link } from 'react-router-dom';
import ogLogo from '../../assets/brand/og-music-logo.png';

export interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero' | 'loader';
  className?: string;
  linkHome?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ 
  size = 'md', 
  className = '',
  linkHome = false 
}) => {
  const heights = {
    sm: 28,
    md: 38,
    lg: 56,
    xl: 72,
    hero: 96,
    loader: 120,
  };

  const height = heights[size];

  const content = (
    <div 
      className={`brand-logo-container ${className}`}
      style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        textDecoration: 'none',
        position: 'relative',
        userSelect: 'none'
      }}
    >
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          height: `${height}px`,
          position: 'relative'
        }}
      >
        <img 
          src={ogLogo} 
          alt="MARUDHAM OG MUSIC — Official Logo" 
          title="MARUDHAM OG MUSIC"
          style={{ 
            height: '100%', 
            width: 'auto',
            maxHeight: `${height}px`,
            objectFit: 'contain',
            display: 'block',
            filter: 'drop-shadow(0 4px 16px rgba(220, 38, 38, 0.25))'
          }}
          onError={(e) => {
            // High-contrast emergency fallback if asset path is momentarily broken
            e.currentTarget.style.display = 'none';
            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
        {/* Fallback container with identical brand styling */}
        <div 
          style={{
            display: 'none',
            alignItems: 'center',
            color: 'var(--brand-red, #DC2626)',
            fontWeight: 900,
            fontSize: `${height * 0.45}px`,
            fontStyle: 'italic',
            letterSpacing: '-1px',
            textTransform: 'uppercase'
          }}
        >
          OG <span style={{ color: '#FFFFFF', marginLeft: '6px' }}>MUSIC</span>
        </div>
      </div>
    </div>
  );

  if (linkHome) {
    return (
      <Link to="/home" style={{ textDecoration: 'none', display: 'inline-flex' }} aria-label="OG MUSIC Home">
        {content}
      </Link>
    );
  }

  return content;
};

