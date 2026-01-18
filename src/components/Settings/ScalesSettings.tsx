import { useState, useEffect, ChangeEvent, FocusEvent } from 'react';
import { Sliders, Plus, Trash2, RefreshCw } from 'lucide-react';
import apiService, { Scale, CreateScaleData, UpdateScaleData } from '../../services/api';

const DEFAULT_COLOR = '#0d9488';
const PRESET_SCALES = [
  { name: 'Sleep Quality', min_label: 'Terrible', max_label: 'Perfect', color_hex: '#6366f1' },
  { name: 'Energy Level', min_label: 'Exhausted', max_label: 'Energized', color_hex: '#22c55e' },
  { name: 'Stress Level', min_label: 'Calm', max_label: 'Overwhelmed', color_hex: '#ef4444' },
  { name: 'Anxiety Level', min_label: 'Relaxed', max_label: 'Anxious', color_hex: '#f59e0b' },
  { name: 'Focus', min_label: 'Distracted', max_label: 'Focused', color_hex: '#8b5cf6' },
  { name: 'Social Battery', min_label: 'Drained', max_label: 'Recharged', color_hex: '#ec4899' },
  { name: 'Productivity', min_label: 'Unproductive', max_label: 'Very Productive', color_hex: '#06b6d4' },
];

