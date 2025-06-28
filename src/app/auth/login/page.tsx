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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-6">
        <div className="bg-white border border-gray-200 p-8">
          <div className="mb-8">
            <Link href="/" className="text-xl font-medium text-gray-900">
              AUCTIONFANS
            </Link>
            <h2 className="mt-6 text-heading text-gray-900">
              Sign In
            </h2>
            <p className="mt-2 text-caption text-gray-600">
              Don&apos;t have an account?{' '}
              <Link 
                href="/auth/register"
                className="text-gray-900 hover:underline"
              >
                Create one here
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 text-caption">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-caption text-gray-700 mb-2">
                EMAIL ADDRESS
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input w-full"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-caption text-gray-700 mb-2">
                PASSWORD
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input w-full"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
