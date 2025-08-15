'use client';

import { useState } from 'react';

interface MarketCatalyst {
  type: 'positive' | 'negative';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  timeframe: string;
  priceTarget?: {
    min: number;
    max: number;
  };
  sources: string[];
  timestamp: string;
}

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
}

interface MarketContext {
  grokAnalysis?: {
    summary: string;
    recommendation: string;
    confidence: number;
  };
  catalysts: MarketCatalyst[];
  marketAnalysis?: {
    overallSentiment: string;
    weeklyOutlook: string;
    keyRisks: string[];
    opportunities: string[];
  };
  technicalAnalysis?: {
    trend: string;
    support: number;
    resistance: number;
    momentum: string;
  };
  newsArticles?: NewsArticle[];
}

interface Props {
  marketContext: MarketContext;
  isLoading?: boolean;
}

export function MarketCatalysts({ marketContext, isLoading = false }: Props) {
  const [expandedCatalyst, setExpandedCatalyst] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'catalysts' | 'analysis' | 'technical' | 'news'>('catalysts');

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getImpactIcon = (type: string) => {
    return type === 'positive' ? '📈' : '📉';
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else {
      return 'Just now';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white apple-card rounded-2xl p-6 border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!marketContext) {
    return (
      <div className="bg-white apple-card rounded-2xl p-6 border border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Market Analysis</h2>
        <p className="text-gray-500">No market data available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="bg-white apple-card rounded-2xl p-6 border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Market Analysis</h2>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors apple-button font-medium"
        >
          Refresh Analysis
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
        {[
          { id: 'catalysts', label: 'Catalysts', icon: '⚡' },
          { id: 'analysis', label: 'AI Analysis', icon: '🤖' },
          { id: 'technical', label: 'Technical', icon: '📊' },
          { id: 'news', label: 'News', icon: '📰' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === 'catalysts' && (
          <div>
            {marketContext.catalysts && marketContext.catalysts.length > 0 ? (
              <div className="space-y-4">
                {marketContext.catalysts.map((catalyst, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border ${
                      catalyst.type === 'positive' 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getImpactIcon(catalyst.type)}</span>
                        <h3 className="font-semibold text-gray-900">{catalyst.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          catalyst.impact === 'high' ? 'bg-red-100 text-red-700' :
                          catalyst.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {catalyst.impact} impact
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">{formatTimeAgo(catalyst.timestamp)}</span>
                    </div>
                    
                    <p className="text-gray-700 mt-2">{catalyst.description}</p>
                    
                    {catalyst.priceTarget && (
                      <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                        <p className="text-sm font-medium text-gray-900 mb-1">Price Target</p>
                        <p className="text-lg font-semibold text-gray-900">
                          ${catalyst.priceTarget.min.toFixed(2)} - ${catalyst.priceTarget.max.toFixed(2)}
                        </p>
                      </div>
                    )}
                    
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">Confidence:</span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${catalyst.confidence}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500">{catalyst.confidence}%</span>
                      </div>
                      <span className="text-xs text-gray-500">{catalyst.timeframe}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No catalysts identified at this time.</p>
            )}
          </div>
        )}

        {activeTab === 'analysis' && (
          <div>
            {marketContext.grokAnalysis ? (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <h3 className="font-semibold text-blue-900 mb-2">AI Summary</h3>
                  <p className="text-blue-800">{marketContext.grokAnalysis.summary}</p>
                </div>
                
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                  <h3 className="font-semibold text-green-900 mb-2">Recommendation</h3>
                  <p className="text-green-800">{marketContext.grokAnalysis.recommendation}</p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">AI Confidence:</span>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${marketContext.grokAnalysis.confidence}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600">{marketContext.grokAnalysis.confidence}%</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">AI analysis not available.</p>
            )}
          </div>
        )}

        {activeTab === 'technical' && (
          <div>
            {marketContext.technicalAnalysis ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-2">Trend</h3>
                  <p className="text-gray-700">{marketContext.technicalAnalysis.trend}</p>
                </div>
                
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-2">Momentum</h3>
                  <p className="text-gray-700">{marketContext.technicalAnalysis.momentum}</p>
                </div>
                
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-2">Support</h3>
                  <p className="text-2xl font-bold text-green-600">${marketContext.technicalAnalysis.support}</p>
                </div>
                
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-2">Resistance</h3>
                  <p className="text-2xl font-bold text-red-600">${marketContext.technicalAnalysis.resistance}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Technical analysis not available.</p>
            )}
          </div>
        )}

        {activeTab === 'news' && (
          <div>
            {marketContext.newsArticles && marketContext.newsArticles.length > 0 ? (
              <div className="space-y-4">
                {marketContext.newsArticles.slice(0, 5).map((article, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{article.title}</h3>
                        <p className="text-gray-600 text-sm mb-2">{article.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>{article.source}</span>
                          <span>{formatTimeAgo(article.publishedAt)}</span>
                          <span className={`px-2 py-1 rounded-full ${
                            article.sentiment === 'bullish' ? 'bg-green-100 text-green-700' :
                            article.sentiment === 'bearish' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {article.sentiment}
                          </span>
                        </div>
                      </div>
                      {article.url && (
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-4 px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Read
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No news articles available.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}