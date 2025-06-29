'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

export default function Navigation() {
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(true); // Start collapsed

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {/* Mobile/Desktop overlay */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsCollapsed(true)}
        />
      )}
      
      {/* Sidebar */}
      <nav className={`fixed left-0 top-0 h-full bg-zinc-900 border-r border-zinc-800 z-50 transition-all duration-300 ${
        isCollapsed ? '-translate-x-full' : 'translate-x-0'
      } w-64`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-zinc-800">
            <Link href="/" className="text-xl font-black">
              <span className="text-white">FAN</span>
              <span className="text-violet-400">VAULT</span>
            </Link>
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-2 text-zinc-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 px-4 py-6">
            <div className="space-y-2">
              <Link 
                href="/auctions"
                className="flex items-center space-x-3 text-zinc-300 hover:text-white hover:bg-zinc-800 p-3 rounded-lg transition-all group"
                onClick={() => setIsCollapsed(true)}
              >
                <div className="w-5 h-5 bg-violet-500 rounded flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                </div>
                <span className="font-mono text-sm font-semibold tracking-wider uppercase">AUCTIONS</span>
              </Link>

              <Link 
                href="/creators"
                className="flex items-center space-x-3 text-zinc-300 hover:text-white hover:bg-zinc-800 p-3 rounded-lg transition-all group"
                onClick={() => setIsCollapsed(true)}
              >
                <div className="w-5 h-5 bg-red-500 rounded flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="font-mono text-sm font-semibold tracking-wider uppercase">CREATORS</span>
              </Link>

              {user && (
                <Link 
                  href="/dashboard"
                  className="flex items-center space-x-3 text-zinc-300 hover:text-white hover:bg-zinc-800 p-3 rounded-lg transition-all group"
                  onClick={() => setIsCollapsed(true)}
                >
                  <div className="w-5 h-5 bg-zinc-600 rounded flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                  </div>
                  <span className="font-mono text-sm font-semibold tracking-wider uppercase">DASHBOARD</span>
                </Link>
              )}
            </div>
          </div>

          {/* User Section */}
          <div className="border-t border-zinc-800 p-4">
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {user.display_name?.[0]?.toUpperCase() || user.username[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium text-sm truncate">
                      {user.display_name || user.username}
                    </div>
                    {user.is_creator && (
                      <div className="text-xs text-violet-400 font-mono uppercase tracking-wider">
                        CREATOR
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <Link
                    href="/profile"
                    className="block text-zinc-400 hover:text-white text-xs font-mono uppercase tracking-wider transition-colors"
                    onClick={() => setIsCollapsed(true)}
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block text-zinc-400 hover:text-white text-xs font-mono uppercase tracking-wider transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Link 
                  href="/auth/login"
                  className="block w-full text-center py-2 text-zinc-300 hover:text-white font-mono text-xs uppercase tracking-wider transition-colors"
                  onClick={() => setIsCollapsed(true)}
                >
                  SIGN IN
                </Link>
                <Link 
                  href="/auth/register"
                  className="block w-full text-center py-2 bg-violet-500 text-white font-mono text-xs uppercase tracking-wider hover:bg-violet-600 transition-colors rounded"
                  onClick={() => setIsCollapsed(true)}
                >
                  SIGN UP
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Burger Menu Button */}
      <button
        onClick={() => setIsCollapsed(false)}
        className="fixed top-6 left-6 z-30 p-3 bg-zinc-900/90 backdrop-blur-sm text-white rounded-lg border border-zinc-800 hover:bg-zinc-800 transition-all duration-300"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </>
  );
}
