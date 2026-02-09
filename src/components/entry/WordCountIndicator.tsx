import { useDeferredValue, useMemo } from 'react';
import { countWords, formatWordCount } from '../../utils/wordCountUtils';

interface WordCountIndicatorProps {
  content: string;
  weeklyTotal?: number;
}

const WordCountIndicator = ({ content, weeklyTotal }: WordCountIndicatorProps) => {
  const deferredContent = useDeferredValue(content);
  const wordCount = useMemo(() => countWords(deferredContent), [deferredContent]);

  return (
    <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
      <span>{formatWordCount(wordCount)}</span>
      {weeklyTotal !== undefined && weeklyTotal > 0 && (
        <span>{formatWordCount(weeklyTotal)} this week</span>
      )}
    </div>
  );
};

export default WordCountIndicator;
