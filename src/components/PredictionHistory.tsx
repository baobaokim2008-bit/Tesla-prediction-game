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

  const isCurrentWeek = (prediction: Prediction) => {
    const now = new Date();
    const currentDay = now.getDay();
    const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysToMonday);
    weekStart.setHours(0, 0, 0, 0);

    const predictionDate = new Date(prediction.weekStartDate);
    return predictionDate.getTime() === weekStart.getTime();
  };

  const canEdit = (prediction: Prediction) => {
    // Can only edit current week's prediction and only if it's not an old format
    return isCurrentWeek(prediction) && 
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
      if (!isCurrentWeek(prediction)) {
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
        isCurrentWeek: isCurrentWeek(prediction),
        actualPrice: prediction.actualPrice,
        isCorrect: prediction.isCorrect,
        score: prediction.score
      });
    });

    // Sort by week start date (newest first)
    return processed.sort((a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime());
  };

  const processedPredictions = processPredictionsWithHistory();

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
      <h2 className="text-2xl font-bold text-white mb-6">My Current Week Predictions</h2>
      
      {predictions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400 mb-4">No predictions for this week yet</p>
          <p className="text-sm text-gray-500">
            Make your first prediction for this week to see it here!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {processedPredictions.map((item, index) => (
            <div key={item.prediction._id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                              <div className="mb-4">
                  <h3 className="text-lg font-semibold text-white">
                    Week of {formatDate(item.weekStart)}
                  </h3>
                </div>

              {/* Input History */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-300 mb-2">📝 Input History:</h4>
                <div className="space-y-2">
                  {item.historyEntries.map((historyEntry, historyIndex) => {
                    const dayOfWeek = getDayOfWeek(historyEntry.createdAt);
                    const multiplier = historyEntry.dayMultiplier;
                                         const isLatest = historyIndex === 0; // First entry is now the latest since we sorted newest first
                    
                    return (
                      <div 
                        key={historyEntry.createdAt}
                        className={`flex items-center justify-between p-2 rounded ${
                          isLatest ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-xs text-gray-400 min-w-[60px]">
                            {dayOfWeek}
                          </div>
                          <div className="text-sm font-medium text-white">
                            ${getHistoryEntryDisplay(historyEntry)}
                          </div>
                          <div className={`text-xs font-semibold ${getMultiplierColor(multiplier)}`}>
                            {multiplier}×
                          </div>
                          {isLatest && (
                            <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                              Latest
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatTime(historyEntry.createdAt)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Edit functionality for current week */}
              {item.isCurrentWeek && canEdit(item.prediction) && (
                <div className="mb-4">
                  <button
                    onClick={() => startEditing(item.prediction)}
                    className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                  >
                    Edit Latest Prediction
                  </button>
                </div>
              )}

              {/* Edit Mode */}
              {editingId === item.prediction._id && (
                <div className="space-y-4 p-4 bg-white/10 rounded-lg border border-white/20">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-white">Edit Prediction</h3>
                    <button
                      onClick={cancelEditing}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                      <input
                        type="number"
                        value={editMin}
                        onChange={(e) => setEditMin(e.target.value)}
                        placeholder="Min"
                        step="0.01"
                        min="0"
                        className="w-full pl-8 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <label className="block text-xs text-gray-400 mt-1">Minimum</label>
                    </div>
                    
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                      <input
                        type="number"
                        value={editMax}
                        onChange={(e) => setEditMax(e.target.value)}
                        placeholder="Max"
                        step="0.01"
                        min="0"
                        className="w-full pl-8 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <label className="block text-xs text-gray-400 mt-1">Maximum</label>
                    </div>
                  </div>

                  {editMessage && (
                    <div className={`p-3 rounded-lg text-sm ${
                      editMessage.type === 'success' 
                        ? 'bg-green-500/20 border border-green-500/30 text-green-300' 
                        : 'bg-red-500/20 border border-red-500/30 text-red-300'
                    }`}>
                      {editMessage.text}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleEditSubmit(item.prediction._id)}
                      disabled={editLoading}
                      className="flex-1 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {editLoading ? 'Updating...' : 'Update Prediction'}
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="px-4 py-2 bg-white/10 text-white border border-white/20 rounded-lg hover:bg-white/20 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Results for completed weeks */}
              {item.actualPrice && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">📊 Results:</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Actual Price:</span>
                      <span className="text-white font-medium">
                        ${item.actualPrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Status:</span>
                      <span className={`font-medium ${getStatusColor(item.prediction)}`}>
                        {getStatusText(item.prediction)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Accuracy:</span>
                      <span className="text-white font-medium">
                        {getAccuracy(item.prediction, item.actualPrice)}% off
                      </span>
                    </div>
                    {item.score !== null && item.score !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Final Score:</span>
                        <span className={`font-medium ${item.score > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {item.score} points
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

