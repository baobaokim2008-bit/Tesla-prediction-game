'use client';

import { PredictionForm } from '@/components/PredictionForm';
import { PredictionHistory } from '@/components/PredictionHistory';
import { PredictionDashboard } from '@/components/PredictionDashboard';
import { Leaderboard } from '@/components/Leaderboard';
import { MarketCatalysts } from '@/components/MarketCatalysts';
import { StockDataDisplay } from '@/components/StockDataDisplay';
import { SimpleLoginForm } from '@/components/SimpleLoginForm';
import { useState, useEffect } from 'react';

export default function Home() {
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [stockData, setStockData] = useState<any>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshingCatalysts, setRefreshingCatalysts] = useState(false);

  useEffect(() => {
    // Check for existing login
    const savedUserId = localStorage.getItem('tesla_user_id');
    const savedUsername = localStorage.getItem('tesla_username');
    
    // Clean up old localStorage keys if they exist
    const oldUserId = localStorage.getItem('userId');
    const oldUsername = localStorage.getItem('username');
    if (oldUserId && oldUsername) {
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      console.log('Cleaned up old localStorage keys');
    }
    
    if (savedUserId && savedUsername) {
      setUserId(savedUserId);
      setUsername(savedUsername);
      console.log('Restored session for user:', savedUsername, 'ID:', savedUserId);
    }
    
    fetchStockData();
  }, []);

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
    localStorage.setItem('tesla_user_id', newUserId);
    localStorage.setItem('tesla_username', newUsername);
  };

  const handleLogout = () => {
    localStorage.removeItem('tesla_user_id');
    localStorage.removeItem('tesla_username');
    setUserId(null);
    setUsername(null);
    setPredictions([]);
  };



  const handlePredictionSubmit = async (predictedRange: { min: number; max: number }) => {
    if (!userId || !username) return { success: false, error: 'Not logged in' };

    try {
      const response = await fetch('/api/predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          username,
          predictedMin: predictedRange.min,
          predictedMax: predictedRange.max,
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
    try {
      const response = await fetch('/api/predictions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          predictionId,
          predictedMin: newRange.min,
          predictedMax: newRange.max,
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
      console.error('Error updating prediction:', error);
      return { success: false, error: 'Failed to update prediction' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
        <SimpleLoginForm onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Tesla Prediction Game</h1>
              <p className="text-sm text-gray-300">Welcome, {username}!</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Tesla Prediction Game</h1>
          <p className="text-xl text-gray-300 mb-2">Predict Tesla's stock price range for the week</p>
          <p className="text-lg text-blue-300">Make predictions Monday through Thursday • Earlier predictions get higher multipliers!</p>
        </div>
        {/* Market Catalysts - Moved to top */}
        {stockData?.data?.marketContext && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Market Catalysts</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => fetchStockData(true)}
                  disabled={refreshingCatalysts}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {refreshingCatalysts ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Refreshing...
                    </>
                  ) : (
                    'Refresh Data'
                  )}
                </button>
                <span className="text-xs text-gray-400">
                  Last updated: {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
            <MarketCatalysts marketContext={stockData.data.marketContext} isLoading={refreshingCatalysts} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Prediction Form */}
            <PredictionForm
              onSubmit={handlePredictionSubmit}
              currentPrice={currentPrice}
              userId={userId}
              onEditPrediction={handleEditPrediction}
            />

            {/* Tesla Stock Display */}
            {stockData?.data && <StockDataDisplay stockData={stockData.data} />}
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Leaderboard */}
            <Leaderboard currentUserId={userId} />

            {/* User Predictions */}
            <PredictionHistory
              predictions={predictions}
              currentPrice={currentPrice}
              onEditPrediction={handleEditPrediction}
            />
          </div>
        </div>

        {/* Community Predictions Dashboard */}
        <div className="mt-8">
          <PredictionDashboard currentPrice={currentPrice} />
        </div>
      </main>
    </div>
  );
}
