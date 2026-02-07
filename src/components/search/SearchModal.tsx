import { useState, useEffect, useRef, useMemo, ReactNode, memo } from 'react';
import { Search, Calendar, Filter, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { MOOD_CONFIG, TIMEOUTS } from '../../constants/appConstants';
import { Dialog, DialogContent } from '../ui/dialog';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { useToast } from '../ui/ToastProvider';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface SearchEntry {
  id: number;
  date: string;
  mood: number;
  content: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const highlightText = (text: string, query: string): ReactNode => {
  if (!query || !text) return text;

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));

  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="bg-[color:var(--warning-soft)] text-foreground rounded-sm px-0.5">{part}</mark>
      : part
  );
};

const SearchModal = memo(({ isOpen, onClose }: SearchModalProps) => {
  const [query, setQuery] = useState('');
  const [selectedMoods, setSelectedMoods] = useState<number[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [results, setResults] = useState<SearchEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { show } = useToast();
  useAuth();

  // Cache token in ref to avoid repeated localStorage access
  const tokenRef = useRef(localStorage.getItem('twilightio_token'));

  // Create a Set for O(1) includes() lookups
  const selectedMoodsSet = useMemo(() => new Set(selectedMoods), [selectedMoods]);

  useEffect(() => {
    if (!isOpen) return;

    if (!query && selectedMoods.length === 0 && !startDate && !endDate) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (query) params.append('q', query);
        if (selectedMoods.length > 0) params.append('moods', selectedMoods.join(','));
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);

        const res = await fetch(`/api/search?${params.toString()}`, {
          headers: { 'Authorization': `Bearer ${tokenRef.current}` }
        });
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (err) {
        console.error("Search failed", err);
        show('Search failed. Please try again.', 'error');
      } finally {
        setLoading(false);
      }
    }, TIMEOUTS.DEBOUNCE_SEARCH);

    return () => clearTimeout(timer);
  }, [query, selectedMoods, startDate, endDate, isOpen]);

  const toggleMood = (mood: number) => {
    setSelectedMoods(prev =>
      prev.includes(mood) ? prev.filter(m => m !== mood) : [...prev, mood]
    );
  };

  const handleEntryClick = (entry: SearchEntry) => {
    onClose();
    navigate('/dashboard/entry', { state: { entry, mood: entry.mood } });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col gap-0 p-0 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" aria-hidden="true" />
            <Input
              placeholder="Search your journal..."
              name="search"
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 bg-muted/50 border-0 focus-visible:ring-1"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Filter size={12} aria-hidden="true" />
                <span>Filter by Mood</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {MOOD_CONFIG.map(m => {
                  const isSelected = selectedMoodsSet.has(m.value);
                  return (
                    <Badge
                      key={m.value}
                      variant={isSelected ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer transition-all hover:opacity-80",
                        isSelected ? "" : "opacity-50 hover:opacity-100"
                      )}
                      style={isSelected ? { backgroundColor: m.color } : undefined}
                      onClick={() => toggleMood(m.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleMood(m.value);
                        }
                      }}
                      role="checkbox"
                      aria-checked={isSelected}
                      aria-label={`Filter by ${m.label} mood`}
                      tabIndex={0}
                    >
                      {m.label}
                    </Badge>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Calendar size={12} aria-hidden="true" />
                <span id="date-range-label">Date Range</span>
              </div>
              <div className="flex items-center gap-2" role="group" aria-labelledby="date-range-label">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-8 text-xs w-auto"
                  aria-label="Start date"
                />
                <span className="text-xs text-muted-foreground" aria-hidden="true">to</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-8 text-xs w-auto"
                  aria-label="End date"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <ScrollArea className="flex-1 p-4 bg-muted/10">
          {loading && (
            <div
              className="flex items-center justify-center py-8 text-muted-foreground"
              role="status"
              aria-live="polite"
            >
              <Loader2 className="h-6 w-6 animate-spin mr-2" aria-hidden="true" />
              Searching…
            </div>
          )}

          {!loading && results.length === 0 && (query || selectedMoods.length > 0) && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No matching entries found.
            </div>
          )}

          <div className="space-y-3">
            {results.map(entry => (
              <div
                key={entry.id}
                onClick={() => handleEntryClick(entry)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleEntryClick(entry);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`View entry from ${format(new Date(entry.date), 'MMM d, yyyy')}`}
                className="group flex flex-col gap-2 p-3 rounded-lg border bg-card hover:bg-accent/50 hover:border-accent cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: `var(--mood-${entry.mood})` }}
                    />
                    <span className="text-xs font-medium text-muted-foreground">
                      {format(new Date(entry.date), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
                <p className="text-sm line-clamp-2 leading-relaxed text-muted-foreground group-hover:text-foreground transition-colors">
                  {highlightText(entry.content, query)}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
});

SearchModal.displayName = 'SearchModal';
export default SearchModal;
