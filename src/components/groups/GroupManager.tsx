import { useState } from 'react';
import { Settings, X, Plus, Grid, List, ArrowRightLeft, FolderInput, FolderPlus, Tag } from 'lucide-react';
import IconPicker, { getIconComponent } from '../ui/IconPicker';
import { Group, GroupOption } from '../../services/api';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';


interface MoveOptionModalProps {
  option: GroupOption & { group_id: number };
  groups: Group[];
  onClose: () => void;
  onMove: (optionId: number, newGroupId: number) => Promise<void | boolean>;
}

interface GroupManagerProps {
  groups: Group[];
  onCreateGroup: (name: string) => Promise<boolean>;
  onCreateOption: (groupId: number, name: string, icon?: string) => Promise<boolean>;
  onMoveOption: (optionId: number, newGroupId: number) => Promise<void | boolean>;
}

type ViewMode = 'grid' | 'list';

const MoveOptionModal = ({ option, groups, onClose, onMove }: MoveOptionModalProps) => {
  const [selectedGroup, setSelectedGroup] = useState<string>(String(option.group_id));
  const [loading, setLoading] = useState(false);

  const handleMove = async () => {
    const groupId = parseInt(selectedGroup);
    if (groupId === option.group_id) return;
    setLoading(true);
    await onMove(option.id, groupId);
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderInput size={18} />
            Move "{option.name}"
          </DialogTitle>
          <DialogDescription>
            Select a new category for this activity:
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[300px] mt-4">
          <div className="flex flex-col gap-2 pr-4">
            {groups.map(g => (
              <Button
                key={g.id}
                variant={selectedGroup === String(g.id) ? "default" : "outline"}
                className={cn(
                  "justify-start h-auto py-3",
                  g.id === option.group_id && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => setSelectedGroup(String(g.id))}
                disabled={g.id === option.group_id}
              >
                <div className="flex flex-col items-start gap-0.5">
                  <span className="font-medium">{g.name}</span>
                  {g.id === option.group_id && <span className="text-[10px] uppercase">Current</span>}
                </div>
              </Button>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleMove} disabled={parseInt(selectedGroup) === option.group_id || loading}>
            {loading ? 'Moving...' : 'Move Here'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const GroupManager = ({ groups, onCreateGroup, onCreateOption, onMoveOption }: GroupManagerProps) => {
  const [showManager, setShowManager] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newOptionName, setNewOptionName] = useState('');
  const [selectedGroupForOption, setSelectedGroupForOption] = useState<string>('');
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isCreatingOption, setIsCreatingOption] = useState(false);
  const [movingOption, setMovingOption] = useState<(GroupOption & { group_id: number }) | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    setIsCreatingGroup(true);
    try {
      const success = await onCreateGroup(newGroupName.trim());
      if (success) setNewGroupName('');
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleCreateOption = async () => {
    if (!newOptionName.trim() || !selectedGroupForOption) return;
    setIsCreatingOption(true);
    try {
      const success = await onCreateOption(parseInt(selectedGroupForOption), newOptionName.trim(), selectedIcon ?? undefined);
      if (success) {
        setNewOptionName('');
        setSelectedIcon(null);
      }
    } finally {
      setIsCreatingOption(false);
    }
  };

  const IconDisplay = getIconComponent(selectedIcon || 'SmilePlus');

  if (!showManager) {
    return (
      <div className="flex justify-center mt-4">
        <Button
          onClick={() => setShowManager(true)}
          className="rounded-full shadow-md bg-gradient-to-r from-primary to-[color:var(--accent-bg-2)] hover:brightness-95 text-[color:var(--primary-foreground)] border-0"
        >
          <Settings size={16} className="mr-2" />
          Manage Categories
        </Button>
      </div>
    );
  }

  return (
    <Card className="mt-4 border-dashed relative animate-in fade-in slide-in-from-bottom-4 duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Grid size={20} />
          </div>
          <CardTitle className="text-lg">Manage Categories</CardTitle>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border rounded-md p-0.5 bg-muted/50">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-11 w-11 min-h-[44px] min-w-[44px] p-0"
              title="Grid view"
            >
              <Grid size={14} />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-11 w-11 min-h-[44px] min-w-[44px] p-0"
              title="List view"
            >
              <List size={14} />
            </Button>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setShowManager(false)} className="ml-2 h-10 w-10" aria-label="Close manager">
            <X size={18} className="text-muted-foreground" aria-hidden="true" />
          </Button>
        </div>

      </CardHeader>

      <CardContent className="space-y-8">
        {movingOption && (
          <MoveOptionModal
            option={movingOption}
            groups={groups}
            onClose={() => setMovingOption(null)}
            onMove={onMoveOption}
          />
        )}

        {/* Creation Forms */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* New Group */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FolderPlus size={14} /> New Category
            </h4>
            <div className="flex gap-2">
              <Input
                placeholder="Category Name..."
                name="group-name"
                autoComplete="off"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateGroup()}
              />
              <Button onClick={handleCreateGroup} disabled={!newGroupName.trim() || isCreatingGroup}>
                Add
              </Button>
            </div>
          </div>

          {/* New Option */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Tag size={14} /> New Activity
            </h4>
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              <Select value={selectedGroupForOption} onValueChange={setSelectedGroupForOption}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map(g => (
                    <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex flex-1 gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" className="shrink-0 aspect-square">
                      {selectedIcon && IconDisplay ? <IconDisplay size={18} className="text-primary" /> : <Plus size={18} />}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <IconPicker onSelect={(icon) => setSelectedIcon(icon)} selectedIcon={selectedIcon} />
                  </PopoverContent>
                </Popover>

                <Input
                  placeholder="Activity Name..."
                  name="option-name"
                  autoComplete="off"
                  value={newOptionName}
                  onChange={(e) => setNewOptionName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateOption()}
                  className="min-w-[120px]"
                />
                <Button onClick={handleCreateOption} disabled={!newOptionName.trim() || !selectedGroupForOption || isCreatingOption}>
                  Add
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground/80">Categories & Activities</h4>
          <div className={cn(
            "grid gap-4",
            viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
          )}>
            {groups.map(group => (
              <div
                key={group.id}
                className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden"
              >
                <div className="px-4 py-3 bg-muted/40 border-b flex justify-between items-center">
                  <span className="font-semibold">{group.name}</span>
                  <Badge variant="secondary" className="text-xs">{group.options.length}</Badge>
                </div>
                <div className="p-4 flex flex-wrap gap-2">
                  {group.options.length === 0 ? (
                    <span className="text-xs text-muted-foreground italic">Empty</span>
                  ) : (
                    group.options.map(option => {
                      const Icon = getIconComponent(option.icon || '');
                      return (
                        <div
                          key={option.id}
                          className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border bg-background hover:border-primary/50 transition-colors select-none"
                        >
                          {Icon && <Icon size={14} className="text-muted-foreground" />}
                          <span className="text-sm font-medium">{option.name}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMovingOption({ ...option, group_id: group.id });
                            }}
                            className="ml-1 p-0.5 rounded hover:bg-muted text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Move"
                          >
                            <ArrowRightLeft size={12} />
                          </button>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </CardContent>
    </Card>
  );
};

export default GroupManager;
