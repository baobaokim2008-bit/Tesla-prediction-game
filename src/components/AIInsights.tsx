'use client';

import { useState, useEffect } from 'react';

interface Props {
  currentPrice: number;
}

export function AIInsights({ currentPrice }: Props) {
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchCatalystAnalysis();
  }, [currentPrice]);

  const fetchCatalystAnalysis = async () => {
    setLoading(true);
    setInsight('');

    try {
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPrice,
          predictedPrice: currentPrice, // Use current price as reference
          historicalContext: 'Recent market analysis',
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setInsight(data.data.insight);
        setLastUpdated(new Date());
      } else {
        setInsight('Unable to generate catalyst analysis at this time. Please try again later.');
      }
    } catch (error) {
      setInsight('Failed to get catalyst analysis. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const formatInsight = (insightText: string) => {
    // Improved regex patterns to better capture both sections
    const positiveMatch = insightText.match(/POSITIVE CATALYSTS[:\s]*([\s\S]*?)(?=NEGATIVE CATALYSTS|$)/i);
    const negativeMatch = insightText.match(/NEGATIVE CATALYSTS[:\s]*([\s\S]*?)(?=POSITIVE CATALYSTS|$)/i);
    
    // Debug logging to see what's being captured
    console.log('Full insight text:', insightText);
    console.log('Positive match:', positiveMatch);
    console.log('Negative match:', negativeMatch);
    
    if (positiveMatch || negativeMatch) {
      return (
        <div className="space-y-4">
          {positiveMatch && (
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-green-300 mb-2">⬆️ Positive Catalysts</h4>
              <div className="text-gray-200 text-sm leading-relaxed whitespace-pre-line">
                {positiveMatch[1].trim()}
              </div>
            </div>
          )}
          {negativeMatch && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-red-300 mb-2">⬇️ Negative Catalysts</h4>
              <div className="text-gray-200 text-sm leading-relaxed whitespace-pre-line">
                {negativeMatch[1].trim()}
              </div>
            </div>
          )}
        </div>
      );
    }
    
    // Fallback to regular text if no structured format found
    return (
      <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-line">
        {insightText}
      </p>
    );
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">AI Catalyst Analysis</h2>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-gray-400">
              Updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchCatalystAnalysis}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Refreshing...' : '🔄 Refresh'}
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
          <span className="ml-3 text-gray-300">Analyzing recent catalysts...</span>
        </div>
      ) : insight ? (
        <div className="space-y-4">
          {formatInsight(insight)}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <p>Unable to load catalyst analysis</p>
          <button
            onClick={fetchCatalystAnalysis}
            className="mt-2 px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Removed "About Catalyst Analysis" section */}
    </div>
  );
}

