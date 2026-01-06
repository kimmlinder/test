import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type ColorThemeId = 'orange' | 'purple' | 'ocean' | 'sunset' | 'forest' | 'rose';

interface ColorTheme {
  id: ColorThemeId;
  name: string;
  colors: string[];
  hsl: {
    primary: string;
    accent: string;
    ring: string;
  };
}

export const colorThemes: ColorTheme[] = [
  { 
    id: 'orange', 
    name: 'Sunset Orange', 
    colors: ['#fa821d', '#fb923c', '#f97316'],
    hsl: { primary: '24 96% 55%', accent: '24 96% 55%', ring: '24 96% 55%' }
  },
  { 
    id: 'purple', 
    name: 'Purple Haze', 
    colors: ['#9333ea', '#a855f7', '#6366f1'],
    hsl: { primary: '270 91% 56%', accent: '270 91% 56%', ring: '270 91% 56%' }
  },
  { 
    id: 'ocean', 
    name: 'Ocean Blue', 
    colors: ['#0ea5e9', '#38bdf8', '#06b6d4'],
    hsl: { primary: '199 89% 48%', accent: '199 89% 48%', ring: '199 89% 48%' }
  },
  { 
    id: 'sunset', 
    name: 'Sunset', 
    colors: ['#f97316', '#fb923c', '#ef4444'],
    hsl: { primary: '25 95% 53%', accent: '25 95% 53%', ring: '25 95% 53%' }
  },
  { 
    id: 'forest', 
    name: 'Forest', 
    colors: ['#22c55e', '#4ade80', '#10b981'],
    hsl: { primary: '142 71% 45%', accent: '142 71% 45%', ring: '142 71% 45%' }
  },
  { 
    id: 'rose', 
    name: 'Rose', 
    colors: ['#f43f5e', '#fb7185', '#ec4899'],
    hsl: { primary: '350 89% 60%', accent: '350 89% 60%', ring: '350 89% 60%' }
  },
];

interface ColorThemeContextType {
  colorTheme: ColorThemeId;
  setColorTheme: (theme: ColorThemeId) => void;
  currentTheme: ColorTheme;
}

const ColorThemeContext = createContext<ColorThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'color-theme';

export function ColorThemeProvider({ children }: { children: ReactNode }) {
  const [colorTheme, setColorThemeState] = useState<ColorThemeId>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && colorThemes.some(t => t.id === stored)) {
        return stored as ColorThemeId;
      }
    }
    return 'orange';
  });

  const currentTheme = colorThemes.find(t => t.id === colorTheme) || colorThemes[0];

  const setColorTheme = (theme: ColorThemeId) => {
    setColorThemeState(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  };

  useEffect(() => {
    const theme = colorThemes.find(t => t.id === colorTheme);
    if (theme) {
      const root = document.documentElement;
      root.style.setProperty('--primary', theme.hsl.primary);
      root.style.setProperty('--accent', theme.hsl.accent);
      root.style.setProperty('--ring', theme.hsl.ring);
      root.style.setProperty('--sidebar-primary', theme.hsl.primary);
      root.style.setProperty('--sidebar-ring', theme.hsl.ring);
    }
  }, [colorTheme]);

  return (
    <ColorThemeContext.Provider value={{ colorTheme, setColorTheme, currentTheme }}>
      {children}
    </ColorThemeContext.Provider>
  );
}

export function useColorTheme() {
  const context = useContext(ColorThemeContext);
  if (context === undefined) {
    throw new Error('useColorTheme must be used within a ColorThemeProvider');
  }
  return context;
}
