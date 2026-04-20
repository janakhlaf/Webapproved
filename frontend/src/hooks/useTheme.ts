import { useEffect, useCallback } from 'react';
import { detectThemeKeyword, getThemeColors } from '@/lib/index';

export const useTheme = () => {
  const applyTheme = useCallback((keyword: string | null) => {
    const colors = getThemeColors(keyword);
    const root = document.documentElement;

    const backgroundOklch = `oklch(${colors.lightness} ${colors.saturation} ${colors.hue})`;
    const cardOklch = `oklch(${colors.lightness + 0.04} ${colors.saturation + 0.005} ${colors.hue})`;
    const popoverOklch = `oklch(${colors.lightness + 0.02} ${colors.saturation + 0.003} ${colors.hue})`;
    const mutedOklch = `oklch(${colors.lightness + 0.10} ${colors.saturation + 0.010} ${colors.hue})`;
    const borderOklch = `oklch(${colors.lightness + 0.17} ${colors.saturation + 0.020} ${colors.hue})`;
    const inputOklch = `oklch(${colors.lightness + 0.14} ${colors.saturation + 0.015} ${colors.hue})`;

    root.style.setProperty('--background', backgroundOklch);
    root.style.setProperty('--card', cardOklch);
    root.style.setProperty('--popover', popoverOklch);
    root.style.setProperty('--muted', mutedOklch);
    root.style.setProperty('--border', borderOklch);
    root.style.setProperty('--input', inputOklch);

    root.style.transition = 'background-color 800ms cubic-bezier(0.4, 0, 0.2, 1), color 800ms cubic-bezier(0.4, 0, 0.2, 1)';
  }, []);

  const detectAndApplyTheme = useCallback((text: string) => {
    const keyword = detectThemeKeyword(text);
    applyTheme(keyword);
    return keyword;
  }, [applyTheme]);

  const resetTheme = useCallback(() => {
    applyTheme(null);
  }, [applyTheme]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('dark');

    return () => {
      root.style.transition = '';
    };
  }, []);

  return {
    applyTheme,
    detectAndApplyTheme,
    resetTheme,
  };
};
