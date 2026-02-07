import ReactMarkdown from 'react-markdown';
import { getIconComponent } from '../ui/IconPicker';
import { splitTitleBody } from '../../utils/markdownUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Edit2, Trash2 } from 'lucide-react';
import type { HistoryEntry } from '../../types/entry';

// Use shared HistoryEntry type (aliased for local use)
type Entry = HistoryEntry;

interface EntryModalProps {
  isOpen: boolean;
  entry: Entry | null;
  onClose: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
  onEdit?: () => void;
}

const EntryModal = ({ isOpen, entry, onClose, onDelete, isDeleting, onEdit }: EntryModalProps) => {
  if (!entry) return null;

  const { title, body } = splitTitleBody(entry.content);

  const formattedDate = entry.date;
  const formattedTime = entry.created_at
    ? new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[800px] max-h-[90vh] overflow-y-auto w-[92vw] [&>button]:hidden">
        <DialogHeader>
          <div className="flex justify-between items-start gap-4">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                {formattedDate}
                {formattedTime && (
                  <span className="text-sm font-normal text-muted-foreground">
                    • {formattedTime}
                  </span>
                )}
              </DialogTitle>
              {title && (
                <div className="mt-2 text-lg font-semibold text-primary">
                  {title}
                </div>
              )}
            </div>

            <div className="flex gap-2 shrink-0">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); onEdit(); }}
                  disabled={isDeleting}
                >
                  <Edit2 size={14} className="mr-2" />
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  disabled={isDeleting}
                >
                  <Trash2 size={14} className="mr-2" />
                  {isDeleting ? 'Deleting…' : 'Delete'}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); onClose(); }}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tags */}
          {entry.selections && entry.selections.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {entry.selections.map((s) => {
                const Icon = getIconComponent(s.icon || '');
                return (
                  <Badge
                    key={s.id}
                    variant="secondary"
                    className="gap-1.5 py-1"
                  >
                    {Icon && <Icon size={12} />}
                    {s.name}
                  </Badge>
                );
              })}
            </div>
          )}

          {/* Scale Entries */}
          {entry.scale_entries && entry.scale_entries.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Scales</h4>
              <div className="space-y-2">
                {entry.scale_entries.map((scale) => {
                  const minVal = scale.min_value ?? 1;
                  const maxVal = scale.max_value ?? 10;
                  const range = maxVal - minVal;
                  const percentage = range > 0 ? ((scale.value - minVal) / range) * 100 : 0;
                  return (
                    <div key={scale.scale_id} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium" style={{ color: scale.color_hex }}>
                          {scale.name}
                        </span>
                        <span className="text-muted-foreground">
                          {scale.value}/{maxVal}
                        </span>
                      </div>
                      <Progress
                        value={percentage}
                        className="h-2"
                        style={{
                          '--progress-background': scale.color_hex || 'var(--primary)',
                        } as React.CSSProperties}
                      />
                      {(scale.min_label || scale.max_label) && (
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{scale.min_label || ''}</span>
                          <span>{scale.max_label || ''}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Media Grid */}
          {entry.media && entry.media.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {entry.media.map(media => (
                <a
                  key={media.id}
                  href={`/api/media/${media.file_path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg overflow-hidden border bg-muted aspect-square hover:ring-2 ring-primary/50 transition-shadow"
                >
                  <img
                    src={`/api/media/${media.file_path}`}
                    alt="Attachment"
                    width={200}
                    height={200}
                    className="w-full h-full object-cover"
                  />
                </a>
              ))}
            </div>
          )}

          {/* Content Body */}
          <div className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-a:text-primary prose-code:text-foreground prose-code:bg-muted prose-pre:bg-muted prose-pre:text-foreground">
            <ReactMarkdown>{body}</ReactMarkdown>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EntryModal;
