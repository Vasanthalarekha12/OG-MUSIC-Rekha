import React, { useEffect, useRef, useState, useCallback } from 'react';
import ogLogo from '../../assets/brand/og-music-logo-transparent.png';
import shardsData from './shards-data.json';
import { titleCardAudio } from './TitleCardAudio';
import './cinematic-loader.css';

export interface CinematicBrandLoaderProps {
  isReady?: boolean;
  onFinish?: () => void;
  minDisplayTimeMs?: number;
  maxTimeoutMs?: number;
  showSkipButton?: boolean;
  forcePhase?: LoaderPhase;
  replayKey?: number | string;
}

type LoaderPhase =
  | 'enter'        // 0ms - 200ms: Black screen, ambient atmospheric light emerges
  | 'scattered'    // 200ms - 450ms: Shards scattered in 3D perspective space
  | 'converging'   // 450ms - 1900ms: Shards fly, rotate, and assemble into logo
  | 'impact'       // 1900ms - 2100ms: Fragments lock in, seam flash, impact jolt, shockwave
  | 'reveal'       // 2100ms - 2800ms: Metallic becomes red OG, white MUSIC reveals, light sweep
  | 'settled'      // 2800ms+: Master logo holds steady with pulsing backlight
  | 'exit'         // Exit transition: smooth scale and fade-out
  | 'done';        // Unmounted

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  maxAlpha: number;
  type: 'dust' | 'ember';
  wobbleSpeed: number;
  wobbleDistance: number;
  phase: number;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  decay: number;
  size: number;
  color: string;
}

interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  active: boolean;
}

