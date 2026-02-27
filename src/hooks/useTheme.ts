import { useEffect, useState } from 'react';

export type AppTheme = 'dark' | 'light';

const STORAGE_KEY = 'f1iq-theme';

const getSystemTheme = (): AppTheme => {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const getInitialTheme = (): AppTheme => {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  const storedTheme = window.localStorage.getItem(STORAGE_KEY);
  if (storedTheme === 'dark' || storedTheme === 'light') {
    return storedTheme;
  }

  return getSystemTheme();
};

const applyTheme = (theme: AppTheme) => {
  document.documentElement.setAttribute('data-theme', theme);
};

export const useTheme = () => {
  const [theme, setTheme] = useState<AppTheme>(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (window.localStorage.getItem(STORAGE_KEY)) {
      return;
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onSystemThemeChange = (event: MediaQueryListEvent) => {
      setTheme(event.matches ? 'dark' : 'light');
    };

    media.addEventListener('change', onSystemThemeChange);
    return () => media.removeEventListener('change', onSystemThemeChange);
  }, []);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
  };

  return { theme, toggleTheme };
};

