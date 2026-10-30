import React from 'react';
import { BrandLogo } from '../../components/ui/BrandLogo';
import headphonesImg from '../../assets/brand/headphones-auth.jpg';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div
      className="auth-root-layout"
      style={{
        backgroundColor: '#050505',
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: 'max(24px, env(safe-area-inset-top, 24px)) 16px max(24px, env(safe-area-inset-bottom, 24px))',
        boxSizing: 'border-box',
        overflowX: 'hidden',
        overflowY: 'auto',
        fontFamily: 'var(--font-body)'
      }}
    >
      {/* Volumetric Red Ambient Glow */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '650px',
          height: '450px',
          background: 'radial-gradient(ellipse at center, rgba(220, 38, 38, 0.18) 0%, rgba(220, 38, 38, 0.04) 50%, transparent 75%)',
          filter: 'blur(48px)',
          pointerEvents: 'none'
        }}
      />

      {/* Floating Red Embers */}
      {[
        { left: '15%', top: '25%', delay: '0s', size: '3px' },
        { left: '82%', top: '35%', delay: '1.2s', size: '4px' },
        { left: '28%', top: '70%', delay: '0.6s', size: '2px' },
        { left: '72%', top: '75%', delay: '1.8s', size: '3px' },
      ].map((p, idx) => (
        <div
          key={idx}
          className="brand-particle"
          style={{
            position: 'absolute',
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 60, 60, 0.75)',
            boxShadow: '0 0 10px rgba(255, 30, 30, 0.9)',
            pointerEvents: 'none',
            animation: `brandParticleFloat 3.2s infinite ease-out ${p.delay}`
          }}
        />
      ))}

      {/* Main Container */}
      <div
        style={{
          width: '100%',
          maxWidth: '980px',
          margin: 'auto 0',
          display: 'flex',
          backgroundColor: 'rgba(15, 15, 18, 0.85)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          border: '1px solid rgba(255, 255, 255, 0.09)',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0, 0, 0, 0.85), 0 0 40px rgba(220, 38, 38, 0.15)',
          position: 'relative',
          zIndex: 10
        }}
      >
        {/* Left Column: Visual Artwork & Brand (Visible on tablet/desktop >= 860px) */}
        <div
          className="auth-visual-column"
          style={{
            flex: '1 1 45%',
            position: 'relative',
            background: '#09090B',
            borderRight: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '40px',
            overflow: 'hidden'
          }}
        >
          {/* Headphones Image Backdrop */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${headphonesImg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.55,
              mixBlendMode: 'screen',
              filter: 'contrast(1.15) brightness(0.95)'
            }}
          />

          {/* Dark Overlay Gradient */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, rgba(5,5,5,0.7) 0%, rgba(5,5,5,0.3) 40%, rgba(5,5,5,0.95) 100%)',
              pointerEvents: 'none'
            }}
          />

          {/* Top Brand Logo */}
          <div style={{ position: 'relative', zIndex: 2 }}>
            <BrandLogo size="lg" linkHome />
          </div>

          {/* Animated Audio Equalizer Sound Wave */}
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              marginTop: 'auto',
              marginBottom: '28px',
              display: 'flex',
              alignItems: 'flex-end',
              gap: '4px',
              height: '32px'
            }}
          >
            {[
              { delay: '0.1s', height: '40%' },
              { delay: '0.3s', height: '80%' },
              { delay: '0.2s', height: '60%' },
              { delay: '0.5s', height: '95%' },
              { delay: '0.4s', height: '70%' },
              { delay: '0.25s', height: '85%' },
              { delay: '0.45s', height: '50%' },
              { delay: '0.15s', height: '75%' },
            ].map((bar, i) => (
              <div
                key={i}
                className="soundwave-bar"
                style={{
                  width: '3px',
                  backgroundColor: 'var(--brand-red, #DC2626)',
                  borderRadius: '3px',
                  boxShadow: '0 0 6px rgba(220, 38, 38, 0.7)',
                  animation: `soundWaveBar 1.2s ease-in-out infinite ${bar.delay}`,
                  height: bar.height
                }}
              />
            ))}
            <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '1.5px', color: 'rgba(255, 255, 255, 0.6)', marginLeft: '12px', textTransform: 'uppercase' }}>
              Hi-Res Audio 24-bit
            </span>
          </div>

          {/* Bottom Brand Statement */}
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.3, letterSpacing: '-0.3px', marginBottom: '8px' }}>
              Immerse in the Rhythm of Cinematic Sound.
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.5 }}>
              Lossless streaming, movie soundtracks, curated collections, and personal library synchronization.
            </div>
          </div>
        </div>

        {/* Right Column: Form Container */}
        <div
          style={{
            flex: '1 1 55%',
            padding: '48px 40px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            position: 'relative'
          }}
        >
          {/* Mobile Logo Display */}
          <div className="auth-mobile-logo" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
            <BrandLogo size="lg" linkHome />
          </div>

          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.5px', marginBottom: '8px' }}>
              {title}
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary, #A1A1A1)', margin: 0 }}>
              {subtitle}
            </p>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
};