const ScalesSettings = () => {
  const [scales, setScales] = useState<Scale[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [newScale, setNewScale] = useState<CreateScaleData>({
    name: '',
    min_value: 1,
    max_value: 10,
    min_label: 'Low',
    max_label: 'High',
    color_hex: DEFAULT_COLOR,
  });

  const loadScales = async () => {
    try {
      setLoading(true);
      const data = await apiService.getScales();
      setScales(data);
    } catch (error) {
      console.error('Failed to load scales:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScales();
  }, []);

  const handleUpdate = async (scaleId: number, updates: UpdateScaleData) => {
    setSaving(scaleId);
    try {
      const updated = await apiService.updateScale(scaleId, updates);
      setScales(prev => prev.map(s => s.id === scaleId ? updated : s));
    } catch (error) {
      console.error('Failed to update scale:', error);
    } finally {
      setSaving(null);
    }
  };

  const handleCreate = async (scaleData: CreateScaleData) => {
    try {
      const created = await apiService.createScale(scaleData);
      setScales(prev => [...prev, created]);
      setNewScale({
        name: '',
        min_value: 1,
        max_value: 10,
        min_label: 'Low',
        max_label: 'High',
        color_hex: DEFAULT_COLOR,
      });
      setShowNewForm(false);
      setShowPresets(false);
    } catch (error) {
      console.error('Failed to create scale:', error);
    }
  };

  const handleDelete = async (scaleId: number) => {
    if (!confirm('Are you sure you want to delete this scale? This will remove all associated data.')) {
      return;
    }
    setDeleting(scaleId);
    try {
      await apiService.deleteScale(scaleId);
      setScales(prev => prev.filter(s => s.id !== scaleId));
    } catch (error) {
      console.error('Failed to delete scale:', error);
    } finally {
      setDeleting(null);
    }
  };

  const handleCreateFromPreset = (preset: typeof PRESET_SCALES[0]) => {
    handleCreate({
      name: preset.name,
      min_value: 1,
      max_value: 10,
      min_label: preset.min_label,
      max_label: preset.max_label,
      color_hex: preset.color_hex,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <RefreshCw className="w-4 h-4 animate-spin" />
        Loading scales...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Sliders className="w-5 h-5" />
            Custom Scales
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Track additional metrics like sleep, energy, stress, and more.
          </p>
        </div>
        <button
          onClick={() => {
            setShowNewForm(!showNewForm);
            setShowPresets(false);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Scale
        </button>
      </div>

      {/* New Scale Form */}
      {showNewForm && (
        <div className="p-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">New Scale</h4>
            <button
              onClick={() => setShowPresets(!showPresets)}
              className="text-sm text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
            >
              {showPresets ? 'Custom Scale' : 'Choose from Presets'}
            </button>
          </div>

          {showPresets ? (
            <div className="grid gap-2 max-h-64 overflow-y-auto">
              {PRESET_SCALES.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handleCreateFromPreset(preset)}
                  className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700 transition-colors text-left"
                  style={{
                    borderLeftWidth: '4px',
                    borderLeftColor: preset.color_hex,
                  }}
                >
                  <div className="font-medium text-gray-900 dark:text-gray-100">{preset.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {preset.min_label} → {preset.max_label}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <>
              <input
                type="text"
                placeholder="Scale name (e.g., Sleep Quality)"
                value={newScale.name}
                onChange={(e) => setNewScale({ ...newScale, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Min label (e.g., Terrible)"
                  value={newScale.min_label || ''}
                  onChange={(e) => setNewScale({ ...newScale, min_label: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <input
                  type="text"
                  placeholder="Max label (e.g., Perfect)"
                  value={newScale.max_label || ''}
                  onChange={(e) => setNewScale({ ...newScale, max_label: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-700 dark:text-gray-300">Color:</label>
                <input
                  type="color"
                  value={newScale.color_hex || DEFAULT_COLOR}
                  onChange={(e) => setNewScale({ ...newScale, color_hex: e.target.value })}
                  className="w-12 h-10 rounded-lg cursor-pointer border-2 border-white shadow"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleCreate(newScale)}
                  disabled={!newScale.name.trim()}
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Scale
                </button>
                <button
                  onClick={() => setShowNewForm(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-gray-100"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Existing Scales */}
      {scales.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Sliders className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No scales created yet.</p>
          <p className="text-sm">Click "Add Scale" to create your first tracking scale!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {scales.map((scale) => (
            <div
              key={scale.id}
              className="p-4 rounded-xl border transition-all"
              style={{
                borderColor: scale.color_hex || DEFAULT_COLOR,
                backgroundColor: `${scale.color_hex || DEFAULT_COLOR}15`,
              }}
            >
              <div className="flex items-start gap-4">
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={scale.name}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setScales(prev => prev.map(s => s.id === scale.id ? { ...s, name: e.target.value } : s))
                    }
                    onBlur={(e: FocusEvent<HTMLInputElement>) => {
                      const currentScale = scales.find(s => s.id === scale.id);
                      if (currentScale && e.target.value !== currentScale.name) {
                        handleUpdate(scale.id, { name: e.target.value });
                      }
                    }}
                    className="font-semibold text-lg bg-transparent border-b border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-gray-400 dark:focus:border-gray-500 outline-none w-full"
                    style={{ color: scale.color_hex || DEFAULT_COLOR }}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={scale.min_label || ''}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setScales(prev => prev.map(s => s.id === scale.id ? { ...s, min_label: e.target.value } : s))
                      }
                      onBlur={(e: FocusEvent<HTMLInputElement>) => {
                        const currentScale = scales.find(s => s.id === scale.id);
                        if (currentScale && e.target.value !== currentScale.min_label) {
                          handleUpdate(scale.id, { min_label: e.target.value });
                        }
                      }}
                      placeholder="Min label"
                      className="text-sm px-2 py-1 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                    />
                    <input
                      type="text"
                      value={scale.max_label || ''}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setScales(prev => prev.map(s => s.id === scale.id ? { ...s, max_label: e.target.value } : s))
                      }
                      onBlur={(e: FocusEvent<HTMLInputElement>) => {
                        const currentScale = scales.find(s => s.id === scale.id);
                        if (currentScale && e.target.value !== currentScale.max_label) {
                          handleUpdate(scale.id, { max_label: e.target.value });
                        }
                      }}
                      placeholder="Max label"
                      className="text-sm px-2 py-1 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Range: {scale.min_value} - {scale.max_value}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={scale.color_hex || DEFAULT_COLOR}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      handleUpdate(scale.id, { color_hex: e.target.value })
                    }
                    className="w-10 h-10 rounded-lg cursor-pointer border-2 border-white shadow"
                    title="Change color"
                  />

                  <button
                    onClick={() => handleDelete(scale.id)}
                    disabled={deleting === scale.id}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete scale"
                  >
                    {deleting === scale.id ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>

                  {saving === scale.id && (
                    <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScalesSettings;
