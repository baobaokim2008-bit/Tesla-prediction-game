'use client';

interface Props {
  marketContext: string;
  isLoading?: boolean;
}

export function MarketCatalysts({ marketContext, isLoading = false }: Props) {
  const parseMarketContext = (contextText: string) => {
    // Parse the new format with HIGH-IMPACT RECENT NEWS and UPCOMING HIGH-IMPACT EVENTS
    const recentNewsMatch = contextText.match(/HIGH-IMPACT RECENT NEWS \(Last 7 Days\):([\s\S]*?)(?=UPCOMING HIGH-IMPACT EVENTS:|$)/i);
    const upcomingEventsMatch = contextText.match(/UPCOMING HIGH-IMPACT EVENTS:([\s\S]*?)(?=Note:|$)/i);
    
    // Extract positive and negative catalysts from recent news
    const recentPositiveMatch = recentNewsMatch?.[1]?.match(/POSITIVE CATALYSTS:([\s\S]*?)(?=NEGATIVE CATALYSTS:|$)/i);
    const recentNegativeMatch = recentNewsMatch?.[1]?.match(/NEGATIVE CATALYSTS:([\s\S]*?)(?=UPCOMING HIGH-IMPACT EVENTS:|$)/i);
    
    // Extract positive and negative forecasts from upcoming events
    const upcomingPositiveMatch = upcomingEventsMatch?.[1]?.match(/POSITIVE FORECASTS:([\s\S]*?)(?=NEGATIVE FORECASTS:|$)/i);
    const upcomingNegativeMatch = upcomingEventsMatch?.[1]?.match(/NEGATIVE FORECASTS:([\s\S]*?)(?=Note:|$)/i);
    
    return {
      recentPositive: recentPositiveMatch?.[1]?.trim() || '',
      recentNegative: recentNegativeMatch?.[1]?.trim() || '',
      upcomingPositive: upcomingPositiveMatch?.[1]?.trim() || '',
      upcomingNegative: upcomingNegativeMatch?.[1]?.trim() || ''
    };
  };

  const formatCatalystList = (catalystText: string) => {
    if (!catalystText) return <p className="text-gray-400 text-sm">No data available</p>;
    
    const lines = catalystText.split('\n').filter(line => line.trim());
    return (
      <div className="space-y-2">
        {lines.map((line, index) => {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith('- [')) {
            return (
              <div key={index} className="text-gray-200 text-sm leading-relaxed">
                {trimmedLine}
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  };

  const parsedData = parseMarketContext(marketContext);

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 relative">
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p className="text-white text-sm">Updating market catalysts...</p>
          </div>
        </div>
      )}
      <h2 className="text-2xl font-bold text-white mb-6">Market Catalysts</h2>
      
      <div className="space-y-6">
        {/* Positive Catalysts Section */}
        <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-green-300 mb-4">⬆️ Positive Catalysts</h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Previous News Column */}
            <div>
              <h5 className="text-md font-medium text-green-200 mb-3">📰 Previous News (Last 7 Days)</h5>
              {formatCatalystList(parsedData.recentPositive)}
            </div>
            {/* Forecasts Column */}
            <div>
              <h5 className="text-md font-medium text-green-200 mb-3">🔮 Forecasts (Upcoming Events)</h5>
              {formatCatalystList(parsedData.upcomingPositive)}
            </div>
          </div>
        </div>

        {/* Negative Catalysts Section */}
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-red-300 mb-4">⬇️ Negative Catalysts</h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Previous News Column */}
            <div>
              <h5 className="text-md font-medium text-red-200 mb-3">📰 Previous News (Last 7 Days)</h5>
              {formatCatalystList(parsedData.recentNegative)}
            </div>
            {/* Forecasts Column */}
            <div>
              <h5 className="text-md font-medium text-red-200 mb-3">🔮 Forecasts (Upcoming Events)</h5>
              {formatCatalystList(parsedData.upcomingNegative)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
