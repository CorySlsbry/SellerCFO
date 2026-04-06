'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface RevenueChartProps {
  data?: Array<{ month: string; revenue: number; expenses: number }>;
}

export const RevenueChart = ({ data }: RevenueChartProps) => {
  // Show empty state if no data provided
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-[#8888a0]">
        <p>No revenue data available. Connect QuickBooks to see revenue trends.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#2a2a3d"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            stroke="#8888a0"
            style={{ fontSize: '0.875rem' }}
          />
          <YAxis
            stroke="#8888a0"
            style={{ fontSize: '0.875rem' }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a26',
              border: '1px solid #2a2a3d',
              borderRadius: '0.5rem',
              color: '#e8e8f0',
            }}
            labelStyle={{ color: '#e8e8f0' }}
            formatter={(value: any) => `$${(Number(value) / 1000).toFixed(0)}k`}
          />
          <Legend
            wrapperStyle={{ paddingTop: '1.5rem' }}
            iconType="line"
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#06b6d4"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorRevenue)"
            name="Revenue"
          />
          <Area
            type="monotone"
            dataKey="expenses"
            stroke="#ef4444"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorExpenses)"
            name="Expenses"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
