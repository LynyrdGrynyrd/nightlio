import { Plus } from 'lucide-react';
import { KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '../ui/card';

const AddEntryCard = () => {
  const handleAdd = () => {
    window.dispatchEvent(new CustomEvent('twilightio:new-entry'));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <Card
      className={cn(
        "flex flex-col items-center justify-center min-h-[200px] cursor-pointer transition-all border-dashed shadow-sm",
        "bg-accent/5 hover:bg-accent/10 border-primary/30 hover:border-primary/50",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      )}
      onClick={handleAdd}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label="Add Entry"
      title="Add Entry"
    >
      <div className="flex flex-col items-center gap-3 text-primary">
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-sm">
          <Plus size={24} />
        </div>
        <div className="font-semibold text-lg">Add Entry</div>
      </div>
    </Card>
  );
};

export default AddEntryCard;
