'use client';

import { useState, useEffect } from 'react';

interface LeaderboardUser {
  _id: string;
  username: string;
  totalScore: number;
  predictionCount: number;
  correctPredictions: number;
  accuracy: number;
  averageScore: number;
  weeksActive: number;
  rank: number;
}

interface PreviousWeekWinner {
  username: string;
  score: number;
  prediction: {
    predictedMin?: number;
    predictedMax?: number;
    predictedPrice?: number;
    actualPrice?: number;
    weekStartDate: string;
  };
}

interface Props {
  currentUserId?: string | null;
}

export function Leaderboard({ currentUserId }: Props) {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [previousWeekWinner, setPreviousWeekWinner] = useState<PreviousWeekWinner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  // Remove auto-refresh to prevent flickering
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     fetchLeaderboard();
  //   }, 60000);

  //   return () => clearInterval(interval);
  // }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/leaderboard');
      const data = await response.json();
      
      if (data.success) {
        setLeaderboardData(data.data);
        setPreviousWeekWinner(data.previousWeekWinner || null);
        setLastRefresh(new Date());
      } else {
        setError('Failed to fetch leaderboard');
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to fetch leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-400';
      case 2: return 'text-gray-300';
      case 3: return 'text-amber-600';
      default: return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        <span className="ml-3 text-gray-300">Loading leaderboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-400">
        <p>{error}</p>
        <button
          onClick={fetchLeaderboard}
          className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">🏆 Leaderboard</h2>
          <div className="text-xs text-gray-400 mt-1">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
        </div>
        <button
          onClick={fetchLeaderboard}
          disabled={loading}
          className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Previous Week Winner */}
      {previousWeekWinner && (
        <div className="mb-6 p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-2xl">👑</div>
            <div>
              <h3 className="text-lg font-bold text-yellow-300">Previous Week Winner</h3>
              <p className="text-sm text-yellow-200">
                Week of {new Date(previousWeekWinner.prediction.weekStartDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-yellow-200 font-semibold">Winner</div>
              <div className="text-white text-lg font-bold">{previousWeekWinner.username}</div>
            </div>
            <div>
              <div className="text-yellow-200 font-semibold">Score</div>
              <div className="text-white text-lg font-bold">{previousWeekWinner.score} pts</div>
            </div>
            <div>
              <div className="text-yellow-200 font-semibold">Prediction</div>
              <div className="text-white">
                {previousWeekWinner.prediction.predictedMin !== undefined && previousWeekWinner.prediction.predictedMax !== undefined
                  ? `$${previousWeekWinner.prediction.predictedMin.toFixed(2)} - $${previousWeekWinner.prediction.predictedMax.toFixed(2)}`
                  : `$${previousWeekWinner.prediction.predictedPrice?.toFixed(2) || 'N/A'}`
                }
              </div>
            </div>
            <div>
              <div className="text-yellow-200 font-semibold">Actual Price</div>
              <div className="text-white">
                ${previousWeekWinner.prediction.actualPrice?.toFixed(2) || 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}

      {leaderboardData.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p>No players yet. Make your first prediction to join the leaderboard!</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {leaderboardData.map((user) => (
            <div 
              key={user._id} 
              className={`bg-white/5 rounded-lg p-4 border border-white/10 transition-all ${
                currentUserId === user._id ? 'ring-2 ring-blue-500 bg-blue-500/10' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`text-lg font-bold ${getRankColor(user.rank)}`}>
                    {getRankIcon(user.rank)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-white">
                        {user.username}
                      </span>
                      {currentUserId === user._id && (
                        <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      {user.predictionCount} predictions • {user.weeksActive} weeks active
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-xl font-bold text-white">
                    {user.totalScore} pts
                  </div>
                  <div className="text-xs text-gray-400">
                    {user.accuracy.toFixed(1)}% accuracy
                  </div>
                  <div className="text-xs text-gray-400">
                    Avg: {user.averageScore.toFixed(0)} pts
                  </div>
                </div>
              </div>
              
              {/* Progress bar for accuracy */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Accuracy</span>
                  <span>{user.correctPredictions}/{user.predictionCount} correct</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${user.accuracy}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-300 mb-3">🏆 Scoring System</h4>
        <div className="text-xs text-blue-200 space-y-3">
          <div>
            <p className="font-semibold text-blue-100 mb-1">📊 Base Points:</p>
            <ul className="ml-2 space-y-1">
              <li>• 1 point for participation</li>
              <li>• +10 points for correct prediction</li>
              <li>• +30 points for narrowest range (among correct predictions)</li>
            </ul>
          </div>
          
          <div>
            <p className="font-semibold text-blue-100 mb-1">⏰ Day Multipliers:</p>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div className="bg-green-500/20 p-1 rounded text-center">
                <p className="font-semibold">Monday: 5×</p>
              </div>
              <div className="bg-yellow-500/20 p-1 rounded text-center">
                <p className="font-semibold">Tuesday: 3×</p>
              </div>
              <div className="bg-orange-500/20 p-1 rounded text-center">
                <p className="font-semibold">Wednesday: 2×</p>
              </div>
              <div className="bg-red-500/20 p-1 rounded text-center">
                <p className="font-semibold">Thursday: 1×</p>
              </div>
            </div>
          </div>
          
          <div>
            <p className="font-semibold text-blue-100 mb-1">🎯 Final Score:</p>
            <p className="bg-blue-500/30 p-2 rounded text-center font-semibold">
              (Base + Bonus) × Day Multiplier
            </p>
          </div>
          
          <div className="bg-yellow-500/20 p-2 rounded border border-yellow-500/30">
            <p className="text-yellow-200 font-semibold text-xs mb-1">💡 Example:</p>
            <p className="text-yellow-100 text-xs">
              Monday prediction, correct, narrowest range:<br/>
              (1 + 10 + 30) × 5 = <strong>205 points</strong>
            </p>
          </div>
        </div>
      </div>
      <div className="text-center py-4 text-gray-400">
        <div className="text-sm">
          {leaderboardData.length} players
        </div>
      </div>
    </div>
  );
}
