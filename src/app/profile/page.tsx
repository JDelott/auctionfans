'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface User {
  id: string;
  email: string;
  username: string;
  display_name?: string;
  bio?: string;
  profile_image_url?: string;
  is_creator: boolean;
  is_verified: boolean;
  created_at: string;
}

interface CreatorProfile {
  id: string;
  user_id: string;
  channel_name?: string;
  channel_url?: string;
  platform?: string;
  subscriber_count: number;
  verification_status: string;
  created_at: string;
  updated_at: string;
}

interface UserStats {
  auctions_created: number;
  bids_placed: number;
  items_watched: number;
  items_sold: number;
  items_bought: number;
}

interface ProfileData {
  user: User;
  creatorProfile?: CreatorProfile;
  stats: UserStats;
}

export default function ProfilePage() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    profile_image_url: '',
    // Creator fields
    channel_name: '',
    channel_url: '',
    platform: '',
    subscriber_count: 0
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
        
        // Populate form with existing data
        setFormData({
          display_name: data.user.display_name || '',
          bio: data.user.bio || '',
          profile_image_url: data.user.profile_image_url || '',
          channel_name: data.creatorProfile?.channel_name || '',
          channel_url: data.creatorProfile?.channel_url || '',
          platform: data.creatorProfile?.platform || '',
          subscriber_count: data.creatorProfile?.subscriber_count || 0
        });
      } else {
        setError('Failed to load profile data');
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleSave = async () => {
    setError('');
    setSaving(true);

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchProfile(); // Refresh profile data
        await refreshUser(); // Refresh user data in auth context
        setEditing(false);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profileData) {
      // Reset form to original data
      setFormData({
        display_name: profileData.user.display_name || '',
        bio: profileData.user.bio || '',
        profile_image_url: profileData.user.profile_image_url || '',
        channel_name: profileData.creatorProfile?.channel_name || '',
        channel_url: profileData.creatorProfile?.channel_url || '',
        platform: profileData.creatorProfile?.platform || '',
        subscriber_count: profileData.creatorProfile?.subscriber_count || 0
      });
    }
    setEditing(false);
    setError('');
  };

  const getPlatformColor = (platform: string) => {
    const colors: { [key: string]: string } = {
      'youtube': 'bg-red-500/20 text-red-300 border-red-500/30',
      'twitch': 'bg-violet-500/20 text-violet-300 border-violet-500/30',
      'tiktok': 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30',
      'instagram': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
      'twitter': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    };
    return colors[platform?.toLowerCase()] || 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30';
  };

  const formatSubscriberCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="relative">
          <div className="w-12 h-12 border border-violet-400/30 border-t-violet-400 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-12 h-12 border border-violet-400/10 rounded-full animate-ping"></div>
        </div>
      </div>
    );
  }

  if (!user || !profileData) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-black text-white mb-6">PROFILE NOT FOUND</h1>
          <p className="text-zinc-400 mb-8 font-mono text-sm tracking-[0.15em] uppercase">Unable to load profile information</p>
          <Link 
            href="/dashboard" 
            className="group relative overflow-hidden px-8 py-4 rounded-xl border border-violet-400/30 bg-gradient-to-r from-violet-500/10 to-purple-500/10 backdrop-blur-sm text-white font-mono text-sm tracking-[0.15em] hover:from-violet-500/20 hover:to-purple-500/20 hover:border-violet-400/50 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <span className="relative">GO TO DASHBOARD</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white relative overflow-hidden">
      {/* Electric Grid Background */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      {/* Electric Accent Lines */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-0 w-1/3 h-px bg-gradient-to-r from-transparent via-violet-400/20 to-transparent"></div>
        <div className="absolute top-40 right-0 w-1/4 h-px bg-gradient-to-l from-transparent via-emerald-400/20 to-transparent"></div>
        <div className="absolute bottom-1/3 left-1/4 w-px h-32 bg-gradient-to-b from-transparent via-violet-400/20 to-transparent"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-8 py-16">
        {/* Electric Header */}
        <header className="mb-16">
          <nav className="mb-8">
            <Link 
              href="/dashboard" 
              className="inline-flex items-center text-zinc-400 hover:text-white font-mono text-sm tracking-[0.15em] transition-colors group"
            >
              <span className="group-hover:-translate-x-1 transition-transform duration-200">←</span>
              <span className="ml-2">BACK TO DASHBOARD</span>
            </Link>
          </nav>
          
          <div className="flex items-start justify-between mb-12">
            <div>
              <div className="flex items-center space-x-6 mb-8">
                <div className="w-1 h-16 bg-gradient-to-b from-violet-400 to-purple-500"></div>
                <div>
                  <h1 className="text-5xl font-black text-white tracking-tight mb-2">
                    PROFILE SETTINGS
                  </h1>
                  <p className="text-zinc-400 font-mono text-sm tracking-[0.2em] uppercase">
                    MANAGE YOUR ACCOUNT INFORMATION
                  </p>
                </div>
              </div>
            </div>
            
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="group relative overflow-hidden px-8 py-4 rounded-xl border border-violet-400/30 bg-gradient-to-r from-violet-500/10 to-purple-500/10 backdrop-blur-sm text-white font-mono text-sm tracking-[0.15em] hover:from-violet-500/20 hover:to-purple-500/20 hover:border-violet-400/50 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative">EDIT PROFILE</span>
              </button>
            ) : (
              <div className="flex gap-4">
                <button
                  onClick={handleCancel}
                  className="group relative overflow-hidden px-8 py-4 rounded-xl border border-zinc-700/30 bg-zinc-900/30 backdrop-blur-sm text-zinc-300 font-mono text-sm tracking-[0.15em] hover:bg-zinc-800/50 hover:text-white hover:border-zinc-600/50 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-zinc-700/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative">CANCEL</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="group relative overflow-hidden px-8 py-4 rounded-xl border border-emerald-400/30 bg-gradient-to-r from-emerald-500/10 to-green-500/10 backdrop-blur-sm text-white font-mono text-sm tracking-[0.15em] hover:from-emerald-500/20 hover:to-green-500/20 hover:border-emerald-400/50 transition-all duration-300 disabled:opacity-50"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-green-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative">{saving ? 'SAVING...' : 'SAVE CHANGES'}</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {error && (
          <div className="relative overflow-hidden rounded-2xl border border-red-500/30 bg-red-500/10 backdrop-blur-xl p-6 mb-12">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent"></div>
            <div className="relative">
              <p className="text-red-300 font-mono text-sm tracking-[0.1em]">{error}</p>
            </div>
          </div>
        )}

        {/* Electric Profile Overview */}
        <section className="relative overflow-hidden rounded-2xl border border-zinc-700/30 bg-zinc-900/30 backdrop-blur-xl mb-12">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-transparent"></div>
          <div className="relative p-12">
            <div className="flex items-start gap-12">
              {/* Profile Image */}
              <div className="flex-shrink-0">
                {profileData.user.profile_image_url ? (
                  <div className="relative w-32 h-32">
                    <Image
                      src={profileData.user.profile_image_url}
                      alt={profileData.user.display_name || profileData.user.username}
                      fill
                      className="rounded-2xl object-cover border-2 border-zinc-700/30"
                    />
                  </div>
                ) : (
                  <div className="w-32 h-32 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center border-2 border-zinc-700/30">
                    <span className="text-white text-4xl font-bold">
                      {(profileData.user.display_name || profileData.user.username).charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <h2 className="text-4xl font-black text-white mb-3 tracking-tight">
                  {profileData.user.display_name || profileData.user.username}
                </h2>
                <p className="text-xl text-zinc-400 font-mono tracking-[0.1em] mb-6">
                  @{profileData.user.username}
                </p>
                
                {/* Electric Badges */}
                <div className="flex flex-wrap gap-4 mb-8">
                  {profileData.user.is_creator && (
                    <div className="px-4 py-2 bg-violet-500/20 border border-violet-500/30 rounded-xl text-xs font-mono text-violet-300 tracking-[0.1em] backdrop-blur-sm">
                      CREATOR
                    </div>
                  )}
                  {profileData.user.is_verified && (
                    <div className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-xs font-mono text-emerald-300 tracking-[0.1em] backdrop-blur-sm">
                      VERIFIED
                    </div>
                  )}
                  {profileData.creatorProfile?.platform && (
                    <div className={`px-4 py-2 rounded-xl text-xs font-mono tracking-[0.1em] border backdrop-blur-sm ${getPlatformColor(profileData.creatorProfile.platform)}`}>
                      {profileData.creatorProfile.platform.toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Bio */}
                {profileData.user.bio && (
                  <div className="mb-8">
                    <p className="text-zinc-300 text-lg leading-relaxed max-w-3xl">
                      {profileData.user.bio}
                    </p>
                  </div>
                )}

                {/* Member Since */}
                <p className="text-zinc-500 font-mono text-sm tracking-[0.1em] uppercase">
                  Member since {new Date(profileData.user.created_at).getFullYear()}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Electric Activity Stats */}
        <section className="relative overflow-hidden rounded-2xl border border-zinc-700/30 bg-zinc-900/30 backdrop-blur-xl mb-12">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent"></div>
          <div className="relative p-12">
            <div className="flex items-center space-x-6 mb-8">
              <div className="w-12 h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent"></div>
              <h3 className="text-2xl font-black text-white tracking-tight">ACTIVITY OVERVIEW</h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
              {profileData.user.is_creator && (
                <>
                  <div className="text-center">
                    <div className="text-4xl font-black text-violet-400 mb-2">
                      {profileData.stats.auctions_created}
                    </div>
                    <div className="text-zinc-400 font-mono text-xs tracking-[0.15em] uppercase">
                      Auctions Created
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-black text-emerald-400 mb-2">
                      {profileData.stats.items_sold}
                    </div>
                    <div className="text-zinc-400 font-mono text-xs tracking-[0.15em] uppercase">
                      Items Sold
                    </div>
                  </div>
                </>
              )}
              <div className="text-center">
                <div className="text-4xl font-black text-zinc-300 mb-2">
                  {profileData.stats.bids_placed}
                </div>
                <div className="text-zinc-400 font-mono text-xs tracking-[0.15em] uppercase">
                  Bids Placed
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-black text-zinc-300 mb-2">
                  {profileData.stats.items_watched}
                </div>
                <div className="text-zinc-400 font-mono text-xs tracking-[0.15em] uppercase">
                  Items Watched
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-black text-zinc-300 mb-2">
                  {profileData.stats.items_bought}
                </div>
                <div className="text-zinc-400 font-mono text-xs tracking-[0.15em] uppercase">
                  Items Bought
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Electric Account Settings */}
        <section className="relative overflow-hidden rounded-2xl border border-zinc-700/30 bg-zinc-900/30 backdrop-blur-xl mb-12">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-transparent"></div>
          <div className="relative p-12">
            <div className="flex items-center space-x-6 mb-8">
              <div className="w-12 h-px bg-gradient-to-r from-transparent via-violet-400 to-transparent"></div>
              <h3 className="text-2xl font-black text-white tracking-tight">ACCOUNT SETTINGS</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Email */}
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-3 uppercase tracking-[0.2em]">
                  Email Address
                </label>
                <div className="p-6 bg-zinc-800/50 border border-zinc-700/50 rounded-xl backdrop-blur-sm">
                  <p className="text-white font-mono text-sm">{profileData.user.email}</p>
                  <p className="text-xs text-zinc-500 font-mono mt-2 tracking-[0.1em]">Email cannot be changed</p>
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-3 uppercase tracking-[0.2em]">
                  Username
                </label>
                <div className="p-6 bg-zinc-800/50 border border-zinc-700/50 rounded-xl backdrop-blur-sm">
                  <p className="text-white font-mono text-sm">@{profileData.user.username}</p>
                  <p className="text-xs text-zinc-500 font-mono mt-2 tracking-[0.1em]">Username cannot be changed</p>
                </div>
              </div>

              {/* Display Name */}
              <div>
                <label htmlFor="display_name" className="block text-xs font-mono text-zinc-400 mb-3 uppercase tracking-[0.2em]">
                  Display Name
                </label>
                {editing ? (
                  <input
                    id="display_name"
                    name="display_name"
                    type="text"
                    value={formData.display_name}
                    onChange={handleInputChange}
                    className="w-full px-6 py-4 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-500 font-mono text-sm backdrop-blur-sm focus:outline-none focus:border-violet-400/50 focus:bg-zinc-800/70 transition-all duration-300"
                    placeholder="Your display name"
                  />
                ) : (
                  <div className="p-6 bg-zinc-800/50 border border-zinc-700/50 rounded-xl backdrop-blur-sm">
                    <p className="text-white font-mono text-sm">{profileData.user.display_name || 'Not set'}</p>
                  </div>
                )}
              </div>

              {/* Profile Image URL */}
              <div>
                <label htmlFor="profile_image_url" className="block text-xs font-mono text-zinc-400 mb-3 uppercase tracking-[0.2em]">
                  Profile Image URL
                </label>
                {editing ? (
                  <input
                    id="profile_image_url"
                    name="profile_image_url"
                    type="url"
                    value={formData.profile_image_url}
                    onChange={handleInputChange}
                    className="w-full px-6 py-4 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-500 font-mono text-sm backdrop-blur-sm focus:outline-none focus:border-violet-400/50 focus:bg-zinc-800/70 transition-all duration-300"
                    placeholder="https://example.com/image.jpg"
                  />
                ) : (
                  <div className="p-6 bg-zinc-800/50 border border-zinc-700/50 rounded-xl backdrop-blur-sm">
                    <p className="text-white font-mono text-sm break-all">{profileData.user.profile_image_url || 'Not set'}</p>
                  </div>
                )}
              </div>

              {/* Bio - spans full width */}
              <div className="lg:col-span-2">
                <label htmlFor="bio" className="block text-xs font-mono text-zinc-400 mb-3 uppercase tracking-[0.2em]">
                  Bio
                </label>
                {editing ? (
                  <textarea
                    id="bio"
                    name="bio"
                    rows={4}
                    value={formData.bio}
                    onChange={handleInputChange}
                    className="w-full px-6 py-4 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-500 font-mono text-sm backdrop-blur-sm focus:outline-none focus:border-violet-400/50 focus:bg-zinc-800/70 transition-all duration-300 resize-none"
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <div className="p-6 bg-zinc-800/50 border border-zinc-700/50 rounded-xl backdrop-blur-sm">
                    <p className="text-white font-mono text-sm">{profileData.user.bio || 'No bio provided'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Electric Creator Settings */}
        {profileData.user.is_creator && (
          <section className="relative overflow-hidden rounded-2xl border border-zinc-700/30 bg-zinc-900/30 backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent"></div>
            <div className="relative p-12">
              <div className="flex items-center space-x-6 mb-8">
                <div className="w-12 h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent"></div>
                <h3 className="text-2xl font-black text-white tracking-tight">CREATOR SETTINGS</h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Channel Name */}
                <div>
                  <label htmlFor="channel_name" className="block text-xs font-mono text-zinc-400 mb-3 uppercase tracking-[0.2em]">
                    Channel Name
                  </label>
                  {editing ? (
                    <input
                      id="channel_name"
                      name="channel_name"
                      type="text"
                      value={formData.channel_name}
                      onChange={handleInputChange}
                      className="w-full px-6 py-4 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-500 font-mono text-sm backdrop-blur-sm focus:outline-none focus:border-violet-400/50 focus:bg-zinc-800/70 transition-all duration-300"
                      placeholder="Your channel name"
                    />
                  ) : (
                    <div className="p-6 bg-zinc-800/50 border border-zinc-700/50 rounded-xl backdrop-blur-sm">
                      <p className="text-white font-mono text-sm">{profileData.creatorProfile?.channel_name || 'Not set'}</p>
                    </div>
                  )}
                </div>

                {/* Platform */}
                <div>
                  <label htmlFor="platform" className="block text-xs font-mono text-zinc-400 mb-3 uppercase tracking-[0.2em]">
                    Platform
                  </label>
                  {editing ? (
                    <select
                      id="platform"
                      name="platform"
                      value={formData.platform}
                      onChange={handleInputChange}
                      className="w-full px-6 py-4 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-white font-mono text-sm backdrop-blur-sm focus:outline-none focus:border-violet-400/50 focus:bg-zinc-800/70 transition-all duration-300"
                    >
                      <option value="">Select platform</option>
                      <option value="youtube">YouTube</option>
                      <option value="twitch">Twitch</option>
                      <option value="tiktok">TikTok</option>
                      <option value="instagram">Instagram</option>
                      <option value="twitter">Twitter/X</option>
                      <option value="other">Other</option>
                    </select>
                  ) : (
                    <div className="p-6 bg-zinc-800/50 border border-zinc-700/50 rounded-xl backdrop-blur-sm">
                      <p className="text-white font-mono text-sm capitalize">{profileData.creatorProfile?.platform || 'Not set'}</p>
                    </div>
                  )}
                </div>

                {/* Subscriber Count */}
                <div>
                  <label htmlFor="subscriber_count" className="block text-xs font-mono text-zinc-400 mb-3 uppercase tracking-[0.2em]">
                    Subscriber Count
                  </label>
                  {editing ? (
                    <input
                      id="subscriber_count"
                      name="subscriber_count"
                      type="number"
                      min="0"
                      value={formData.subscriber_count}
                      onChange={handleInputChange}
                      className="w-full px-6 py-4 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-500 font-mono text-sm backdrop-blur-sm focus:outline-none focus:border-violet-400/50 focus:bg-zinc-800/70 transition-all duration-300"
                      placeholder="0"
                    />
                  ) : (
                    <div className="p-6 bg-zinc-800/50 border border-zinc-700/50 rounded-xl backdrop-blur-sm">
                      <p className="text-white font-mono text-sm">
                        {formatSubscriberCount(profileData.creatorProfile?.subscriber_count || 0)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Verification Status */}
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-3 uppercase tracking-[0.2em]">
                    Verification Status
                  </label>
                  <div className="p-6 bg-zinc-800/50 border border-zinc-700/50 rounded-xl backdrop-blur-sm">
                    <span className={`inline-block px-3 py-1 rounded-xl text-xs font-mono tracking-[0.1em] border backdrop-blur-sm ${
                      profileData.user.is_verified 
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                        : 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30'
                    }`}>
                      {profileData.user.is_verified ? 'VERIFIED' : 'UNVERIFIED'}
                    </span>
                  </div>
                </div>

                {/* Channel URL - spans full width */}
                <div className="lg:col-span-2">
                  <label htmlFor="channel_url" className="block text-xs font-mono text-zinc-400 mb-3 uppercase tracking-[0.2em]">
                    Channel URL
                  </label>
                  {editing ? (
                    <input
                      id="channel_url"
                      name="channel_url"
                      type="url"
                      value={formData.channel_url}
                      onChange={handleInputChange}
                      className="w-full px-6 py-4 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-500 font-mono text-sm backdrop-blur-sm focus:outline-none focus:border-violet-400/50 focus:bg-zinc-800/70 transition-all duration-300"
                      placeholder="https://youtube.com/c/yourchannel"
                    />
                  ) : (
                    <div className="p-6 bg-zinc-800/50 border border-zinc-700/50 rounded-xl backdrop-blur-sm">
                      <p className="text-white font-mono text-sm break-all">
                        {profileData.creatorProfile?.channel_url ? (
                          <a 
                            href={profileData.creatorProfile.channel_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-violet-400 hover:text-violet-300 transition-colors"
                          >
                            {profileData.creatorProfile.channel_url}
                          </a>
                        ) : (
                          'Not set'
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
