import React, { useEffect, useRef } from 'react';
// FIX 1: Import the new CandlestickSeries object from the library
import { createChart, CandlestickSeries } from 'lightweight-charts';

const CandlestickChart = ({ chartData }) => {
  const chartContainerRef = useRef();

  useEffect(() => {
    if (!chartData || !chartData.dates) return;

    // 1. Format the raw arrays from Python into objects for TradingView
    const formattedData = chartData.dates.map((date, index) => ({
      time: date,
      open: chartData.open[index],
      high: chartData.high[index],
      low: chartData.low[index],
      close: chartData.close[index],
    }));

    // 2. Initialize the sleek, dark-mode chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: 'solid', color: 'transparent' },
        textColor: '#d1d5db',
      },
      grid: {
        vertLines: { color: 'rgba(51, 65, 85, 0.4)' },
        horzLines: { color: 'rgba(51, 65, 85, 0.4)' },
      },
      crosshair: {
        mode: 1, // Magnet mode
      },
      width: chartContainerRef.current.clientWidth,
      height: 350, 
    });

    // 3. FIX 2: Use the brand new v5.0 syntax to add the candles!
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    candlestickSeries.setData(formattedData);
    chart.timeScale().fitContent();

    // Cleanup memory when the component unmounts
    return () => chart.remove();
  }, [chartData]);

  return <div ref={chartContainerRef} style={{ width: '100%', height: '350px' }} />;
};

export default CandlestickChart;