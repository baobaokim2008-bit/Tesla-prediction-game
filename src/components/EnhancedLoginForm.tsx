// src/components/EnhancedLoginForm.tsx
'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';

// Extend the NextAuth session type
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      username?: string;
    }
  }
}

interface EnhancedLoginFormProps {
  onLogin: (userId: string, username: string) => void;
}

export function EnhancedLoginForm({ onLogin }: EnhancedLoginFormProps) {
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showGuestLogin, setShowGuestLogin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleXLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Starting X login...');
      
      const result = await signIn('twitter', {
        callbackUrl: window.location.origin,
        redirect: false
      });
      
      console.log('X login result:', result);
      
      if (result?.ok) {
        // Get session data after successful login
        const session = await getSession();
        if (session?.user) {
          onLogin(
            session.user.id!,
            session.user.username || session.user.name || 'X User'
          );
        }
      } else if (result?.error) {
        setError('X login failed. Please try again.');
        console.error('X login error:', result.error);
      }
    } catch (error) {
      console.error('X login error:', error);
      setError('X login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = () => {
    if (nickname.trim()) {
      onLogin(`guest_${Date.now()}`, nickname.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="relative bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-red-500 to-purple-600 p-4 rounded-2xl shadow-lg inline-block mb-4">
            <svg className="h-12 w-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-2">
            Tesla Prediction Game
          </h1>
          <p className="text-purple-200">Sign in to start predicting</p>
        </div>
        
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* X (Twitter) Login Button */}
        <div className="space-y-4">
          <button
            onClick={handleXLogin}
            disabled={isLoading}
            className="w-full bg-black hover:bg-gray-900 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Connecting to X...</span>
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span>Continue with X</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-slate-900 text-purple-200">or</span>
            </div>
          </div>

          {/* Guest Login Toggle */}
          {!showGuestLogin ? (
            <button
              onClick={() => setShowGuestLogin(true)}
              className="w-full text-purple-300 hover:text-white text-sm py-2 transition-colors"
            >
              Continue as Guest
            </button>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Guest Nickname
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Enter your nickname"
                  onKeyPress={(e) => e.key === 'Enter' && handleGuestLogin()}
                />
              </div>
              <button
                onClick={handleGuestLogin}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Start Predicting
              </button>
              <button
                onClick={() => setShowGuestLogin(false)}
                className="w-full text-purple-300 hover:text-white text-sm py-1 transition-colors"
              >
                Back to X Login
              </button>
            </div>
          )}
        </div>

        {/* Features List */}
        <div className="mt-8 pt-6 border-t border-white/20">
          <h3 className="text-sm font-medium text-purple-200 mb-3">Why sign in with X?</h3>
          <ul className="space-y-2 text-xs text-purple-300">
            <li className="flex items-center space-x-2">
              <span className="w-1 h-1 bg-purple-400 rounded-full"></span>
              <span>Persistent predictions across devices</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-1 h-1 bg-purple-400 rounded-full"></span>
              <span>Share your Tesla predictions on X</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-1 h-1 bg-purple-400 rounded-full"></span>
              <span>Compete with X community</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-1 h-1 bg-purple-400 rounded-full"></span>
              <span>Track your prediction history</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}