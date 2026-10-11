import { useContext } from 'react';
import { ThemeContext, type ThemeContextType } from '../context/themeContextDef';

/**
 * Custom hook providing access to dark/light appearance theme state and toggle control.
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
