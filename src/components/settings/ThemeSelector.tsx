import { ChangeEvent, MouseEvent } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Palette } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { cn } from '@/lib/utils';

const ThemeSelector = () => {
  const { theme, setTheme, themes, customColor, setCustomColor } = useTheme();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          <CardTitle>Appearance</CardTitle>
        </div>
        <CardDescription>Choose a color theme for the app.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 rounded-lg border text-left transition-all",
                theme === t.id
                  ? 'border-primary bg-primary/10 ring-2 ring-primary'
                  : 'border-border hover:bg-accent'
              )}
            >
              <span className="text-xl">{t.icon}</span>
              <span className="font-medium">{t.name}</span>
            </button>
          ))}

          <div
            className={cn(
              "relative flex items-center gap-2 px-4 py-3 rounded-lg border text-left transition-all cursor-pointer hover:bg-accent",
              theme === 'custom'
                ? 'border-primary bg-primary/10 ring-2 ring-primary'
                : 'border-border'
            )}
            onClick={() => setTheme('custom')}
          >
            <span className="text-xl">🎨</span>
            <span className="font-medium flex-1">Custom</span>

            <div
              className="relative w-6 h-6 rounded-full overflow-hidden border border-border"
              onClick={(e: MouseEvent) => e.stopPropagation()}
            >
              <input
                type="color"
                value={customColor}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setCustomColor(e.target.value);
                  setTheme('custom');
                }}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] p-0 border-0 cursor-pointer"
                title="Pick custom color"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ThemeSelector;
