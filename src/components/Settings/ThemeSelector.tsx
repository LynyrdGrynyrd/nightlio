import { ChangeEvent, MouseEvent } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Palette } from 'lucide-react';

const ThemeSelector = () => {
  const { theme, setTheme, themes, customColor, setCustomColor } = useTheme();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
        <Palette className="w-5 h-5" />
        Appearance
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Choose a color theme for the app.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
        {themes.map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={`
              flex items-center gap-2 px-4 py-3 rounded-lg border text-left transition-all
              ${theme === t.id
                ? 'border-[var(--accent-600)] bg-[var(--accent-bg-soft)] ring-2 ring-[var(--accent-600)]'
                : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
              }
            `}
          >
            <span className="text-xl">{t.icon}</span>
            <span className="font-medium">{t.name}</span>
          </button>
        ))}

        <div
          className={`
            relative flex items-center gap-2 px-4 py-3 rounded-lg border text-left transition-all cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800
            ${theme === 'custom'
              ? 'border-[var(--accent-600)] bg-[var(--accent-bg-soft)] ring-2 ring-[var(--accent-600)]'
              : 'border-gray-300 dark:border-gray-600'
            }
          `}
          onClick={() => setTheme('custom')}
        >
          <span className="text-xl">🎨</span>
          <span className="font-medium flex-1">Custom</span>

          <div className="relative w-6 h-6 rounded-full overflow-hidden border border-gray-300 dark:border-gray-500" onClick={(e: MouseEvent) => e.stopPropagation()}>
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
    </div>
  );
};

export default ThemeSelector;
