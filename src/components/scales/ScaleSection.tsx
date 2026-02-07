import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronDown, Sliders, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Scale, ScaleValuesMap } from '@/services/api';
import { cn } from '@/lib/utils';
import ScaleInput from './ScaleInput';

interface ScaleSectionProps {
  scales: Scale[];
  values: ScaleValuesMap;
  onChange: (scaleId: number, value: number | null) => void;
  loading?: boolean;
  disabled?: boolean;
  defaultExpanded?: boolean;
}

const ScaleSection = ({
  scales,
  values,
  onChange,
  loading = false,
  disabled = false,
  defaultExpanded = false,
}: ScaleSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const prefersReducedMotion = useReducedMotion();

  const trackedCount = Object.values(values).filter(v => v !== null).length;
  const hasScales = scales.length > 0;

  if (loading) {
    return (
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-5 w-32" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!hasScales) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-6">
          <div className="text-center space-y-2">
            <Sliders className="h-8 w-8 mx-auto text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No custom scales configured
            </p>
            <Link
              to="/settings"
              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
            >
              <Settings className="h-3 w-3" />
              Set up scales in Settings
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const motionProps = prefersReducedMotion
    ? {}
    : {
        initial: { height: 0, opacity: 0 },
        animate: { height: 'auto', opacity: 1 },
        exit: { height: 0, opacity: 0 },
        transition: { duration: 0.2 },
      };

  return (
    <Card>
      <CardHeader className="pb-3">
        <Button
          variant="ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full justify-between px-0 hover:bg-transparent"
          disabled={disabled}
        >
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">Additional Metrics</span>
            {trackedCount > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {trackedCount} tracked
              </Badge>
            )}
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          </motion.div>
        </Button>
      </CardHeader>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div {...motionProps} className="overflow-hidden">
            <CardContent className="pt-0 space-y-3">
              {scales.map(scale => (
                <ScaleInput
                  key={scale.id}
                  scale={scale}
                  value={values[scale.id] ?? null}
                  onChange={onChange}
                  disabled={disabled}
                />
              ))}

              <div className="pt-2 text-center">
                <Link
                  to="/settings"
                  className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  <Settings className="h-3 w-3" />
                  Manage scales
                </Link>
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default ScaleSection;
