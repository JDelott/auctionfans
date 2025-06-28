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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || !profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-heading text-gray-900 mb-4">Profile Not Found</h1>
          <p className="text-gray-600 mb-6">Unable to load profile information.</p>
          <Link href="/dashboard" className="btn-primary">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-caption text-gray-600 hover:text-indigo-600 mb-4 inline-block">
            ← BACK TO DASHBOARD
          </Link>
          <div className="accent-bar w-16 mb-4"></div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-heading text-gray-900 mb-2">Profile Settings</h1>
              <p className="text-lg text-gray-600">Manage your account information and preferences</p>
            </div>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="btn-primary"
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex space-x-3">
                <button
                  onClick={handleCancel}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="card p-6 text-center">
              <div className="mb-6">
                {profileData.user.profile_image_url ? (
                  <Image
                    src={profileData.user.profile_image_url}
                    alt={profileData.user.display_name || profileData.user.username}
                    width={96}
                    height={96}
                    className="w-24 h-24 rounded-full mx-auto mb-4"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">
                      {(profileData.user.display_name || profileData.user.username).charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                
                <h2 className="text-subheading text-gray-900 mb-1">
                  {profileData.user.display_name || profileData.user.username}
                </h2>
                <p className="text-caption text-gray-600 mb-2">@{profileData.user.username}</p>
                
                <div className="flex items-center justify-center space-x-2">
                  {profileData.user.is_creator && (
                    <span className="creator-badge">CREATOR</span>
                  )}
                  {profileData.user.is_verified && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-semibold">
                      VERIFIED
                    </span>
                  )}
                </div>
              </div>

              {profileData.user.bio && (
                <div className="mb-6">
                  <p className="text-sm text-gray-600 leading-relaxed">{profileData.user.bio}</p>
                </div>
              )}

              <div className="text-sm text-gray-500">
                <p>Member since {new Date(profileData.user.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Stats Card */}
            <div className="card p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Stats</h3>
              <div className="space-y-3">
                {profileData.user.is_creator && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Auctions Created</span>
                      <span className="font-semibold">{profileData.stats.auctions_created}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Items Sold</span>
                      <span className="font-semibold">{profileData.stats.items_sold}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Bids Placed</span>
                  <span className="font-semibold">{profileData.stats.bids_placed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Items Watched</span>
                  <span className="font-semibold">{profileData.stats.items_watched}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Items Bought</span>
                  <span className="font-semibold">{profileData.stats.items_bought}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Basic Information</h3>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-caption text-gray-700 mb-2">
                      EMAIL ADDRESS
                    </label>
                    {editing ? (
                      <div className="input w-full bg-gray-100 cursor-not-allowed">
                        {profileData.user.email}
                      </div>
                    ) : (
                      <p className="text-gray-900">{profileData.user.email}</p>
                    )}
                    {editing && (
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-caption text-gray-700 mb-2">
                      USERNAME
                    </label>
                    {editing ? (
                      <div className="input w-full bg-gray-100 cursor-not-allowed">
                        {profileData.user.username}
                      </div>
                    ) : (
                      <p className="text-gray-900">@{profileData.user.username}</p>
                    )}
                    {editing && (
                      <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="display_name" className="block text-caption text-gray-700 mb-2">
                    DISPLAY NAME
                  </label>
                  {editing ? (
                    <input
                      id="display_name"
                      name="display_name"
                      type="text"
                      value={formData.display_name}
                      onChange={handleInputChange}
                      className="input w-full"
                      placeholder="Your display name"
                    />
                  ) : (
                    <p className="text-gray-900">{profileData.user.display_name || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="bio" className="block text-caption text-gray-700 mb-2">
                    BIO
                  </label>
                  {editing ? (
                    <textarea
                      id="bio"
                      name="bio"
                      rows={4}
                      value={formData.bio}
                      onChange={handleInputChange}
                      className="input w-full resize-none"
                      placeholder="Tell us about yourself..."
                    />
                  ) : (
                    <p className="text-gray-900">{profileData.user.bio || 'No bio provided'}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="profile_image_url" className="block text-caption text-gray-700 mb-2">
                    PROFILE IMAGE URL
                  </label>
                  {editing ? (
                    <input
                      id="profile_image_url"
                      name="profile_image_url"
                      type="url"
                      value={formData.profile_image_url}
                      onChange={handleInputChange}
                      className="input w-full"
                      placeholder="https://example.com/your-image.jpg"
                    />
                  ) : (
                    <p className="text-gray-900">{profileData.user.profile_image_url || 'No image set'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Creator Information */}
            {profileData.user.is_creator && (
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Creator Information</h3>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="channel_name" className="block text-caption text-gray-700 mb-2">
                        CHANNEL NAME
                      </label>
                      {editing ? (
                        <input
                          id="channel_name"
                          name="channel_name"
                          type="text"
                          value={formData.channel_name}
                          onChange={handleInputChange}
                          className="input w-full"
                          placeholder="Your channel name"
                        />
                      ) : (
                        <p className="text-gray-900">{profileData.creatorProfile?.channel_name || 'Not set'}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="platform" className="block text-caption text-gray-700 mb-2">
                        PLATFORM
                      </label>
                      {editing ? (
                        <select
                          id="platform"
                          name="platform"
                          value={formData.platform}
                          onChange={handleInputChange}
                          className="input w-full"
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
                        <p className="text-gray-900 capitalize">{profileData.creatorProfile?.platform || 'Not set'}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="channel_url" className="block text-caption text-gray-700 mb-2">
                      CHANNEL URL
                    </label>
                    {editing ? (
                      <input
                        id="channel_url"
                        name="channel_url"
                        type="url"
                        value={formData.channel_url}
                        onChange={handleInputChange}
                        className="input w-full"
                        placeholder="https://youtube.com/c/yourchannel"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {profileData.creatorProfile?.channel_url ? (
                          <a 
                            href={profileData.creatorProfile.channel_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-700"
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
                    <label htmlFor="subscriber_count" className="block text-caption text-gray-700 mb-2">
                      SUBSCRIBER COUNT
                    </label>
                    {editing ? (
                      <input
                        id="subscriber_count"
                        name="subscriber_count"
                        type="number"
                        min="0"
                        value={formData.subscriber_count}
                        onChange={handleInputChange}
                        className="input w-full"
                        placeholder="0"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {profileData.creatorProfile?.subscriber_count?.toLocaleString() || '0'}
                      </p>
                    )}
                  </div>

                  {profileData.creatorProfile?.verification_status && (
                    <div>
                      <label className="block text-caption text-gray-700 mb-2">
                        VERIFICATION STATUS
                      </label>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        profileData.creatorProfile.verification_status === 'verified' ? 'bg-green-100 text-green-800' :
                        profileData.creatorProfile.verification_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
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
