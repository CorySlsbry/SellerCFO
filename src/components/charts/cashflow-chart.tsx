'use client';

interface CashFlowChartProps {
  data?: Array<{ month: string; inflows: number; outflows: number; net: number; isForecast: boolean }>;
}

export const CashFlowChart = ({ data }: CashFlowChartProps) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[340px] text-[#8888a0]">
        <p>No cash flow data available. Connect QuickBooks to see your cash flow chart.</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => Math.max(d.inflows, d.outflows)));

  return (
    <div className="w-full h-full">
      {/* Overlapping bar chart */}
      <div className="flex items-end gap-2 sm:gap-3 md:gap-4" style={{ height: 340, padding: '20px 16px 0' }}>
        {data.map((d) => {
          const inflowPct = maxValue > 0 ? (d.inflows / maxValue) * 100 : 0;
          const outflowPct = maxValue > 0 ? (d.outflows / maxValue) * 100 : 0;
          const isPositive = d.inflows >= d.outflows;
          const forecastOpacity = d.isForecast ? 0.55 : 1;

          return (
            <div key={d.month} className="flex-1 flex flex-col items-center gap-1.5 group relative">
              <div className="w-full relative flex items-end justify-center" style={{ height: 280 }}>
                {/* Taller bar — narrow on mobile (25% inset), wider on desktop (10% inset) */}
                <div
                  className="absolute bottom-0 rounded-t-md transition-all left-[25%] right-[25%] md:left-[10%] md:right-[10%]"
                  style={{
                    height: `${Math.max(inflowPct, outflowPct)}%`,
                    backgroundColor: isPositive ? '#14532d' : '#7f1d1d',
                    border: `1.5px solid ${isPositive ? '#4ade80' : '#f87171'}`,
                    borderBottom: 'none',
                    opacity: forecastOpacity,
                  }}
                />
                {/* Shorter bar (overlapping) — same responsive inset */}
                <div
                  className="absolute bottom-0 rounded-t-sm transition-all left-[25%] right-[25%] md:left-[10%] md:right-[10%]"
                  style={{
                    height: `${Math.min(inflowPct, outflowPct)}%`,
                    backgroundColor: isPositive ? '#7f1d1d' : '#14532d',
                    border: `1.5px solid ${isPositive ? '#f87171' : '#4ade80'}`,
                    borderBottom: 'none',
                    opacity: forecastOpacity,
                  }}
                />
                {/* Net indicator — positioned just above the taller bar */}
                <div
                  className="absolute left-0 right-0 text-center hidden md:block"
                  style={{ bottom: `calc(${Math.max(inflowPct, outflowPct)}% + 6px)` }}
                >
                  <span
                    className="text-[10px] font-bold"
                    style={{
                      color: isPositive ? '#4ade80' : '#f87171',
                      opacity: forecastOpacity,
                    }}
                  >
                    {isPositive ? '+' : '-'}${(Math.abs(d.net) / 1000).toFixed(0)}k
                  </span>
                </div>

                {/* Hover/tap tooltip — shows on all devices */}
                <div className="hidden group-hover:block absolute -top-28 left-1/2 -translate-x-1/2 z-20 bg-[#1a1a26] border border-[#2a2a3d] rounded-lg p-2.5 text-xs whitespace-nowrap shadow-xl">
                  <p className="text-[#e8e8f0] font-bold mb-1">
                    {d.month} {d.isForecast && '(Forecast)'}
                  </p>
                  <p style={{ color: '#4ade80' }}>Revenue: ${(d.inflows / 1000).toFixed(1)}k</p>
                  <p style={{ color: '#f87171' }}>Expenses: ${(d.outflows / 1000).toFixed(1)}k</p>
                  <p style={{ color: isPositive ? '#4ade80' : '#f87171' }} className="mt-1 font-bold">
                    Net: {isPositive ? '+' : '-'}${(Math.abs(d.net) / 1000).toFixed(1)}k
                  </p>
                </div>
              </div>
              <span
                className="text-[9px] sm:text-xs"
                style={{
                  color: '#8888a0',
                  opacity: d.isForecast ? 0.6 : 1,
                  fontWeight: d.isForecast ? 400 : 500,
                }}
              >
                {d.month}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 px-4 py-3 rounded border" style={{ borderColor: '#2a2a3d' }}>
        <div className="flex flex-wrap gap-4 justify-center items-center">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#14532d', border: '1.5px solid #4ade80' }} />
            <span className="text-xs" style={{ color: '#b0b0c8' }}>Revenue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#7f1d1d', border: '1.5px solid #f87171' }} />
            <span className="text-xs" style={{ color: '#b0b0c8' }}>Expenses</span>
          </div>
        </div>
      </div>
    </div>
  );
};
