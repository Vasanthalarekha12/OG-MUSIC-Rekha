import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { useAuth } from '../../contexts/AuthContext';
import {
  getAuthErrorMessage,
  setAuthRedirectDestination,
  getAuthRedirectDestination,
  clearAuthRedirectDestination
} from '../../services/firebase/authService';
import { Mail, Lock, User as UserIcon, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading, authError, setAuthError, register, loginWithGoogle } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Return to previous route (such as /friends/invite/:token) or default to /home
  const rawFrom = (location.state as any)?.from;
  const parsedFrom = typeof rawFrom === 'string'
    ? rawFrom
    : rawFrom?.pathname || getAuthRedirectDestination() || '/home';
  const destination = (parsedFrom === '/login' || parsedFrom === '/register') ? '/home' : parsedFrom;

  // Auto-redirect authenticated user away from register page
  useEffect(() => {
    if (!isLoading && user) {
      clearAuthRedirectDestination();
      navigate(destination, { replace: true });
    }
  }, [user, isLoading, destination, navigate]);

  // Sync authError from redirect result if present
  const displayError = error || authError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAuthError(null);

    if (!email.trim() || !password) {
      setError('Please provide an email address and choose a password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    try {
      setLoading(true);
      await register(email, password, displayName);
      clearAuthRedirectDestination();
      navigate(destination, { replace: true });
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setAuthError(null);
    try {
      setGoogleLoading(true);
      setAuthRedirectDestination(destination);
      await loginWithGoogle();
      clearAuthRedirectDestination();
      navigate(destination, { replace: true });
    } catch (err: any) {
      if (err?.message?.includes('Redirecting')) {
        // Keep loading state while browser redirects to Google account chooser
        return;
      }
      setError(getAuthErrorMessage(err));
      setGoogleLoading(false);
    }
  };

  // While resolving authentication session or already authenticated, render sleek brand loader
  if (isLoading || user) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#050505',
        color: '#FFFFFF'
      }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '16px',
          overflow: 'hidden',
          marginBottom: '20px',
          boxShadow: '0 8px 32px rgba(220, 38, 38, 0.4)'
        }}>
          <img src="/icon-192.png" alt="OG MUSIC" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <Loader2 size={28} className="spin-animation" style={{ color: 'var(--brand-red, #DC2626)', marginBottom: '16px' }} />
        <p style={{ fontSize: '15px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.85)' }}>
          {user ? 'Entering OG MUSIC...' : 'Authenticating...'}
        </p>
      </div>
    );
  }

  return (
    <AuthLayout
      title="Create Your Account"
      subtitle="Join MARUDHAM OG MUSIC for personal favorites, playlists, and tailored recommendations"
    >
      {/* Error Banner */}
      {displayError && (
        <div
          role="alert"
          style={{
            backgroundColor: 'rgba(220, 38, 38, 0.12)',
            border: '1px solid rgba(220, 38, 38, 0.35)',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px',
            color: '#FCA5A5'
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{displayError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Name Field */}
        <div>
          <label
            htmlFor="register-name"
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-secondary, #A1A1A1)',
              marginBottom: '6px'
            }}
          >
            Your Name or DJ Handle
          </label>
          <div style={{ position: 'relative' }}>
            <UserIcon
              size={18}
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted, #777777)'
              }}
            />
            <input
              id="register-name"
              type="text"
              autoComplete="name"
              placeholder="e.g. Master Anirudh"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                padding: '13px 14px 13px 44px',
                color: '#FFFFFF',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--brand-red, #DC2626)';
                e.target.style.boxShadow = '0 0 0 3px rgba(220, 38, 38, 0.25)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
        </div>

        {/* Email Field */}
        <div>
          <label
            htmlFor="register-email"
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-secondary, #A1A1A1)',
              marginBottom: '6px'
            }}
          >
            Email Address
          </label>
          <div style={{ position: 'relative' }}>
            <Mail
              size={18}
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted, #777777)'
              }}
            />
            <input
              id="register-email"
              type="email"
              required
              autoComplete="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                padding: '13px 14px 13px 44px',
                color: '#FFFFFF',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--brand-red, #DC2626)';
                e.target.style.boxShadow = '0 0 0 3px rgba(220, 38, 38, 0.25)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <label
            htmlFor="register-password"
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-secondary, #A1A1A1)',
              marginBottom: '6px'
            }}
          >
            Create Account Password <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>(Min 6 characters)</span>
          </label>
          <div style={{ position: 'relative' }}>
            <Lock
              size={18}
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted, #777777)'
              }}
            />
            <input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              placeholder="Choose a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                padding: '13px 44px 13px 44px',
                color: '#FFFFFF',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--brand-red, #DC2626)';
                e.target.style.boxShadow = '0 0 0 3px rgba(220, 38, 38, 0.25)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                e.target.style.boxShadow = 'none';
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted, #777777)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center'
              }}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Confirm Password Field */}
        <div>
          <label
            htmlFor="register-confirm-password"
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-secondary, #A1A1A1)',
              marginBottom: '6px'
            }}
          >
            Confirm Password
          </label>
          <div style={{ position: 'relative' }}>
            <Lock
              size={18}
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted, #777777)'
              }}
            />
            <input
              id="register-confirm-password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              placeholder="Confirm chosen password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                padding: '13px 14px 13px 44px',
                color: '#FFFFFF',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--brand-red, #DC2626)';
                e.target.style.boxShadow = '0 0 0 3px rgba(220, 38, 38, 0.25)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || googleLoading}
          className="hover-lift"
          style={{
            marginTop: '8px',
            backgroundColor: 'var(--brand-red, #DC2626)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '12px',
            padding: '14px',
            fontSize: '15px',
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 20px rgba(220, 38, 38, 0.45)',
            letterSpacing: '0.4px',
            opacity: loading ? 0.75 : 1
          }}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="spin-animation" />
              <span>Creating Your Profile...</span>
            </>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      {/* Divider */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          margin: '22px 0 18px',
          color: 'var(--text-muted, #777777)',
          fontSize: '12px',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}
      >
        <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.08)' }} />
        <span>Or Continue With</span>
        <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.08)' }} />
      </div>

      {/* Google Provider Button */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading || googleLoading}
        className="hover-lift"
        style={{
          width: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '12px',
          padding: '13px',
          color: '#FFFFFF',
          fontSize: '14px',
          fontWeight: 600,
          cursor: googleLoading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          transition: 'all 0.2s ease',
          opacity: googleLoading ? 0.75 : 1
        }}
      >
        {googleLoading ? (
          <Loader2 size={18} className="spin-animation" />
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        )}
        <span>Sign up with Google</span>
      </button>

      {/* Navigation to Login */}
      <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary, #A1A1A1)' }}>
        Already have an account?{' '}
        <Link
          to="/login"
          state={location.state}
          style={{
            color: '#FFFFFF',
            fontWeight: 700,
            textDecoration: 'none',
            marginLeft: '4px',
            borderBottom: '1px solid var(--brand-red, #DC2626)'
          }}
        >
          Sign In
        </Link>
      </div>
    </AuthLayout>
  );
};
