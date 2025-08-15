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
      <div className="bg-white apple-card rounded-2xl p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Tesla Stock (TSLA)</h2>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Loading stock data...</p>
        </div>
      </div>
    );
  }

  const { currentPrice, weeklyData, isFallbackData } = stockData;
  
  // Add null checks for weeklyData
  if (!weeklyData) {
    return (
      <div className="bg-white apple-card rounded-2xl p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Tesla Stock (TSLA)</h2>
        </div>
        <div className="mb-6">
          <div className="text-4xl font-bold text-gray-900 mb-2">
            ${(currentPrice || 0).toFixed(2)}
          </div>
          <div className="text-sm text-gray-500">
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
    <div className="bg-white apple-card rounded-2xl p-6 border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Tesla Stock (TSLA)</h2>
        {isFallbackData && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-1">
            <span className="text-yellow-700 text-xs font-medium">Demo Data</span>
          </div>
        )}
      </div>
      
      {/* Current Price */}
      <div className="mb-6">
        <div className="text-4xl font-bold text-gray-900 mb-2">
          ${(currentPrice || 0).toFixed(2)}
        </div>
        <div className={`text-lg font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? '+' : ''}{priceChange.toFixed(2)} ({isPositive ? '+' : ''}{priceChangePercent.toFixed(2)}%)
        </div>
        <div className="text-sm text-gray-500">
          Since Monday ({weeklyData.weekStartDate})
        </div>
      </div>

      {/* Weekly Data */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <div className="text-sm text-gray-500 font-medium">Week Start</div>
          <div className="text-xl font-semibold text-gray-900">
            ${weeklyData.weekStartPrice.toFixed(2)}
          </div>
          <div className="text-xs text-gray-400">{weeklyData.weekStartDate}</div>
        </div>
        
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <div className="text-sm text-gray-500 font-medium">Week End Target</div>
          <div className="text-xl font-semibold text-gray-900">
            ${weeklyData.weekEndPrice.toFixed(2)}
          </div>
          <div className="text-xs text-gray-400">{weeklyData.weekEndDate}</div>
        </div>
      </div>
    </div>
  );
}

