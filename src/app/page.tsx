// src/app/page.tsx - Complete updated version
'use client';

import { PredictionForm } from '@/components/PredictionForm';
import { PredictionHistory } from '@/components/PredictionHistory';
import { PredictionDashboard } from '@/components/PredictionDashboard';
import { Leaderboard } from '@/components/Leaderboard';
import { MarketCatalysts } from '@/components/MarketCatalysts';
import { StockDataDisplay } from '@/components/StockDataDisplay';
import { EnhancedLoginForm } from '@/components/EnhancedLoginForm';
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';

export default function Home() {
  const { data: session, status } = useSession();
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [stockData, setStockData] = useState<any>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshingCatalysts, setRefreshingCatalysts] = useState(false);

  useEffect(() => {
    // Handle NextAuth session
    if (status === 'loading') return; // Still loading
    
    if (session?.user) {
      // User signed in with X
      setUserId(session.user.id!);
      setUsername(session.user.username || session.user.name || 'X User');
    } else {
      // Check for guest login
      const savedUserId = localStorage.getItem('tesla_user_id');
      const savedUsername = localStorage.getItem('tesla_username');
      
      if (savedUserId && savedUsername) {
        setUserId(savedUserId);
        setUsername(savedUsername);
      }
    }
    
    fetchStockData();
  }, [session, status]);

  useEffect(() => {
    if (userId) {
      fetchUserPredictions();
    }
  }, [userId]);

  const fetchStockData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshingCatalysts(true);
    }
    
    try {
      const url = isRefresh ? '/api/stock?refresh=true' : '/api/stock';
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setCurrentPrice(data.data.currentPrice);
        setStockData(data);
        console.log('Market Context Data:', data.data.marketContext);
      }
    } catch (error) {
      console.error('Error fetching stock data:', error);
    } finally {
      setLoading(false);
      if (isRefresh) {
        setRefreshingCatalysts(false);
      }
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

  const handleLogin = (newUserId: string, newUsername: string) => {
    setUserId(newUserId);
    setUsername(newUsername);
    
    // Save guest login data
    if (newUserId.startsWith('guest_')) {
      localStorage.setItem('tesla_user_id', newUserId);
      localStorage.setItem('tesla_username', newUsername);
    }
  };

  const handleLogout = async () => {
    if (session) {
      // Sign out from NextAuth (X login)
      await signOut({ redirect: false });
    } else {
      // Clear guest login
      localStorage.removeItem('tesla_user_id');
      localStorage.removeItem('tesla_username');
    }
    
    setUserId(null);
    setUsername(null);
    setPredictions([]);
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

  const shareToX = async (prediction: any) => {
    const text = `🚀 Just predicted Tesla stock to be between $${prediction.predictedMin} - $${prediction.predictedMax} this week! Join the Tesla Prediction Game and compete with me! #Tesla #StockPrediction`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        <div className="relative z-10 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-purple-200 text-lg">Loading Tesla Prediction Game...</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return <EnhancedLoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <header className="relative bg-white/10 backdrop-blur-md border-b border-white/20 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-red-500 to-purple-600 p-3 rounded-xl shadow-lg">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                  Tesla Prediction Game
                </h1>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  <p className="text-sm text-purple-200">
                    Welcome, {username}!
                    {session && (
                      <span className="ml-2 px-2 py-1 bg-blue-600/80 text-white text-xs rounded-full">
                        X User
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
            <button 
              onClick={handleLogout} 
              className="flex items-center space-x-2 px-4 py-2 bg-red-600/80 backdrop-blur-sm text-white rounded-lg hover:bg-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 space-y-8">
          {/* Stock Data Display */}
          <StockDataDisplay 
            stockData={stockData?.data} 
          />

          {/* Prediction Form */}
          <PredictionForm 
            currentPrice={currentPrice}
            onSubmit={handlePredictionSubmit}
            userId={userId}
            onEditPrediction={handleEditPrediction}
          />

          {/* Prediction History */}
          <PredictionHistory 
            predictions={predictions}
            currentPrice={currentPrice}
            onEditPrediction={handleEditPrediction}
          />

          {/* Prediction Dashboard */}
          <PredictionDashboard 
            currentPrice={currentPrice}
          />

          {/* Leaderboard */}
          <Leaderboard currentUserId={userId} />

          {/* Market Catalysts */}
          <MarketCatalysts 
            marketContext={stockData?.data?.marketContext}
            isLoading={refreshingCatalysts}
          />
        </div>
      </main>
    </div>
  );
}