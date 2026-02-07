import { Plus } from 'lucide-react';
import { KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '../ui/card';

// ========== Types ==========

interface AddGoalCardProps {
  onAdd: () => void;
}

// ========== Component ==========

const AddGoalCard = ({ onAdd }: AddGoalCardProps) => {
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onAdd?.();
    }
  };

  return (
    <Card
      className={cn(
        'flex flex-col items-center justify-center min-h-[170px] cursor-pointer transition-all border-dashed shadow-sm',
        'bg-accent/5 hover:bg-accent/10 border-primary/30 hover:border-primary/50',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
      )}
      role="button"
      tabIndex={0}
      onClick={onAdd}
      onKeyDown={handleKeyDown}
      aria-label="Add Goal"
      title="Add Goal"
    >
      <div className="flex flex-col items-center gap-2 text-primary">
        <div className="w-14 h-14 rounded-full flex items-center justify-center bg-primary text-primary-foreground shadow-sm">
          <Plus size={24} />
        </div>
        <div className="font-semibold">Add Goal</div>
      </div>
    </Card>
  );
};

export default AddGoalCard;
