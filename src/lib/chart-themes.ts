// Dashboard Style System — Full visual themes inspired by top BI platforms
// Tremor, Geckoboard, Glassmorphism, and more
// Each theme controls chart colors AND overall dashboard visual feel

export type ChartThemeKey = 'default' | 'glass' | 'tremor' | 'midnight' | 'executive';

export interface DashboardStyle {
  // Surface & container colors
  pageBg: string;
  cardBg: string;
  cardBorder: string;
  cardShadow: string;
  // Card effects
  cardBlur?: string;         // backdrop-blur for glass effects
  cardGradient?: string;     // optional gradient overlay
  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  // Borders & dividers
  divider: string;
  // Input / interactive surfaces
  inputBg: string;
  inputBorder: string;
  // Tab navigation
  tabActiveBg: string;
  tabActiveText: string;
  tabInactiveText: string;
  // AI Brief card
  briefBg: string;
  briefBorder: string;
  // Badge / tag styling
  badgeStyle: 'solid' | 'soft' | 'outline' | 'glass';
  // Card border radius
  borderRadius: string;
  // KPI card specifics
  kpiValueSize: string;
  kpiLabelWeight: string;
}

export interface ChartTheme {
  key: ChartThemeKey;
  name: string;
  description: string;
  preview: string;  // emoji or short visual hint for picker
  colors: {
    primary: string;
    positive: string;
    negative: string;
    warning: string;
    secondary: string;
    tertiary: string;
  };
  series: string[];
  chart: {
    gridColor: string;
    tooltipBg: string;
    tooltipBorder: string;
    areaOpacity: number;
    barRadius: number;
    strokeWidth: number;
    glowEffect: boolean;
    gradientFills: boolean;
  };
  dashboard: DashboardStyle;
}

