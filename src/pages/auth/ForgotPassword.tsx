import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { useAuth } from '../../contexts/AuthContext';
import { getAuthErrorMessage } from '../../services/firebase/authService';
import { Mail, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const { resetPassword, isConfigured } = useAuth();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please provide your account email address.');
      return;
    }

    try {
      setLoading(true);
      await resetPassword(email);
      setSubmitted(true);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Password Recovery"
      subtitle="Enter your email to receive a secure password reset link from Firebase"
    >
      {/* Firebase configuration warning if missing */}
      {!isConfigured && (
        <div
          style={{
            backgroundColor: 'rgba(234, 179, 8, 0.1)',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            fontSize: '13px',
            color: '#FDE047'
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Firebase Setup Notice:</strong> Password reset emails are sent via your Firebase Authentication project configured in <code>.env.local</code>.
          </div>
        </div>
      )}

      {/* Success Confirmation State */}
      {submitted ? (
        <div
          style={{
            backgroundColor: 'rgba(34, 197, 94, 0.08)',
            border: '1px solid rgba(34, 197, 94, 0.25)',
            borderRadius: '16px',
            padding: '24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'rgba(34, 197, 94, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#4ADE80'
            }}
          >
            <CheckCircle2 size={28} />
          </div>

          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF', marginBottom: '8px' }}>
              Reset Link Dispatched
            </h3>
            <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.6, margin: 0 }}>
              If an account is associated with <strong>{email}</strong>, a secure Firebase password reset email has been sent.
            </p>
          </div>

          <div
            style={{
              fontSize: '13px',
              backgroundColor: 'rgba(0,0,0,0.3)',
              borderRadius: '8px',
              padding: '12px 16px',
              color: 'var(--text-muted, #777777)',
              lineHeight: 1.5,
              width: '100%'
            }}
          >
            Please check your <strong>Inbox</strong> and <strong>Spam / Junk</strong> folder. Click the link provided in the email to set a new password.
          </div>

          <Link
            to="/login"
            className="hover-lift"
            style={{
              marginTop: '8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--brand-red, #DC2626)',
              color: '#FFFFFF',
              textDecoration: 'none',
              padding: '12px 24px',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '14px',
              boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)'
            }}
          >
            <ArrowLeft size={16} />
            <span>Return to Sign In</span>
          </Link>
        </div>
      ) : (
        <>
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

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label
                htmlFor="forgot-email"
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-secondary, #A1A1A1)',
                  marginBottom: '6px'
                }}
              >
                Registered Email Address
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
                  id="forgot-email"
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

            <button
              type="submit"
              disabled={loading}
              className="hover-lift"
              style={{
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
                  <span>Dispatching Reset Email...</span>
                </>
              ) : (
                'Send Password Reset Link'
              )}
            </button>
          </form>

          <div style={{ marginTop: '28px', textAlign: 'center' }}>
            <Link
              to="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--text-secondary, #A1A1A1)',
                fontSize: '13px',
                textDecoration: 'none',
                fontWeight: 600
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </>
      )}
    </AuthLayout>
  );
};
