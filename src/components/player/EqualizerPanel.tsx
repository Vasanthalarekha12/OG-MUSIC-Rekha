import React, { useState } from 'react';
import { usePlayer } from '../../contexts/PlayerContext';
import { Settings2, ArrowLeft, CheckCircle2, RotateCw, ChevronUp, ChevronDown, Headphones, Volume2, FastForward, Volume, ChevronLeft, ChevronRight } from 'lucide-react';

interface EqualizerPanelProps {
  onClose: () => void;
}

const EQ_PRESETS = {
  'Custom': [0, 0, 0, 0, 0],
  'Normal': [0, 0, 0, 0, 0],
  'Classical': [3, 2, -1, 2, 3],
  'Dance': [5, 3, 0, 2, 4],
  'Flat': [0, 0, 0, 0, 0],
  'Folk': [2, -1, 0, 1, 2],
  'Heavy Metal': [4, 1, -2, 3, 5],
};

const BANDS = ['60 Hz', '230 Hz', '910 Hz', '4 kHz', '14 kHz'];

const Switch = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
  <div 
    onClick={onChange}
    style={{
      width: '36px',
      height: '20px',
      borderRadius: '20px',
      backgroundColor: checked ? 'rgba(255, 22, 22, 0.2)' : '#333',
      position: 'relative',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      padding: '2px',
      boxShadow: checked ? '0 0 10px rgba(255, 22, 22, 0.4)' : 'none',
      transition: 'all 0.3s'
    }}
  >
    <div style={{
      width: '16px',
      height: '16px',
      borderRadius: '50%',
      backgroundColor: checked ? 'var(--brand-red)' : '#888',
      transform: checked ? 'translateX(16px)' : 'translateX(0)',
      transition: 'all 0.3s',
      boxShadow: checked ? '0 0 8px var(--brand-red)' : 'none'
    }} />
  </div>
);

const RangeSliderRow = ({ 
  icon, 
  title, 
  valueLabel, 
  value, 
  min, 
  max, 
  step, 
  onChange,
  rightLabel,
  hasReset = true
}: any) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {icon}
          <div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>{title} </span>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#aaa' }}>{valueLabel}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {rightLabel && <span style={{ fontSize: '10px', color: '#666', fontWeight: 700, backgroundColor: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px' }}>{rightLabel}</span>}
          {hasReset && <RotateCw size={16} color="var(--text-muted)" style={{ cursor: 'pointer' }} onClick={() => onChange((max - min)/2 + min)} />}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <ChevronLeft size={20} color="var(--text-muted)" />
        <input 
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={{
            flex: 1,
            appearance: 'none',
            height: '4px',
            backgroundColor: '#1a1a1a',
            borderRadius: '2px',
            outline: 'none',
          }}
          className="eq-slider"
        />
        <ChevronRight size={20} color="var(--text-muted)" />
      </div>
    </div>
  );
};


