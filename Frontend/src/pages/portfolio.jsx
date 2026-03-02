import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Briefcase, TrendingUp, TrendingDown, Wallet, Loader2 } from 'lucide-react';

const Portfolio = ({ user }) => {
  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState(true);

  // FIXED: Added the missing loadMarketOverview function
  const loadMarketOverview = async () => {
    try {
      setLoading(true);
      // Fetching your user-specific portfolio from the Python backend
      const response = await fetch(`http://localhost:8001/api/portfolio/${user.id}`);
      const data = await response.json();
      setPortfolioData(data);
    } catch (error) {
      console.error("Error loading portfolio:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadMarketOverview();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Calculating your gains...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Your Portfolio</h1>
        <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-lg">
          <Wallet className="w-5 h-5 text-primary" />
          <span className="font-bold">₹{portfolioData?.balance?.toLocaleString()}</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Invested</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{portfolioData?.summary?.total_invested?.toLocaleString()}</div>
          </CardContent>
        </Card>
        {/* Additional portfolio summary cards would go here */}
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Your Holdings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead>
                <tr className="border-b transition-colors">
                  <th className="h-12 px-4 text-left font-medium">Ticker</th>
                  <th className="h-12 px-4 text-left font-medium">Qty</th>
                  <th className="h-12 px-4 text-left font-medium">Avg Price</th>
                  <th className="h-12 px-4 text-left font-medium">Current</th>
                  <th className="h-12 px-4 text-left font-medium">P&L</th>
                </tr>
              </thead>
              <tbody>
                {portfolioData?.positions?.map((pos, i) => (
                  <tr key={i} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 font-bold">{pos.ticker}</td>
                    <td className="p-4">{pos.quantity}</td>
                    <td className="p-4">₹{pos.avg_price.toFixed(2)}</td>
                    <td className="p-4 font-semibold">₹{pos.current_price.toFixed(2)}</td>
                    <td className={`p-4 font-bold ${pos.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {pos.pnl >= 0 ? '+' : ''}{pos.pnl.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Portfolio;