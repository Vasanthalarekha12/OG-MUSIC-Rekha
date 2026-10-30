import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CinematicBrandLoader } from '../../components/ui/CinematicBrandLoader';
import { RotateCcw, ArrowLeft, Sparkles } from 'lucide-react';

export const LoaderPreview = () => {
  const [replayKey, setReplayKey] = useState(0);

  const handleReplay = () => {
    setReplayKey((prev) => prev + 1);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#000000',
        zIndex: 99999,
        overflow: 'hidden',
      }}
    >
      {/* Active Cinematic Brand Loader */}
      <CinematicBrandLoader
        key={replayKey}
        isReady={false}
        minDisplayTimeMs={3600}
        maxTimeoutMs={999999}
        showSkipButton={false}
      />

      {/* Floating Control Console */}
      <div
        style={{
          position: 'absolute',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000001,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 18px',
          background: 'rgba(15, 15, 18, 0.92)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.85), 0 0 24px rgba(220, 38, 38, 0.25)',
          maxWidth: '92vw',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={15} color="var(--brand-red, #dc2626)" />
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '1.2px',
              textTransform: 'uppercase',
              color: '#ffffff',
              whiteSpace: 'nowrap',
            }}
          >
            Brand Animation
          </span>
        </div>

        <button
          id="btn-replay-animation"
          type="button"
          onClick={handleReplay}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '12px',
            backgroundColor: 'var(--brand-red, #dc2626)',
            color: '#ffffff',
            border: '1px solid #ef4444',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 0 14px rgba(220, 38, 38, 0.6)',
          }}
        >
          <RotateCcw size={13} /> Replay
        </button>

        <Link
          to="/home"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: 'rgba(255, 255, 255, 0.75)',
            fontSize: '11px',
            textDecoration: 'none',
            padding: '6px 12px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            whiteSpace: 'nowrap',
          }}
        >
          <ArrowLeft size={12} /> App
        </Link>
      </div>
    </div>
  );
};
