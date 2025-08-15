'use client';

import { useState } from 'react';

interface Prediction {
  _id: string;
  userId: string;
  predictedMin?: number;
  predictedMax?: number;
  predictedPrice?: number; // Keep for backward compatibility
  weekStartDate: string;
  weekEndDate: string;
  actualPrice?: number;
  isCorrect?: boolean;
  createdAt: string;
  score?: number; // Added for score display
  dayMultiplier?: number; // Added for day multiplier display
  predictionHistory?: Array<{
    predictedMin: number;
    predictedMax: number;
    createdAt: string;
    dayMultiplier: number;
  }>; // New field for tracking all inputs
}

interface Props {
  predictions: Prediction[];
  currentPrice: number;
  onEditPrediction: (predictionId: string, newRange: { min: number; max: number }) => Promise<{ success: boolean; error?: string }>;
}

export function PredictionHistory({ predictions, currentPrice, onEditPrediction }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMin, setEditMin] = useState('');
  const [editMax, setEditMax] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editMessage, setEditMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDayOfWeek = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  };

  const getMultiplierForDay = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDay();
    switch (day) {
      case 1: return 5; // Monday
      case 2: return 3; // Tuesday
      case 3: return 2; // Wednesday
      case 4: return 1; // Thursday
      default: return 1; // Default
    }
  };

  const getMultiplierColor = (multiplier: number) => {
    switch (multiplier) {
      case 5: return 'text-green-400';
      case 3: return 'text-yellow-400';
      case 2: return 'text-orange-400';
      case 1: return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getAccuracy = (prediction: Prediction, actual?: number) => {
    if (!actual) return null;
    
    // Handle both old and new format
    if (prediction.predictedMin !== undefined && prediction.predictedMax !== undefined) {
      const midPoint = (prediction.predictedMin + prediction.predictedMax) / 2;
      const difference = Math.abs(midPoint - actual);
      const percentage = (difference / actual) * 100;
      return percentage.toFixed(1);
    } else if (prediction.predictedPrice !== undefined) {
      const difference = Math.abs(prediction.predictedPrice - actual);
      const percentage = (difference / actual) * 100;
      return percentage.toFixed(1);
    }
    return null;
  };

  const getStatusColor = (prediction: Prediction) => {
    if (!prediction.actualPrice) return 'text-gray-400';
    if (prediction.isCorrect) return 'text-green-400';
    return 'text-red-400';
  };

  const getStatusText = (prediction: Prediction) => {
    if (!prediction.actualPrice) return 'Pending';
    if (prediction.isCorrect) return 'Correct';
    return 'Incorrect';
  };

  const isInRange = (actual: number, prediction: Prediction) => {
    if (prediction.predictedMin !== undefined && prediction.predictedMax !== undefined) {
      return actual >= prediction.predictedMin && actual <= prediction.predictedMax;
    } else if (prediction.predictedPrice !== undefined) {
      // For old format, consider it correct if within 1% of predicted price
      const tolerance = prediction.predictedPrice * 0.01;
      return Math.abs(actual - prediction.predictedPrice) <= tolerance;
    }
    return false;
  };

  const getPredictionDisplay = (prediction: Prediction) => {
    if (prediction.predictedMin !== undefined && prediction.predictedMax !== undefined) {
      return `${prediction.predictedMin.toFixed(2)} - ${prediction.predictedMax.toFixed(2)}`;
    } else if (prediction.predictedPrice !== undefined) {
      return prediction.predictedPrice.toFixed(2);
    }
    return 'N/A';
  };

  const getHistoryEntryDisplay = (entry: { predictedMin: number; predictedMax: number }) => {
    return `${entry.predictedMin.toFixed(2)} - ${entry.predictedMax.toFixed(2)}`;
  };

const isCurrentWeekPrediction = (prediction: Prediction) => {
  const now = new Date();
  const currentDay = now.getDay();
  const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - daysToMonday);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6); // Sunday
  weekEnd.setHours(23, 59, 59, 999);

  const predictionDate = new Date(prediction.weekStartDate);
  
  // More flexible comparison - check if dates are within same week
  // Allow for timezone differences by comparing just the date parts
  const predictionWeekStart = new Date(predictionDate);
  predictionWeekStart.setHours(0, 0, 0, 0);
  
  const currentWeekStart = new Date(weekStart);
  currentWeekStart.setHours(0, 0, 0, 0);
  
  // Calculate the difference in days
  const diffTime = Math.abs(predictionWeekStart.getTime() - currentWeekStart.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Consider it the same week if within 6 days
  return diffDays <= 6;
};

  const canEdit = (prediction: Prediction) => {
    // Can only edit current week's prediction and only if it's not an old format
    return isCurrentWeekPrediction(prediction) && 
           prediction.predictedMin !== undefined && 
           prediction.predictedMax !== undefined &&
           !prediction.actualPrice; // Can't edit if results are already in
  };
  
  const startEditing = (prediction: Prediction) => {
    if (prediction.predictedMin !== undefined && prediction.predictedMax !== undefined) {
      setEditingId(prediction._id);
      setEditMin(prediction.predictedMin.toString());
      setEditMax(prediction.predictedMax.toString());
      setEditMessage(null);
    }
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditMin('');
    setEditMax('');
    setEditMessage(null);
  };

  const handleEditSubmit = async (predictionId: string) => {
    const min = parseFloat(editMin);
    const max = parseFloat(editMax);
    
    if (!min || !max || min <= 0 || max <= 0) {
      setEditMessage({ type: 'error', text: 'Please enter valid prices' });
      return;
    }

    if (min >= max) {
      setEditMessage({ type: 'error', text: 'Minimum price must be less than maximum price' });
      return;
    }

    if (max - min < 1) {
      setEditMessage({ type: 'error', text: 'Price range must be at least $1.00' });
      return;
    }

    if (max - min > currentPrice * 1.0) {
      setEditMessage({ type: 'error', text: 'Price range cannot exceed 100% of current price' });
      return;
    }

    setEditLoading(true);
    setEditMessage(null);

    const result = await onEditPrediction(predictionId, { min, max });
    
    if (result.success) {
      setEditMessage({ type: 'success', text: 'Prediction updated successfully!' });
      setTimeout(() => {
        cancelEditing();
      }, 1500);
    } else {
      setEditMessage({ type: 'error', text: result.error || 'Failed to update prediction' });
    }

    setEditLoading(false);
  };

  // Process predictions to show history - only current week
  const processPredictionsWithHistory = () => {
    const processed: Array<{
      weekStart: string;
      weekEnd: string;
      prediction: Prediction;
      historyEntries: Array<{
        predictedMin: number;
        predictedMax: number;
        createdAt: string;
        dayMultiplier: number;
      }>;
      isCurrentWeek: boolean;
      actualPrice?: number;
      isCorrect?: boolean;
      score?: number;
    }> = [];
    
    predictions.forEach(prediction => {
      // Only process current week predictions
      if (!isCurrentWeekPrediction(prediction)) {
        return;
      }

      // Use predictionHistory if available, otherwise create a single entry from the prediction itself
      const historyEntries = prediction.predictionHistory && prediction.predictionHistory.length > 0 
        ? prediction.predictionHistory 
        : [{
            predictedMin: prediction.predictedMin || 0,
            predictedMax: prediction.predictedMax || 0,
            createdAt: prediction.createdAt,
            dayMultiplier: prediction.dayMultiplier || 1
          }];

      // Sort history entries by creation time (newest first)
      historyEntries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      processed.push({
        weekStart: prediction.weekStartDate,
        weekEnd: prediction.weekEndDate,
        prediction,
        historyEntries,
        isCurrentWeek: isCurrentWeekPrediction(prediction),
        actualPrice: prediction.actualPrice,
        isCorrect: prediction.isCorrect,
        score: prediction.score
      });
    });

    // Sort by week start date (newest first)
    return processed.sort((a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime());
  };

  const processedPredictions = processPredictionsWithHistory();

  if (predictions.length === 0) {
    return (
      <div className="bg-white apple-card rounded-2xl p-6 border border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Predictions</h2>
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-gray-500 font-medium">No predictions yet</p>
          <p className="text-gray-400 text-sm mt-2">Make your first prediction to see it here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white apple-card rounded-2xl p-6 border border-gray-200">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Your Predictions</h2>
      
      <div className="space-y-4">
        {predictions.map((prediction) => {
          const isCurrentWeek = isCurrentWeekPrediction(prediction);
          const multiplier = getMultiplierForDay(prediction.createdAt);
          const accuracy = getAccuracy(prediction, prediction.actualPrice);
          
          return (
            <div
              key={prediction._id}
              className={`p-4 rounded-xl border transition-all ${
                isCurrentWeek
                  ? 'bg-blue-50 border-blue-200'
                  : prediction.isCorrect
                  ? 'bg-green-50 border-green-200'
                  : prediction.actualPrice !== undefined
                  ? 'bg-red-50 border-red-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">
                    Week of {formatDate(prediction.weekStartDate)}
                  </span>
                  {isCurrentWeek && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                      Current Week
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-semibold ${getMultiplierColor(multiplier)}`}>
                    {multiplier}×
                  </span>
                  <span className="text-xs text-gray-500">
                    {getDayOfWeek(prediction.createdAt)}
                  </span>
                </div>
              </div>

              {/* Prediction Details */}
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Your Prediction</p>
                  <p className="text-lg font-semibold text-gray-900">
                    ${prediction.predictedMin?.toFixed(2) || prediction.predictedPrice?.toFixed(2)} - ${prediction.predictedMax?.toFixed(2) || prediction.predictedPrice?.toFixed(2)}
                  </p>
                </div>
                
                {prediction.actualPrice !== undefined ? (
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Actual Price</p>
                    <p className={`text-lg font-semibold ${
                      prediction.isCorrect ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ${prediction.actualPrice.toFixed(2)}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Current Price</p>
                    <p className="text-lg font-semibold text-gray-900">
                      ${currentPrice.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>

              {/* Status and Score */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {prediction.actualPrice !== undefined ? (
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${
                        prediction.isCorrect ? 'bg-green-500' : 'bg-red-500'
                      }`}></span>
                      <span className={`text-sm font-medium ${
                        prediction.isCorrect ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {prediction.isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                      <span className="text-sm text-gray-600 font-medium">Pending</span>
                    </div>
                  )}
                  
                  {accuracy && (
                    <span className="text-sm text-gray-500">
                      Accuracy: {accuracy}%
                    </span>
                  )}
                </div>
                
                {prediction.score !== undefined && (
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Score</p>
                    <p className="text-lg font-bold text-gray-900">
                      {prediction.score} pts
                    </p>
                  </div>
                )}
              </div>

              {/* Edit Button for Current Week */}
              {isCurrentWeek && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setEditingId(prediction._id);
                      setEditMin(prediction.predictedMin?.toString() || prediction.predictedPrice?.toString() || '');
                      setEditMax(prediction.predictedMax?.toString() || prediction.predictedPrice?.toString() || '');
                      setEditMessage(null);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors apple-button"
                  >
                    Edit Prediction
                  </button>
                </div>
              )}

              {/* Edit Form */}
              {editingId === prediction._id && (
                <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3">Edit Prediction</h4>
                  
                  {editMessage && (
                    <div className={`p-3 rounded-lg mb-3 ${
                      editMessage.type === 'success' 
                        ? 'bg-green-50 border border-green-200 text-green-700' 
                        : 'bg-red-50 border border-red-200 text-red-700'
                    }`}>
                      {editMessage.text}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Min Price</label>
                      <input
                        type="number"
                        value={editMin}
                        onChange={(e) => setEditMin(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Price</label>
                      <input
                        type="number"
                        value={editMax}
                        onChange={(e) => setEditMax(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        step="0.01"
                      />
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={async () => {
                        const min = parseFloat(editMin);
                        const max = parseFloat(editMax);
                        
                        if (!min || !max || min >= max) {
                          setEditMessage({ type: 'error', text: 'Please enter valid prices (min < max)' });
                          return;
                        }
                        
                        setEditLoading(true);
                        const result = await onEditPrediction(prediction._id, { min, max });
                        
                        if (result.success) {
                          setEditMessage({ type: 'success', text: 'Prediction updated successfully!' });
                          setTimeout(() => {
                            setEditingId(null);
                            setEditMessage(null);
                          }, 2000);
                        } else {
                          setEditMessage({ type: 'error', text: result.error || 'Failed to update prediction' });
                        }
                        
                        setEditLoading(false);
                      }}
                      disabled={editLoading}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 apple-button"
                    >
                      {editLoading ? 'Updating...' : 'Save Changes'}
                    </button>
                    
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditMessage(null);
                      }}
                      className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors apple-button"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

