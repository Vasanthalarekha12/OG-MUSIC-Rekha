import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { useAuth } from '../../contexts/AuthContext';
import { getAuthErrorMessage } from '../../services/firebase/authService';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { confirmPasswordReset, verifyResetCode } = useAuth();

  const oobCode = searchParams.get('oobCode');

  const [verifying, setVerifying] = useState(true);
  const [associatedEmail, setAssociatedEmail] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!oobCode) {
      setCodeError('No password reset authorization token provided. Please click the link sent to your email.');
      setVerifying(false);
      return;
    }

    let isMounted = true;
    verifyResetCode(oobCode)
      .then((email) => {
        if (isMounted) {
          setAssociatedEmail(email);
          setVerifying(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setCodeError(getAuthErrorMessage(err));
          setVerifying(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [oobCode, verifyResetCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newPassword || newPassword.length < 6) {
      setFormError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError('Passwords do not match. Please re-enter your new password.');
      return;
    }

    if (!oobCode) return;

    try {
      setSubmitting(true);
      await confirmPasswordReset(oobCode, newPassword);
      setSubmitSuccess(true);
    } catch (err) {
      setFormError(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Set New Password"
      subtitle="Choose a secure new password for your OG MUSIC account"
    >
      {verifying ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', gap: '16px' }}>
          <Loader2 size={32} className="spin-animation" color="var(--brand-red, #DC2626)" />
          <div style={{ color: 'var(--text-secondary, #A1A1A1)', fontSize: '14px' }}>
            Verifying reset link with Firebase...
          </div>
        </div>
      ) : codeError ? (
        <div
          style={{
            backgroundColor: 'rgba(220, 38, 38, 0.08)',
            border: '1px solid rgba(220, 38, 38, 0.25)',
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
              backgroundColor: 'rgba(220, 38, 38, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#F87171'
            }}
          >
            <AlertCircle size={28} />
          </div>

          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF', marginBottom: '8px' }}>
              Invalid or Expired Link
            </h3>
            <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.5, margin: 0 }}>
              {codeError}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <Link
              to="/forgot-password"
              className="hover-lift"
              style={{
                backgroundColor: 'var(--brand-red, #DC2626)',
                color: '#FFFFFF',
                textDecoration: 'none',
                padding: '12px 20px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '14px'
              }}
            >
              Request New Link
            </Link>
            <Link
              to="/login"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#FFFFFF',
                textDecoration: 'none',
                padding: '12px 20px',
                borderRadius: '12px',
                fontWeight: 600,
                fontSize: '14px'
              }}
            >
              Sign In
            </Link>
          </div>
        </div>
      ) : submitSuccess ? (
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
              Password Successfully Updated
            </h3>
            <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.5, margin: 0 }}>
              Your account password has been safely updated. You can now sign in with your new credentials.
            </p>
          </div>

          <button
            onClick={() => navigate('/login', { replace: true })}
            className="hover-lift"
            style={{
              marginTop: '8px',
              backgroundColor: 'var(--brand-red, #DC2626)',
              color: '#FFFFFF',
              border: 'none',
              padding: '12px 28px',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)'
            }}
          >
            Sign In with New Password
          </button>
        </div>
      ) : (
        <>
          {associatedEmail && (
            <div
              style={{
                fontSize: '13px',
                color: 'var(--text-secondary, #A1A1A1)',
                marginBottom: '16px'
              }}
            >
              Resetting password for: <strong style={{ color: '#FFFFFF' }}>{associatedEmail}</strong>
            </div>
          )}

          {formError && (
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
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label
                htmlFor="reset-new-password"
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-secondary, #A1A1A1)',
                  marginBottom: '6px'
                }}
              >
                New Password <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>(Min 6 characters)</span>
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
                  id="reset-new-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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

            <div>
              <label
                htmlFor="reset-confirm-password"
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-secondary, #A1A1A1)',
                  marginBottom: '6px'
                }}
              >
                Confirm New Password
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
                  id="reset-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  placeholder="Re-enter new password"
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

            <button
              type="submit"
              disabled={submitting}
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
                cursor: submitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 20px rgba(220, 38, 38, 0.45)',
                letterSpacing: '0.4px',
                opacity: submitting ? 0.75 : 1
              }}
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="spin-animation" />
                  <span>Saving New Password...</span>
                </>
              ) : (
                'Save New Password'
              )}
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center' }}>
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