export const EqualizerPanel: React.FC<EqualizerPanelProps> = ({ onClose }) => {
  const { 
    eqGains, 
    setEqGains, 
    eqEnabled, 
    setEqEnabled, 
    playbackRate, 
    setPlaybackRate, 
    volume, 
    setVolume, 
    preAmp, 
    setPreAmp,
    loudnessEnabled,
    setLoudnessEnabled,
    webAudioSupported
  } = usePlayer();
  const [activePreset, setActivePreset] = useState<string>('Custom');

  const handleSliderChange = (index: number, value: number) => {
    setActivePreset('Custom');
    const newGains = [...eqGains];
    newGains[index] = value;
    setEqGains(newGains);
  };

  const handlePresetSelect = (preset: keyof typeof EQ_PRESETS) => {
    setActivePreset(preset);
    setEqGains(EQ_PRESETS[preset]);
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#050505',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideUpFade 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        overflowY: 'auto',
        color: '#fff'
      }}
    >
      {/* CSS for custom sliders */}
      <style>{`
        .eq-slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--brand-red);
          cursor: pointer;
          box-shadow: 0 0 10px rgba(255, 22, 22, 0.5);
        }
        .eq-slider-vertical::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 12px;
          border-radius: 6px;
          background: var(--brand-red);
          cursor: pointer;
          box-shadow: 0 0 10px rgba(255, 22, 22, 0.5);
        }
      `}</style>

      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', backgroundColor: '#050505', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={onClose} style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={24} strokeWidth={2} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Settings2 size={20} strokeWidth={2} color="var(--text-secondary)" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: webAudioSupported ? 'var(--brand-red)' : 'var(--text-secondary)' }}>
            {webAudioSupported ? 'Hi-Res Audio DSP Active' : 'Direct Audio'}
          </span>
        </div>
        <button onClick={onClose} style={{ color: 'var(--text-secondary)' }}>
          <CheckCircle2 size={24} strokeWidth={1.5} />
        </button>
      </div>

      <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* Equalizer Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Settings2 size={24} color="var(--text-secondary)" />
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Equalizer</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Headphones size={20} color="var(--text-muted)" />
            <RotateCw size={18} color="var(--text-muted)" onClick={() => handlePresetSelect('Custom')} />
            <Switch checked={eqEnabled} onChange={() => setEqEnabled(!eqEnabled)} />
          </div>
        </div>

        {/* EQ Sliders */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '280px', marginBottom: '24px', opacity: eqEnabled ? 1 : 0.5, pointerEvents: eqEnabled ? 'auto' : 'none', transition: 'opacity 0.3s' }}>
          {eqGains.map((gain, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', gap: '12px' }}>
              <ChevronUp size={20} color="var(--text-muted)" />
              <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="1"
                  value={gain}
                  onChange={(e) => handleSliderChange(i, parseInt(e.target.value))}
                  style={{
                    appearance: 'none',
                    width: '160px',
                    height: '4px',
                    backgroundColor: '#1a1a1a',
                    transform: 'rotate(270deg)',
                    borderRadius: '2px',
                    outline: 'none',
                    margin: 0
                  }}
                  className="eq-slider-vertical"
                />
              </div>
              <ChevronDown size={20} color="var(--text-muted)" />
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '8px' }}>
                {gain > 0 ? '+' : ''}{gain.toFixed(2)}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>
                {BANDS[i]}
              </span>
            </div>
          ))}
        </div>

        {/* Presets */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '16px', marginBottom: '40px', scrollbarWidth: 'none' }}>
          {Object.keys(EQ_PRESETS).map(preset => (
            <button
              key={preset}
              onClick={() => handlePresetSelect(preset as keyof typeof EQ_PRESETS)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                whiteSpace: 'nowrap',
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: activePreset === preset ? 'rgba(255, 22, 22, 0.2)' : '#151515',
                color: activePreset === preset ? 'var(--brand-red)' : 'var(--text-secondary)',
                border: activePreset === preset ? '1px solid var(--brand-red)' : '1px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Normalize Audio */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <Headphones size={24} color="var(--text-secondary)" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Normalize audio</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', maxWidth: '180px', lineHeight: '1.4' }}>
                Normalizes volume by reading the replay gain tag or the info provided by youtube
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Default</span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>(Loudness Enhancer)</span>
          </div>
        </div>

        {/* Sliders */}
        <RangeSliderRow 
          icon={<Volume2 size={20} color="var(--text-secondary)" />}
          title="Loudness Enhancer (PreAmp)"
          valueLabel={`${preAmp.toFixed(1)}dB`}
          value={preAmp}
          min={-20} max={20} step={0.1}
          onChange={setPreAmp}
          hasReset={false}
          rightLabel={
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <RotateCw size={16} color="var(--text-muted)" style={{ cursor: 'pointer' }} onClick={() => setPreAmp(0)} />
              <Switch checked={loudnessEnabled} onChange={() => setLoudnessEnabled(!loudnessEnabled)} />
            </div>
          }
        />
        
        {/* Pitch disabled (Unsupported gracefully) */}
        <div style={{ opacity: 0.5, pointerEvents: 'none' }}>
          <RangeSliderRow 
            icon={<Headphones size={20} color="var(--text-secondary)" />}
            title="Pitch (%)"
            valueLabel={`100% (Unsupported)`}
            value={100}
            min={50} max={150} step={1}
            onChange={() => {}}
            rightLabel="432Hz"
          />
        </div>

        <RangeSliderRow 
          icon={<FastForward size={20} color="var(--text-secondary)" />}
          title="Speed"
          valueLabel={`${playbackRate.toFixed(2)}x`}
          value={playbackRate}
          min={0.5} max={2} step={0.05}
          onChange={setPlaybackRate}
          rightLabel="Pitch"
        />

        <RangeSliderRow 
          icon={<Volume size={20} color="var(--text-secondary)" />}
          title="Volume"
          valueLabel={`${Math.round(volume * 100)}%`}
          value={volume}
          min={0} max={1} step={0.01}
          onChange={setVolume}
        />

      </div>
    </div>
  );
};
