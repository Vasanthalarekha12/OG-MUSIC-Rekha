import React, { useRef, useEffect } from 'react';
import { audioEngine } from '../../audio/AudioEngine';
import { usePlayer } from '../../contexts/PlayerContext';

export const MusicParticles: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isPlaying, currentTrack, webAudioSupported } = usePlayer();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle Resize
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const onResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    // Particle System
    const particles: any[] = [];
    // Restrict particles for performance
    const numParticles = window.innerWidth < 768 ? 25 : 50;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5 - 0.5,
        baseSize: Math.random() * 2 + 1,
        seedOffset: Math.random() * 1000,
        alpha: Math.random() * 0.5 + 0.1
      });
    }

    let animationFrameId: number;
    const dataArray = new Uint8Array(256);

    const render = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      let bassEnergy = 0.2;
      let midEnergy = 0.2;

      // Extract Audio Data if supported and playing
      if (webAudioSupported && audioEngine.analyser && isPlaying) {
        audioEngine.analyser.getByteFrequencyData(dataArray);
        let bassSum = 0;
        for (let i = 0; i < 10; i++) bassSum += dataArray[i];
        bassEnergy = bassSum / 10 / 255;

        let midSum = 0;
        for (let i = 20; i < 60; i++) midSum += dataArray[i];
        midEnergy = midSum / 40 / 255;
      } else if (isPlaying && currentTrack) {
        // Deterministic Fake Visualizer for CORS-blocked audio (like YouTube)
        const hash = currentTrack.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const slowTime = time * 0.001;
        bassEnergy = 0.2 + (Math.sin(slowTime * (hash % 5 + 1)) * 0.15) + (Math.cos(slowTime * 3.4) * 0.1);
        midEnergy = 0.2 + (Math.cos(slowTime * (hash % 3 + 2)) * 0.1);
      } else {
        // Paused state
        bassEnergy = 0.05;
        midEnergy = 0.05;
      }

      // Draw Atmospheric Glow
      const cx = width / 2;
      const cy = height / 2;
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(width, height) * 0.8);
      gradient.addColorStop(0, `rgba(255, 22, 22, ${bassEnergy * 0.15})`);
      gradient.addColorStop(1, 'rgba(10, 10, 10, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw Particles
      particles.forEach(p => {
        // Update position
        if (!reducedMotion) {
          const speedMultiplier = isPlaying ? 1 + (midEnergy * 2) : 0.2;
          p.y += p.vy * speedMultiplier;
          p.x += Math.sin(time * 0.001 + p.seedOffset) * 0.5 * speedMultiplier;

          // Wrap around
          if (p.y < 0) p.y = height;
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
        }

        // Draw
        const size = p.baseSize * (1 + bassEnergy * 2);
        const currentAlpha = isPlaying ? p.alpha + midEnergy * 0.3 : p.alpha * 0.3;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 100, 100, ${Math.min(currentAlpha, 1)})`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render(0);

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, currentTrack, webAudioSupported]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
};
