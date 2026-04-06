'use client';

import { useState } from 'react';
import { useChartTheme } from '@/components/chart-theme-provider';
import {
  BarChart3,
  PieChart as PieIcon,
  LineChart as LineIcon,
  AreaChart as AreaIcon,
  Layers,
  ArrowLeftRight,
} from 'lucide-react';

export type ChartVariant =
  | 'bar'
  | 'stackedBar'
  | 'groupedBar'
  | 'horizontalBar'
  | 'line'
  | 'area'
  | 'pie'
  | 'donut';

interface ChartOption {
  key: ChartVariant;
  label: string;
  icon: React.ComponentType<any>;
}

const ALL_OPTIONS: Record<ChartVariant, ChartOption> = {
  bar: { key: 'bar', label: 'Bar', icon: BarChart3 },
  stackedBar: { key: 'stackedBar', label: 'Stacked', icon: Layers },
  groupedBar: { key: 'groupedBar', label: 'Grouped', icon: ArrowLeftRight },
  horizontalBar: { key: 'horizontalBar', label: 'H-Bar', icon: BarChart3 },
  line: { key: 'line', label: 'Line', icon: LineIcon },
  area: { key: 'area', label: 'Area', icon: AreaIcon },
  pie: { key: 'pie', label: 'Pie', icon: PieIcon },
  donut: { key: 'donut', label: 'Donut', icon: PieIcon },
};

interface ChartTypeSelectorProps {
  options: ChartVariant[];
  value: ChartVariant;
  onChange: (variant: ChartVariant) => void;
}

export function ChartTypeSelector({ options, value, onChange }: ChartTypeSelectorProps) {
  let ds: any;
  let tc: any;
  try {
    const { theme } = useChartTheme();
    ds = theme.dashboard;
    tc = theme.colors;
  } catch {
    ds = {
      inputBg: '#1a1a26',
      divider: '#2a2a3d',
      textMuted: '#8888a0',
      textPrimary: '#e8e8f0',
    };
    tc = { primary: '#06b6d4' };
  }

  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-lg p-0.5"
      style={{ backgroundColor: ds.inputBg, border: `1px solid ${ds.divider}` }}
    >
      {options.map((optKey) => {
        const opt = ALL_OPTIONS[optKey];
        const Icon = opt.icon;
        const isActive = value === optKey;
        return (
          <button
            key={optKey}
            onClick={() => onChange(optKey)}
            title={opt.label}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all"
            style={{
              backgroundColor: isActive ? tc.primary + '25' : 'transparent',
              color: isActive ? tc.primary : ds.textMuted,
              border: isActive ? `1px solid ${tc.primary}40` : '1px solid transparent',
            }}
          >
            <Icon size={13} />
            <span className="hidden sm:inline">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// Hook for managing chart type state with localStorage persistence
export function useChartType(chartId: string, defaultType: ChartVariant): [ChartVariant, (v: ChartVariant) => void] {
  const [chartType, setChartType] = useState<ChartVariant>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`chart-type-${chartId}`);
        if (saved) return saved as ChartVariant;
      } catch {}
    }
    return defaultType;
  });

  const setType = (v: ChartVariant) => {
    setChartType(v);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`chart-type-${chartId}`, v);
      } catch {}
    }
  };

  return [chartType, setType];
}
