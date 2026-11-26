import { useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Eye,
  EyeOff,
  Leaf,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { authClient } from './auth';
import { Neighborhood } from './Neighborhood';
export default function AuthScreen({ onSignedIn }: { onSignedIn: () => Promise<void> }) {
  const recovery = new URLSearchParams(location.search).get('flow') === 'recovery';
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset' | 'password'>(
    recovery ? 'password' : 'signin',
  );
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  function changeMode(next: typeof mode) {
    setMode(next);
    setError('');
    setMessage('');
    setPassword('');
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const auth = authClient().auth;
      if (mode === 'signup') {
        const result = await auth.signUp({
          email,
          password,
          options: { data: { name: name.trim() }, emailRedirectTo: location.origin + '/' },
        });
        if (result.error) throw result.error;
        setMessage(
          'Check your inbox to confirm your email, then come back to sign in. A confirmed email is required.',
        );
      } else if (mode === 'reset') {
        const { error } = await auth.resetPasswordForEmail(email, {
          redirectTo: location.origin + '/?flow=recovery',
        });
        if (error) throw error;
        setMessage(
          'If an account exists for this email, you’ll receive a password reset link. Check your inbox and spam folder.',
        );
      } else if (mode === 'password') {
        const { error } = await auth.updateUser({ password });
        if (error) throw error;
        history.replaceState(null, '', '/');
        await onSignedIn();
      } else {
        const { error } = await auth.signInWithPassword({ email, password });
        if (error) throw error;
        await onSignedIn();
      }
    } catch (e) {
      setError((e as Error).message || 'Sign-in is temporarily unavailable. Please try again.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-shell">
      <section className="auth-story">
        <div className="brand">
          <span className="brand-mark">
            p<span />
          </span>
          pafupi<span className="brand-period">.</span>
        </div>
        <div className="auth-story-copy">
          <span className="eyebrow">YOUR NEIGHBOURHOOD, CONNECTED</span>
          <h1>
            A little help.
            <br />A lot more <em>possibility.</em>
          </h1>
          <p>
            Everyday tasks meet people who can help. Built around community, starting at Laws
            Campus, Rumphi.
          </p>
          <Neighborhood />
        </div>
        <div className="auth-story-footer">
          <Leaf size={16} />
          Made for Malawi. Built around you.
        </div>
      </section>
      <section className="auth-form-panel">
        <div className="auth-status">
          <ShieldCheck size={17} />
          Account access powered by Supabase
        </div>
        <div className="auth-form-wrap">
          <span className="eyebrow">GOOD TO HAVE YOU HERE</span>
          <h2>
            {mode === 'signup'
              ? 'Make yourself at home.'
              : mode === 'reset'
                ? 'Let’s get you back in.'
                : mode === 'password'
                  ? 'A fresh start.'
                  : 'Welcome, neighbour.'}
          </h2>
          <p>
            {mode === 'signup'
              ? 'Create your own account. Your tasks and conversations stay in your workspace.'
              : mode === 'reset'
                ? 'We’ll send a secure password reset link to your email.'
                : mode === 'password'
                  ? 'Choose a strong new password for your account.'
                  : 'Sign in to pick up where you left off.'}
          </p>
          {['signin', 'signup'].includes(mode) && (
            <div className="auth-tabs">
              <button
                className={mode === 'signin' ? 'active' : ''}
                onClick={() => changeMode('signin')}
              >
                Sign in
              </button>
              <button
                className={mode === 'signup' ? 'active' : ''}
                onClick={() => changeMode('signup')}
              >
                Create account
              </button>
            </div>
          )}
          <form onSubmit={submit}>
            {mode === 'signup' && (
              <label>
                Your display name
                <input
                  autoComplete="nickname"
                  required
                  minLength={2}
                  maxLength={60}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="How should we call you?"
                />
              </label>
            )}
            {mode !== 'password' && (
              <label>
                Email address
                <div className="auth-input">
                  <Mail size={17} />
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={254}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
              </label>
            )}
            {mode !== 'reset' && (
              <label>
                {mode === 'password' ? 'New password' : 'Password'}
                <div className="auth-input">
                  <LockKeyhole size={17} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    required
                    minLength={mode === 'signin' ? 1 : 12}
                    maxLength={128}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={
                      mode === 'signin' ? 'Enter your password' : 'At least 12 characters'
                    }
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((s) => !s)}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </label>
            )}
            {mode === 'signin' && (
              <button
                type="button"
                className="text-link auth-forgot"
                onClick={() => changeMode('reset')}
              >
                Forgot password?
              </button>
            )}
            {mode === 'signup' && (
              <label className="checkbox-label">
                <input type="checkbox" required />
                <span>
                  I understand this is a pre-launch marketplace. I agree to request only safe,
                  lawful tasks and not to share sensitive information in public descriptions.
                </span>
              </label>
            )}
            {error && (
              <div className="error-box" role="alert">
                {error}
              </div>
            )}
            {message && (
              <div className="info-note" role="status">
                <Check size={18} />
                {message}
              </div>
            )}
            <button disabled={busy} className="button primary full">
              {busy ? (
                <LoaderCircle size={18} className="spin" />
              ) : (
                <>
                  {mode === 'signup'
                    ? 'Create account'
                    : mode === 'reset'
                      ? 'Send reset link'
                      : mode === 'password'
                        ? 'Save new password'
                        : 'Sign in'}
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>
          {['reset', 'password'].includes(mode) && (
            <button className="text-link auth-back" onClick={() => changeMode('signin')}>
              Back to sign in
              <ArrowUpRight size={15} />
            </button>
          )}
          <div className="auth-privacy">
            <ShieldCheck size={20} />
            <p>
              Confirmed email is not identity verification. Payments, provider onboarding and live
              fulfilment are not available yet. Never share a mobile money PIN.
            </p>
          </div>
        </div>
        <span className="auth-bottom-note">Your neighbourhood. Your people. Your tasks.</span>
      </section>
    </main>
  );
}
