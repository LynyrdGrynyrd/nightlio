import { useState, ChangeEvent, Dispatch, SetStateAction, ReactElement } from 'react';
import { Sliders, Plus, Trash2, RefreshCw, Pencil, Check } from 'lucide-react';
import { useScales } from '../../hooks/useScales';
import { Scale, CreateScaleData } from '../../services/api';
import { SCALE_DEFAULTS } from '../../constants/scaleConstants';
import { normalizeColorValue } from '../../utils/colorUtils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

const QUICK_SUGGESTIONS = [
  { name: 'Anxiety', min_label: 'None', max_label: 'Severe', colorToken: 'var(--mood-1)' },
  { name: 'Focus', min_label: 'Distracted', max_label: 'Deep Focus', colorToken: 'var(--mood-5)' },
  { name: 'Productivity', min_label: 'Low', max_label: 'Very High', colorToken: 'var(--mood-4)' },
  { name: 'Pain Level', min_label: 'None', max_label: 'Extreme', colorToken: 'var(--warning)' },
  { name: 'Social Energy', min_label: 'Drained', max_label: 'Energized', colorToken: 'var(--accent-600)' },
];

const COLOR_PRESETS = [
  'var(--mood-1)',
  'var(--mood-2)',
  'var(--mood-3)',
  'var(--mood-4)',
  'var(--mood-5)',
  'var(--success)',
  'var(--warning)',
  'var(--destructive)',
  'var(--accent-500)',
  'var(--accent-600)',
  'var(--accent-700)',
];

interface ScaleFormData {
  name: string;
  min_value: number;
  max_value: number;
  min_label: string;
  max_label: string;
  color_hex: string;
}

const defaultFormData: ScaleFormData = {
  name: '',
  min_value: 1,
  max_value: 10,
  min_label: '',
  max_label: '',
  color_hex: SCALE_DEFAULTS.DEFAULT_COLOR,
};

// --- ScaleFormDialog ---

interface ScaleFormDialogProps {
  mode: 'create' | 'edit';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: ScaleFormData;
  setFormData: Dispatch<SetStateAction<ScaleFormData>>;
  onSave: () => void;
  saving: boolean;
}

