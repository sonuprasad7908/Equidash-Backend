import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Newspaper, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';

const News = ({ user }) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * FIXED: This function was missing, causing your 'ReferenceError'.
   * It fetches live news data from your Python backend.
   */
  const loadMarketOverview = async () => {
    try {
      setLoading(true);
      // Calls your Python server running on port 8001
      const response = await fetch('http://localhost:8001/api/market/news'); 
      
      if (!response.ok) {
        throw new Error('Server responded with an error');
      }
      
      const data = await response.json();
      
      // We check if data exists and contains an array
      if (data && Array.isArray(data)) {
        setNews(data);
      } else if (data && data.news) {
        setNews(data.news);
      }
      
      setError(null);
    } catch (err) {
      console.error("News Load Error:", err);
      setError("Unable to connect to the news server. Check if your Python backend is running.");
    } finally {
      setLoading(false);
    }
  };

  // Trigger the load when the page opens
  useEffect(() => {
    loadMarketOverview();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Loading market intelligence...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-6 bg-destructive/10 rounded-xl border border-destructive/20">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold text-destructive mb-2">Connection Issue</h3>
        <p className="text-sm text-muted-foreground max-w-xs mb-4">{error}</p>
        <button 
          onClick={loadMarketOverview}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-full hover:opacity-90 transition-opacity"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Market News</h1>
          <p className="text-muted-foreground">Real-time financial updates and sentiment analysis.</p>
        </div>
        <div className="p-3 bg-primary/10 rounded-xl">
          <Newspaper className="w-6 h-6 text-primary" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {news.length > 0 ? (
          news.map((item, index) => (
            <Card key={index} className="overflow-hidden hover:border-primary/40 transition-all cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start gap-4">
                  <CardTitle className="text-base font-bold line-clamp-2 leading-snug">
                    {item.title}
                  </CardTitle>
                  {item.sentiment === 'positive' ? (
                    <div className="bg-green-500/10 p-1.5 rounded-lg">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    </div>
                  ) : (
                    <div className="bg-red-500/10 p-1.5 rounded-lg">
                      <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {item.source || 'Market Sync'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {item.time || 'Just now'}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                  {item.summary || 'Click to view full market analysis for this ticker.'}
                </p>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-24 text-center border-2 border-dashed rounded-2xl bg-secondary/20">
            <Newspaper className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">No recent articles found.</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Check back in a few minutes for new updates.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default News;