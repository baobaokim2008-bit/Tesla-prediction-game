'use client';

import { useState, useEffect } from 'react';

interface Props {
  onSubmit: (predictedRange: { min: number; max: number }) => Promise<{ success: boolean; error?: string }>;
  currentPrice: number;
  userId: string | null;
  onEditPrediction: (predictionId: string, newRange: { min: number; max: number }) => Promise<{ success: boolean; error?: string }>;
}

interface Prediction {
  _id: string;
  predictedMin?: number;
  predictedMax?: number;
  predictedPrice?: number;
  weekStartDate: string;
  weekEndDate: string;
  actualPrice?: number;
  isCorrect?: boolean;
  createdAt: string;
}

export function PredictionForm({ onSubmit, currentPrice, userId, onEditPrediction }: Props) {
  const [predictedMin, setPredictedMin] = useState('');
  const [predictedMax, setPredictedMax] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [existingPrediction, setExistingPrediction] = useState<Prediction | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Check for existing prediction when component mounts or userId changes
  useEffect(() => {
    if (userId) {
      checkExistingPrediction();
    }
  }, [userId]);

  const checkExistingPrediction = async () => {
    if (!userId) return;
    
    try {
      const response = await fetch(`/api/predictions?userId=${userId}`);
      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        // Check if any prediction is for the current week
        const now = new Date();
        const currentDay = now.getDay();
        const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - daysToMonday);
        weekStart.setHours(0, 0, 0, 0);

        const currentWeekPrediction = data.data.find((pred: Prediction) => {
          const predictionDate = new Date(pred.weekStartDate);
          
          // More flexible comparison for timezone differences
          const predictionWeekStart = new Date(predictionDate);
          predictionWeekStart.setHours(0, 0, 0, 0);
          
          const currentWeekStart = new Date(weekStart);
          currentWeekStart.setHours(0, 0, 0, 0);
          
          // Calculate the difference in days
          const diffTime = Math.abs(predictionWeekStart.getTime() - currentWeekStart.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          // Consider it the same week if within 6 days
          return diffDays <= 6;
        });

        if (currentWeekPrediction) {
          setExistingPrediction(currentWeekPrediction);
          // Don't automatically switch to edit mode - let user choose
          setIsEditing(false);
        } else {
          setExistingPrediction(null);
          setIsEditing(false);
        }
      } else {
        setExistingPrediction(null);
        setIsEditing(false);
      }
    } catch (err) {
      console.error('Failed to check existing prediction:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const min = parseFloat(predictedMin);
    const max = parseFloat(predictedMax);
    
    if (!min || !max || min <= 0 || max <= 0) {
      setMessage({ type: 'error', text: 'Please enter valid prices' });
      return;
    }

    if (min >= max) {
      setMessage({ type: 'error', text: 'Minimum price must be less than maximum price' });
      return;
    }

    if (max - min < 1) {
      setMessage({ type: 'error', text: 'Price range must be at least $1.00' });
      return;
    }

    if (max - min > (currentPrice || 340) * 1.0) {
      setMessage({ type: 'error', text: 'Price range cannot exceed 100% of current price' });
      return;
    }

    setLoading(true);
    setMessage(null);

    let result;
    if (existingPrediction && isEditing) {
      // Edit existing prediction
      result = await onEditPrediction(existingPrediction._id, { min, max });
    } else {
      // Create new prediction
      result = await onSubmit({ min, max });
    }
    
    if (result.success) {
      setMessage({ type: 'success', text: existingPrediction && isEditing ? 'Prediction updated successfully!' : 'Prediction submitted successfully!' });
      if (!existingPrediction || !isEditing) {
        setPredictedMin('');
        setPredictedMax('');
      }
      // Refresh the existing prediction check after a short delay to allow parent state to update
      setTimeout(async () => {
        await checkExistingPrediction();
      }, 100);
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to submit prediction' });
    }

    setLoading(false);
  };

  const getPriceRangeSuggestion = () => {
    const basePrice = currentPrice || 340;
    const range = basePrice * 0.05; // 5% range
    const min = basePrice - range / 2;
    const max = basePrice + range / 2;
    return { min: min.toFixed(2), max: max.toFixed(2) };
  };

  const startEditing = () => {
    setIsEditing(true);
    setMessage(null);
    // Pre-fill with existing values if available
    if (existingPrediction && existingPrediction.predictedMin !== undefined && existingPrediction.predictedMax !== undefined) {
      setPredictedMin(existingPrediction.predictedMin.toString());
      setPredictedMax(existingPrediction.predictedMax.toString());
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setPredictedMin('');
    setPredictedMax('');
    setMessage(null);
  };

  // If there's an existing prediction and we're not editing, show edit prompt
  if (existingPrediction && !isEditing) {
    return (
      <div className="bg-white apple-card rounded-2xl p-6 border border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Make Your Prediction</h2>
        
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">You already have a prediction for this week</h3>
          <p className="text-blue-700 text-sm mb-4">
            Current prediction: ${existingPrediction.predictedMin?.toFixed(2) || existingPrediction.predictedPrice?.toFixed(2)} - ${existingPrediction.predictedMax?.toFixed(2) || existingPrediction.predictedPrice?.toFixed(2)}
          </p>
          <button
            onClick={startEditing}
            className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors apple-button"
          >
            Edit Prediction
          </button>
        </div>

        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">How it works</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Predict a price range (min - max) by Monday</li>
            <li>• One prediction per week per user</li>
            <li>• You win if Friday's price falls within your range</li>
            <li>• Range must be at least $1.00 and no more than 100% of current price</li>
            <li>• Get AI insights to help inform your decision</li>
            <li>• <strong>Scoring:</strong> 1 point participation + 10 points correct + 30 points narrowest range</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white apple-card rounded-2xl p-6 border border-gray-200">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        {existingPrediction && isEditing ? 'Edit Your Prediction' : 'Make Your Prediction'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Predict Tesla's stock price range by Friday
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={predictedMin}
                onChange={(e) => setPredictedMin(e.target.value)}
                placeholder={((currentPrice || 340) * 0.95).toFixed(2)}
                step="0.01"
                min="0"
                className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                required
              />
              <label className="block text-xs text-gray-500 mt-1">Minimum</label>
            </div>
            
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={predictedMax}
                onChange={(e) => setPredictedMax(e.target.value)}
                placeholder={((currentPrice || 340) * 1.05).toFixed(2)}
                step="0.01"
                min="0"
                className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                required
              />
              <label className="block text-xs text-gray-500 mt-1">Maximum</label>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Current price: ${(currentPrice || 0).toFixed(2)} | Range must be $1.00 - ${((currentPrice || 340) * 1.0).toFixed(2)}
          </p>
        </div>

        {message && (
          <div className={`p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed apple-button"
          >
            {loading ? 'Submitting...' : (existingPrediction && isEditing ? 'Update Prediction' : 'Submit Prediction')}
          </button>
          
          {!existingPrediction && (
            <button
              type="button"
              onClick={() => {
                const suggestion = getPriceRangeSuggestion();
                setPredictedMin(suggestion.min);
                setPredictedMax(suggestion.max);
              }}
              className="px-6 py-3 bg-gray-100 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors apple-button font-medium"
            >
              Get Suggestion
            </button>
          )}

          {existingPrediction && isEditing && (
            <button
              type="button"
              onClick={cancelEditing}
              className="px-6 py-3 bg-gray-100 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors apple-button font-medium"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 How it works</h3>
        <div className="space-y-3 text-sm text-blue-800">
          <div>
            <p className="font-semibold text-blue-900 mb-1">📅 Prediction Window:</p>
            <p>• Make predictions Monday through Thursday</p>
            <p>• One prediction per week per user</p>
            <p>• You can update your prediction until Thursday</p>
          </div>
          
          <div>
            <p className="font-semibold text-blue-900 mb-1">🏆 Day-Based Multipliers:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-green-100 p-2 rounded border border-green-200">
                <p className="font-semibold text-green-800">Monday: 5×</p>
                <p className="text-green-700">Highest reward for early predictions</p>
              </div>
              <div className="bg-yellow-100 p-2 rounded border border-yellow-200">
                <p className="font-semibold text-yellow-800">Tuesday: 3×</p>
                <p className="text-yellow-700">Good balance of timing and info</p>
              </div>
              <div className="bg-orange-100 p-2 rounded border border-orange-200">
                <p className="font-semibold text-orange-800">Wednesday: 2×</p>
                <p className="text-orange-700">More market data available</p>
              </div>
              <div className="bg-red-100 p-2 rounded border border-red-200">
                <p className="font-semibold text-red-800">Thursday: 1×</p>
                <p className="text-red-700">Latest info, lowest multiplier</p>
              </div>
            </div>
          </div>
          
          <div>
            <p className="font-semibold text-blue-900 mb-1">📊 Scoring System:</p>
            <ul className="space-y-1 ml-2">
              <li>• <strong>Base Points:</strong> 1 (participation) + 10 (correct prediction)</li>
              <li>• <strong>Bonus Points:</strong> +30 for narrowest range among correct predictions</li>
              <li>• <strong>Final Score:</strong> (Base + Bonus) × Day Multiplier</li>
            </ul>
          </div>
          
          <div>
            <p className="font-semibold text-blue-900 mb-1">🎮 Game Rules:</p>
            <ul className="space-y-1 ml-2">
              <li>• Predict a price range (min - max)</li>
              <li>• You win if Friday's closing price falls within your range</li>
              <li>• Range must be at least $1.00 and no more than 100% of current price</li>
              <li>• Get AI insights to help inform your decision</li>
            </ul>
          </div>
          
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <p className="text-yellow-800 font-semibold mb-1">💡 Pro Tips:</p>
            <ul className="text-xs text-yellow-700 space-y-1">
              <li>• <strong>Early Bird Bonus:</strong> Monday predictions get 5× multiplier!</li>
              <li>• <strong>Strategic Updates:</strong> Later updates use the new day's multiplier</li>
              <li>• <strong>Risk vs. Reward:</strong> Narrower ranges = higher bonus potential</li>
              <li>• <strong>Market Timing:</strong> Use AI insights to time your predictions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