function ScaleFormDialog({
  mode,
  open,
  onOpenChange,
  formData,
  setFormData,
  onSave,
  saving,
}: ScaleFormDialogProps): ReactElement {
  const isCreate = mode === 'create';
  const idPrefix = isCreate ? '' : 'edit-';

  const handleInputChange = (field: keyof ScaleFormData) => (e: ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleQuickSuggestion = (suggestion: typeof QUICK_SUGGESTIONS[0]) => {
    setFormData(prev => ({
      ...prev,
      name: suggestion.name,
      min_label: suggestion.min_label,
      max_label: suggestion.max_label,
      color_hex: normalizeColorValue(suggestion.colorToken),
    }));
  };

  const handleColorPreset = (color: string) => {
    setFormData(prev => ({ ...prev, color_hex: normalizeColorValue(color) }));
  };

  const handleCustomColor = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, color_hex: e.target.value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isCreate ? 'Create New Scale' : 'Edit Scale'}</DialogTitle>
          <DialogDescription>
            {isCreate
              ? 'Add a custom scale to track alongside your mood entries'
              : 'Update your scale settings'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isCreate && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Quick start</Label>
              <div className="flex flex-wrap gap-2">
                {QUICK_SUGGESTIONS.map(suggestion => (
                  <button
                    key={suggestion.name}
                    onClick={() => handleQuickSuggestion(suggestion)}
                    className="px-2.5 py-1 text-xs rounded-full border hover:bg-muted transition-colors"
                    style={{
                      borderColor: suggestion.colorToken,
                      color: formData.name === suggestion.name ? 'var(--primary-foreground)' : suggestion.colorToken,
                      backgroundColor: formData.name === suggestion.name ? suggestion.colorToken : 'transparent',
                    }}
                  >
                    {suggestion.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}scale-name`}>Name</Label>
            <Input
              id={`${idPrefix}scale-name`}
              value={formData.name}
              onChange={handleInputChange('name')}
              placeholder={isCreate ? 'e.g., Sleep Quality' : undefined}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}min-label`}>Min Label</Label>
              <Input
                id={`${idPrefix}min-label`}
                value={formData.min_label}
                onChange={handleInputChange('min_label')}
                placeholder={isCreate ? 'e.g., Poor' : undefined}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}max-label`}>Max Label</Label>
              <Input
                id={`${idPrefix}max-label`}
                value={formData.max_label}
                onChange={handleInputChange('max_label')}
                placeholder={isCreate ? 'e.g., Excellent' : undefined}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map(color => (
                <button
                  key={color}
                  onClick={() => handleColorPreset(color)}
                  className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                  style={{
                    backgroundColor: color,
                    boxShadow: formData.color_hex === normalizeColorValue(color)
                      ? `0 0 0 2px var(--background), 0 0 0 4px ${color}`
                      : undefined,
                  }}
                />
              ))}
              <input
                type="color"
                value={normalizeColorValue(formData.color_hex)}
                onChange={handleCustomColor}
                className="w-7 h-7 rounded-full cursor-pointer"
                title="Custom color"
              />
            </div>
          </div>

          {isCreate && formData.name && (
            <div className="p-3 rounded-lg border bg-muted/30">
              <p className="text-xs text-muted-foreground mb-2">Preview</p>
              <div
                className="p-3 rounded-lg border"
                style={{ borderLeftWidth: '4px', borderLeftColor: formData.color_hex }}
              >
                <span className="font-medium" style={{ color: formData.color_hex }}>
                  {formData.name}
                </span>
                <Slider
                  value={[5]}
                  min={formData.min_value}
                  max={formData.max_value}
                  disabled
                  className="mt-2 w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{formData.min_label || formData.min_value}</span>
                  <span>{formData.max_label || formData.max_value}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={!formData.name.trim() || saving}>
            {saving
              ? <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              : <Check className="w-4 h-4 mr-2" />}
            {isCreate ? 'Create Scale' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- ScaleManager ---

const ScaleManager = () => {
  const { scales, loading, error, createScale, updateScale, deleteScale } = useScales();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingScale, setEditingScale] = useState<Scale | null>(null);
  const [deleteConfirmScale, setDeleteConfirmScale] = useState<Scale | null>(null);
  const [formData, setFormData] = useState<ScaleFormData>(defaultFormData);
  const [saving, setSaving] = useState(false);

  const handleOpenCreate = () => {
    setFormData({ ...defaultFormData, color_hex: normalizeColorValue(SCALE_DEFAULTS.DEFAULT_COLOR) });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (scale: Scale) => {
    setFormData({
      name: scale.name,
      min_value: scale.min_value ?? 1,
      max_value: scale.max_value ?? 10,
      min_label: scale.min_label || '',
      max_label: scale.max_label || '',
      color_hex: scale.color_hex || normalizeColorValue(SCALE_DEFAULTS.DEFAULT_COLOR),
    });
    setEditingScale(scale);
  };

  const handleSaveCreate = async () => {
    if (!formData.name.trim()) return;
    setSaving(true);
    const data: CreateScaleData = {
      name: formData.name.trim(),
      min_value: formData.min_value,
      max_value: formData.max_value,
      min_label: formData.min_label || undefined,
      max_label: formData.max_label || undefined,
      color_hex: formData.color_hex || undefined,
    };
    const success = await createScale(data);
    setSaving(false);
    if (success) {
      setIsCreateOpen(false);
      setFormData(defaultFormData);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingScale || !formData.name.trim()) return;
    setSaving(true);
    const success = await updateScale(editingScale.id, {
      name: formData.name.trim(),
      min_label: formData.min_label || undefined,
      max_label: formData.max_label || undefined,
      color_hex: formData.color_hex || undefined,
    });
    setSaving(false);
    if (success) {
      setEditingScale(null);
      setFormData(defaultFormData);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmScale) return;
    const success = await deleteScale(deleteConfirmScale.id);
    if (success) {
      setDeleteConfirmScale(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <RefreshCw className="w-4 h-4 animate-spin" />
        Loading scale settings...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
            <Sliders className="w-5 h-5" />
            Custom Scales
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Track additional metrics alongside your mood entries
          </p>
        </div>
        <Button onClick={handleOpenCreate} size="sm" className="gap-1">
          <Plus className="w-4 h-4" />
          Add Scale
        </Button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {scales.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Sliders className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No custom scales yet</p>
          <p className="text-sm">Create scales to track things like sleep, energy, or stress</p>
        </div>
      ) : (
        <div className="space-y-3">
          {scales.map(scale => (
            <div
              key={scale.id}
              className="p-4 rounded-xl border transition-all hover:shadow-sm"
              style={{
                borderLeftWidth: '4px',
                borderLeftColor: scale.color_hex || 'var(--border)',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="font-semibold"
                      style={{ color: scale.color_hex }}
                    >
                      {scale.name}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {scale.min_value ?? 1} - {scale.max_value ?? 10}
                    </Badge>
                  </div>
                  {(scale.min_label || scale.max_label) && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {scale.min_label || scale.min_value} to {scale.max_label || scale.max_value}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 min-h-[44px] min-w-[44px]"
                    onClick={() => handleOpenEdit(scale)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 min-h-[44px] min-w-[44px] text-destructive hover:text-destructive"
                    onClick={() => setDeleteConfirmScale(scale)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-3">
                <Slider
                  value={[Math.round(((scale.min_value ?? 1) + (scale.max_value ?? 10)) / 2)]}
                  min={scale.min_value ?? 1}
                  max={scale.max_value ?? 10}
                  disabled
                  className="w-full opacity-50"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <ScaleFormDialog
        mode="create"
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSaveCreate}
        saving={saving}
      />

      <ScaleFormDialog
        mode="edit"
        open={!!editingScale}
        onOpenChange={() => setEditingScale(null)}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSaveEdit}
        saving={saving}
      />

      <AlertDialog open={!!deleteConfirmScale} onOpenChange={() => setDeleteConfirmScale(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Scale</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteConfirmScale?.name}"? This will remove the scale from future entries. Existing data will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ScaleManager;
