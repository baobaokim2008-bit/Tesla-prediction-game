// Tesla Prediction Game - Main Application Page
// Updated with Apple-inspired design and X login functionality
'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { StockDataDisplay } from '@/components/StockDataDisplay';
import { PredictionForm } from '@/components/PredictionForm';
import { PredictionHistory } from '@/components/PredictionHistory';
import { PredictionDashboard } from '@/components/PredictionDashboard';
import { Leaderboard } from '@/components/Leaderboard';
import { MarketCatalysts } from '@/components/MarketCatalysts';
import { EnhancedLoginForm } from '@/components/EnhancedLoginForm';

export default function Home() {
  const { data: session, status } = useSession();
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [stockData, setStockData] = useState<any>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session or guest login
    if (session?.user) {
      setUserId(session.user.id);
      setUsername(session.user.username || session.user.name || 'X User');
    } else {
      // Check for guest login in localStorage
      const guestData = localStorage.getItem('guestUser');
      if (guestData) {
        const { userId: guestUserId, username: guestUsername } = JSON.parse(guestData);
        setUserId(guestUserId);
        setUsername(guestUsername);
      }
    }
    setLoading(false);
  }, [session]);

  useEffect(() => {
    if (userId) {
      fetchStockData();
      fetchUserPredictions();
    }
  }, [userId]);

  const fetchStockData = async () => {
    try {
      const response = await fetch('/api/stock');
      const data = await response.json();
      
      if (data.success) {
        setCurrentPrice(data.data.currentPrice);
        setStockData(data.data);
      }
    } catch (error) {
      console.error('Error fetching stock data:', error);
    }
  };

  const fetchUserPredictions = async () => {
    if (!userId) return;
    
    try {
      const response = await fetch(`/api/predictions?userId=${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setPredictions(data.data);
      }
    } catch (error) {
      console.error('Error fetching predictions:', error);
    }
  };

  const handlePredictionSubmit = async (predictedRange: { min: number; max: number }) => {
    if (!userId || !username) return { success: false, error: 'Not logged in' };

    try {
      const response = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          username,
          predictedMin: predictedRange.min,
          predictedMax: predictedRange.max,
          loginType: session ? 'twitter' : 'guest'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchUserPredictions();
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Error submitting prediction:', error);
      return { success: false, error: 'Failed to submit prediction' };
    }
  };

  const handleEditPrediction = async (predictionId: string, newRange: { min: number; max: number }) => {
    if (!userId || !username) return { success: false, error: 'Not logged in' };

    try {
      const response = await fetch('/api/predictions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          predictionId,
          predictedMin: newRange.min,
          predictedMax: newRange.max,
          loginType: session ? 'twitter' : 'guest'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchUserPredictions();
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Error editing prediction:', error);
      return { success: false, error: 'Failed to edit prediction' };
    }
  };

  const handleLogin = (newUserId: string, newUsername: string) => {
    setUserId(newUserId);
    setUsername(newUsername);
    
    // Store guest data in localStorage
    if (newUserId.startsWith('guest_')) {
      localStorage.setItem('guestUser', JSON.stringify({
        userId: newUserId,
        username: newUsername
      }));
    }
  };

  const handleLogout = () => {
    setUserId(null);
    setUsername(null);
    setPredictions([]);
    localStorage.removeItem('guestUser');
    if (session) {
      signOut({ callbackUrl: '/' });
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Tesla Prediction Game...</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return <EnhancedLoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Tesla Prediction Game</h1>
              <p className="text-sm opacity-90">Welcome, {username}!</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {session && (
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                X User
              </span>
            )}
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors apple-button"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Stock Data */}
          <div className="lg:col-span-1">
            <StockDataDisplay stockData={stockData} />
          </div>

          {/* Prediction Form */}
          <div className="lg:col-span-1">
            <PredictionForm 
              onSubmit={handlePredictionSubmit}
              currentPrice={currentPrice}
              userId={userId}
              onEditPrediction={handleEditPrediction}
            />
          </div>
        </div>

        {/* Market Analysis */}
        <MarketCatalysts marketContext={stockData?.marketContext} />

        {/* Prediction History */}
        <PredictionHistory 
          predictions={predictions}
          currentPrice={currentPrice}
          onEditPrediction={handleEditPrediction}
        />

        {/* Community Dashboard */}
        <PredictionDashboard currentPrice={currentPrice} />

        {/* Leaderboard */}
        <Leaderboard />
      </main>
    </div>
  );
}