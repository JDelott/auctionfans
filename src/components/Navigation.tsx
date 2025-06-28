'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

export default function Navigation() {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  return (
    <nav className="border-b border-gray-200 bg-white/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-12">
            <Link href="/" className="text-xl font-bold text-gradient-primary">
              AUCTIONFANS
            </Link>
            <div className="hidden md:flex space-x-8">
              <Link 
                href="/auctions" 
                className="text-caption text-gray-600 hover:text-indigo-600 transition-colors"
              >
                AUCTIONS
              </Link>
              <Link 
                href="/creators" 
                className="text-caption text-gray-600 hover:text-indigo-600 transition-colors"
              >
                CREATORS
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 text-caption text-gray-600 hover:text-gray-900"
                >
                  <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg">
                    <div className="text-white text-sm font-bold">
                      {user.display_name?.[0]?.toUpperCase() || user.username[0]?.toUpperCase() || 'U'}
                    </div>
                  </div>
                  <span className="hidden sm:block font-medium">{user.display_name || user.username}</span>
                  {user.is_creator && (
                    <span className="creator-badge">
                      CREATOR
                    </span>
                  )}
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
                    <Link
                      href="/dashboard"
                      className="block px-6 py-3 text-caption text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/profile"
                      className="block px-6 py-3 text-caption text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Profile
                    </Link>
                    {user.is_creator && (
                      <Link
                        href="/creator/auctions"
                        className="block px-6 py-3 text-caption text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        My Auctions
                      </Link>
                    )}
                    <hr className="border-gray-200" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-6 py-3 text-caption text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link 
                  href="/auth/login" 
                  className="text-caption text-gray-600 hover:text-indigo-600 transition-colors"
                >
                  SIGN IN
                </Link>
                <Link 
                  href="/auth/register" 
                  className="btn-primary"
                >
                  SIGN UP
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
