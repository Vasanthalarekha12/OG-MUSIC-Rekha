/**
 * MARUDHAM OG MUSIC — Unified Audio Engine
 * Single authoritative audio processing pipeline with Web Audio API.
 *
 * Signal Chain:
 * HTMLAudioElement -> MediaElementAudioSourceNode -> PreAmp (GainNode)
 *   -> 5-Band BiquadFilterNode EQ -> DynamicsCompressorNode -> Makeup Gain (GainNode)
 *   -> AnalyserNode -> AudioContext.destination
 */

export class AudioEngine {
  public audio: HTMLAudioElement;
  public audioContext: AudioContext | null = null;
  public sourceNode: MediaElementAudioSourceNode | null = null;
  public analyser: AnalyserNode | null = null;
  public preampNode: GainNode | null = null;
  public eqBands: BiquadFilterNode[] = [];
  public compressorNode: DynamicsCompressorNode | null = null;
  public makeupGainNode: GainNode | null = null;

  public webAudioSupported: boolean = false;
  public eqEnabled: boolean = true;
  public loudnessEnabled: boolean = true;

  private currentEqGains: number[] = [0, 0, 0, 0, 0];
  private currentPreampDb: number = 0;
  private isChainConnected: boolean = false;

  // The 5 UI frequency bands: 60Hz, 230Hz, 910Hz, 4kHz, 14kHz
  public static readonly BAND_FREQUENCIES = [60, 230, 910, 4000, 14000];

  constructor() {
    this.audio = new Audio();
    this.audio.preload = 'metadata';
  }

  /**
   * Lazily initializes Web Audio API processing chain.
   * Safe to call multiple times; node connections are strictly guarded against duplicates.
   */
  public async initWebAudio(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    try {
      if (!this.audioContext || this.audioContext.state === 'closed') {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) {
          this.webAudioSupported = false;
          return false;
        }
        this.audioContext = new AudioCtx();
      }

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      if (!this.isChainConnected && this.audioContext) {
        const ctx = this.audioContext;

        // 1. Source Node (must only be created ONCE per HTMLAudioElement)
        if (!this.sourceNode) {
          this.sourceNode = ctx.createMediaElementSource(this.audio);
        }

        // 2. Pre-Amp Gain Node (-12dB to +12dB)
        this.preampNode = ctx.createGain();
        this.preampNode.gain.setValueAtTime(
          Math.pow(10, Math.max(-12, Math.min(12, this.currentPreampDb)) / 20),
          ctx.currentTime
        );

        // 3. 5-Band BiquadFilter Nodes
        this.eqBands = AudioEngine.BAND_FREQUENCIES.map((freq, index) => {
          const filter = ctx.createBiquadFilter();
          if (index === 0) {
            filter.type = 'lowshelf';
          } else if (index === AudioEngine.BAND_FREQUENCIES.length - 1) {
            filter.type = 'highshelf';
          } else {
            filter.type = 'peaking';
            filter.Q.value = 1.0;
          }
          filter.frequency.value = freq;
          const initialGain = this.eqEnabled ? this.currentEqGains[index] || 0 : 0;
          filter.gain.value = Math.max(-12, Math.min(12, initialGain));
          return filter;
        });

        // 4. Dynamics Compressor for Loudness Enhancement
        this.compressorNode = ctx.createDynamicsCompressor();
        this.makeupGainNode = ctx.createGain();
        this.applyEnhancementSettings();

        // 5. Analyser Node for Visualizers / Waveforms
        this.analyser = ctx.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = 0.8;

        // Connect the audio graph linearly
        // source -> preamp -> eq0 -> eq1 -> eq2 -> eq3 -> eq4 -> compressor -> makeup -> analyser -> destination
        let lastNode: AudioNode = this.sourceNode;
        lastNode.connect(this.preampNode);
        lastNode = this.preampNode;

        for (const band of this.eqBands) {
          lastNode.connect(band);
          lastNode = band;
        }

        lastNode.connect(this.compressorNode);
        this.compressorNode.connect(this.makeupGainNode);
        this.makeupGainNode.connect(this.analyser);
        this.analyser.connect(ctx.destination);

        this.isChainConnected = true;
      }

      this.webAudioSupported = true;
      return true;
    } catch (err) {
      console.warn('Web Audio initialization error:', err);
      this.webAudioSupported = false;
      return false;
    }
  }

  public setEqBands(gains: number[]) {
    this.currentEqGains = [...gains];
    if (!this.webAudioSupported || !this.audioContext || this.eqBands.length === 0) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    gains.forEach((gain, i) => {
      if (this.eqBands[i]) {
        const targetGain = this.eqEnabled ? Math.max(-12, Math.min(12, gain)) : 0;
        // Smooth transition prevents clicks/pops
        this.eqBands[i].gain.setTargetAtTime(targetGain, now, 0.025);
      }
    });
  }

  public setEqEnabled(enabled: boolean) {
    this.eqEnabled = enabled;
    this.setEqBands(this.currentEqGains);
  }

  public setPreAmp(gainDb: number) {
    this.currentPreampDb = gainDb;
    if (!this.webAudioSupported || !this.preampNode || !this.audioContext) return;

    const clampedDb = Math.max(-12, Math.min(12, gainDb));
    const linearGain = Math.pow(10, clampedDb / 20);
    this.preampNode.gain.setTargetAtTime(linearGain, this.audioContext.currentTime, 0.025);
  }

  public setAudioEnhancement(enabled: boolean) {
    this.loudnessEnabled = enabled;
    this.applyEnhancementSettings();
  }

  private applyEnhancementSettings() {
    if (!this.compressorNode || !this.makeupGainNode || !this.audioContext) return;

    const now = this.audioContext.currentTime;
    if (this.loudnessEnabled) {
      // Warm, punchy mastering-style compression: transparent loudness without digital clipping
      this.compressorNode.threshold.setTargetAtTime(-18, now, 0.03);
      this.compressorNode.knee.setTargetAtTime(15, now, 0.03);
      this.compressorNode.ratio.setTargetAtTime(3.5, now, 0.03);
      this.compressorNode.attack.setTargetAtTime(0.005, now, 0.03);
      this.compressorNode.release.setTargetAtTime(0.18, now, 0.03);
      // Clean 2.2 dB makeup gain
      this.makeupGainNode.gain.setTargetAtTime(1.28, now, 0.03);
    } else {
      // Neutral bypass mode
      this.compressorNode.threshold.setTargetAtTime(0, now, 0.03);
      this.compressorNode.ratio.setTargetAtTime(1, now, 0.03);
      this.makeupGainNode.gain.setTargetAtTime(1.0, now, 0.03);
    }
  }

  public destroy() {
    this.audio.pause();
    this.audio.src = '';
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch (e) {}
      this.audioContext = null;
      this.isChainConnected = false;
      this.sourceNode = null;
    }
  }
}

export const audioEngine = new AudioEngine();
