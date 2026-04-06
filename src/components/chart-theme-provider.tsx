'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ChartTheme, ChartThemeKey, chartThemes, getStoredThemeKey, storeThemeKey } from '@/lib/chart-themes';

interface ChartThemeContextType {
  theme: ChartTheme;
  themeKey: ChartThemeKey;
  setThemeKey: (key: ChartThemeKey) => void;
}

const ChartThemeContext = createContext<ChartThemeContextType>({
  theme: chartThemes.default,
  themeKey: 'default',
  setThemeKey: () => {},
});

export function ChartThemeProvider({ children }: { children: ReactNode }) {
  const [themeKey, setThemeKeyState] = useState<ChartThemeKey>('default');

  useEffect(() => {
    setThemeKeyState(getStoredThemeKey());
  }, []);

  const setThemeKey = (key: ChartThemeKey) => {
    setThemeKeyState(key);
    storeThemeKey(key);
  };

  return (
    <ChartThemeContext.Provider value={{ theme: chartThemes[themeKey], themeKey, setThemeKey }}>
      {children}
    </ChartThemeContext.Provider>
  );
}

export function useChartTheme() {
  return useContext(ChartThemeContext);
}
