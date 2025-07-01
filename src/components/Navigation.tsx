'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';

export default function Navigation() {
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [loadingVerification, setLoadingVerification] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const isCreator = user?.is_creator;

  // Check verification status for creators
  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (!user?.is_creator) return;
      
      setLoadingVerification(true);
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
         
          
          // Check if user has verified ID verification
          const idResponse = await fetch('/api/creator-verification/id-verification');
          if (idResponse.ok) {
            const idData = await idResponse.json();
            setIsVerified(idData.verified && idData.status === 'verified');
          }
        }
      } catch (error) {
        console.error('Error checking verification status:', error);
      } finally {
        setLoadingVerification(false);
      }
    };

    checkVerificationStatus();
  }, [user]);

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
      <nav className={`fixed left-0 top-0 h-full bg-zinc-900/95 backdrop-blur-xl border-r border-zinc-700/50 z-50 transition-all duration-300 ${
        isCollapsed ? '-translate-x-full' : 'translate-x-0'
      } w-64`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-zinc-700/30">
            <Link href="/" className="text-xl font-black">
              <span className="text-white">FAN</span>
              <span className="text-violet-400">VAULT</span>
            </Link>
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-2 text-zinc-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6L18 18M6 18L18 6" />
              </svg>
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 px-6 py-8">
            <div className="space-y-3">
              
              {/* CREATOR NAVIGATION */}
              {isCreator ? (
                <>
                  <Link 
                    href="/creator"
                    className="group relative block overflow-hidden rounded-lg border border-transparent hover:border-violet-400/20 transition-all duration-300"
                    onClick={() => setIsCollapsed(true)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative px-4 py-3">
                      <span className="font-mono text-sm font-bold tracking-[0.2em] uppercase text-zinc-300 group-hover:text-white transition-colors">
                        CREATOR HUB
                      </span>
                      <div className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-violet-400/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  </Link>

                  <Link 
                    href="/creator/auctions"
                    className="group relative block overflow-hidden rounded-lg border border-transparent hover:border-emerald-400/20 transition-all duration-300"
                    onClick={() => setIsCollapsed(true)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative px-4 py-3">
                      <span className="font-mono text-sm font-bold tracking-[0.2em] uppercase text-zinc-300 group-hover:text-white transition-colors">
                        MY AUCTIONS
                      </span>
                      <div className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  </Link>

                  <Link 
                    href="/auctions"
                    className="group relative block overflow-hidden rounded-lg border border-transparent hover:border-blue-400/20 transition-all duration-300"
                    onClick={() => setIsCollapsed(true)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative px-4 py-3">
                      <span className="font-mono text-sm font-bold tracking-[0.2em] uppercase text-zinc-300 group-hover:text-white transition-colors">
                        BROWSE
                      </span>
                      <div className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-blue-400/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  </Link>
                </>
              ) : (
                /* BUYER NAVIGATION */
                <>
                  <Link 
                    href="/auctions"
                    className="group relative block overflow-hidden rounded-lg border border-transparent hover:border-violet-400/20 transition-all duration-300"
                    onClick={() => setIsCollapsed(true)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative px-4 py-3">
                      <span className="font-mono text-sm font-bold tracking-[0.2em] uppercase text-zinc-300 group-hover:text-white transition-colors">
                        AUCTIONS
                      </span>
                      <div className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-violet-400/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  </Link>

                  <Link 
                    href="/creators"
                    className="group relative block overflow-hidden rounded-lg border border-transparent hover:border-pink-400/20 transition-all duration-300"
                    onClick={() => setIsCollapsed(true)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative px-4 py-3">
                      <span className="font-mono text-sm font-bold tracking-[0.2em] uppercase text-zinc-300 group-hover:text-white transition-colors">
                        CREATORS
                      </span>
                      <div className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-pink-400/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  </Link>
                </>
              )}

              {/* SHARED LINKS */}
              {user && (
                <Link 
                  href="/dashboard"
                  className="group relative block overflow-hidden rounded-lg border border-transparent hover:border-zinc-400/20 transition-all duration-300"
                  onClick={() => setIsCollapsed(true)}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-zinc-500/5 to-gray-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative px-4 py-3">
                    <span className="font-mono text-sm font-bold tracking-[0.2em] uppercase text-zinc-300 group-hover:text-white transition-colors">
                      DASHBOARD
                    </span>
                    <div className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-zinc-400/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                </Link>
              )}
            </div>
          </div>

          {/* User Section */}
          <div className="border-t border-zinc-700/30 p-6">
            {user ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-violet-500/20 to-purple-600/20 backdrop-blur-sm border border-violet-400/30 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {user.display_name?.[0]?.toUpperCase() || user.username[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="text-white font-mono text-sm font-medium tracking-wide truncate">
                        {user.display_name || user.username}
                      </div>
                      {/* Verification Badge */}
                      {isCreator && isVerified && (
                        <div className="flex items-center justify-center w-5 h-5 bg-gradient-to-br from-emerald-400/20 to-green-500/20 backdrop-blur-sm border border-emerald-400/40 rounded-full flex-shrink-0" title="Verified Creator">
                          <svg className="w-2.5 h-2.5 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                          </svg>
                        </div>
                      )}
                    </div>
                    {isCreator && (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="text-xs text-violet-300 font-mono uppercase tracking-[0.15em]">
                          CREATOR
                        </div>
                        {loadingVerification ? (
                          <div className="text-xs text-zinc-500 font-mono uppercase tracking-[0.15em]">
                            CHECKING...
                          </div>
                        ) : isVerified ? (
                          <div className="text-xs text-emerald-300 font-mono uppercase tracking-[0.15em]">
                            VERIFIED
                          </div>
                        ) : (
                          <div className="text-xs text-yellow-300 font-mono uppercase tracking-[0.15em]">
                            UNVERIFIED
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Link
                    href="/profile"
                    className="block text-zinc-400 hover:text-white text-xs font-mono uppercase tracking-[0.15em] transition-colors hover:pl-2 duration-200"
                    onClick={() => setIsCollapsed(true)}
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block text-zinc-400 hover:text-white text-xs font-mono uppercase tracking-[0.15em] transition-colors hover:pl-2 duration-200"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Link 
                  href="/auth/login"
                  className="block w-full text-center py-3 text-zinc-300 hover:text-white font-mono text-xs uppercase tracking-[0.2em] transition-all duration-300 border border-transparent hover:border-zinc-600/30 rounded-lg"
                  onClick={() => setIsCollapsed(true)}
                >
                  SIGN IN
                </Link>
                <Link 
                  href="/auth/register"
                  className="block w-full text-center py-3 bg-gradient-to-r from-violet-500/10 to-purple-500/10 backdrop-blur-sm border border-violet-400/30 text-white font-mono text-xs uppercase tracking-[0.2em] hover:from-violet-500/20 hover:to-purple-500/20 hover:border-violet-400/50 transition-all duration-300 rounded-lg"
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
        className="fixed top-6 left-6 z-30 p-3 bg-zinc-900/90 backdrop-blur-xl text-white rounded-lg border border-zinc-700/50 hover:bg-zinc-800/90 hover:border-zinc-600/50 transition-all duration-300"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/>
        </svg>
      </button>
    </>
  );
}
