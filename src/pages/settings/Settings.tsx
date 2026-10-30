import React, { useState } from 'react';
import { Settings as SettingsIcon, Moon, Volume2, Shield, Grid, LogOut, Download, ArrowLeft, Headphones, Radio, User as UserIcon, LogIn, Trash2, CheckCircle2, Sparkles } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { recommendationService } from '../../services/recommendationService';

export const Settings: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { videoQuality, setVideoQuality, gridDensity, setGridDensity, audioQuality, setAudioQuality, audioEnhancement, setAudioEnhancement } = useSettings();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [notification, setNotification] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleThemeChange = () => {
    setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark');
    showFeedback(`Theme set to ${theme === 'dark' ? 'Light' : theme === 'light' ? 'System' : 'Dark'}`);
  };

  const handleQualityChange = () => {
    const next = videoQuality === '720p' ? '360p' : '720p';
    setVideoQuality(next);
    showFeedback(`YouTube quality set to ${next}`);
  };

  const handleGridChange = () => {
    const next = gridDensity >= 5 ? 1 : gridDensity + 1;
    setGridDensity(next);
    showFeedback(`Grid density set to ${next} columns`);
  };

  const handleClearListeningData = () => {
    recommendationService.clearSignals();
    showFeedback('Recommendation events and listening cache cleared');
  };

  const handleSignOut = async () => {
    try {
      await logout();
      showFeedback('You have been safely signed out');
      navigate('/home');
    } catch {
      showFeedback('Sign out completed');
    }
  };

  const sections = [
    {
      title: 'Appearance',
      items: [
        { icon: <Moon size={20} />, label: 'Theme Mode', value: theme.charAt(0).toUpperCase() + theme.slice(1), onClick: handleThemeChange },
        { icon: <Grid size={20} />, label: 'Grid Density', value: `${gridDensity} Columns`, onClick: handleGridChange },
        { 
          icon: <Sparkles size={20} color="var(--brand-red)" />, 
          label: 'Cinematic 3D Brand Intro', 
          value: 'Preview Studio', 
          onClick: () => navigate('/loader-preview') 
        },
      ]
    },
    {
      title: 'Audio Engine',
      items: [
        { 
          icon: <Headphones size={20} />, 
          label: 'Master Streaming Quality', 
          value: audioQuality, 
          onClick: () => {
            const next = audioQuality === 'ULTRA HD' ? 'HD QUALITY' : audioQuality === 'HD QUALITY' ? 'STANDARD' : 'ULTRA HD';
            setAudioQuality(next);
            showFeedback(`Audio quality set to ${next}`);
          } 
        },
        { 
          icon: <Radio size={20} />, 
          label: 'Acoustic Soundstage Enhancement', 
          value: audioEnhancement ? 'Active' : 'Bypassed', 
          onClick: () => {
            setAudioEnhancement(!audioEnhancement);
            showFeedback(`Audio enhancement ${!audioEnhancement ? 'enabled' : 'disabled'}`);
          } 
        },
        { 
          icon: <Download size={20} />, 
          label: 'Offline Audio Format', 
          value: '320kbps MP3 / Direct Audio', 
          onClick: () => showFeedback('Offline downloads use direct high-bitrate audio streams') 
        },
      ]
    },
    {
      title: 'Playback Stream',
      items: [
        { icon: <Volume2 size={20} />, label: 'YouTube Engine Resolution', value: videoQuality, onClick: handleQualityChange },
      ]
    },
    {
      title: 'Account & Identity',
      items: user ? [
        { 
          icon: <UserIcon size={20} />, 
          label: 'Connected Account', 
          value: user.displayName || user.email, 
          onClick: () => showFeedback(`Logged in as ${user.email}`) 
        },
        { 
          icon: <Shield size={20} />, 
          label: 'Reset Recommendation Profile', 
          value: 'Clear Cache', 
          onClick: handleClearListeningData 
        },
        { 
          icon: <LogOut size={20} color="var(--brand-red)" />, 
          label: 'Sign Out', 
          value: 'Disconnect', 
          onClick: handleSignOut 
        },
      ] : [
        { 
          icon: <LogIn size={20} color="var(--brand-red)" />, 
          label: 'Sign In to OG MUSIC', 
          value: 'Connect Account', 
          onClick: () => navigate('/login') 
        },
        { 
          icon: <Trash2 size={20} />, 
          label: 'Clear Guest Listening History', 
          value: 'Clear Cache', 
          onClick: handleClearListeningData 
        },
      ]
    }
  ];

  return (
    <div style={{ paddingBottom: '32px' }}>
      {/* Toast Notification */}
      {notification && (
        <div
          role="status"
          style={{
            position: 'fixed',
            bottom: '100px',
            right: '24px',
            backgroundColor: 'rgba(20, 20, 24, 0.95)',
            border: '1px solid var(--brand-red, #DC2626)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.65), 0 0 16px rgba(220, 38, 38, 0.35)',
            backdropFilter: 'blur(16px)',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '12px',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px',
            fontWeight: 600,
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <CheckCircle2 size={16} color="var(--brand-red, #DC2626)" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button 
          onClick={() => navigate(-1)}
          className="hover-lift"
          aria-label="Go back"
          style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '50%', 
            backgroundColor: 'var(--surface-elevated)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: 'var(--text-primary)', 
            border: 'none', 
            cursor: 'pointer' 
          }}
        >
          <ArrowLeft size={20} />
        </button>
        <div style={{ padding: '12px', backgroundColor: 'var(--surface-elevated)', borderRadius: 'var(--radius-md)' }}>
          <SettingsIcon size={24} color="var(--brand-red)" />
        </div>
        <div>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            Settings & Preferences
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Manage audio fidelity, playback preferences, and user account
          </p>
        </div>
      </div>

      {/* Settings Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '800px' }}>
        {sections.map((section, idx) => (
          <div key={idx}>
            <h2 style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px' }}>
              {section.title}
            </h2>
            <div style={{ 
              backgroundColor: 'var(--surface)', 
              borderRadius: 'var(--radius-lg)', 
              border: '1px solid var(--border)',
              overflow: 'hidden'
            }}>
              {section.items.map((item, itemIdx) => (
                <div 
                  key={itemIdx}
                  className="hover-lift"
                  onClick={item.onClick}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      item.onClick();
                    }
                  }}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '18px 24px',
                    borderBottom: itemIdx !== section.items.length - 1 ? '1px solid var(--border)' : 'none',
                    cursor: 'pointer',
                    backgroundColor: 'transparent',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ color: 'var(--text-secondary)' }}>{item.icon}</div>
                    <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {item.label}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--brand-red)', fontWeight: 600 }}>
                      {item.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
