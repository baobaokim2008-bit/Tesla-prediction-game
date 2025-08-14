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
      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">📊 Prediction Distribution</h3>
        <p className="text-gray-400 text-center">No predictions available for visualization</p>
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
      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">📊 Prediction Distribution</h3>
        <p className="text-gray-400 text-center">No valid prediction data available</p>
        <p className="text-gray-500 text-xs text-center mt-2">
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
      isCurrentPrice: currentPrice >= point!.min && currentPrice <= point!.max
    };
  });

  // Combine all bell curves
  const combinedCurve = [];
  for (let i = 0; i < numPoints; i++) {
    const price = startPrice + i * priceStep;
    const totalY = bellCurves.reduce((sum, bell) => sum + bell.curve[i].y, 0);
    combinedCurve.push({ price, y: totalY });
  }

  // Find max height for scaling
  const maxY = Math.max(...combinedCurve.map(p => p.y));

  // Find the peak point (highest point) of the combined curve
  const peakPoint = combinedCurve.reduce((max, point) => 
    point.y > max.y ? point : max, combinedCurve[0]
  );

  // Safe values with fallbacks
  const safeCurrentPrice = currentPrice || 0;
  const safeStartPrice = startPrice || 0;
  const safeEndPrice = endPrice || 0;
  const safePeakPrice = peakPoint?.price || 0;
  const safeAvgMidpoint = avgMidpoint || 0;
  const safeStdDev = stdDev || 0;
  const safeMinPrice = minPrice || 0;
  const safeMaxPrice = maxPrice || 0;

  return (
    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
      <h3 className="text-lg font-semibold text-white mb-4">📊 Prediction Distribution</h3>
      
      {/* Bell curve visualization */}
      <div className="mb-6">
        <div className="text-sm text-gray-300 mb-2">Combined Bell Curve Distribution:</div>
        <div className="relative h-64 bg-white/5 rounded-lg p-4 overflow-hidden">
          {/* SVG for bell curves */}
          <svg 
            width="100%" 
            height="100%" 
            viewBox={`0 0 ${numPoints} 100`}
            className="absolute inset-0"
          >
            {/* Individual bell curves (semi-transparent) */}
            {bellCurves.map((bell, index) => (
              <g key={index}>
                <path
                  d={bell.curve.map((point, i) => {
                    const x = (i / (numPoints - 1)) * 100;
                    const y = 100 - (point.y / maxY) * 80; // Scale to 80% of height
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke={bell.isCurrentPrice ? "#fbbf24" : "#60a5fa"}
                  strokeWidth="1"
                  opacity="0.3"
                />
              </g>
            ))}
            
            {/* Combined bell curve (thick line) */}
            <path
              d={combinedCurve.map((point, i) => {
                const x = (i / (numPoints - 1)) * 100;
                const y = 100 - (point.y / maxY) * 80;
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ')}
              fill="none"
              stroke="#ffffff"
              strokeWidth="2"
              opacity="0.8"
            />
            
            {/* Peak point indicator (highest point) */}
            <circle
              cx={(combinedCurve.indexOf(peakPoint) / (numPoints - 1)) * 100}
              cy={100 - (peakPoint.y / maxY) * 80}
              r="3"
              fill="#10b981"
              stroke="#ffffff"
              strokeWidth="1"
            />
            
            {/* Peak point label */}
            <text
              x={(combinedCurve.indexOf(peakPoint) / (numPoints - 1)) * 100}
              y={100 - (peakPoint.y / maxY) * 80 - 10}
              fill="#10b981"
              fontSize="8"
              fontFamily="monospace"
              textAnchor="middle"
              fontWeight="bold"
            >
              Peak Prediction Price: ${safePeakPrice.toFixed(0)}
            </text>
            
            {/* Current price indicator line */}
            <line
              x1={((safeCurrentPrice - safeStartPrice) / totalRange) * 100}
              y1="0"
              x2={((safeCurrentPrice - safeStartPrice) / totalRange) * 100}
              y2="100"
              stroke="#fbbf24"
              strokeWidth="2"
              strokeDasharray="5,5"
              opacity="0.8"
            />
            
            {/* Price labels */}
            <text
              x="5"
              y="95"
              fill="#9ca3af"
              fontSize="8"
              fontFamily="monospace"
            >
              ${safeStartPrice.toFixed(0)}
            </text>
            <text
              x="85"
              y="95"
              fill="#9ca3af"
              fontSize="8"
              fontFamily="monospace"
              textAnchor="end"
            >
              ${safeEndPrice.toFixed(0)}
            </text>
            <text
              x={((safeCurrentPrice - safeStartPrice) / totalRange) * 100}
              y="15"
              fill="#fbbf24"
              fontSize="8"
              fontFamily="monospace"
              textAnchor="middle"
            >
              ${safeCurrentPrice.toFixed(0)}
            </text>
          </svg>
        </div>
      </div>

      {/* Individual prediction ranges */}
      <div className="mb-4 p-3 bg-white/5 rounded-lg">
        <div className="text-sm text-gray-300 mb-2">Individual Predictions:</div>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {dataPoints.map((point, index) => {
            const isCurrentPrice = safeCurrentPrice >= point!.min && safeCurrentPrice <= point!.max;
            return (
              <div key={index} className="text-xs flex items-center gap-2">
                <div 
                  className={`w-3 h-3 rounded-full ${
                    isCurrentPrice ? 'bg-yellow-400' : 'bg-blue-400'
                  }`}
                />
                <span className="text-gray-400">
                  {point!.username}: ${(point!.min || 0).toFixed(0)} - ${(point!.max || 0).toFixed(0)} 
                  (mid: ${(point!.midpoint || 0).toFixed(0)})
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-gray-400">Average Midpoint</div>
          <div className="text-white font-semibold">${safeAvgMidpoint.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-gray-400">Peak Prediction Price</div>
          <div className="text-green-400 font-semibold">${safePeakPrice.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-gray-400">Standard Deviation</div>
          <div className="text-white font-semibold">${safeStdDev.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-gray-400">Current Price</div>
          <div className="text-yellow-400 font-semibold">${safeCurrentPrice.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-gray-400">Price Range</div>
          <div className="text-white font-semibold">${safeMinPrice.toFixed(2)} - ${safeMaxPrice.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-gray-400">Peak vs Current</div>
          <div className={`font-semibold ${safePeakPrice > safeCurrentPrice ? 'text-green-400' : 'text-red-400'}`}>
            {safePeakPrice > safeCurrentPrice ? '+' : ''}{(safePeakPrice - safeCurrentPrice).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
          <span className="text-gray-300">Predictions</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
          <span className="text-gray-300">Current Price Range</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-white rounded-full opacity-80"></div>
          <span className="text-gray-300">Combined Distribution</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          <span className="text-gray-300">Peak Prediction Price</span>
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
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        <span className="ml-3 text-gray-300">Loading community predictions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-400">
        <p>{error}</p>
        <button
          onClick={fetchAllPredictions}
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
          <h2 className="text-2xl font-bold text-white">Current Week Community Predictions</h2>
          <div className="text-xs text-gray-400 mt-1">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-400">
            {allPredictions.length} predictions
          </div>
          <button
            onClick={fetchAllPredictions}
            disabled={loading}
            className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Bell Curve Chart */}
      <BellCurveChart predictions={allPredictions} currentPrice={currentPrice} />

      {allPredictions.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p>No predictions for this week yet. Be the first to make a prediction!</p>
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
              <div key={prediction._id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">
                      {prediction.username}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${status.color} bg-white/10`}>
                      {status.icon} {status.status}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatDate(prediction.createdAt)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-lg font-bold text-white">
                    ${getPredictionDisplay(prediction)}
                    {prediction.predictedMin !== undefined && prediction.predictedMax !== undefined && (
                      <span className="text-xs text-gray-400 ml-2">
                        (${(rangeWidth || 0).toFixed(2)} range)
                      </span>
                    )}
                  </div>
                  <div className={`text-sm ${difference >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {difference >= 0 ? '+' : ''}{(difference || 0).toFixed(2)} ({(percentage || 0) >= 0 ? '+' : ''}{(percentage || 0).toFixed(1)}%)
                  </div>
                </div>
                
                <div className="text-xs text-gray-400 mt-1">
                  vs Current: ${safeCurrentPrice.toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-300 mb-2">📊 Prediction Stats</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-400">Average Mid-Point</div>
            <div className="text-white font-semibold">
              {allPredictions.length > 0 ? `$${((allPredictions.reduce((sum, p) => sum + getMidPoint(p), 0) / allPredictions.length) || 0).toFixed(2)}` : 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-gray-400">Most Bullish</div>
            <div className="text-green-400 font-semibold">
              {allPredictions.length > 0 ? `$${(Math.max(...allPredictions.map(p => p.predictedMax || p.predictedPrice || 0)) || 0).toFixed(2)}` : 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-gray-400">Most Bearish</div>
            <div className="text-red-400 font-semibold">
              {allPredictions.length > 0 ? `$${(Math.min(...allPredictions.map(p => p.predictedMin || p.predictedPrice || 0)) || 0).toFixed(2)}` : 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-gray-400">In Range</div>
            <div className="text-white font-semibold">
              {allPredictions.filter(p => isInRange(p)).length} / {allPredictions.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
