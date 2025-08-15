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
      <div className="bg-white apple-card rounded-2xl p-6 border border-gray-200">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600 font-medium">Loading leaderboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white apple-card rounded-2xl p-6 border border-gray-200">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchLeaderboard}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors apple-button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white apple-card rounded-2xl p-6 border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Leaderboard</h2>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={fetchLeaderboard}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors apple-button font-medium"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Previous Week Winner */}
      {previousWeekWinner && (
        <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl">
          <h3 className="font-semibold text-yellow-900 mb-2">🏆 Previous Week Winner</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-800 font-medium">{previousWeekWinner.username}</p>
              <p className="text-sm text-yellow-700">
                Score: {previousWeekWinner.score} points
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-yellow-700">
                Prediction: ${previousWeekWinner.prediction.predictedMin?.toFixed(2) || previousWeekWinner.prediction.predictedPrice?.toFixed(2)} - ${previousWeekWinner.prediction.predictedMax?.toFixed(2) || previousWeekWinner.prediction.predictedPrice?.toFixed(2)}
              </p>
              <p className="text-sm text-yellow-700">
                Actual: ${previousWeekWinner.prediction.actualPrice?.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rank
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Player
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Accuracy
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Predictions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leaderboardData.map((user, index) => (
              <tr
                key={user._id}
                className={`${
                  currentUserId === user._id ? 'bg-blue-50' : 'hover:bg-gray-50'
                } transition-colors`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className={`text-lg font-semibold ${getRankColor(user.rank)}`}>
                      {getRankIcon(user.rank)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.username}
                        {currentUserId === user._id && (
                          <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.weeksActive} weeks active
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-gray-900">
                    {user.totalScore.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    Avg: {user.averageScore.toFixed(1)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="text-sm font-semibold text-gray-900">
                      {user.accuracy.toFixed(1)}%
                    </div>
                    <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${user.accuracy}%` }}
                      ></div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.correctPredictions}/{user.predictionCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {leaderboardData.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No leaderboard data available yet.</p>
        </div>
      )}
    </div>
  );
}
