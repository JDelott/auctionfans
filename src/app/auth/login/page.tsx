'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}></div>
      </div>

      {/* Electric Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-px h-32 bg-gradient-to-b from-transparent via-violet-500/30 to-transparent"></div>
        <div className="absolute bottom-1/3 right-1/3 w-px h-24 bg-gradient-to-b from-transparent via-red-500/20 to-transparent"></div>
      </div>

      <div className="relative max-w-md w-full mx-6 z-10">
        <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-lg p-8 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
          <div className="mb-8">
            <Link href="/" className="text-2xl font-black tracking-tight">
              <span className="text-white">FAN</span>
              <span className="text-violet-400">VAULT</span>
            </Link>
            <div className="w-12 h-0.5 bg-gradient-to-r from-violet-500 to-purple-500 mt-4 mb-6"></div>
            <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
              SIGN IN
            </h2>
            <p className="text-zinc-400">
              Don&apos;t have an account?{' '}
              <Link 
                href="/auth/register"
                className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
              >
                Create one here
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-950/50 border border-red-800 rounded-lg p-4">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}
            
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-zinc-300 mb-2 uppercase tracking-wide">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(139,92,246,0.3)] overflow-hidden"
            >
              <span className="relative z-10 tracking-wide uppercase text-sm">
                {loading ? 'SIGNING IN...' : 'SIGN IN'}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
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
