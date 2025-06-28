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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-6">
        <div className="bg-white border border-gray-200 p-8">
          <div className="mb-8">
            <Link href="/" className="text-xl font-medium text-gray-900">
              AUCTIONFANS
            </Link>
            <h2 className="mt-6 text-heading text-gray-900">
              {isCreatorMode ? 'Creator Registration' : 'Create Account'}
            </h2>
            <p className="mt-2 text-caption text-gray-600">
              Already have an account?{' '}
              <Link
                href="/auth/login"
                className="text-gray-900 hover:underline"
              >
                Sign in here
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 text-caption">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 gap-6">
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
                  value={formData.email}
                  onChange={handleChange}
                  className="input w-full"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label htmlFor="username" className="block text-caption text-gray-700 mb-2">
                  USERNAME
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="input w-full"
                  placeholder="username"
                />
              </div>

              <div>
                <label htmlFor="display_name" className="block text-caption text-gray-700 mb-2">
                  DISPLAY NAME (OPTIONAL)
                </label>
                <input
                  id="display_name"
                  name="display_name"
                  type="text"
                  value={formData.display_name}
                  onChange={handleChange}
                  className="input w-full"
                  placeholder="Display Name"
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
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="input w-full"
                  placeholder="Minimum 8 characters"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-caption text-gray-700 mb-2">
                  CONFIRM PASSWORD
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input w-full"
                  placeholder="Confirm password"
                />
              </div>

              <div className="flex items-start space-x-3">
                <input
                  id="is_creator"
                  name="is_creator"
                  type="checkbox"
                  checked={formData.is_creator}
                  onChange={handleChange}
                  className="mt-1 w-4 h-4 text-gray-900 border-gray-300 focus:ring-0 focus:ring-offset-0"
                />
                <label htmlFor="is_creator" className="text-caption text-gray-700">
                  I am a content creator and want to sell items from my videos
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
