import { useState, KeyboardEvent, memo } from 'react';
import { getIconComponent } from '../ui/IconPicker';
import { getMoodIcon } from '../../utils/moodUtils';
import { generateTitle, generateExcerpt } from '../../utils/markdownUtils';
import apiService from '../../services/api';
import { useToast } from '../ui/ToastProvider';
import EntryModal from './EntryModal';
import ConfirmDialog from '../ui/ConfirmDialog';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import type { HistoryEntry as HistoryEntryType } from '../../types/entry';

interface HistoryEntryProps {
  entry: HistoryEntryType;
  onDelete: (id: number) => void;
  onEdit?: (entry: HistoryEntryType) => void;
}

const HistoryEntry = memo(function HistoryEntry({ entry, onDelete, onEdit }: HistoryEntryProps) {
  const { icon: IconComponent, color } = getMoodIcon(entry.mood);
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const title = generateTitle(entry.content || '');
  const excerpt = generateExcerpt(entry.content || '');

  const { show } = useToast();

  const handleDeleteRequest = () => {
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await apiService.deleteMoodEntry(entry.id);
      onDelete(entry.id);
      show('Entry deleted', 'success');
      setOpen(false);
    } catch (error) {
      console.error('Failed to delete entry:', error);
      show('Failed to delete entry. Please try again.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const openPreview = () => setOpen(true);
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openPreview();
    }
  };

  const handleEdit = () => {
    if (typeof onEdit === 'function') {
      onEdit(entry);
    }
  };

  // Format date nicely using date-fns or native
  const getFormattedDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const formattedTime = entry.created_at
    ? new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <>
      <Card
        className={cn(
          "group cursor-pointer transition-[border-color,box-shadow,transform] hover:border-primary/40 hover:shadow-md outline-none rounded-[calc(var(--radius)+2px)]",
          isDeleting && "opacity-50 pointer-events-none"
        )}
        onClick={openPreview}
        onKeyDown={onKey}
        tabIndex={0}
        role="button"
        aria-label={`Open entry from ${entry.date}`}
      >
        <CardContent className="p-4 sm:p-5">
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-full border border-border/70 shadow-sm shrink-0"
              style={{
                backgroundColor: 'var(--accent-bg-softer)',
                color: color
              }}
            >
              <IconComponent size={18} strokeWidth={2} />
            </div>

            <div className="flex flex-col">
              <span className="text-sm font-bold text-foreground">
                {getFormattedDate(entry.date)}
              </span>
              {formattedTime && (
                <span className="text-xs text-muted-foreground">{formattedTime}</span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2 mb-3">
            <h3 className="font-semibold text-base leading-snug text-foreground/90">
              {title || 'Daily Reflection'}
            </h3>
            {excerpt && (
              <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed font-journal">
                {excerpt}
              </p>
            )}
          </div>

          {/* Media Preview */}
          {entry.media && entry.media.length > 0 && (
            <div className="flex gap-2 mb-4 overflow-hidden">
              {entry.media.slice(0, 4).map((media, index) => (
                <div key={`${media.id ?? 'media'}-${index}`} className="w-12 h-12 rounded-md overflow-hidden border shrink-0">
                  <img
                    src={`/api/media/${media.file_path}`}
                    alt="attachment"
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
              {entry.media.length > 4 && (
                <div className="w-12 h-12 rounded-md border flex items-center justify-center bg-muted text-xs text-muted-foreground">
                  +{entry.media.length - 4}
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {entry.selections && entry.selections.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-auto">
              {entry.selections.slice(0, 5).map((selection, index) => {
                const Icon = getIconComponent(selection.icon || '');
                return (
                  <Badge
                    key={`${selection.id ?? 'selection'}-${index}`}
                    variant="secondary"
                    className="px-2 py-0.5 text-xs font-normal gap-1 bg-muted/50 hover:bg-muted"
                  >
                    {Icon && <Icon size={10} className="opacity-70" />}
                    {selection.name}
                  </Badge>
                );
              })}
              {entry.selections.length > 5 && (
                <Badge variant="outline" className="text-xs font-normal px-1.5">
                  +{entry.selections.length - 5}
                </Badge>
              )}
            </div>
          )}

          {/* Scale Entries */}
          {entry.scale_entries && entry.scale_entries.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {entry.scale_entries.slice(0, 4).map((scale, index) => (
                <Badge
                  key={`${scale.scale_id ?? 'scale'}-${index}`}
                  variant="outline"
                  className="px-2 py-0.5 text-xs font-normal gap-1"
                  style={{
                    borderColor: scale.color_hex || 'var(--border)',
                    color: scale.color_hex || 'var(--foreground)'
                  }}
                >
                  {scale.name}: {scale.value}
                </Badge>
              ))}
              {entry.scale_entries.length > 4 && (
                <Badge variant="outline" className="text-xs px-1.5">
                  +{entry.scale_entries.length - 4}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <EntryModal
        isOpen={open}
        entry={entry}
        onClose={() => setOpen(false)}
        onDelete={handleDeleteRequest}
        isDeleting={isDeleting}
        onEdit={onEdit ? () => {
          setOpen(false);
          handleEdit();
        } : undefined}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Entry"
        description="Are you sure you want to delete this entry? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </>
  );
});

export default HistoryEntry;
