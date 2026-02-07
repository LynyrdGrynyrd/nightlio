import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const SearchPlaceholder = () => {
  return (
    <div
      className={cn(
        "flex items-center gap-2 h-10 bg-background border rounded-full px-3 py-0 text-foreground shadow-sm transition-all duration-200",
        "focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20",
        "hover:bg-accent/50 cursor-text"
      )}
      role="search"
      aria-label="Search"
      title="Search entries…"
      id="global-search"
    >
      <Search size={16} strokeWidth={2} className="text-muted-foreground" aria-hidden="true" />
      <input
        className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
        type="text"
        name="search"
        autoComplete="off"
        readOnly
        placeholder="Search entries… (Press / to focus)"
        aria-readonly="true"
        id="global-search-input"
      />
      <div className="hidden sm:flex items-center gap-1 border rounded px-1.5 py-0.5 bg-muted text-[10px] text-muted-foreground font-mono">
        <span>/</span>
      </div>
    </div>
  );
};

export default SearchPlaceholder;
