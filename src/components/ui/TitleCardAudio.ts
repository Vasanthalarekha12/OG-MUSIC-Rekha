/**
 * MARUDHAM OG MUSIC — Title-Card Cinematic Audio Engine
 * Synchronized with the 3.2-second 3D Logo Assembly Animation
 *
 * Signal Architecture:
 * - Isolated AudioContext (does not interfere with the main PlayerContext / AudioEngine)
 * - Timeline:
 *   0ms - 450ms: Deep atmospheric sub-bass drone and gentle stereo harmonic sweep
 *   450ms - 1900ms: Harmonic convergence chord and rising crescendo
 *   1900ms: High-impact metallic strike, sub-drop punch, and seam flash sparkle
 *   2100ms - 3200ms: Warm resonant brand chord and anamorphic sweep shimmer, fading to silence
 */

export class TitleCardAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying = false;
  private isMuted = false;
  private cleanupTimer: number | null = null;

  public isAutoplayBlocked = false;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.85, this.ctx.currentTime);
    }
  }

  public async play(onEnded?: () => void): Promise<boolean> {
    if (this.isPlaying) return true;

    const ctx = this.getAudioContext();
    if (!ctx) return false;

    // Check autoplay state
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch (err) {
        this.isAutoplayBlocked = true;
        return false;
      }
    }

    if (ctx.state !== 'running') {
      this.isAutoplayBlocked = true;
      return false;
    }

    this.isAutoplayBlocked = false;
    this.isPlaying = true;

    try {
      const now = ctx.currentTime;
      const duration = 4.8; // Extended to cover complete assembly, sweep, and final hold

      // Master Gain
      const master = ctx.createGain();
      master.gain.setValueAtTime(this.isMuted ? 0 : 0.001, now);
      master.gain.exponentialRampToValueAtTime(this.isMuted ? 0 : 0.88, now + 0.15);
      // Smooth fade out into main app at the end of hold
      master.gain.setValueAtTime(this.isMuted ? 0 : 0.88, now + 4.2);
      master.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      master.connect(ctx.destination);
      this.masterGain = master;

      // 1. Atmosphere: Deep Cinematic Sub-Bass Drone (0ms - 1900ms)
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(48, now);
      subOsc.frequency.exponentialRampToValueAtTime(68, now + 1.85); // Gentle tension rise
      subGain.gain.setValueAtTime(0.01, now);
      subGain.gain.linearRampToValueAtTime(0.45, now + 0.3);
      subGain.gain.setValueAtTime(0.45, now + 1.7);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.95);
      subOsc.connect(subGain);
      subGain.connect(master);
      subOsc.start(now);
      subOsc.stop(now + 2.0);

      // 2. Convergence Tension: Multi-Oscillator Rising Shimmer (450ms - 1900ms)
      const convTime = now + 0.45;
      const chordFreqs = [146.83, 220.0, 293.66, 440.0]; // D3, A3, D4, A4
      chordFreqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, convTime);
        osc.frequency.linearRampToValueAtTime(freq * 1.05, now + 1.9); // Micro-pitch converge

        g.gain.setValueAtTime(0.001, convTime);
        g.gain.linearRampToValueAtTime(0.08 / (idx + 1), now + 1.4);
        g.gain.linearRampToValueAtTime(0.18 / (idx + 1), now + 1.88);
        g.gain.exponentialRampToValueAtTime(0.001, now + 1.95);

        osc.connect(g);
        g.connect(master);
        osc.start(convTime);
        osc.stop(now + 2.0);
      });

      // 3. Assembly Impact Strike at 1900ms (Seams flash, fragments lock in)
      const impactTime = now + 1.9;

      // Punchy Sub Drop
      const impactOsc = ctx.createOscillator();
      const impactGain = ctx.createGain();
      impactOsc.type = 'sine';
      impactOsc.frequency.setValueAtTime(130, impactTime);
      impactOsc.frequency.exponentialRampToValueAtTime(36, impactTime + 0.35);

      impactGain.gain.setValueAtTime(0.7, impactTime);
      impactGain.gain.exponentialRampToValueAtTime(0.001, impactTime + 0.5);

      impactOsc.connect(impactGain);
      impactGain.connect(master);
      impactOsc.start(impactTime);
      impactOsc.stop(impactTime + 0.55);

      // Metallic Impact Anvil Clang & Shimmer
      const metallicNoise = ctx.createBufferSource();
      const bufferSize = ctx.sampleRate * 0.4;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      metallicNoise.buffer = noiseBuffer;

      const metalFilter = ctx.createBiquadFilter();
      metalFilter.type = 'bandpass';
      metalFilter.frequency.setValueAtTime(3200, impactTime);
      metalFilter.Q.setValueAtTime(8, impactTime);

      const metalGain = ctx.createGain();
      metalGain.gain.setValueAtTime(0.35, impactTime);
      metalGain.gain.exponentialRampToValueAtTime(0.001, impactTime + 0.4);

      metallicNoise.connect(metalFilter);
      metalFilter.connect(metalGain);
      metalGain.connect(master);
      metallicNoise.start(impactTime);
      metallicNoise.stop(impactTime + 0.45);

      // 4. Brand Reveal Resonant Chords (2100ms - 4600ms) - Warm heroic resolve sustaining through hold
      const revealTime = now + 2.1;
      const revealFreqs = [110.0, 220.0, 277.18, 329.63, 440.0, 659.25]; // Deep A2 sub, A major / heroic cinematic resolve
      revealFreqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = i === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, revealTime);

        g.gain.setValueAtTime(0.001, revealTime);
        g.gain.linearRampToValueAtTime(0.14 / (i + 1), revealTime + 0.3);
        g.gain.setValueAtTime(0.14 / (i + 1), revealTime + 1.8);
        g.gain.exponentialRampToValueAtTime(0.0001, revealTime + 2.5);

        osc.connect(g);
        g.connect(master);
        osc.start(revealTime);
        osc.stop(revealTime + 2.6);
      });

      this.cleanupTimer = window.setTimeout(() => {
        this.stop();
        onEnded?.();
      }, duration * 1000);

      return true;
    } catch (e) {
      console.warn('Error starting title-card audio:', e);
      this.isPlaying = false;
      return false;
    }
  }

  public stop() {
    if (this.cleanupTimer) {
      clearTimeout(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    if (this.masterGain && this.ctx && this.ctx.state !== 'closed') {
      try {
        const now = this.ctx.currentTime;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
        this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
      } catch (e) {}
    }
    this.isPlaying = false;
  }

  public destroy() {
    this.stop();
    if (this.ctx && this.ctx.state !== 'closed') {
      try {
        this.ctx.close();
      } catch (e) {}
      this.ctx = null;
    }
  }
}

export const titleCardAudio = new TitleCardAudioEngine();
