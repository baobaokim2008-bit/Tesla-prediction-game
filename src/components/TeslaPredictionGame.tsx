'use client';

import { useState, useEffect } from 'react';
import { StockDataDisplay } from './StockDataDisplay';
import { PredictionForm } from './PredictionForm';
import { PredictionHistory } from './PredictionHistory';
import { MarketCatalysts } from './MarketCatalysts';
import { PredictionDashboard } from './PredictionDashboard';
import { SimpleLoginForm } from './SimpleLoginForm';
import { UserProfile } from './UserProfile';

interface StockData {
  currentPrice: number;
  weeklyData: {
    weekStartPrice: number;
    weekEndPrice: number;
    weekStartDate: string;
    weekEndDate: string;
  };
  marketContext: string;
  isFallbackData?: boolean;
}

interface Prediction {
  _id: string;
  userId: string;
  username: string;
  predictedMin?: number;
  predictedMax?: number;
  predictedPrice?: number; // Keep for backward compatibility
  weekStartDate: string;
  weekEndDate: string;
  actualPrice?: number;
  isCorrect?: boolean;
  createdAt: string;
}

export function TeslaPredictionGame() {
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for existing user session
    const savedUserId = localStorage.getItem('tesla_user_id');
    const savedUsername = localStorage.getItem('tesla_username');
    
    if (savedUserId && savedUsername) {
      setUserId(savedUserId);
      setUsername(savedUsername);
      setIsAuthenticated(true);
    }
    
    fetchStockData();
  }, []);

  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchPredictions();
    }
  }, [isAuthenticated, userId]);

  const fetchStockData = async () => {
    try {
      const response = await fetch('/api/stock');
      const data = await response.json();
      
      if (data.success) {
        setStockData(data.data);
      } else {
        setError('Failed to fetch stock data');
      }
    } catch (err) {
      setError('Failed to fetch stock data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPredictions = async () => {
    if (!userId) return;
    
    try {
      const response = await fetch(`/api/predictions?userId=${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setPredictions(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch predictions:', err);
    }
  };

  const handleLogin = (newUserId: string, newUsername: string) => {
    setUserId(newUserId);
    setUsername(newUsername);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('tesla_user_id');
    localStorage.removeItem('tesla_username');
    localStorage.removeItem('tesla_password');
    setUserId(null);
    setUsername(null);
    setIsAuthenticated(false);
    setPredictions([]);
  };

  const handlePredictionSubmit = async (predictedRange: { min: number; max: number }) => {
    if (!userId || !username) {
      return { success: false, error: 'User not authenticated' };
    }

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
        setPredictions(prev => [data.data, ...prev]);
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
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
        // Update the prediction in the local state
        setPredictions(prev => 
          prev.map(p => 
            p._id === predictionId 
              ? { ...p, predictedMin: newRange.min, predictedMax: newRange.max }
              : p
          )
        );
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      return { success: false, error: 'Failed to update prediction' };
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-400">
        <p className="text-xl">{error}</p>
        <button 
          onClick={fetchStockData}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Tesla Prediction Game
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Predict Tesla's stock price range by the end of the week and compete with others!
          </p>
        </div>
        
        <SimpleLoginForm onLogin={handleLogin} />
      </div>
    );
  }

  // Show main game interface if authenticated
  return (
    <div className="space-y-8">
      {/* User Profile */}
      <UserProfile username={username!} onLogout={handleLogout} />
      
      {/* Market Catalysts Section */}
      <MarketCatalysts marketContext={stockData!.marketContext} />
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          <PredictionForm 
            onSubmit={handlePredictionSubmit}
            currentPrice={stockData!.currentPrice}
            userId={userId}
            onEditPrediction={handleEditPrediction}
          />
          <StockDataDisplay stockData={stockData!} />
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          <PredictionDashboard currentPrice={stockData!.currentPrice} />
          <PredictionHistory 
            predictions={predictions} 
            currentPrice={stockData!.currentPrice}
            onEditPrediction={handleEditPrediction}
          />
        </div>
      </div>
    </div>
  );
}

