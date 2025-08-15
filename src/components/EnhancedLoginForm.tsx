// src/components/EnhancedLoginForm.tsx
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';

interface EnhancedLoginFormProps {
  onLogin: (userId: string, username: string) => void;
}

export function EnhancedLoginForm({ onLogin }: EnhancedLoginFormProps) {
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleXLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use explicit localhost callback URL to prevent Vercel redirect
      const callbackUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:3000/' 
        : `${window.location.origin}/`;
        
      await signIn('twitter', { 
        callbackUrl,
        redirect: true 
      });
    } catch (error) {
      console.error('X login error:', error);
      setError('X login failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleGuestLogin = () => {
    if (nickname.trim()) {
      onLogin(`guest_${Date.now()}`, nickname.trim());
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="bg-white apple-card rounded-2xl p-8 shadow-xl border border-gray-200 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-2xl shadow-lg inline-block mb-4">
            <svg className="h-12 w-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            Tesla Prediction Game
          </h1>
          <p className="text-gray-600">Sign in to start predicting</p>
        </div>
        
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* X (Twitter) Login Button */}
        <div className="space-y-4">
          <button
            onClick={handleXLogin}
            disabled={isLoading}
            className="w-full bg-black text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed apple-button hover:bg-gray-800"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Signing in...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
                Continue with X (Twitter)
              </div>
            )}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          {/* Guest Login */}
          <div className="space-y-4">
            <div>
              <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-2">
                Enter a nickname
              </label>
              <input
                type="text"
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Your prediction nickname"
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleGuestLogin();
                  }
                }}
              />
            </div>
            <button
              onClick={handleGuestLogin}
              disabled={!nickname.trim()}
              className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed apple-button hover:bg-blue-700"
            >
              Continue as Guest
            </button>
          </div>
        </div>

        {/* How to Play Section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center mb-4">
            <svg className="w-5 h-5 text-purple-600 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <h3 className="text-lg font-semibold text-gray-900">How to Play</h3>
          </div>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Predict Tesla's stock price range for the week</li>
            <li>• Make predictions Monday through Thursday</li>
            <li>• Win if Friday's price falls within your range</li>
            <li>• Early predictions get bonus multipliers</li>
            <li>• Compete on the leaderboard</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
