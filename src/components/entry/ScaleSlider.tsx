import { useState, useEffect } from 'react';
import { Sliders } from 'lucide-react';
import { Scale } from '../../services/api';

interface ScaleSliderProps {
  scales: Scale[];
  values: Record<number, number>;  // { scaleId: value }
  onChange: (scaleId: number, value: number) => void;
}

const ScaleSlider = ({ scales, values, onChange }: ScaleSliderProps) => {
  const [expandedScaleId, setExpandedScaleId] = useState<number | null>(null);

  if (!scales || scales.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 border-t border-[var(--border)] pt-4">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-muted)] mb-3">
        <Sliders size={16} />
        Track Scales
      </h4>

      <div className="space-y-3">
        {scales.map((scale) => {
          const currentValue = values[scale.id] || 5; // Default to middle (5)
          const minValue = scale.min_value || 1;
          const maxValue = scale.max_value || 10;
          const range = maxValue - minValue;
          const percentage = ((currentValue - minValue) / range) * 100;
          const isExpanded = expandedScaleId === scale.id;

          return (
            <div
              key={scale.id}
              className="p-3 rounded-xl border transition-all"
              style={{
                borderColor: scale.color_hex || '#0d9488',
                backgroundColor: `${scale.color_hex || '#0d9488'}10`,
              }}
            >
              {/* Scale Name and Value */}
              <div className="flex items-center justify-between mb-2">
                <span
                  className="font-medium text-sm"
                  style={{ color: scale.color_hex || '#0d9488' }}
                >
                  {scale.name}
                </span>
                <button
                  onClick={() => setExpandedScaleId(isExpanded ? null : scale.id)}
                  className="px-2 py-1 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-sm font-semibold transition-colors"
                  style={{ color: scale.color_hex || '#0d9488' }}
                >
                  {currentValue}
                </button>
              </div>

              {/* Collapsed View: Simple Slider */}
              {!isExpanded && (
                <div className="relative">
                  <input
                    type="range"
                    min={minValue}
                    max={maxValue}
                    value={currentValue}
                    onChange={(e) => onChange(scale.id, parseInt(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, ${scale.color_hex || '#0d9488'} 0%, ${scale.color_hex || '#0d9488'} ${percentage}%, var(--border) ${percentage}%, var(--border) 100%)`,
                    }}
                  />
                </div>
              )}

              {/* Expanded View: Button Grid */}
              {isExpanded && (
                <div>
                  <div className="grid grid-cols-10 gap-1 mt-2">
                    {Array.from({ length: range + 1 }, (_, i) => {
                      const value = minValue + i;
                      const isSelected = value === currentValue;
                      return (
                        <button
                          key={value}
                          onClick={() => {
                            onChange(scale.id, value);
                            setExpandedScaleId(null);
                          }}
                          className={`aspect-square flex items-center justify-center text-xs font-semibold rounded-lg transition-all ${
                            isSelected
                              ? 'text-white shadow-md scale-110'
                              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:scale-105'
                          }`}
                          style={
                            isSelected
                              ? {
                                  backgroundColor: scale.color_hex || '#0d9488',
                                  borderColor: scale.color_hex || '#0d9488',
                                }
                              : {}
                          }
                        >
                          {value}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{scale.min_label || minValue}</span>
                    <span>{scale.max_label || maxValue}</span>
                  </div>
                </div>
              )}

              {/* Labels for Collapsed View */}
              {!isExpanded && (
                <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
                  <span>{scale.min_label || minValue}</span>
                  <span>{scale.max_label || maxValue}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {scales.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          No scales configured. Add scales in Settings.
        </p>
      )}
    </div>
  );
};

export default ScaleSlider;
