'use client';

import { useState } from 'react';

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
}

interface MarketContext {
  catalysts?: any[];
  overallSentiment?: 'bullish' | 'bearish' | 'neutral';
  sentimentScore?: number;
  weeklyOutlook?: string;
  keyRisks?: string[];
  opportunities?: string[];
  technicalAnalysis?: {
    trend: string;
    support: number;
    resistance: number;
    momentum: string;
  };
  grokAnalysis?: {
    summary: string;
    recommendation: string;
    confidenceLevel: number;
    lastUpdated: string;
    newsImpact?: string;
  };
  newsArticles?: NewsArticle[];
  dataQuality?: {
    newsAvailable: boolean;
    newsCount: number;
  };
}

interface Props {
  marketContext: MarketContext | string;
  isLoading?: boolean;
}

export function MarketCatalysts({ marketContext, isLoading = false }: Props) {
  const [activeTab, setActiveTab] = useState<'catalysts' | 'news' | 'analysis' | 'technical'>('catalysts');

  // Parse market context if it's a string (legacy format)
  const parsedContext: MarketContext = typeof marketContext === 'string' 
    ? parseMarketContextString(marketContext)
    : marketContext;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-white/20 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-white/10 rounded w-full mb-2"></div>
          <div className="h-4 bg-white/10 rounded w-3/4"></div>
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 animate-pulse">
            <div className="h-4 bg-white/20 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-white/10 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  const hasNews = parsedContext.newsArticles && parsedContext.newsArticles.length > 0;
  const newsCount = parsedContext.dataQuality?.newsCount || 0;

  return (
    <div className="space-y-6">
      {/* Grok AI Analysis Summary */}
      {parsedContext.grokAnalysis && (
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm rounded-xl p-4 border border-blue-400/30">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <h3 className="font-semibold text-white">Grok-4 Analysis</h3>
            <span className="text-xs text-blue-300 bg-blue-500/20 px-2 py-1 rounded-full">
              Confidence: {parsedContext.grokAnalysis.confidenceLevel}%
            </span>
          </div>
          <p className="text-blue-100 text-sm mb-2">{parsedContext.grokAnalysis.summary}</p>
          <div className="bg-white/10 rounded-lg p-3 mt-3">
            <h4 className="text-xs font-medium text-blue-200 mb-1">AI Recommendation:</h4>
            <p className="text-white text-sm">{parsedContext.grokAnalysis.recommendation}</p>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
        {[
          { id: 'catalysts', label: 'Catalysts', icon: '⚡' },
          ...(hasNews ? [{ id: 'news', label: `News (${newsCount})`, icon: '📰' }] : []),
          { id: 'analysis', label: 'Market Analysis', icon: '📊' },
          { id: 'technical', label: 'Technical', icon: '📈' }
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
        <CatalystsTab catalysts={parsedContext.catalysts || []} />
      )}

      {activeTab === 'news' && hasNews && (
        <NewsTab articles={parsedContext.newsArticles!} />
      )}

      {activeTab === 'analysis' && (
        <AnalysisTab context={parsedContext} />
      )}

      {activeTab === 'technical' && parsedContext.technicalAnalysis && (
        <TechnicalTab technical={parsedContext.technicalAnalysis} />
      )}
    </div>
  );
}

// Component for Catalysts Tab
function CatalystsTab({ catalysts }: { catalysts: any[] }) {
  const [expandedCatalyst, setExpandedCatalyst] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {catalysts.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 text-center">
          <p className="text-purple-200">No specific catalysts available at this time.</p>
          <p className="text-sm text-purple-300 mt-2">Check the Analysis tab for general market insights.</p>
        </div>
      ) : (
        catalysts.map((catalyst) => (
          <div
            key={catalyst.id}
            className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-200"
          >
            <div
              className="p-4 cursor-pointer"
              onClick={() => setExpandedCatalyst(
                expandedCatalyst === catalyst.id ? null : catalyst.id
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-white mb-2">{catalyst.title}</h4>
                  <p className="text-sm text-purple-200">{catalyst.description}</p>
                </div>
                <svg 
                  className={`h-5 w-5 text-purple-300 transition-transform ${
                    expandedCatalyst === catalyst.id ? 'rotate-90' : ''
                  }`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// Component for News Tab
function NewsTab({ articles }: { articles: NewsArticle[] }) {
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-purple-200 mb-4">
        Latest Tesla news and market developments ({articles.length} articles)
      </div>
      {articles.map((article, index) => (
        <div key={index} className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-200">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-semibold text-white text-sm leading-tight pr-4">{article.title}</h4>
            <span className={`inline-block w-2 h-2 rounded-full ${
              article.sentiment === 'bullish' ? 'bg-green-400' :
              article.sentiment === 'bearish' ? 'bg-red-400' : 'bg-yellow-400'
            }`}></span>
          </div>
          <p className="text-sm text-purple-200 mb-3">{article.description}</p>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-3">
              <span className="text-purple-300">{article.source}</span>
              <span className="text-purple-400">{formatTimeAgo(article.publishedAt)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Component for Analysis Tab
function AnalysisTab({ context }: { context: MarketContext }) {
  return (
    <div className="space-y-4">
      {context.weeklyOutlook && (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <h4 className="font-semibold text-white mb-3">Weekly Outlook</h4>
          <p className="text-sm text-purple-200">{context.weeklyOutlook}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {context.keyRisks && context.keyRisks.length > 0 && (
          <div className="bg-red-600/10 backdrop-blur-sm rounded-xl p-4 border border-red-400/20">
            <h4 className="font-semibold text-red-300 mb-3">⚠️ Key Risks</h4>
            <ul className="space-y-2">
              {context.keyRisks.map((risk, idx) => (
                <li key={idx} className="text-sm text-red-200">• {risk}</li>
              ))}
            </ul>
          </div>
        )}

        {context.opportunities && context.opportunities.length > 0 && (
          <div className="bg-green-600/10 backdrop-blur-sm rounded-xl p-4 border border-green-400/20">
            <h4 className="font-semibold text-green-300 mb-3">💡 Opportunities</h4>
            <ul className="space-y-2">
              {context.opportunities.map((opp, idx) => (
                <li key={idx} className="text-sm text-green-200">• {opp}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// Component for Technical Tab
function TechnicalTab({ technical }: { technical: any }) {
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
      <h4 className="font-semibold text-white mb-4">Technical Analysis</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <p className="text-xs text-purple-200 mb-1">Trend</p>
          <p className="text-white font-semibold">{technical.trend}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-purple-200 mb-1">Support</p>
          <p className="text-white font-semibold">${technical.support}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-purple-200 mb-1">Resistance</p>
          <p className="text-white font-semibold">${technical.resistance}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-purple-200 mb-1">Momentum</p>
          <p className="text-white font-semibold">{technical.momentum}</p>
        </div>
      </div>
    </div>
  );
}

// Legacy parser for string-based market context
function parseMarketContextString(contextText: string): MarketContext {
  try {
    return JSON.parse(contextText);
  } catch {
    return {
      weeklyOutlook: "Market analysis in progress...",
      keyRisks: ["Market volatility", "Competitive pressure"],
      opportunities: ["Production scaling", "Energy business growth"],
      overallSentiment: 'neutral',
      technicalAnalysis: {
        trend: 'Analyzing',
        support: 0,
        resistance: 0,
        momentum: 'Moderate'
      }
    };
  }
}
