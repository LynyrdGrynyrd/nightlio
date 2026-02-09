import { ChangeEvent, MouseEvent } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Palette } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';

const ThemeSelector = () => {
  const { theme, setTheme, primaryThemes, legacyThemes, customColor, setCustomColor } = useTheme();

  const tileClass = (isSelected: boolean) => cn(
    "flex items-center gap-2 px-4 py-3 rounded-xl border text-left transition-all duration-200",
    isSelected
      ? 'border-primary bg-primary/10 ring-2 ring-primary/35 shadow-sm'
      : 'border-border hover:bg-accent hover:border-primary/35'
  );

  return (
    <Card className="rounded-[1.25rem] border-border/70 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          <CardTitle>Appearance & Atmosphere</CardTitle>
        </div>
        <CardDescription>Choose a visual mood that fits the way you reflect.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary border border-primary/20">
              Primary
            </Badge>
            <p className="text-xs text-muted-foreground">Recommended daily modes</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {primaryThemes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={tileClass(theme === t.id)}
              >
                <span className="text-xl">{t.icon}</span>
                <span className="font-medium">{t.name}</span>
              </button>
            ))}

            <button
              className={tileClass(theme === 'custom')}
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
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline">More Themes</Badge>
            <p className="text-xs text-muted-foreground">Legacy palettes</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {legacyThemes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={tileClass(theme === t.id)}
              >
                <span className="text-xl">{t.icon}</span>
                <span className="font-medium">{t.name}</span>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ThemeSelector;
