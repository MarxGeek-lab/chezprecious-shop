'use client';

// ==============================================
// THEME PROVIDER - Configuration MUI + Dark Mode
// ==============================================

import { createContext, useContext, useState, useMemo, type ReactNode } from 'react';
import { ThemeProvider as MUIThemeProvider, createTheme, CssBaseline } from '@mui/material';

// Couleurs du thème
const colors = {
  primary: {
    main: '#0F5C4A',
    light: '#1A7A63',
    dark: '#0A4638',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#1A1A2E',
    light: '#2D2D44',
    dark: '#0F0F1A',
    contrastText: '#FFFFFF',
  },
  error: {
    main: '#EF4444',
  },
  warning: {
    main: '#F59E0B',
  },
  success: {
    main: '#10B981',
  },
  info: {
    main: '#3B82F6',
  },
};

// Contexte pour le mode sombre
interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  toggleDarkMode: () => {},
});

export const useThemeMode = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: ReactNode;
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: isDarkMode ? 'dark' : 'light',
          primary: colors.primary,
          secondary: colors.secondary,
          error: colors.error,
          warning: colors.warning,
          success: colors.success,
          info: colors.info,
          background: {
            default: isDarkMode ? '#0F0F1A' : '#FFFFFF',
            paper: isDarkMode ? '#1A1A2E' : '#FFFFFF',
          },
        },
        typography: {
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          h1: {
            fontWeight: 700,
          },
          h2: {
            fontWeight: 700,
          },
          h3: {
            fontWeight: 600,
          },
          h4: {
            fontWeight: 600,
          },
          h5: {
            fontWeight: 600,
          },
          h6: {
            fontWeight: 600,
          },
        },
        shape: {
          borderRadius: 8,
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                fontWeight: 500,
                borderRadius: 8,
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 12,
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                fontWeight: 500,
              },
            },
          },
        },
      }),
    [isDarkMode]
  );

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      <MUIThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MUIThemeProvider>
    </ThemeContext.Provider>
  );
}
