import { useState, useEffect } from 'react';
import { Delete } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

// ========== Types ==========

interface PinPadProps {
  onComplete: (pin: string) => void;
  length?: number;
  error?: string;
}

// ========== Component ==========

const PinPad = ({ onComplete, length = 4, error }: PinPadProps) => {
  const [pin, setPin] = useState('');

  useEffect(() => {
    if (pin.length === length) {
      onComplete(pin);
      setPin('');
    }
  }, [pin, length, onComplete]);

  useEffect(() => {
    if (error) {
      setPin('');
    }
  }, [error]);

  const handleDigit = (digit: number) => {
    if (pin.length < length) {
      setPin(prev => prev + digit);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Dots Display */}
      <div className="flex gap-4 mb-4">
        {[...Array(length)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-4 h-4 rounded-full border border-muted-foreground transition-all duration-200",
              i < pin.length && "bg-primary border-primary",
              error && "border-destructive animate-shake"
            )}
          />
        ))}
      </div>

      {error ? <p className="text-destructive text-sm font-medium animate-pulse">{error}</p> : null}

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <Button
            key={num}
            variant="outline"
            size="icon"
            onClick={() => handleDigit(num)}
            className="w-16 h-16 rounded-full text-2xl font-medium shadow-sm active:scale-95"
          >
            {num}
          </Button>
        ))}

        {/* Empty spacer for alignment */}
        <div />

        <Button
          variant="outline"
          size="icon"
          onClick={() => handleDigit(0)}
          className="w-16 h-16 rounded-full text-2xl font-medium shadow-sm active:scale-95"
        >
          0
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleBackspace}
          className="w-16 h-16 rounded-full text-muted-foreground hover:text-foreground hover:bg-destructive/10 active:scale-95"
          aria-label="Backspace"
        >
          <Delete size={24} />
        </Button>
      </div>
    </div>
  );
};

export default PinPad;
