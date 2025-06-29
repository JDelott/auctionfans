'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    display_name: '',
    is_creator: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const isCreatorMode = searchParams.get('creator') === 'true';

  useState(() => {
    if (isCreatorMode) {
      setFormData(prev => ({ ...prev, is_creator: true }));
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      await register({
        email: formData.email,
        password: formData.password,
        username: formData.username,
        display_name: formData.display_name || undefined,
        is_creator: formData.is_creator,
      });
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center py-12 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}></div>
      </div>

      {/* Electric Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-px h-32 bg-gradient-to-b from-transparent via-violet-500/30 to-transparent"></div>
        <div className="absolute bottom-1/3 left-1/3 w-px h-24 bg-gradient-to-b from-transparent via-red-500/20 to-transparent"></div>
      </div>

      <div className="relative max-w-lg w-full mx-6 z-10">
        <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-lg p-8 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
          <div className="mb-8">
            <Link href="/" className="text-2xl font-black tracking-tight">
              <span className="text-white">FAN</span>
              <span className="text-violet-400">VAULT</span>
            </Link>
            <div className="w-12 h-0.5 bg-gradient-to-r from-violet-500 to-purple-500 mt-4 mb-6"></div>
            <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
              {isCreatorMode ? (
                <>
                  JOIN AS <span className="text-red-400">CREATOR</span>
                </>
              ) : (
                'CREATE ACCOUNT'
              )}
            </h2>
            <p className="text-zinc-400">
              Already have an account?{' '}
              <Link
                href="/auth/login"
                className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-950/50 border border-red-800 rounded-lg p-4">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-zinc-300 mb-2 uppercase tracking-wide">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                  placeholder="your@email.com"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="username" className="block text-xs font-medium text-zinc-300 mb-2 uppercase tracking-wide">
                    Username
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                    placeholder="username"
                  />
                </div>

                <div>
                  <label htmlFor="display_name" className="block text-xs font-medium text-zinc-300 mb-2 uppercase tracking-wide">
                    Display Name <span className="text-zinc-500 normal-case">(Optional)</span>
                  </label>
                  <input
                    id="display_name"
                    name="display_name"
                    type="text"
                    value={formData.display_name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                    placeholder="Display Name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="password" className="block text-xs font-medium text-zinc-300 mb-2 uppercase tracking-wide">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                    placeholder="Minimum 8 characters"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-xs font-medium text-zinc-300 mb-2 uppercase tracking-wide">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                    placeholder="Confirm password"
                  />
                </div>
              </div>

              {!isCreatorMode && (
                <div className="flex items-start space-x-3 p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                  <input
                    id="is_creator"
                    name="is_creator"
                    type="checkbox"
                    checked={formData.is_creator}
                    onChange={handleChange}
                    className="mt-1 w-4 h-4 text-violet-600 bg-zinc-700 border-zinc-600 rounded focus:ring-violet-500 focus:ring-1"
                  />
                  <label htmlFor="is_creator" className="text-sm text-zinc-300 leading-relaxed">
                    I am a content creator and want to sell items from my videos
                  </label>
                </div>
              )}

              {isCreatorMode && (
                <div className="p-4 bg-red-950/20 border border-red-800/30 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-red-400 font-medium text-sm uppercase tracking-wide">Creator Mode</span>
                  </div>
                  <p className="text-zinc-300 text-sm leading-relaxed">
                    You&apos;re registering as a content creator. You&apos;ll be able to list and sell items from your content.
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 hover:-translate-y-0.5 overflow-hidden ${
                isCreatorMode 
                  ? 'bg-red-600 hover:bg-red-700 disabled:bg-zinc-600 hover:shadow-[0_10px_20px_rgba(239,68,68,0.3)]'
                  : 'bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-600 hover:shadow-[0_10px_20px_rgba(139,92,246,0.3)]'
              } text-white`}
            >
              <span className="relative z-10 tracking-wide uppercase text-sm">
                {loading ? 'CREATING ACCOUNT...' : isCreatorMode ? 'JOIN AS CREATOR' : 'CREATE ACCOUNT'}
              </span>
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                isCreatorMode 
                  ? 'bg-gradient-to-r from-red-600 to-red-700'
                  : 'bg-gradient-to-r from-violet-600 to-purple-600'
              }`}></div>
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-zinc-800">
            <Link
              href="/"
              className="text-zinc-400 hover:text-white text-sm transition-colors inline-flex items-center"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
