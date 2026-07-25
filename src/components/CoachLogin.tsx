import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, Shield } from 'lucide-react';
import { authService } from '../lib/authService';

interface CoachLoginProps {
  onLoginSuccess: () => void;
}

export const CoachLogin: React.FC<CoachLoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await authService.loginCoach(username, password);

      if (result.success) {
        onLoginSuccess();
      } else {
        setError(result.error || 'Login failed');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="client-login-shell workout-shell">
      <div className="client-login-glow" aria-hidden />

      <div className="client-login-inner">
        <header className="client-login-brand home-anim">
          <img
            src="/brand-logo-light.png"
            alt="Unbreakables"
            className="client-login-logo"
          />
          <p className="client-login-eyebrow font-saira">UNBREAKABLES</p>
          <h1 className="client-login-title font-saira">Coach sign in</h1>
          <p className="client-login-sub">Access your coaching dashboard</p>
        </header>

        <div className="client-login-card home-anim" style={{ animationDelay: '60ms' }}>
          <form onSubmit={handleSubmit} className="client-login-form">
            <label className="client-login-field" htmlFor="coach-username">
              <span className="client-login-label">Username</span>
              <div className="client-login-input-wrap">
                <User className="client-login-ic" aria-hidden />
                <input
                  type="text"
                  id="coach-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="client-login-input"
                  placeholder="Username"
                  required
                  autoComplete="username"
                />
              </div>
            </label>

            <label className="client-login-field" htmlFor="coach-password">
              <span className="client-login-label">Password</span>
              <div className="client-login-input-wrap">
                <Lock className="client-login-ic" aria-hidden />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="coach-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="client-login-input client-login-input--pwd"
                  placeholder="Password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="client-login-eye"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </label>

            {error && (
              <div className="client-login-error" role="alert">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="client-login-submit">
              {loading ? (
                <>
                  <span className="client-login-spinner" aria-hidden />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        <div className="client-login-note home-anim" style={{ animationDelay: '120ms' }}>
          <Shield className="w-4 h-4 shrink-0" style={{ color: 'var(--red)' }} aria-hidden />
          <p>Coach access only. Keep your credentials private.</p>
        </div>
      </div>
    </div>
  );
};
