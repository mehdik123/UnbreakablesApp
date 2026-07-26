import React, { useState, useEffect } from 'react';
import { Key, Copy, Eye, EyeOff, Check, X, Shield } from 'lucide-react';
import { authService } from '../lib/authService';

interface ClientCredentialsManagerProps {
  clientId: string;
  clientName: string;
  onClose: () => void;
}

export const ClientCredentialsManager: React.FC<ClientCredentialsManagerProps> = ({
  clientId,
  clientName,
  onClose
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingCreds, setLoadingCreds] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasExisting, setHasExisting] = useState(false);
  const [savedUsername, setSavedUsername] = useState('');
  const [savedPassword, setSavedPassword] = useState('');

  useEffect(() => {
    loadExistingCredentials();
  }, [clientId]);

  const loadExistingCredentials = async () => {
    setLoadingCreds(true);
    setError('');
    setSuccess('');
    try {
      const creds = await authService.getClientCredentials(clientId);
      if (creds) {
        setHasExisting(true);
        setUsername(creds.username);
        setPassword(creds.password || '');
        setSavedUsername(creds.username);
        setSavedPassword(creds.password || '');
        // Show password when we successfully restored it so coach can review / copy
        if (creds.password) setShowPassword(true);
      } else {
        setHasExisting(false);
        const defaultUsername = clientName.toLowerCase().replace(/\s+/g, '');
        setUsername(defaultUsername);
        setPassword('');
        setSavedUsername('');
        setSavedPassword('');
      }
    } finally {
      setLoadingCreds(false);
    }
  };

  const generatePassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let newPassword = '';
    for (let i = 0; i < length; i++) {
      newPassword += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setPassword(newPassword);
    setShowPassword(true);
  };

  const handleSave = async () => {
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      setError('Please provide both username and password');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const result = hasExisting
      ? await authService.updateClientCredentials(clientId, {
          username: cleanUsername,
          password: cleanPassword,
        })
      : await authService.createClientCredentials(clientId, cleanUsername, cleanPassword);

    if (result.success) {
      setHasExisting(true);
      setSavedUsername(cleanUsername);
      setSavedPassword(cleanPassword);
      setUsername(cleanUsername);
      setPassword(cleanPassword);
      setShowPassword(true);
      setSuccess(hasExisting ? 'Credentials saved.' : 'Credentials created successfully!');
    } else {
      setError(result.error || 'Failed to save credentials');
    }

    setLoading(false);
  };

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setSuccess(`${label} copied to clipboard!`);
      setTimeout(() => setSuccess(''), 2000);
    });
  };

  const copyCredentialsMessage = () => {
    const message = `Hi ${clientName},\n\nHere are your login credentials for your training program:\n\nUsername: ${username.trim()}\nPassword: ${password.trim()}\n\nKeep these credentials safe and don't share them with anyone.\n\nBest regards,\nMehdi`;

    navigator.clipboard.writeText(message).then(() => {
      setSuccess('Credentials message copied! Ready to share with client.');
      setTimeout(() => setSuccess(''), 3000);
    });
  };

  const isDirty =
    username.trim() !== savedUsername || password.trim() !== savedPassword;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[10000]">
      <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Client Credentials</h2>
              <p className="text-sm text-slate-400">{clientName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {loadingCreds ? (
          <p className="text-slate-400 text-sm py-8 text-center">Loading credentials…</p>
        ) : (
          <div className="space-y-4">
            {/*
              autocomplete=off + non-login field names: stops the browser from
              filling the coach account password (e.g. coach123) into this form.
            */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="client-cred-username">
                Username
              </label>
              <div className="relative">
                <input
                  id="client-cred-username"
                  name="client-cred-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any username you want"
                  style={{ fontSize: 16 }}
                />
                {hasExisting && username.trim() === savedUsername && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Check className="w-5 h-5 text-green-500" />
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">You can change this anytime and save.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="client-cred-password">
                Password
              </label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <input
                    id="client-cred-password"
                    name="client-cred-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Any password you want"
                    style={{ fontSize: 16 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition-colors min-w-[44px] justify-center"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={generatePassword}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg border border-slate-600 transition-colors flex items-center justify-center min-h-[44px] min-w-[44px]"
                  title="Generate random password"
                >
                  <Key className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Saved password is shown here so you can look it up later.
              </p>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3">
                <p className="text-green-200 text-sm">{success}</p>
              </div>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={loading || !username.trim() || !password.trim() || (hasExisting && !isDirty)}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold py-2.5 px-4 rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              {loading
                ? 'Saving…'
                : hasExisting
                  ? isDirty
                    ? 'Save changes'
                    : 'Saved'
                  : 'Create credentials'}
            </button>

            {hasExisting && password.trim() && (
              <div className="space-y-2 pt-4 border-t border-slate-700">
                <p className="text-sm text-slate-400 mb-2">Quick Actions:</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(username.trim(), 'Username')}
                    className="flex items-center justify-center space-x-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors text-sm min-h-[44px]"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy Username</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(password.trim(), 'Password')}
                    className="flex items-center justify-center space-x-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors text-sm min-h-[44px]"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy Password</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={copyCredentialsMessage}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white rounded-lg transition-all text-sm font-medium min-h-[44px]"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy Full Message for Client</span>
                </button>
              </div>
            )}

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mt-4">
              <p className="text-blue-300 text-xs leading-relaxed">
                Tip: Pick any username and password, tap Save, then copy the message for your client.
                Re-open Manage Credentials anytime to see or change them — they will not reset.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
