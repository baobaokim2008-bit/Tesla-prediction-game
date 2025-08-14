'use client';

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

interface Props {
  stockData: StockData | null;
}

export function StockDataDisplay({ stockData }: Props) {
  // Handle null stockData
  if (!stockData) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Tesla Stock (TSLA)</h2>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading stock data...</p>
        </div>
      </div>
    );
  }

  const { currentPrice, weeklyData, isFallbackData } = stockData;
  
  // Add null checks for weeklyData
  if (!weeklyData) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Tesla Stock (TSLA)</h2>
        </div>
        <div className="mb-6">
          <div className="text-4xl font-bold text-white mb-2">
            ${(currentPrice || 0).toFixed(2)}
          </div>
          <div className="text-sm text-gray-400">
            Current price available
          </div>
        </div>
      </div>
    );
  }

  const priceChange = currentPrice - weeklyData.weekStartPrice;
  const priceChangePercent = (priceChange / weeklyData.weekStartPrice) * 100;
  const isPositive = priceChange >= 0;

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Tesla Stock (TSLA)</h2>
        {isFallbackData && (
          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg px-3 py-1">
            <span className="text-yellow-300 text-xs">Demo Data</span>
          </div>
        )}
      </div>
      
      {/* Current Price */}
      <div className="mb-6">
        <div className="text-4xl font-bold text-white mb-2">
          ${(currentPrice || 0).toFixed(2)}
        </div>
        <div className={`text-lg ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {isPositive ? '+' : ''}{priceChange.toFixed(2)} ({isPositive ? '+' : ''}{priceChangePercent.toFixed(2)}%)
        </div>
        <div className="text-sm text-gray-400">
          Since Monday ({weeklyData.weekStartDate})
        </div>
      </div>

      {/* Weekly Data */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 rounded-lg p-4">
          <div className="text-sm text-gray-400">Week Start</div>
          <div className="text-xl font-semibold text-white">
            ${weeklyData.weekStartPrice.toFixed(2)}
          </div>
          <div className="text-xs text-gray-400">{weeklyData.weekStartDate}</div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-4">
          <div className="text-sm text-gray-400">Week End Target</div>
          <div className="text-xl font-semibold text-white">
            ${weeklyData.weekEndPrice.toFixed(2)}
          </div>
          <div className="text-xs text-gray-400">{weeklyData.weekEndDate}</div>
        </div>
      </div>

      {isFallbackData && (
        <div className="mt-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
          <p className="text-blue-300 text-sm">
            💡 <strong>Note:</strong> Using demo stock data due to API rate limits. 
            Real-time Tesla stock prices would be shown with active API access.
          </p>
        </div>
      )}
    </div>
  );
}

