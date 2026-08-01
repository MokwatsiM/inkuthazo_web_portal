import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system' | 'warm';

/**
 * The concrete look applied to the DOM. 'warm' is a warm-tinted variant of
 * light mode, so it never turns on dark mode.
 */
export type EffectiveTheme = 'light' | 'dark' | 'warm';

const THEMES: Theme[] = ['light', 'dark', 'system', 'warm'];

interface ThemeContextType {
  theme: Theme;
  effectiveTheme: EffectiveTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme') as Theme;
      if (stored && THEMES.includes(stored)) {
        return stored;
      }
    }
    return 'system';
  });

  const [effectiveTheme, setEffectiveTheme] = useState<EffectiveTheme>('light');

  useEffect(() => {
    const updateEffectiveTheme = () => {
      if (theme === 'system') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setEffectiveTheme(systemPrefersDark ? 'dark' : 'light');
      } else {
        setEffectiveTheme(theme);
      }
    };

    updateEffectiveTheme();

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', updateEffectiveTheme);
      return () => mediaQuery.removeEventListener('change', updateEffectiveTheme);
    }
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    // 'warm' is a light-family theme: apply .warm, never .dark.
    root.classList.toggle('dark', effectiveTheme === 'dark');
    root.classList.toggle('warm', effectiveTheme === 'warm');
    root.style.colorScheme = effectiveTheme === 'dark' ? 'dark' : 'light';
  }, [effectiveTheme]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    // Cycle light -> dark -> system -> warm -> light
    const order: Theme[] = ['light', 'dark', 'system', 'warm'];
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setTheme(next);
  };

  const value: ThemeContextType = {
    theme,
    effectiveTheme,
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}