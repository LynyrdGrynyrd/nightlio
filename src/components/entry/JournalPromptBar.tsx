import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Lightbulb, X, SkipForward } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { pickPrompt, getStartersForMood } from '../../data/journalPrompts';
import type { JournalPrompt } from '../../data/journalPrompts';

interface JournalPromptBarProps {
  mood: number;
  onInsertText: (text: string) => void;
  onApplyPrompt: (prompt: JournalPrompt) => void;
  hasContent: boolean;
  isEditing: boolean;
}

const JournalPromptBar = ({
  mood,
  onInsertText,
  onApplyPrompt,
  hasContent,
  isEditing,
}: JournalPromptBarProps) => {
  const [currentPrompt, setCurrentPrompt] = useState<JournalPrompt | null>(
    () => pickPrompt(mood)
  );
  const [dismissed, setDismissed] = useState(false);
  const [skippedIds, setSkippedIds] = useState<string[]>([]);

  const starters = getStartersForMood(mood);

  const handleSkip = useCallback(() => {
    const nextExclude = currentPrompt
      ? [...skippedIds, currentPrompt.id]
      : skippedIds;
    setSkippedIds(nextExclude);
    setCurrentPrompt(pickPrompt(mood, nextExclude));
  }, [mood, currentPrompt, skippedIds]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  const handleUsePrompt = useCallback(() => {
    if (currentPrompt) {
      onApplyPrompt(currentPrompt);
      setDismissed(true);
    }
  }, [currentPrompt, onApplyPrompt]);

  if (isEditing) return null;

  return (
    <div className="space-y-3">
      {/* Prompt card */}
      <AnimatePresence>
        {currentPrompt && !dismissed && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-primary/10 p-1.5 shrink-0">
                    <Lightbulb size={16} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug">
                      {currentPrompt.text}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        variant="default"
                        size="sm"
                        className="h-9 min-h-[44px] text-xs"
                        onClick={handleUsePrompt}
                      >
                        Use this prompt
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 min-h-[44px] text-xs gap-1.5 text-muted-foreground"
                        onClick={handleSkip}
                      >
                        <SkipForward size={14} />
                        Next
                      </Button>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={handleDismiss}
                  >
                    <X size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sentence starters */}
      <AnimatePresence>
        {!hasContent && starters.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
          >
            {starters.map((starter) => (
              <Button
                key={starter.id}
                variant="outline"
                size="sm"
                className="shrink-0 min-h-[44px] text-xs text-muted-foreground hover:text-foreground whitespace-nowrap"
                onClick={() => onInsertText(starter.text)}
              >
                {starter.text}
              </Button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default JournalPromptBar;
