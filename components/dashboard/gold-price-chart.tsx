// components/dashboard/gold-price-chart.tsx
// Purpose: Display gold price chart with selectable time periods (1D/1W/1M/1Y)

'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface GoldPriceChartProps {
  currentPrice: number;
  isLoading: boolean;
}

type TimeRange = '1D' | '1W' | '1M' | '1Y';

export function GoldPriceChart({ currentPrice, isLoading }: GoldPriceChartProps) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('1M');
  const glassCardClasses = 'bg-card/60 backdrop-blur-md border border-border';

  // Generate mock chart data based on selected range
  const generateChartData = (range: TimeRange) => {
    const basePrice = currentPrice || 65;
    let dataPoints = 30;
    let dateFormat = 'day';

    switch (range) {
      case '1D':
        dataPoints = 24;
        dateFormat = 'hour';
        break;
      case '1W':
        dataPoints = 7;
        dateFormat = 'day';
        break;
      case '1M':
        dataPoints = 30;
        dateFormat = 'day';
        break;
      case '1Y':
        dataPoints = 12;
        dateFormat = 'month';
        break;
    }

    return Array.from({ length: dataPoints }, (_, i) => ({
      label: `${i + 1}`,
      price: basePrice + (Math.random() - 0.5) * 5,
      date: new Date(Date.now() - (dataPoints - i) * 24 * 60 * 60 * 1000),
    }));
  };

  const chartData = generateChartData(selectedRange);

  const ranges: TimeRange[] = ['1D', '1W', '1M', '1Y'];

  if (isLoading) {
    return (
      <Card className={`${glassCardClasses} p-6 flex-1`}>
        <div className="animate-pulse">
          <div className="h-6 bg-muted/20 rounded w-1/3 mb-4" />
          <div className="h-64 bg-muted/20 rounded" />
        </div>
      </Card>
    );
  }

  return (
    <Card className={`${glassCardClasses} p-6 flex-1 flex flex-col min-h-0`}>
      {/* Header with Time Range Tabs */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="text-base font-bold">Gold Price Chart</h3>
        </div>
        
        {/* Time Range Selector */}
        <div className="flex gap-1 bg-secondary/30 p-1 rounded-lg">
          {ranges.map((range) => (
            <Button
              key={range}
              variant="ghost"
              size="sm"
              onClick={() => setSelectedRange(range)}
              className={`
                h-7 px-3 text-xs font-medium transition-all
                ${selectedRange === range
                  ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }
              `}
            >
              {range}
            </Button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <defs>
              <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FFB800" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#FFB800" stopOpacity={0} />
              </linearGradient>
            </defs>
            
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--border))"
              opacity={0.1}
            />
            
            <XAxis
              dataKey="label"
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))', opacity: 0.2 }}
            />
            
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))', opacity: 0.2 }}
              tickFormatter={(value) => `$${value.toFixed(0)}`}
            />
            
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
                backdropFilter: 'blur(12px)',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
            />
            
            <Line
              type="monotone"
              dataKey="price"
              stroke="#FFB800"
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 4,
                fill: '#FFB800',
                stroke: 'hsl(var(--background))',
                strokeWidth: 2,
              }}
              fill="url(#goldGradient)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