export const CinematicBrandLoader: React.FC<CinematicBrandLoaderProps> = ({
  isReady = true,
  onFinish,
  minDisplayTimeMs = 3800,
  maxTimeoutMs = 5200,
  showSkipButton = true,
  forcePhase,
  replayKey,
}) => {
  const [phase, setPhase] = useState<LoaderPhase>(forcePhase || 'enter');
  const [isMetallic, setIsMetallic] = useState(
    forcePhase ? (forcePhase === 'reveal' || forcePhase === 'settled' || forcePhase === 'exit' ? false : true) : true
  );
  const [sweepActive, setSweepActive] = useState(
    forcePhase ? (forcePhase === 'reveal' || forcePhase === 'settled') : false
  );
  const [progress, setProgress] = useState(
    forcePhase === 'scattered' ? 30 : forcePhase === 'converging' ? 60 : forcePhase === 'impact' ? 80 : forcePhase === 'reveal' ? 95 : forcePhase === 'settled' ? 100 : 15
  );
  const [impactTriggered, setImpactTriggered] = useState(
    forcePhase ? (forcePhase === 'impact' || forcePhase === 'reveal' || forcePhase === 'settled') : false
  );

  const [assemblyComplete, setAssemblyComplete] = useState(
    forcePhase ? (forcePhase === 'settled' || forcePhase === 'exit' || forcePhase === 'done') : false
  );

  const [isMuted, setIsMuted] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const shockwaveRef = useRef<Shockwave>({ x: 0, y: 0, radius: 0, maxRadius: 360, alpha: 0, active: false });
  const sparksRef = useRef<Spark[]>([]);
  const animFrameRef = useRef<number | null>(null);

  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const handleFinish = useCallback(() => {
    titleCardAudio.stop();
    setPhase('done');
    onFinish?.();
  }, [onFinish]);

  const triggerSkip = useCallback(() => {
    titleCardAudio.stop();
    setPhase('exit');
  }, []);

  const toggleSound = useCallback(() => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    titleCardAudio.setMuted(nextMuted);
    if (!nextMuted && audioBlocked) {
      titleCardAudio.play().then(res => {
        if (res) setAudioBlocked(false);
      });
    }
  }, [isMuted, audioBlocked]);

  // Update states if forcePhase changes
  useEffect(() => {
    if (forcePhase) {
      setPhase(forcePhase);
      const isMet = forcePhase !== 'reveal' && forcePhase !== 'settled' && forcePhase !== 'exit';
      setIsMetallic(isMet);
      setSweepActive(forcePhase === 'reveal' || forcePhase === 'settled');
      setImpactTriggered(forcePhase === 'impact' || forcePhase === 'reveal' || forcePhase === 'settled');
      setAssemblyComplete(forcePhase === 'settled' || forcePhase === 'exit' || forcePhase === 'done');
      setProgress(
        forcePhase === 'scattered' ? 30 :
        forcePhase === 'converging' ? 60 :
        forcePhase === 'impact' ? 80 :
        forcePhase === 'reveal' ? 95 : 100
      );
    }
  }, [forcePhase]);

  // Keyboard shortcuts: Escape to skip intro, M to toggle sound
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        triggerSkip();
      } else if (e.key === 'm' || e.key === 'M') {
        toggleSound();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerSkip, toggleSound]);

  // Main Choreography Timeline
  useEffect(() => {
    // If locked to a specific phase, do not auto-advance
    if (forcePhase) return;

    // Reset initial states for replay
    setPhase('enter');
    setIsMetallic(true);
    setSweepActive(false);
    setProgress(15);
    setImpactTriggered(false);
    setAssemblyComplete(false);

    // If user prefers reduced motion, present stable branding reveal immediately
    if (prefersReducedMotion) {
      setPhase('settled');
      setIsMetallic(false);
      setSweepActive(false);
      setProgress(100);
      setAssemblyComplete(true);
      return;
    }

    // Synchronize title-card soundtrack start
    titleCardAudio.play().then(started => {
      if (!started) {
        setAudioBlocked(true);
      }
    });

    const handleFirstInteraction = () => {
      titleCardAudio.play().then(started => {
        if (started) setAudioBlocked(false);
      });
    };
    window.addEventListener('pointerdown', handleFirstInteraction, { once: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true });

    // Phase A -> Phase B (Atmospheric intro into scattered 3D fragments)
    const tScatter = setTimeout(() => {
      setPhase('scattered');
      setProgress(30);
    }, 200);

    // Phase B -> Phase C (Converge fragments towards correct logo positions)
    const tConverge = setTimeout(() => {
      setPhase('converging');
      setProgress(55);
    }, 450);

    // Phase C -> Assembly Impact (Pieces lock together, seam flash, shockwave)
    const tImpact = setTimeout(() => {
      setPhase('impact');
      setImpactTriggered(true);
      setProgress(80);
      // Trigger canvas shockwave & sparks
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        shockwaveRef.current = {
          x: cx,
          y: cy,
          radius: 15,
          maxRadius: Math.max(cx, cy) * 0.75,
          alpha: 0.9,
          active: true,
        };

        // Radiate 28 impact sparks
        const newSparks: Spark[] = [];
        for (let i = 0; i < 28; i++) {
          const angle = (Math.PI * 2 * i) / 28 + (Math.random() - 0.5) * 0.3;
          const speed = 2.5 + Math.random() * 4.5;
          newSparks.push({
            x: cx,
            y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            alpha: 0.95,
            decay: 0.02 + Math.random() * 0.02,
            size: 1.5 + Math.random() * 2.5,
            color: Math.random() > 0.4 ? '#ffffff' : '#dc2626',
          });
        }
        sparksRef.current = newSparks;
      }
    }, 1900);

    // Phase D -> Brand Reveal (Resolve metallic to red OG, reveal white MUSIC, light sweep)
    const tReveal = setTimeout(() => {
      setPhase('reveal');
      setIsMetallic(false);
      setSweepActive(true);
      setProgress(95);
    }, 2100);

    // Assembly completion failsafe (sweep takes 1300ms, starting at 2100ms -> ends at 3400ms)
    const settleDelay = Math.max(minDisplayTimeMs, 3450);
    const tSweepDone = setTimeout(() => {
      setPhase('settled');
      setProgress(100);
      setAssemblyComplete(true);
    }, settleDelay);

    // Maximum-duration failsafe: user is guaranteed never to encounter an infinite loader
    const tSafety = setTimeout(() => {
      setPhase('exit');
    }, Math.max(maxTimeoutMs, 4200));

    return () => {
      clearTimeout(tScatter);
      clearTimeout(tConverge);
      clearTimeout(tImpact);
      clearTimeout(tReveal);
      clearTimeout(tSweepDone);
      clearTimeout(tSafety);
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      titleCardAudio.stop();
    };
  }, [minDisplayTimeMs, maxTimeoutMs, prefersReducedMotion, forcePhase, replayKey]);

  // Coordinated exit: only trigger exit once the entire logo assembly animation
  // has actually completed AND the application/auth state is ready.
  // Holds the completed large logo clearly visible before transitioning into the website.
  useEffect(() => {
    if (forcePhase) return;
    if (assemblyComplete && isReady && phase !== 'exit' && phase !== 'done') {
      const exitTimer = setTimeout(() => {
        setPhase('exit');
      }, 900);
      return () => clearTimeout(exitTimer);
    }
  }, [assemblyComplete, isReady, phase, forcePhase]);

  // Exit transition handler
  useEffect(() => {
    if (forcePhase) return;
    if (phase === 'exit') {
      const exitTimer = setTimeout(() => {
        handleFinish();
      }, 550); // Matches CSS transition duration
      return () => clearTimeout(exitTimer);
    }
  }, [phase, handleFinish, forcePhase]);

  // Canvas Atmosphere & Particle Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || prefersReducedMotion) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Generate cinematic particles
    const particles: Particle[] = [];
    // 30 ambient floating dust motes
    for (let i = 0; i < 30; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z: 0.3 + Math.random() * 0.7,
        vx: (Math.random() - 0.5) * 0.35,
        vy: -0.2 - Math.random() * 0.45,
        size: 1 + Math.random() * 2,
        alpha: 0,
        maxAlpha: 0.15 + Math.random() * 0.3,
        type: 'dust',
        wobbleSpeed: 0.01 + Math.random() * 0.02,
        wobbleDistance: 0.4 + Math.random() * 0.8,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // 16 rising crimson ember sparks
    for (let i = 0; i < 16; i++) {
      particles.push({
        x: width * 0.3 + Math.random() * (width * 0.4),
        y: height * 0.5 + Math.random() * (height * 0.45),
        z: 0.5 + Math.random() * 0.5,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -0.6 - Math.random() * 0.8,
        size: 1.5 + Math.random() * 2.5,
        alpha: 0,
        maxAlpha: 0.5 + Math.random() * 0.45,
        type: 'ember',
        wobbleSpeed: 0.02 + Math.random() * 0.03,
        wobbleDistance: 0.8 + Math.random() * 1.2,
        phase: Math.random() * Math.PI * 2,
      });
    }

    let rayAngle = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // 1. Volumetric God Rays (subtle rotating light shafts)
      rayAngle += 0.0015;
      const rayGlow = ctx.createRadialGradient(cx, cy, 20, cx, cy, Math.max(cx, cy) * 0.85);
      rayGlow.addColorStop(0, 'rgba(220, 38, 38, 0.09)');
      rayGlow.addColorStop(0.5, 'rgba(180, 20, 20, 0.03)');
      rayGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.save();
      ctx.fillStyle = rayGlow;
      ctx.fillRect(0, 0, width, height);

      // Light Beams
      ctx.translate(cx, cy);
      ctx.rotate(rayAngle);
      for (let i = 0; i < 4; i++) {
        ctx.rotate((Math.PI * 2) / 4);
        const beamGrad = ctx.createLinearGradient(0, 0, 0, Math.max(cx, cy) * 0.7);
        beamGrad.addColorStop(0, 'rgba(255, 100, 100, 0.035)');
        beamGrad.addColorStop(0.5, 'rgba(220, 38, 38, 0.015)');
        beamGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-45, Math.max(cx, cy) * 0.7);
        ctx.lineTo(45, Math.max(cx, cy) * 0.7);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // 2. Shockwave Ring
      const sw = shockwaveRef.current;
      if (sw.active && sw.alpha > 0.01) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 60, 60, ${sw.alpha * 0.85})`;
        ctx.lineWidth = 3;
        ctx.shadowColor = 'rgba(255, 30, 30, 0.9)';
        ctx.shadowBlur = 12;
        ctx.stroke();

        // Inner bright white wavefront
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, Math.max(0, sw.radius - 2), 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${sw.alpha * 0.75})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();

        sw.radius += (sw.maxRadius - sw.radius) * 0.09 + 3;
        sw.alpha *= 0.94;
        if (sw.alpha <= 0.01) sw.active = false;
      }

      // 3. Impact Sparks
      const sparks = sparksRef.current;
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vx *= 0.96;
        s.vy *= 0.96;
        s.alpha -= s.decay;

        if (s.alpha <= 0) {
          sparks.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.fillStyle = s.color;
        ctx.globalAlpha = Math.max(0, s.alpha);
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 4. Ambient Floating Dust & Embers
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.phase += p.wobbleSpeed;
        p.x += p.vx + Math.sin(p.phase) * p.wobbleDistance;
        p.y += p.vy;

        // Fade in gradually, fade out near top
        if (p.alpha < p.maxAlpha) {
          p.alpha += 0.01;
        }

        // Wrap around vertically & horizontally
        if (p.y < -20) {
          p.y = height + 10;
          p.x = Math.random() * width;
          p.alpha = 0;
        }
        if (p.x < -20) p.x = width + 10;
        if (p.x > width + 20) p.x = -10;

        ctx.save();
        ctx.globalAlpha = p.alpha;
        if (p.type === 'ember') {
          ctx.fillStyle = 'rgba(255, 75, 50, 0.95)';
          ctx.shadowColor = 'rgba(255, 40, 20, 0.9)';
          ctx.shadowBlur = 10 * p.z;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * p.z, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = 'rgba(240, 245, 255, 0.85)';
          ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
          ctx.shadowBlur = 4 * p.z;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * p.z, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [prefersReducedMotion]);

  if (phase === 'done') return null;

  const isExiting = phase === 'exit';
  const isFinalReveal = phase === 'reveal' || phase === 'settled' || isExiting;
  const showShards = phase !== 'enter';
  const isScattered = phase === 'scattered';
  const hasImpacted = impactTriggered || phase === 'impact' || phase === 'reveal' || phase === 'settled';

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading MARUDHAM OG MUSIC — Audio Experience"
      className={`og-intro-overlay cinematic-loader-root ${isExiting ? 'is-exiting' : ''}`}
    >
      {/* Background Volumetric Canvas (God Rays, 3D Dust, Rising Embers, Impact Shockwaves) */}
      <canvas ref={canvasRef} className="cinematic-bg-canvas" />

      {/* Central Volumetric Radial Red Aura */}
      <div className="cinematic-volumetric-glow" />

      {/* 3D Viewport Stage: Centered across full viewport */}
      <div className="og-intro-stage cinematic-stage">
        <div className={`og-intro-logo-box cinematic-logo-box ${hasImpacted ? 'has-impacted' : ''} ${isFinalReveal ? 'is-final-reveal' : ''}`}>
          
          {/* Seam Glow Flash upon convergence */}
          <div className={`cinematic-seams-flash ${phase === 'impact' ? 'active' : ''}`} />

          {/* 3D Shards Assembly Layer */}
          {showShards && (
            <div
              className={`cinematic-shards-group ${isMetallic ? 'metallic-mode' : ''}`}
              style={{
                position: 'absolute',
                inset: 0,
                transformStyle: 'preserve-3d',
                display: phase === 'settled' || isExiting ? 'none' : 'block',
                pointerEvents: 'none',
              }}
            >
              {shardsData.map((shard) => {
                // If scattered, position in wide 3D space with perspective rotation.
                // When converging/impact/reveal, animate to (0, 0, 0)
                const transform = isScattered
                  ? `translate3d(${shard.startX}px, ${shard.startY}px, ${shard.startZ}px) rotateX(${shard.rotX}deg) rotateY(${shard.rotY}deg) rotateZ(${shard.rotZ}deg) scale3d(0.85, 0.85, 0.85)`
                  : 'translate3d(0px, 0px, 0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale3d(1, 1, 1)';

                const transition = isScattered
                  ? 'none'
                  : `transform ${shard.duration}s cubic-bezier(0.16, 1, 0.3, 1) ${shard.delay}s, filter 0.6s ease`;

                return (
                  <div
                    key={shard.id}
                    className="cinematic-shard"
                    style={{
                      clipPath: `polygon(${shard.polygon})`,
                      WebkitClipPath: `polygon(${shard.polygon})`,
                      transform,
                      transition,
                    }}
                  >
                    {/* Back Depth Facet (Extruded bevel shadow) */}
                    <div className="cinematic-facet cinematic-facet-back">
                      <img src={ogLogo} alt="" aria-hidden="true" className="cinematic-facet-img" />
                    </div>

                    {/* Mid Bevel Facet (Chiseled metallic edge) */}
                    <div className="cinematic-facet cinematic-facet-mid">
                      <img src={ogLogo} alt="" aria-hidden="true" className="cinematic-facet-img" />
                    </div>

                    {/* Front Surface Facet (Primary high-res metallic/crimson face) */}
                    <div className="cinematic-facet cinematic-facet-front">
                      <img src={ogLogo} alt="" aria-hidden="true" className="cinematic-facet-img" />
                    </div>

                    {/* Dynamic Specular Gleam Overlay */}
                    {isMetallic && <div className="cinematic-shard-gleam" />}
                  </div>
                );
              })}
            </div>
          )}

          {/* Seamless Master Brand Layer (seamlessly holds settled state without shard seams or under-layers) */}
          <div
            className="cinematic-final-brand"
            style={{
              opacity: phase === 'settled' || isExiting ? 1 : 0,
              pointerEvents: 'none',
            }}
          >
            <img
              src={ogLogo}
              alt="MARUDHAM OG MUSIC — Official Brand"
              className="og-intro-logo"
            />
          </div>

          {/* Anamorphic Red & White Lens Sweep */}
          <div
            className={`cinematic-brand-sweep ${sweepActive ? 'sweep-active' : ''}`}
            onAnimationEnd={() => setAssemblyComplete(true)}
          />
        </div>
      </div>

      {/* Subtitle / Status Panel */}
      <div 
        className="cinematic-status-panel"
        style={{
          opacity: phase === 'settled' || isExiting ? 0 : 1,
        }}
      >
        <div className="cinematic-tagline">
          <span>MARUDHAM OG MUSIC</span>
          <span className="cinematic-tagline-dot" />
          <span>CINEMATIC AUDIO</span>
        </div>

        {/* Precision Progress Bar */}
        <div className="cinematic-meter-track">
          <div
            className="cinematic-meter-fill"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>
      </div>

      {/* Sound Toggle Button (Handles browser autoplay restrictions elegantly) */}
      <button
        type="button"
        onClick={toggleSound}
        className="cinematic-sound-btn"
        aria-label={isMuted ? "Unmute title-card soundtrack" : "Mute title-card soundtrack"}
      >
        {isMuted || audioBlocked ? "Sound: Off [M]" : "Sound: On [M]"}
      </button>

      {/* Skip Button for quick testing & power users */}
      {showSkipButton && (
        <button
          type="button"
          onClick={triggerSkip}
          className="cinematic-skip-btn"
          aria-label="Skip introductory animation"
        >
          Skip Intro [ESC]
        </button>
      )}
    </div>
  );
};
