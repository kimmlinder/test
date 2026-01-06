import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type BackgroundType = 'gradient' | 'static' | 'custom' | 'animated';

export interface BackgroundPreset {
  id: string;
  name: string;
  type: BackgroundType;
  preview: string; // CSS gradient or image URL for preview
  value: string; // Actual CSS value or image URL
}

export const backgroundPresets: BackgroundPreset[] = [
  {
    id: 'gradient-default',
    name: 'Default Glow',
    type: 'gradient',
    preview: 'linear-gradient(135deg, hsl(var(--primary) / 0.1), hsl(var(--primary) / 0.05))',
    value: 'default',
  },
  {
    id: 'gradient-subtle',
    name: 'Subtle Mist',
    type: 'gradient',
    preview: 'linear-gradient(180deg, hsl(220 20% 10%), hsl(220 15% 5%))',
    value: 'subtle',
  },
  {
    id: 'gradient-aurora',
    name: 'Aurora',
    type: 'gradient',
    preview: 'linear-gradient(135deg, hsl(280 60% 20%), hsl(200 60% 15%), hsl(160 50% 15%))',
    value: 'aurora',
  },
  {
    id: 'gradient-sunset',
    name: 'Sunset',
    type: 'gradient',
    preview: 'linear-gradient(135deg, hsl(20 60% 20%), hsl(350 50% 15%), hsl(280 40% 10%))',
    value: 'sunset',
  },
  {
    id: 'gradient-ocean',
    name: 'Ocean Deep',
    type: 'gradient',
    preview: 'linear-gradient(180deg, hsl(210 50% 15%), hsl(200 60% 10%), hsl(190 50% 5%))',
    value: 'ocean',
  },
  {
    id: 'gradient-forest',
    name: 'Forest',
    type: 'gradient',
    preview: 'linear-gradient(135deg, hsl(140 40% 12%), hsl(160 35% 8%), hsl(180 30% 5%))',
    value: 'forest',
  },
];

export const animatedBackgrounds: BackgroundPreset[] = [
  {
    id: 'animated-horizon',
    name: 'Sonoma Horizon',
    type: 'animated',
    preview: 'linear-gradient(to bottom, hsl(25 80% 55%), hsl(340 70% 45%), hsl(260 60% 35%), hsl(220 50% 25%))',
    value: 'horizon',
  },
  {
    id: 'animated-sequoia',
    name: 'Sequoia Sunrise',
    type: 'animated',
    preview: 'linear-gradient(to bottom, hsl(35 90% 60%), hsl(20 85% 50%), hsl(350 60% 35%), hsl(280 50% 20%))',
    value: 'sequoia',
  },
  {
    id: 'animated-nebula',
    name: 'Cosmic Nebula',
    type: 'animated',
    preview: 'linear-gradient(135deg, hsl(280 70% 25%), hsl(320 60% 30%), hsl(260 50% 20%))',
    value: 'nebula',
  },
  {
    id: 'animated-northern',
    name: 'Northern Lights',
    type: 'animated',
    preview: 'linear-gradient(180deg, hsl(180 70% 25%), hsl(160 60% 30%), hsl(200 50% 20%))',
    value: 'northern',
  },
  {
    id: 'animated-waves',
    name: 'Ocean Waves',
    type: 'animated',
    preview: 'linear-gradient(180deg, hsl(200 60% 15%), hsl(210 50% 10%))',
    value: 'waves',
  },
  {
    id: 'animated-particles',
    name: 'Floating Particles',
    type: 'animated',
    preview: 'linear-gradient(135deg, hsl(260 50% 20%), hsl(220 50% 15%))',
    value: 'particles',
  },
];

interface BackgroundContextType {
  backgroundType: BackgroundType;
  backgroundValue: string;
  customImageUrl: string | null;
  setBackground: (type: BackgroundType, value: string) => void;
  setCustomImage: (url: string | null) => void;
  currentPreset: BackgroundPreset | null;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

const STORAGE_KEY = 'background-preference';

interface StoredBackground {
  type: BackgroundType;
  value: string;
  customImageUrl: string | null;
}

export function BackgroundProvider({ children }: { children: ReactNode }) {
  const [backgroundType, setBackgroundType] = useState<BackgroundType>('gradient');
  const [backgroundValue, setBackgroundValue] = useState<string>('default');
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed: StoredBackground = JSON.parse(stored);
          setBackgroundType(parsed.type);
          setBackgroundValue(parsed.value);
          setCustomImageUrl(parsed.customImageUrl);
        } catch (e) {
          console.error('Failed to parse background preference:', e);
        }
      }
    }
  }, []);

  const setBackground = (type: BackgroundType, value: string) => {
    setBackgroundType(type);
    setBackgroundValue(value);
    
    const toStore: StoredBackground = {
      type,
      value,
      customImageUrl: type === 'custom' ? customImageUrl : null,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  };

  const setCustomImage = (url: string | null) => {
    setCustomImageUrl(url);
    if (url) {
      setBackgroundType('custom');
      setBackgroundValue('custom');
      const toStore: StoredBackground = {
        type: 'custom',
        value: 'custom',
        customImageUrl: url,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    }
  };

  const currentPreset = [...backgroundPresets, ...animatedBackgrounds].find(
    p => p.value === backgroundValue && p.type === backgroundType
  ) || null;

  return (
    <BackgroundContext.Provider 
      value={{ 
        backgroundType, 
        backgroundValue, 
        customImageUrl, 
        setBackground, 
        setCustomImage,
        currentPreset 
      }}
    >
      {children}
    </BackgroundContext.Provider>
  );
}

export function useBackground() {
  const context = useContext(BackgroundContext);
  if (context === undefined) {
    throw new Error('useBackground must be used within a BackgroundProvider');
  }
  return context;
}
