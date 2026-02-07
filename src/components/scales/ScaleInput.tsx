import { motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Scale } from '@/services/api';
import { SCALE_DEFAULTS } from '@/constants/scaleConstants';

interface ScaleInputProps {
  scale: Scale;
  value: number | null;
  onChange: (scaleId: number, value: number | null) => void;
  disabled?: boolean;
}

const ScaleInput = ({ scale, value, onChange, disabled = false }: ScaleInputProps) => {
  const prefersReducedMotion = useReducedMotion();
  const isTracked = value !== null;
  const minValue = scale.min_value ?? 1;
  const maxValue = scale.max_value ?? 10;
  const displayValue = value ?? Math.round((minValue + maxValue) / 2);

  const handleValueChange = (values: number[]) => {
    onChange(scale.id, values[0]);
  };

  const handleSkip = () => {
    onChange(scale.id, null);
  };

  const handleActivate = () => {
    // Set to middle value when activating
    onChange(scale.id, Math.round((minValue + maxValue) / 2));
  };

  const accentColor = scale.color_hex || SCALE_DEFAULTS.DEFAULT_COLOR;

  const motionProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.2 },
      };

  return (
    <motion.div
      className={cn(
        "rounded-lg border p-4 transition-all",
        isTracked ? "bg-card border-border" : "bg-muted/30 border-dashed border-muted-foreground/30"
      )}
      style={{
        borderLeftWidth: isTracked ? '3px' : undefined,
        borderLeftColor: isTracked ? accentColor : undefined,
      }}
      {...motionProps}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className="font-medium text-sm"
            style={{ color: isTracked ? accentColor : undefined }}
          >
            {scale.name}
          </span>
          {isTracked && (
            <span
              className="text-lg font-semibold tabular-nums"
              style={{ color: accentColor }}
            >
              {displayValue}/{maxValue}
            </span>
          )}
        </div>
        {isTracked ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            disabled={disabled}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            aria-label={`Skip tracking ${scale.name}`}
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Skip
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={handleActivate}
            disabled={disabled}
            className="h-7 px-3 text-xs"
            aria-label={`Track ${scale.name}`}
          >
            Track
          </Button>
        )}
      </div>

      {isTracked && (
        <div className="space-y-2">
          <Slider
            value={[displayValue]}
            min={minValue}
            max={maxValue}
            step={1}
            onValueChange={handleValueChange}
            disabled={disabled}
            className="w-full"
            aria-label={`${scale.name} value`}
            style={{
              // Custom accent color via CSS variables
              '--slider-track-bg': `${accentColor}20`,
              '--slider-range-bg': accentColor,
              '--slider-thumb-border': accentColor,
            } as React.CSSProperties}
          />
          {(scale.min_label || scale.max_label) && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{scale.min_label || minValue}</span>
              <span>{scale.max_label || maxValue}</span>
            </div>
          )}
        </div>
      )}

      {!isTracked && (
        <p className="text-xs text-muted-foreground">
          Click "Track" to record {scale.name.toLowerCase()} for this entry
        </p>
      )}
    </motion.div>
  );
};

export default ScaleInput;
