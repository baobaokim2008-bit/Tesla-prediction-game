'use client';

import { useState, useEffect } from 'react';

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

interface Props {
  currentPrice: number;
}

// Bell curve visualization component
function BellCurveChart({ predictions, currentPrice }: { predictions: Prediction[]; currentPrice: number }) {
  if (predictions.length === 0) {
    return (
      <div className="bg-white apple-card rounded-2xl p-6 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">📊 Prediction Distribution</h3>
        <p className="text-gray-500 text-center">No predictions available for visualization</p>
      </div>
    );
  }

  // Get all midpoints and ranges
  const dataPoints = predictions.map(pred => {
    if (pred.predictedMin !== undefined && pred.predictedMax !== undefined) {
      return {
        midpoint: (pred.predictedMin + pred.predictedMax) / 2,
        range: pred.predictedMax - pred.predictedMin,
        min: pred.predictedMin,
        max: pred.predictedMax,
        username: pred.username
      };
    } else if (pred.predictedPrice !== undefined) {
      return {
        midpoint: pred.predictedPrice,
        range: 0,
        min: pred.predictedPrice,
        max: pred.predictedPrice,
        username: pred.username
      };
    }
    return null;
  }).filter(Boolean);

  if (dataPoints.length === 0) {
    return (
      <div className="bg-white apple-card rounded-2xl p-6 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">📊 Prediction Distribution</h3>
        <p className="text-gray-500 text-center">No valid prediction data available</p>
        <p className="text-gray-400 text-xs text-center mt-2">
          Predictions need valid min/max values to display the distribution
        </p>
      </div>
    );
  }

  // Calculate overall statistics
  const midpoints = dataPoints.map(d => d!.midpoint);
  const minPrice = Math.min(...dataPoints.map(d => d!.min));
  const maxPrice = Math.max(...dataPoints.map(d => d!.max));
  const avgMidpoint = midpoints.reduce((sum, val) => sum + val, 0) / midpoints.length;
  const stdDev = Math.sqrt(midpoints.reduce((sum, val) => sum + Math.pow(val - avgMidpoint, 2), 0) / midpoints.length);

  // Create price range for visualization
  const priceRange = maxPrice - minPrice;
  const padding = priceRange * 0.1; // 10% padding
  const startPrice = minPrice - padding;
  const endPrice = maxPrice + padding;
  const totalRange = endPrice - startPrice;

  // Number of points to sample for smooth curves
  const numPoints = 200;
  const priceStep = totalRange / (numPoints - 1);

  // Generate bell curves for each prediction
  const bellCurves = dataPoints.map(point => {
    const curve = [];
    const sigma = point!.range / 4; // Standard deviation based on range (95% within range)
    
    for (let i = 0; i < numPoints; i++) {
      const price = startPrice + i * priceStep;
      const x = (price - point!.midpoint) / sigma;
      const y = Math.exp(-0.5 * x * x) / (sigma * Math.sqrt(2 * Math.PI));
      curve.push({ price, y });
    }
    
    return {
      curve,
      username: point!.username,
      midpoint: point!.midpoint,
      range: point!.range
    };
  });

  // Find the maximum y value for scaling
  const maxY = Math.max(...bellCurves.flatMap(bc => bc.curve.map(p => p.y)));

  return (
    <div className="bg-white apple-card rounded-2xl p-6 border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">📊 Prediction Distribution</h3>
      
      <div className="space-y-4">
        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500 font-medium">Average</p>
            <p className="text-lg font-semibold text-gray-900">${avgMidpoint.toFixed(2)}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500 font-medium">Range</p>
            <p className="text-lg font-semibold text-gray-900">${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500 font-medium">Std Dev</p>
            <p className="text-lg font-semibold text-gray-900">${stdDev.toFixed(2)}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500 font-medium">Current</p>
            <p className="text-lg font-semibold text-blue-600">${currentPrice.toFixed(2)}</p>
          </div>
        </div>

        {/* Bell Curve Visualization */}
        <div className="relative h-64 bg-gray-50 rounded-lg border border-gray-200 p-4">
          <svg className="w-full h-full" viewBox={`0 0 ${numPoints} 100`} preserveAspectRatio="none">
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map(y => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2={numPoints}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="0.5"
              />
            ))}
            
            {/* Price labels */}
            {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
              const price = startPrice + t * totalRange;
              const x = t * numPoints;
              return (
                <text
                  key={i}
                  x={x}
                  y="95"
                  fontSize="8"
                  fill="#6b7280"
                  textAnchor="middle"
                >
                  ${price.toFixed(0)}
                </text>
              );
            })}

            {/* Bell curves */}
            {bellCurves.map((bellCurve, index) => {
              const color = `hsl(${(index * 137.5) % 360}, 70%, 50%)`;
              return (
                <g key={index}>
                  <path
                    d={bellCurve.curve.map((point, i) => {
                      const x = ((point.price - startPrice) / totalRange) * numPoints;
                      const y = 100 - (point.y / maxY) * 80;
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ')}
                    stroke={color}
                    strokeWidth="2"
                    fill="none"
                    opacity="0.7"
                  />
                  
                  {/* Midpoint marker */}
                  <circle
                    cx={((bellCurve.midpoint - startPrice) / totalRange) * numPoints}
                    cy={100 - (bellCurve.curve.find(p => Math.abs(p.price - bellCurve.midpoint) < priceStep)?.y || 0) / maxY * 80}
                    r="3"
                    fill={color}
                  />
                </g>
              );
            })}

            {/* Current price line */}
            <line
              x1={((currentPrice - startPrice) / totalRange) * numPoints}
              y1="0"
              x2={((currentPrice - startPrice) / totalRange) * numPoints}
              y2="100"
              stroke="#3b82f6"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
          </svg>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2">
          {bellCurves.map((bellCurve, index) => {
            const color = `hsl(${(index * 137.5) % 360}, 70%, 50%)`;
            return (
              <div key={index} className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                ></div>
                <span className="text-sm text-gray-700">{bellCurve.username}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function PredictionDashboard({ currentPrice }: Props) {
  const [allPredictions, setAllPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    fetchAllPredictions();
  }, []);

  // Remove auto-refresh to prevent flickering
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     fetchAllPredictions();
  //   }, 30000);

  //   return () => clearInterval(interval);
  // }, []);

  const fetchAllPredictions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/predictions/all');
      const data = await response.json();
      
      console.log('Fetched predictions data:', data);
      
      if (data.success) {
        console.log('Setting predictions:', data.data);
        setAllPredictions(data.data);
        setLastRefresh(new Date());
      } else {
        setError('Failed to fetch predictions');
      }
    } catch (err) {
      console.error('Error fetching predictions:', err);
      setError('Failed to fetch predictions');
    } finally {
      setLoading(false);
    }
  };

  const getPredictionStatus = (prediction: Prediction) => {
    // Check if it's a range prediction
    if (prediction.predictedMin !== undefined && prediction.predictedMax !== undefined) {
      // For range predictions, check if current price is within the range
      if (currentPrice >= prediction.predictedMin && currentPrice <= prediction.predictedMax) {
        return { status: 'in range', color: 'text-green-400', icon: '✅' };
      }
      
      // Calculate distance from range
      let distanceFromRange = 0;
      if (currentPrice < prediction.predictedMin) {
        distanceFromRange = prediction.predictedMin - currentPrice;
      } else if (currentPrice > prediction.predictedMax) {
        distanceFromRange = currentPrice - prediction.predictedMax;
      }
      
      const percentageFromRange = (distanceFromRange / currentPrice) * 100;
      
      if (percentageFromRange <= 1) {
        return { status: 'close to range', color: 'text-yellow-400', icon: '🎯' };
      } else if (currentPrice < prediction.predictedMin) {
        return { status: 'below range', color: 'text-red-400', icon: '📉' };
      } else {
        return { status: 'above range', color: 'text-green-400', icon: '📈' };
      }
    } else if (prediction.predictedPrice !== undefined) {
      // For old single-price format
      const difference = prediction.predictedPrice - currentPrice;
      const percentage = (difference / currentPrice) * 100;
      
      // Consider it in range if within 1% of predicted price
      const tolerance = prediction.predictedPrice * 0.01;
      if (Math.abs(currentPrice - prediction.predictedPrice) <= tolerance) {
        return { status: 'close', color: 'text-green-400', icon: '✅' };
      }
      
      if (Math.abs(percentage) <= 1) {
        return { status: 'close', color: 'text-yellow-400', icon: '🎯' };
      } else if (percentage > 5) {
        return { status: 'very bullish', color: 'text-green-400', icon: '🚀' };
      } else if (percentage > 1) {
        return { status: 'bullish', color: 'text-green-300', icon: '📈' };
      } else if (percentage < -5) {
        return { status: 'very bearish', color: 'text-red-400', icon: '📉' };
      } else {
        return { status: 'bearish', color: 'text-red-300', icon: '📉' };
      }
    }
    
    return { status: 'unknown', color: 'text-gray-400', icon: '❓' };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPredictionDisplay = (prediction: Prediction) => {
    if (prediction.predictedMin !== undefined && prediction.predictedMax !== undefined) {
      return `${(prediction.predictedMin || 0).toFixed(2)} - ${(prediction.predictedMax || 0).toFixed(2)}`;
    } else if (prediction.predictedPrice !== undefined) {
      return (prediction.predictedPrice || 0).toFixed(2);
    }
    return 'N/A';
  };

  const getMidPoint = (prediction: Prediction) => {
    if (prediction.predictedMin !== undefined && prediction.predictedMax !== undefined) {
      return ((prediction.predictedMin || 0) + (prediction.predictedMax || 0)) / 2;
    } else if (prediction.predictedPrice !== undefined) {
      return prediction.predictedPrice || 0;
    }
    return 0;
  };

  const isInRange = (prediction: Prediction) => {
    const safeCurrentPrice = currentPrice || 0;
    if (prediction.predictedMin !== undefined && prediction.predictedMax !== undefined) {
      return safeCurrentPrice >= (prediction.predictedMin || 0) && safeCurrentPrice <= (prediction.predictedMax || 0);
    } else if (prediction.predictedPrice !== undefined) {
      const tolerance = (prediction.predictedPrice || 0) * 0.01;
      return Math.abs(safeCurrentPrice - (prediction.predictedPrice || 0)) <= tolerance;
    }
    return false;
  };

  const getRangeWidth = (prediction: Prediction) => {
    if (prediction.predictedMin !== undefined && prediction.predictedMax !== undefined) {
      return (prediction.predictedMax || 0) - (prediction.predictedMin || 0);
    }
    return 0;
  };

  if (loading) {
    return (
      <div className="bg-white apple-card rounded-2xl p-6 border border-gray-200">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600 font-medium">Loading community predictions...</span>
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
            onClick={fetchAllPredictions}
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
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Current Week Community Predictions</h2>
          <div className="text-sm text-gray-500 mt-1">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500">
            {allPredictions.length} predictions
          </div>
          <button
            onClick={fetchAllPredictions}
            disabled={loading}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 apple-button font-medium"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Bell Curve Chart */}
      <BellCurveChart predictions={allPredictions} currentPrice={currentPrice} />

      {allPredictions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No predictions for this week yet. Be the first to make a prediction!</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto mt-6">
          {allPredictions.map((prediction) => {
            const status = getPredictionStatus(prediction);
            const midPoint = getMidPoint(prediction);
            const safeCurrentPrice = currentPrice || 0;
            const difference = midPoint - safeCurrentPrice;
            const percentage = safeCurrentPrice > 0 ? (difference / safeCurrentPrice) * 100 : 0;
            const rangeWidth = getRangeWidth(prediction);
            
            return (
              <div key={prediction._id} className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {prediction.username}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      status.status === 'in range' ? 'bg-green-100 text-green-700' :
                      status.status === 'close to range' ? 'bg-yellow-100 text-yellow-700' :
                      status.status === 'below range' ? 'bg-red-100 text-red-700' :
                      status.status === 'above range' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {status.icon} {status.status}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatDate(prediction.createdAt)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-lg font-bold text-gray-900">
                    ${getPredictionDisplay(prediction)}
                    {prediction.predictedMin !== undefined && prediction.predictedMax !== undefined && (
                      <span className="text-xs text-gray-500 ml-2">
                        (${(rangeWidth || 0).toFixed(2)} range)
                      </span>
                    )}
                  </div>
                  <div className={`text-sm ${difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {difference >= 0 ? '+' : ''}{(difference || 0).toFixed(2)} ({(percentage || 0) >= 0 ? '+' : ''}{(percentage || 0).toFixed(1)}%)
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 mt-1">
                  vs Current: ${safeCurrentPrice.toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">📊 Prediction Stats</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-600">Average Mid-Point</div>
            <div className="text-gray-900 font-semibold">
              {allPredictions.length > 0 ? `$${((allPredictions.reduce((sum, p) => sum + getMidPoint(p), 0) / allPredictions.length) || 0).toFixed(2)}` : 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-gray-600">Most Bullish</div>
            <div className="text-green-700 font-semibold">
              {allPredictions.length > 0 ? `$${(Math.max(...allPredictions.map(p => p.predictedMax || p.predictedPrice || 0)) || 0).toFixed(2)}` : 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-gray-600">Most Bearish</div>
            <div className="text-red-700 font-semibold">
              {allPredictions.length > 0 ? `$${(Math.min(...allPredictions.map(p => p.predictedMin || p.predictedPrice || 0)) || 0).toFixed(2)}` : 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-gray-600">In Range</div>
            <div className="text-gray-900 font-semibold">
              {allPredictions.filter(p => isInRange(p)).length} / {allPredictions.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
