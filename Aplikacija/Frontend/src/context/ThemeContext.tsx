import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import type { ReactNode } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material';

type Mode = 'light' | 'dark';

interface ThemeContextType {
    mode: Mode;
    toggleTheme: () => void;
}

const ThemeContextInstance = createContext<ThemeContextType | null>(null);

const lightTheme = createTheme({
    palette: {
        mode: 'light',
        primary: { main: '#6D28D9' },
        secondary: { main: '#F97316' },
        background: { default: '#f5f5f5', paper: '#ffffff' },
    },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    },
});

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: { main: '#F97316' },
        secondary: { main: '#A78BFA' },
        background: { default: '#1C110A', paper: '#1C110A' },
    },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    },
});

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [mode, setMode] = useState<Mode>(() => {
        return (localStorage.getItem('theme') as Mode) || 'light';
    });

    const toggleTheme = useCallback(() => {
        setMode((prev) => {
            const next = prev === 'light' ? 'dark' : 'light';
            localStorage.setItem('theme', next);
            return next;
        });
    }, []);

    const theme = useMemo(() => (mode === 'light' ? lightTheme : darkTheme), [mode]);

    return (
        <ThemeContextInstance.Provider value={{ mode, toggleTheme }}>
            <MuiThemeProvider theme={theme}>
                {children}
            </MuiThemeProvider>
        </ThemeContextInstance.Provider>
    );
}

export function useThemeContext(): ThemeContextType {
    const ctx = useContext(ThemeContextInstance);
    if (!ctx) throw new Error('useThemeContext must be used within ThemeProvider');
    return ctx;
}
