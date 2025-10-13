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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [existingCredentials, setExistingCredentials] = useState<{ username: string } | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState('');

  useEffect(() => {
    console.log('🔐 ClientCredentialsManager mounted for:', clientName, clientId);
    loadExistingCredentials();
  }, [clientId]);

  const loadExistingCredentials = async () => {
    const creds = await authService.getClientCredentials(clientId);
    if (creds) {
      setExistingCredentials(creds);
      setUsername(creds.username);
    } else {
      // Generate default username from client name
      const defaultUsername = clientName.toLowerCase().replace(/\s+/g, '');
      setUsername(defaultUsername);
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
    setGeneratedPassword(newPassword);
    setShowPassword(true);
  };

  const handleCreateCredentials = async () => {
    if (!username || !password) {
      setError('Please provide both username and password');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const result = await authService.createClientCredentials(clientId, username, password);

    if (result.success) {
      setSuccess('Credentials created successfully!');
      setExistingCredentials({ username });
    } else {
      setError(result.error || 'Failed to create credentials');
    }

    setLoading(false);
  };

  const handleUpdatePassword = async () => {
    if (!password) {
      setError('Please provide a new password');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const result = await authService.updateClientPassword(clientId, password);

    if (result.success) {
      setSuccess('Password updated successfully!');
      setGeneratedPassword(password);
    } else {
      setError(result.error || 'Failed to update password');
    }

    setLoading(false);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setSuccess(`${label} copied to clipboard!`);
      setTimeout(() => setSuccess(''), 2000);
    });
  };

  const copyCredentialsMessage = () => {
    const message = `Hi ${clientName},\n\nHere are your login credentials for your training program:\n\nUsername: ${username}\nPassword: ${password}\n\nKeep these credentials safe and don't share them with anyone.\n\nBest regards,\nYour Coach`;
    
    navigator.clipboard.writeText(message).then(() => {
      setSuccess('Credentials message copied! Ready to share with client.');
      setTimeout(() => setSuccess(''), 3000);
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[10000]">
      <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-700">
        {/* Header */}
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
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={!!existingCredentials}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Enter username"
              />
              {existingCredentials && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <Check className="w-5 h-5 text-green-500" />
                </div>
              )}
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Password
            </label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter or generate password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <button
                onClick={generatePassword}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg border border-slate-600 transition-colors flex items-center space-x-2"
                title="Generate random password"
              >
                <Key className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3">
              <p className="text-green-200 text-sm">{success}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            {!existingCredentials ? (
              <button
                onClick={handleCreateCredentials}
                disabled={loading || !username || !password}
                className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold py-2 px-4 rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Credentials'}
              </button>
            ) : (
              <button
                onClick={handleUpdatePassword}
                disabled={loading || !password}
                className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold py-2 px-4 rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            )}
          </div>

          {/* Copy Actions */}
          {existingCredentials && password && (
            <div className="space-y-2 pt-4 border-t border-slate-700">
              <p className="text-sm text-slate-400 mb-2">Quick Actions:</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => copyToClipboard(username, 'Username')}
                  className="flex items-center justify-center space-x-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors text-sm"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy Username</span>
                </button>
                <button
                  onClick={() => copyToClipboard(password, 'Password')}
                  className="flex items-center justify-center space-x-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors text-sm"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy Password</span>
                </button>
              </div>
              <button
                onClick={copyCredentialsMessage}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white rounded-lg transition-all text-sm font-medium"
              >
                <Copy className="w-4 h-4" />
                <span>Copy Full Message for Client</span>
              </button>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mt-4">
            <p className="text-blue-300 text-xs leading-relaxed">
              💡 <strong>Tip:</strong> After creating credentials, copy the full message and send it to your client along with their program link. They'll need these credentials to access their training program.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

