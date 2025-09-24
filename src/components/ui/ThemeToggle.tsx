import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, type Theme } from '../../contexts/ThemeContext';

interface ThemeToggleProps {
  variant?: 'button' | 'dropdown';
  showLabels?: boolean;
}

export function ThemeToggle({ variant = 'button', showLabels = false }: ThemeToggleProps) {
  const { theme, setTheme, toggleTheme } = useTheme();

  const getThemeIcon = (themeType: Theme) => {
    switch (themeType) {
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Moon className="h-4 w-4" />;
      case 'system':
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getThemeLabel = (themeType: Theme) => {
    switch (themeType) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
        return 'System';
    }
  };

  if (variant === 'button') {
    return (
      <button
        onClick={toggleTheme}
        className="inline-flex items-center justify-center p-2 rounded-lg border border-line dark:border-line-dark bg-surface dark:bg-surface-dark hover:bg-surface-2 dark:hover:bg-surface-2-dark transition-colors duration-200"
        title={`Current theme: ${getThemeLabel(theme)}. Click to cycle themes.`}
      >
        {getThemeIcon(theme)}
        {showLabels && (
          <span className="ml-2 text-sm text-text-primary dark:text-text-primary-dark">
            {getThemeLabel(theme)}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center space-x-1 p-1 bg-surface-2 dark:bg-surface-2-dark rounded-lg border border-line dark:border-line-dark">
        {(['light', 'dark', 'system'] as Theme[]).map((themeOption) => (
          <button
            key={themeOption}
            onClick={() => setTheme(themeOption)}
            className={`
              inline-flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
              ${theme === themeOption
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-secondary dark:text-text-secondary-dark hover:text-text-primary dark:hover:text-text-primary-dark hover:bg-surface dark:hover:bg-surface-dark'
              }
            `}
            title={`Switch to ${getThemeLabel(themeOption)} theme`}
          >
            {getThemeIcon(themeOption)}
            {showLabels && (
              <span className="ml-2">
                {getThemeLabel(themeOption)}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}