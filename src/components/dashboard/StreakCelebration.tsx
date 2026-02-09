import { AnimatePresence, motion } from 'framer-motion';
import { PartyPopper } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';

interface StreakCelebrationProps {
  activeMilestone: number | null;
  onViewTrends: () => void;
}

const StreakCelebration = ({ activeMilestone, onViewTrends }: StreakCelebrationProps) => (
  <AnimatePresence initial={false}>
    {activeMilestone ? (
      <motion.div
        key={`streak-milestone-${activeMilestone}`}
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
      >
        <Card className="border-primary/40 bg-gradient-to-r from-primary/15 via-primary/5 to-card">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                <PartyPopper size={16} />
              </span>
              <div>
                <p className="text-sm font-semibold leading-tight">{activeMilestone}-day streak milestone reached</p>
                <p className="text-xs text-muted-foreground font-journal">Momentum secured. Keep the next check-in simple and gentle.</p>
              </div>
            </div>
            <Button size="sm" variant="secondary" onClick={onViewTrends} className="w-full sm:w-auto">
              View streak trends
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    ) : null}
  </AnimatePresence>
);

export default StreakCelebration;
