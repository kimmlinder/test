import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Palette, Sparkles, RefreshCw, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface MoodBoardItem {
  color: string;
  name: string;
  hex: string;
}

const moodPresets: Record<string, MoodBoardItem[]> = {
  calm: [
    { color: 'bg-blue-200', name: 'Soft Sky', hex: '#BFDBFE' },
    { color: 'bg-green-200', name: 'Mint Fresh', hex: '#BBF7D0' },
    { color: 'bg-slate-100', name: 'Cloud White', hex: '#F1F5F9' },
    { color: 'bg-cyan-100', name: 'Ocean Mist', hex: '#CFFAFE' },
  ],
  energetic: [
    { color: 'bg-orange-500', name: 'Vibrant Orange', hex: '#F97316' },
    { color: 'bg-yellow-400', name: 'Electric Yellow', hex: '#FACC15' },
    { color: 'bg-pink-500', name: 'Hot Pink', hex: '#EC4899' },
    { color: 'bg-red-500', name: 'Fire Red', hex: '#EF4444' },
  ],
  professional: [
    { color: 'bg-slate-800', name: 'Deep Navy', hex: '#1E293B' },
    { color: 'bg-blue-600', name: 'Corporate Blue', hex: '#2563EB' },
    { color: 'bg-gray-200', name: 'Light Gray', hex: '#E5E7EB' },
    { color: 'bg-emerald-600', name: 'Success Green', hex: '#059669' },
  ],
  creative: [
    { color: 'bg-purple-500', name: 'Creative Purple', hex: '#A855F7' },
    { color: 'bg-pink-400', name: 'Playful Pink', hex: '#F472B6' },
    { color: 'bg-indigo-500', name: 'Deep Indigo', hex: '#6366F1' },
    { color: 'bg-teal-400', name: 'Teal Pop', hex: '#2DD4BF' },
  ],
  nature: [
    { color: 'bg-green-600', name: 'Forest Green', hex: '#16A34A' },
    { color: 'bg-amber-600', name: 'Autumn Gold', hex: '#D97706' },
    { color: 'bg-stone-400', name: 'Earth Stone', hex: '#A8A29E' },
    { color: 'bg-sky-400', name: 'Clear Sky', hex: '#38BDF8' },
  ],
};

export function AIMoodBoard() {
  const [keyword, setKeyword] = useState('');
  const [currentMood, setCurrentMood] = useState<string | null>(null);
  const [palette, setPalette] = useState<MoodBoardItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const generatePalette = () => {
    setLoading(true);
    
    // Simulate AI generation with keyword matching
    setTimeout(() => {
      const lowerKeyword = keyword.toLowerCase();
      let selectedMood = 'creative';
      
      if (lowerKeyword.includes('calm') || lowerKeyword.includes('peace') || lowerKeyword.includes('relax')) {
        selectedMood = 'calm';
      } else if (lowerKeyword.includes('energy') || lowerKeyword.includes('bold') || lowerKeyword.includes('exciting')) {
        selectedMood = 'energetic';
      } else if (lowerKeyword.includes('business') || lowerKeyword.includes('corporate') || lowerKeyword.includes('professional')) {
        selectedMood = 'professional';
      } else if (lowerKeyword.includes('nature') || lowerKeyword.includes('organic') || lowerKeyword.includes('earth')) {
        selectedMood = 'nature';
      } else if (lowerKeyword.includes('creative') || lowerKeyword.includes('art') || lowerKeyword.includes('fun')) {
        selectedMood = 'creative';
      } else {
        // Random selection
        const moods = Object.keys(moodPresets);
        selectedMood = moods[Math.floor(Math.random() * moods.length)];
      }
      
      setCurrentMood(selectedMood);
      setPalette(moodPresets[selectedMood]);
      setLoading(false);
      toast.success(`Generated "${selectedMood}" palette based on your input!`);
    }, 1000);
  };

  const copyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    toast.success(`Copied ${hex} to clipboard`);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  const regenerate = () => {
    const moods = Object.keys(moodPresets);
    const newMood = moods[Math.floor(Math.random() * moods.length)];
    setCurrentMood(newMood);
    setPalette(moodPresets[newMood]);
    toast.info(`Switched to "${newMood}" palette`);
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500/20 to-purple-500/20">
              <Palette className="h-5 w-5 text-pink-400" />
            </div>
            <div>
              <CardTitle className="text-lg">AI Mood Board</CardTitle>
              <CardDescription>Generate color palettes from keywords</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="border-pink-500/30 bg-pink-500/10 text-pink-400">
            Experimental
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Enter a mood or keyword (e.g., calm, energetic, nature)"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && generatePalette()}
          />
          <Button onClick={generatePalette} disabled={loading || !keyword.trim()}>
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Palette Display */}
        {palette.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium capitalize">{currentMood} Palette</span>
              <Button variant="ghost" size="sm" onClick={regenerate}>
                <RefreshCw className="h-3 w-3 mr-1" />
                Shuffle
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {palette.map((item) => (
                <button
                  key={item.hex}
                  onClick={() => copyHex(item.hex)}
                  className="group relative aspect-square rounded-lg overflow-hidden transition-transform hover:scale-105"
                >
                  <div className={`absolute inset-0 ${item.color}`} />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/50 transition-opacity">
                    {copiedHex === item.hex ? (
                      <Check className="h-5 w-5 text-white" />
                    ) : (
                      <Copy className="h-4 w-4 text-white" />
                    )}
                  </div>
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {palette.map((item) => (
                <Badge
                  key={item.hex}
                  variant="outline"
                  className="text-xs cursor-pointer hover:bg-accent"
                  onClick={() => copyHex(item.hex)}
                >
                  {item.name}: {item.hex}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {palette.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Palette className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Enter a keyword to generate a color palette</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}