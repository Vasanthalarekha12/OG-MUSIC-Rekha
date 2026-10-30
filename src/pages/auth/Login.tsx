import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { useAuth } from '../../contexts/AuthContext';
import { getAuthErrorMessage } from '../../services/firebase/authService';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Return to previous route or default to /home
  const from = (location.state as any)?.from?.pathname || '/home';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please enter both your email address and password.');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to resume your personal listening experience"
    >
      {/* Demo Credentials Quick Fill */}
      <div
        style={{
          backgroundColor: 'rgba(220, 38, 38, 0.08)',
          border: '1px solid rgba(220, 38, 38, 0.25)',
          borderRadius: '12px',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          fontSize: '13px',
          color: 'var(--text-secondary, #ccc)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, color: '#fff' }}>Default Test Account:</span>
          <button
            type="button"
            onClick={() => {
              setEmail('listener@ogmusic.com');
              setPassword('password123');
            }}
            style={{
              background: 'var(--brand-red, #dc2626)',
              border: 'none',
              color: '#fff',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Autofill
          </button>
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#fca5a5' }}>
          Email: <strong>listener@ogmusic.com</strong><br />
          Password: <strong>password123</strong>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
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
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Email Field */}
        <div>
          <label
            htmlFor="login-email"
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
              id="login-email"
              type="email"
              required
              autoComplete="email"
              placeholder="listener@ogmusic.com"
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label
              htmlFor="login-password"
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-secondary, #A1A1A1)'
              }}
            >
              Account Password
            </label>
            <Link
              to="/forgot-password"
              style={{
                fontSize: '12px',
                color: 'var(--brand-red, #DC2626)',
                textDecoration: 'none',
                fontWeight: 500
              }}
            >
              Forgot password?
            </Link>
          </div>
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
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              placeholder="••••••••••••"
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
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
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
              <span>Authenticating...</span>
            </>
          ) : (
            'Sign In to OG MUSIC'
          )}
        </button>
      </form>

      {/* Navigation to Register */}
      <div style={{ marginTop: '28px', textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary, #A1A1A1)' }}>
        Don't have an account yet?{' '}
        <Link
          to="/register"
          style={{
            color: '#FFFFFF',
            fontWeight: 700,
            textDecoration: 'none',
            marginLeft: '4px',
            borderBottom: '1px solid var(--brand-red, #DC2626)'
          }}
        >
          Create an Account
        </Link>
      </div>
    </AuthLayout>
  );
};