export const chartThemes: Record<ChartThemeKey, ChartTheme> = {
  // ── 1. Classic (MedicalCFO default) ──────────────────────
  default: {
    key: 'default',
    name: 'Classic',
    description: 'Clean, professional with cyan accents',
    preview: '🔵',
    colors: {
      primary: '#06b6d4',
      positive: '#22c55e',
      negative: '#ef4444',
      warning: '#eab308',
      secondary: '#a78bfa',
      tertiary: '#ef9d44',
    },
    series: ['#06b6d4', '#22c55e', '#eab308', '#ef9d44', '#a78bfa', '#8888a0'],
    chart: {
      gridColor: '#2a2a3d',
      tooltipBg: '#1a1a26',
      tooltipBorder: '#2a2a3d',
      areaOpacity: 0.15,
      barRadius: 4,
      strokeWidth: 2,
      glowEffect: false,
      gradientFills: false,
    },
    dashboard: {
      pageBg: '#0a0a0f',
      cardBg: '#12121a',
      cardBorder: '#2a2a3d',
      cardShadow: 'none',
      textPrimary: '#e8e8f0',
      textSecondary: '#c8c8d8',
      textMuted: '#8888a0',
      divider: '#2a2a3d',
      inputBg: '#1a1a26',
      inputBorder: '#2a2a3d',
      tabActiveBg: '#06b6d4',
      tabActiveText: '#ffffff',
      tabInactiveText: '#8888a0',
      briefBg: '#1a1a26',
      briefBorder: '#2a2a3d',
      badgeStyle: 'soft',
      borderRadius: '0.5rem',
      kpiValueSize: 'text-2xl',
      kpiLabelWeight: 'font-medium',
    },
  },

  // ── 2. Glass (Frosted / Translucent) ─────────────────────
  glass: {
    key: 'glass',
    name: 'Glass',
    description: 'Frosted glass cards with subtle blur effects',
    preview: '🧊',
    colors: {
      primary: '#22d3ee',
      positive: '#34d399',
      negative: '#fb7185',
      warning: '#fbbf24',
      secondary: '#a78bfa',
      tertiary: '#f9a8d4',
    },
    series: ['#22d3ee', '#34d399', '#fbbf24', '#f9a8d4', '#a78bfa', '#fb7185'],
    chart: {
      gridColor: 'rgba(255,255,255,0.06)',
      tooltipBg: 'rgba(15, 15, 30, 0.85)',
      tooltipBorder: 'rgba(255,255,255,0.1)',
      areaOpacity: 0.15,
      barRadius: 8,
      strokeWidth: 2,
      glowEffect: false,
      gradientFills: true,
    },
    dashboard: {
      pageBg: '#0e0e1a',
      cardBg: 'rgba(255, 255, 255, 0.04)',
      cardBorder: 'rgba(255, 255, 255, 0.08)',
      cardShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
      cardBlur: 'blur(16px)',
      textPrimary: '#f0f0ff',
      textSecondary: '#c0c0e0',
      textMuted: '#8080a8',
      divider: 'rgba(255, 255, 255, 0.06)',
      inputBg: 'rgba(255, 255, 255, 0.04)',
      inputBorder: 'rgba(255, 255, 255, 0.08)',
      tabActiveBg: 'rgba(129, 140, 248, 0.25)',
      tabActiveText: '#ffffff',
      tabInactiveText: '#8080a8',
      briefBg: 'rgba(129, 140, 248, 0.06)',
      briefBorder: 'rgba(129, 140, 248, 0.12)',
      badgeStyle: 'glass',
      borderRadius: '1rem',
      kpiValueSize: 'text-2xl',
      kpiLabelWeight: 'font-medium',
    },
  },

  // ── 3. Tremor (Ultra-clean, minimal, rounded) ────────────
  tremor: {
    key: 'tremor',
    name: 'Tremor',
    description: 'Ultra-clean with rounded corners and subtle shadows',
    preview: '✨',
    colors: {
      primary: '#06b6d4',
      positive: '#10b981',
      negative: '#ef4444',
      warning: '#f59e0b',
      secondary: '#8b5cf6',
      tertiary: '#ec4899',
    },
    series: ['#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444'],
    chart: {
      gridColor: '#1f1f35',
      tooltipBg: '#15152a',
      tooltipBorder: '#2a2a45',
      areaOpacity: 0.1,
      barRadius: 8,
      strokeWidth: 2.5,
      glowEffect: false,
      gradientFills: true,
    },
    dashboard: {
      pageBg: '#0b0b16',
      cardBg: '#111122',
      cardBorder: '#1f1f35',
      cardShadow: '0 1px 3px rgba(0, 0, 0, 0.3), 0 4px 12px rgba(0, 0, 0, 0.15)',
      textPrimary: '#f1f1f8',
      textSecondary: '#c4c4dd',
      textMuted: '#7a7a9e',
      divider: '#1f1f35',
      inputBg: '#161628',
      inputBorder: '#1f1f35',
      tabActiveBg: '#06b6d4',
      tabActiveText: '#ffffff',
      tabInactiveText: '#7a7a9e',
      briefBg: '#161628',
      briefBorder: '#1f1f35',
      badgeStyle: 'soft',
      borderRadius: '1rem',
      kpiValueSize: 'text-3xl',
      kpiLabelWeight: 'font-semibold',
    },
  },

  // ── 4. Midnight (Deep navy, high contrast) ───────────────
  midnight: {
    key: 'midnight',
    name: 'Midnight',
    description: 'Deep navy with high-contrast data readability',
    preview: '🌙',
    colors: {
      primary: '#38bdf8',
      positive: '#4ade80',
      negative: '#f87171',
      warning: '#fbbf24',
      secondary: '#c084fc',
      tertiary: '#fb923c',
    },
    series: ['#38bdf8', '#4ade80', '#fbbf24', '#fb923c', '#c084fc', '#f87171'],
    chart: {
      gridColor: '#1e2a3a',
      tooltipBg: '#0c1624',
      tooltipBorder: '#1e2a3a',
      areaOpacity: 0.18,
      barRadius: 3,
      strokeWidth: 2,
      glowEffect: false,
      gradientFills: false,
    },
    dashboard: {
      pageBg: '#0a1628',
      cardBg: '#0f1d32',
      cardBorder: '#1a2d48',
      cardShadow: 'none',
      textPrimary: '#e8f0ff',
      textSecondary: '#a8c0e0',
      textMuted: '#607898',
      divider: '#1a2d48',
      inputBg: '#0c1a2e',
      inputBorder: '#1a2d48',
      tabActiveBg: '#38bdf8',
      tabActiveText: '#0a1628',
      tabInactiveText: '#607898',
      briefBg: '#0c1a2e',
      briefBorder: '#1a2d48',
      badgeStyle: 'solid',
      borderRadius: '0.375rem',
      kpiValueSize: 'text-2xl',
      kpiLabelWeight: 'font-bold',
    },
  },

  // ── 5. Executive (Boardroom, minimal, monochrome) ────────
  executive: {
    key: 'executive',
    name: 'Executive',
    description: 'Minimal monochrome — boardroom-ready reports',
    preview: '🏢',
    colors: {
      primary: '#94a3b8',
      positive: '#a3e635',
      negative: '#f87171',
      warning: '#fcd34d',
      secondary: '#cbd5e1',
      tertiary: '#64748b',
    },
    series: ['#94a3b8', '#a3e635', '#fcd34d', '#64748b', '#cbd5e1', '#f87171'],
    chart: {
      gridColor: '#1e2430',
      tooltipBg: '#0e1218',
      tooltipBorder: '#2a3040',
      areaOpacity: 0.08,
      barRadius: 2,
      strokeWidth: 1.5,
      glowEffect: false,
      gradientFills: false,
    },
    dashboard: {
      pageBg: '#0c0e14',
      cardBg: '#12151e',
      cardBorder: '#1e2230',
      cardShadow: '0 1px 2px rgba(0,0,0,0.3)',
      textPrimary: '#e2e8f0',
      textSecondary: '#94a3b8',
      textMuted: '#64748b',
      divider: '#1e2230',
      inputBg: '#161a24',
      inputBorder: '#1e2230',
      tabActiveBg: '#94a3b8',
      tabActiveText: '#0c0e14',
      tabInactiveText: '#64748b',
      briefBg: '#161a24',
      briefBorder: '#1e2230',
      badgeStyle: 'outline',
      borderRadius: '0.375rem',
      kpiValueSize: 'text-2xl',
      kpiLabelWeight: 'font-bold',
    },
  },
};

// Helper to get the current theme from localStorage (or default)
export function getStoredThemeKey(): ChartThemeKey {
  if (typeof window === 'undefined') return 'default';
  const stored = localStorage.getItem('medicalcfo-chart-theme') as string;
  if (stored && stored in chartThemes) return stored as ChartThemeKey;
  return 'default';
}

export function storeThemeKey(key: ChartThemeKey): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('medicalcfo-chart-theme', key);
}
