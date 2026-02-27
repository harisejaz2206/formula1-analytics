import React from 'react';
import { MoonStar, SunMedium } from 'lucide-react';
import { AppTheme } from '../../hooks/useTheme';

interface ThemeToggleProps {
  theme: AppTheme;
  onToggle: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onToggle }) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="f1-icon-button"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
    </button>
  );
};

export default ThemeToggle;

