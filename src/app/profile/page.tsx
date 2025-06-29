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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || !profileData) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
          <p className="text-zinc-400 mb-6">Unable to load profile information.</p>
          <Link 
            href="/dashboard" 
            className="inline-block px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}></div>
      </div>

      <div className="relative max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center text-zinc-400 hover:text-white text-sm mb-6 transition-colors"
          >
            ← Back to Dashboard
          </Link>
          
          <div className="w-12 h-1 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full mb-4"></div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black text-white mb-3 tracking-tight">
                PROFILE SETTINGS
              </h1>
              <p className="text-zinc-400 text-lg">Manage your account information and preferences</p>
            </div>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors"
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex space-x-3">
                <button
                  onClick={handleCancel}
                  className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-600 text-white font-medium rounded-lg transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-950/50 border border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 text-center">
              <div className="mb-6">
                {profileData.user.profile_image_url ? (
                  <Image
                    src={profileData.user.profile_image_url}
                    alt={profileData.user.display_name || profileData.user.username}
                    width={96}
                    height={96}
                    className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">
                      {(profileData.user.display_name || profileData.user.username).charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                
                <h2 className="text-xl font-bold text-white mb-1">
                  {profileData.user.display_name || profileData.user.username}
                </h2>
                <p className="text-zinc-400 text-sm mb-3">@{profileData.user.username}</p>
                
                <div className="flex items-center justify-center space-x-2">
                  {profileData.user.is_creator && (
                    <span className="px-2 py-1 bg-violet-500/20 border border-violet-500/30 rounded text-xs font-mono text-violet-300">
                      CREATOR
                    </span>
                  )}
                  {profileData.user.is_verified && (
                    <span className="px-2 py-1 bg-green-600/20 border border-green-600/30 rounded text-xs font-mono text-green-300">
                      VERIFIED
                    </span>
                  )}
                </div>
              </div>

              {profileData.user.bio && (
                <div className="mb-6">
                  <p className="text-sm text-zinc-300 leading-relaxed">{profileData.user.bio}</p>
                </div>
              )}

              <div className="text-xs text-zinc-500">
                <p>Member since {new Date(profileData.user.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-1 h-5 bg-violet-500 rounded-full mr-3"></div>
                <h3 className="text-lg font-semibold text-white">Activity Stats</h3>
              </div>
              <div className="space-y-4">
                {profileData.user.is_creator && (
                  <>
                    <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                      <span className="text-zinc-400 text-sm">Auctions Created</span>
                      <span className="text-white font-semibold">{profileData.stats.auctions_created}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                      <span className="text-zinc-400 text-sm">Items Sold</span>
                      <span className="text-white font-semibold">{profileData.stats.items_sold}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                  <span className="text-zinc-400 text-sm">Bids Placed</span>
                  <span className="text-white font-semibold">{profileData.stats.bids_placed}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                  <span className="text-zinc-400 text-sm">Items Watched</span>
                  <span className="text-white font-semibold">{profileData.stats.items_watched}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-zinc-400 text-sm">Items Bought</span>
                  <span className="text-white font-semibold">{profileData.stats.items_bought}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
              <div className="flex items-center mb-6">
                <div className="w-1 h-6 bg-violet-500 rounded-full mr-3"></div>
                <h3 className="text-xl font-semibold text-white">Basic Information</h3>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-2 uppercase tracking-wide">
                      Email Address
                    </label>
                    {editing ? (
                      <div className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-500 cursor-not-allowed">
                        {profileData.user.email}
                      </div>
                    ) : (
                      <p className="text-white text-sm">{profileData.user.email}</p>
                    )}
                    {editing && (
                      <p className="text-xs text-zinc-500 mt-1">Email cannot be changed</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-2 uppercase tracking-wide">
                      Username
                    </label>
                    {editing ? (
                      <div className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-500 cursor-not-allowed">
                        @{profileData.user.username}
                      </div>
                    ) : (
                      <p className="text-white text-sm">@{profileData.user.username}</p>
                    )}
                    {editing && (
                      <p className="text-xs text-zinc-500 mt-1">Username cannot be changed</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="display_name" className="block text-xs font-medium text-zinc-300 mb-2 uppercase tracking-wide">
                    Display Name
                  </label>
                  {editing ? (
                    <input
                      id="display_name"
                      name="display_name"
                      type="text"
                      value={formData.display_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                      placeholder="Your display name"
                    />
                  ) : (
                    <p className="text-white text-sm">{profileData.user.display_name || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="bio" className="block text-xs font-medium text-zinc-300 mb-2 uppercase tracking-wide">
                    Bio
                  </label>
                  {editing ? (
                    <textarea
                      id="bio"
                      name="bio"
                      rows={4}
                      value={formData.bio}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors resize-none"
                      placeholder="Tell us about yourself..."
                    />
                  ) : (
                    <p className="text-white text-sm">{profileData.user.bio || 'No bio provided'}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="profile_image_url" className="block text-xs font-medium text-zinc-300 mb-2 uppercase tracking-wide">
                    Profile Image URL
                  </label>
                  {editing ? (
                    <input
                      id="profile_image_url"
                      name="profile_image_url"
                      type="url"
                      value={formData.profile_image_url}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                      placeholder="https://example.com/your-image.jpg"
                    />
                  ) : (
                    <p className="text-white text-sm">{profileData.user.profile_image_url || 'No image set'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Creator Information */}
            {profileData.user.is_creator && (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
                <div className="flex items-center mb-6">
                  <div className="w-1 h-6 bg-violet-500 rounded-full mr-3"></div>
                  <h3 className="text-xl font-semibold text-white">Creator Information</h3>
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="channel_name" className="block text-xs font-medium text-zinc-300 mb-2 uppercase tracking-wide">
                        Channel Name
                      </label>
                      {editing ? (
                        <input
                          id="channel_name"
                          name="channel_name"
                          type="text"
                          value={formData.channel_name}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                          placeholder="Your channel name"
                        />
                      ) : (
                        <p className="text-white text-sm">{profileData.creatorProfile?.channel_name || 'Not set'}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="platform" className="block text-xs font-medium text-zinc-300 mb-2 uppercase tracking-wide">
                        Platform
                      </label>
                      {editing ? (
                        <select
                          id="platform"
                          name="platform"
                          value={formData.platform}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
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
                        <p className="text-white text-sm capitalize">{profileData.creatorProfile?.platform || 'Not set'}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="channel_url" className="block text-xs font-medium text-zinc-300 mb-2 uppercase tracking-wide">
                      Channel URL
                    </label>
                    {editing ? (
                      <input
                        id="channel_url"
                        name="channel_url"
                        type="url"
                        value={formData.channel_url}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                        placeholder="https://youtube.com/c/yourchannel"
                      />
                    ) : (
                      <p className="text-white text-sm">
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
                    )}
                  </div>

                  <div>
                    <label htmlFor="subscriber_count" className="block text-xs font-medium text-zinc-300 mb-2 uppercase tracking-wide">
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
                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                        placeholder="0"
                      />
                    ) : (
                      <p className="text-white text-sm">
                        {profileData.creatorProfile?.subscriber_count?.toLocaleString() || '0'}
                      </p>
                    )}
                  </div>

                  {profileData.creatorProfile?.verification_status && (
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-2 uppercase tracking-wide">
                        Verification Status
                      </label>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-mono ${
                        profileData.creatorProfile.verification_status === 'verified' ? 'bg-green-600/20 border border-green-600/30 text-green-300' :
                        profileData.creatorProfile.verification_status === 'pending' ? 'bg-yellow-600/20 border border-yellow-600/30 text-yellow-300' :
                        'bg-red-600/20 border border-red-600/30 text-red-300'
                      }`}>
                        {profileData.creatorProfile.verification_status.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
