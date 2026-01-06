import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Focus, Timer, Volume2, VolumeX, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function FocusModeToggle() {
  const [focusMode, setFocusMode] = useState(false);
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes
  const [ambientVolume, setAmbientVolume] = useState([50]);
  const [hideDistractions, setHideDistractions] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (pomodoroActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setPomodoroActive(false);
      toast.success('Focus session complete! Take a break 🎉');
      setTimeLeft(25 * 60);
    }
    return () => clearInterval(interval);
  }, [pomodoroActive, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleFocusMode = (enabled: boolean) => {
    setFocusMode(enabled);
    if (enabled) {
      document.body.classList.add('focus-mode');
      toast.success('Focus Mode enabled - distractions minimized');
    } else {
      document.body.classList.remove('focus-mode');
      setPomodoroActive(false);
      toast.info('Focus Mode disabled');
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Focus className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Focus Mode</CardTitle>
              <CardDescription>Minimize distractions and boost productivity</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-400">
            Beta
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="focus-mode" className="text-sm font-medium">
            Enable Focus Mode
          </Label>
          <Switch
            id="focus-mode"
            checked={focusMode}
            onCheckedChange={toggleFocusMode}
          />
        </div>

        {focusMode && (
          <>
            {/* Pomodoro Timer */}
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Pomodoro Timer</span>
                </div>
                <Button
                  size="sm"
                  variant={pomodoroActive ? 'destructive' : 'default'}
                  onClick={() => setPomodoroActive(!pomodoroActive)}
                >
                  {pomodoroActive ? (
                    <>
                      <Pause className="h-3 w-3 mr-1" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3 mr-1" /> Start
                    </>
                  )}
                </Button>
              </div>
              <div className="text-center">
                <span className="text-4xl font-mono font-bold text-foreground">
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>

            {/* Hide Distractions */}
            <div className="flex items-center justify-between">
              <Label htmlFor="hide-distractions" className="text-sm">
                Hide notifications & badges
              </Label>
              <Switch
                id="hide-distractions"
                checked={hideDistractions}
                onCheckedChange={setHideDistractions}
              />
            </div>

            {/* Ambient Sound */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Ambient Sound</Label>
                {ambientVolume[0] > 0 ? (
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <VolumeX className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <Slider
                value={ambientVolume}
                onValueChange={setAmbientVolume}
                max={100}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                🎵 Lo-fi ambient sounds (coming soon)
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}