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
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <div className="animate-pulse">
          <div className="h-6 bg-white/20 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 bg-white/10 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const showNewsTab = marketContext.newsArticles && marketContext.newsArticles.length > 0;

  return (
    <div className="space-y-6">
      {/* Grok AI Analysis Summary */}
      {marketContext.grokAnalysis && (
        <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-2xl">🤖</span>
            <h3 className="text-xl font-bold text-white">Grok AI Analysis</h3>
            <span className="text-sm bg-white/20 px-2 py-1 rounded text-purple-200">
              {marketContext.grokAnalysis.confidence}% confidence
            </span>
          </div>
          <p className="text-purple-100 mb-3">{marketContext.grokAnalysis.summary}</p>
          <div className="bg-white/10 rounded-lg p-3">
            <span className="text-sm font-semibold text-purple-200">Recommendation: </span>
            <span className="text-white">{marketContext.grokAnalysis.recommendation}</span>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
        {[
          { id: 'catalysts', label: 'Catalysts', icon: '⚡' },
          { id: 'analysis', label: 'Market Analysis', icon: '📊' },
          { id: 'technical', label: 'Technical', icon: '📈' },
          ...(showNewsTab
            ? [{ id: 'news', label: `News (${marketContext.newsArticles!.length})`, icon: '📰' }]
            : [])
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white/20 text-white'
                : 'text-purple-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'catalysts' && (
        <div className="space-y-4">
          {marketContext.catalysts && marketContext.catalysts.length > 0 ? (
            marketContext.catalysts.map((catalyst, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">{getImpactIcon(catalyst.type)}</span>
                      <span className={`inline-block w-3 h-3 rounded-full ${getImpactColor(catalyst.impact)}`}></span>
                      <h4 className="font-semibold text-white">{catalyst.title}</h4>
                      <span className="text-xs bg-white/20 px-2 py-1 rounded text-purple-200">
                        {catalyst.confidence}% confidence
                      </span>
                    </div>
                    <p className="text-sm text-purple-200 mb-2">{catalyst.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-purple-300">
                      <span>Impact: {catalyst.impact}</span>
                      <span>•</span>
                      <span>Timeframe: {catalyst.timeframe}</span>
                      {catalyst.priceTarget && (
                        <>
                          <span>•</span>
                          <span>Target: ${catalyst.priceTarget.min}-${catalyst.priceTarget.max}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setExpandedCatalyst(expandedCatalyst === `${index}` ? null : `${index}`)}
                    className="ml-4 text-purple-300 hover:text-white transition-colors"
                  >
                    <svg className={`h-5 w-5 transform transition-transform ${expandedCatalyst === `${index}` ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {expandedCatalyst === `${index}` && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="text-xs text-purple-300 space-y-1">
                      <div><strong>Sources:</strong> {catalyst.sources.join(', ')}</div>
                      <div><strong>Published:</strong> {formatTimeAgo(catalyst.timestamp)}</div>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-purple-300">
              <span className="text-4xl mb-4 block">📊</span>
              <p>No market catalysts available at the moment.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'analysis' && marketContext.marketAnalysis && (
        <div className="space-y-4">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <h4 className="font-semibold text-white mb-2 flex items-center">
              <span className="mr-2">🎯</span>Overall Sentiment
            </h4>
            <p className="text-purple-200">{marketContext.marketAnalysis.overallSentiment}</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <h4 className="font-semibold text-white mb-2 flex items-center">
              <span className="mr-2">📅</span>Weekly Outlook
            </h4>
            <p className="text-purple-200">{marketContext.marketAnalysis.weeklyOutlook}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <h4 className="font-semibold text-white mb-2 flex items-center">
                <span className="mr-2">⚠️</span>Key Risks
              </h4>
              <ul className="space-y-1">
                {marketContext.marketAnalysis.keyRisks.map((risk, index) => (
                  <li key={index} className="text-sm text-purple-200">• {risk}</li>
                ))}
              </ul>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <h4 className="font-semibold text-white mb-2 flex items-center">
                <span className="mr-2">🚀</span>Opportunities
              </h4>
              <ul className="space-y-1">
                {marketContext.marketAnalysis.opportunities.map((opportunity, index) => (
                  <li key={index} className="text-sm text-purple-200">• {opportunity}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'technical' && marketContext.technicalAnalysis && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <h4 className="font-semibold text-white mb-2 flex items-center">
                <span className="mr-2">📈</span>Trend Analysis
              </h4>
              <p className="text-purple-200">{marketContext.technicalAnalysis.trend}</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <h4 className="font-semibold text-white mb-2 flex items-center">
                <span className="mr-2">⚡</span>Momentum
              </h4>
              <p className="text-purple-200">{marketContext.technicalAnalysis.momentum}</p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <h4 className="font-semibold text-white mb-2 flex items-center">
              <span className="mr-2">🎯</span>Key Levels
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-purple-300">Support: </span>
                <span className="text-white font-semibold">${marketContext.technicalAnalysis.support}</span>
              </div>
              <div>
                <span className="text-sm text-purple-300">Resistance: </span>
                <span className="text-white font-semibold">${marketContext.technicalAnalysis.resistance}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'news' && showNewsTab && (
        <div className="space-y-3">
          {marketContext.newsArticles!.map((article, index) => (
            <a
              key={index}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`inline-block w-3 h-3 rounded-full ${getImpactColor(article.sentiment)}`}></span>
                    <h4 className="font-semibold text-white">{article.title}</h4>
                  </div>
                  <p className="text-sm text-purple-200 mb-2">{article.description}</p>
                  <div className="flex items-center space-x-2 text-xs text-purple-300">
                    <span>{article.source}</span>
                    <span>•</span>
                    <span>{formatTimeAgo(article.publishedAt)}</span>
                  </div>
                </div>
                <svg className="h-5 w-5 text-purple-300 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}