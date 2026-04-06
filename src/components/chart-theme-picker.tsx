'use client';

import { chartThemes, ChartThemeKey } from '@/lib/chart-themes';
import { useChartTheme } from '@/components/chart-theme-provider';
import { Palette } from 'lucide-react';
import { useState } from 'react';

export default function ChartThemePicker() {
  const { themeKey, setThemeKey, theme } = useChartTheme();
  const [open, setOpen] = useState(false);

  const ds = theme.dashboard;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg transition text-sm"
        style={{
          backgroundColor: ds.inputBg,
          border: `1px solid ${ds.inputBorder}`,
          color: ds.textPrimary,
        }}
        title="Change dashboard style"
      >
        <Palette size={16} style={{ color: ds.textMuted }} />
        <span className="hidden sm:inline" style={{ color: ds.textMuted }}>Style:</span>
        <span className="font-medium">{theme.name}</span>
        <div className="flex gap-0.5 ml-1">
          {theme.series.slice(0, 4).map((c, i) => (
            <div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
          ))}
        </div>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-2 z-50 w-80 rounded-xl shadow-2xl p-3 space-y-1.5"
            style={{
              backgroundColor: ds.cardBg,
              border: `1px solid ${ds.cardBorder}`,
              backdropFilter: ds.cardBlur,
            }}
          >
            <p className="text-xs font-medium uppercase tracking-wider px-2 mb-2" style={{ color: ds.textMuted }}>
              Dashboard Style
            </p>
            {(Object.keys(chartThemes) as ChartThemeKey[]).map((key) => {
              const t = chartThemes[key];
              const d = t.dashboard;
              const isActive = key === themeKey;
              return (
                <button
                  key={key}
                  onClick={() => {
                    setThemeKey(key);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-left"
                  style={{
                    backgroundColor: isActive ? `${t.colors.primary}15` : 'transparent',
                    border: isActive ? `1px solid ${t.colors.primary}40` : '1px solid transparent',
                  }}
                >
                  {/* Mini dashboard preview */}
                  <div
                    className="w-12 h-9 rounded flex-shrink-0 overflow-hidden p-0.5"
                    style={{
                      backgroundColor: d.pageBg,
                      border: `1px solid ${d.cardBorder}`,
                    }}
                  >
                    {/* Mini KPI row */}
                    <div className="flex gap-0.5 mb-0.5">
                      {t.series.slice(0, 3).map((c, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-sm"
                          style={{
                            height: 3,
                            backgroundColor: d.cardBg,
                            borderBottom: `1.5px solid ${c}`,
                          }}
                        />
                      ))}
                    </div>
                    {/* Mini chart bars */}
                    <div className="flex items-end gap-px" style={{ height: 16 }}>
                      {[60, 40, 85, 55, 75, 45].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1"
                          style={{
                            height: `${h}%`,
                            backgroundColor: t.series[i % t.series.length],
                            borderRadius: `${Math.min(t.chart.barRadius, 2)}px ${Math.min(t.chart.barRadius, 2)}px 0 0`,
                            opacity: 0.85,
                            boxShadow: t.chart.glowEffect ? `0 0 3px ${t.series[i % t.series.length]}50` : 'none',
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium" style={{ color: ds.textPrimary }}>
                        {t.preview} {t.name}
                      </span>
                    </div>
                    <div className="text-[10px] truncate" style={{ color: ds.textMuted }}>{t.description}</div>
                  </div>

                  {isActive && (
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: t.colors.primary }}
                    >
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
