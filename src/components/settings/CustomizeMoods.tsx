import { useState, useEffect, ChangeEvent, FocusEvent } from 'react';
import { Palette, RefreshCw } from 'lucide-react';
import apiService from '../../services/api';
import { useMoodDefinitions, MoodDefinition } from '../../contexts/MoodDefinitionsContext';

const EMOJI_OPTIONS = ['😢', '😕', '😐', '🙂', '😄', '😊', '🥺', '😩', '😤', '😌', '🤗', '😎', '🥳', '💪', '😴'];

const CustomizeMoods = () => {
  const { definitions, loading, refreshDefinitions } = useMoodDefinitions();
  const [moods, setMoods] = useState<MoodDefinition[]>([]);
  const [saving, setSaving] = useState<number | null>(null);
  const [editingMood, setEditingMood] = useState<number | null>(null);

  useEffect(() => {
    setMoods(definitions);
  }, [definitions]);

  const handleSave = async (score: number, updates: Partial<MoodDefinition>) => {
    setSaving(score);
    try {
      const updated = await apiService.updateMoodDefinition(score, updates);
      setMoods(prev => prev.map(m => m.score === score ? updated : m));
      await refreshDefinitions();
      setEditingMood(null);
    } catch (error) {
      console.error('Failed to update mood:', error);
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <RefreshCw className="w-4 h-4 animate-spin" />
        Loading mood settings...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
        <Palette className="w-5 h-5" />
        Custom Moods
      </h3>
      <p className="text-sm text-muted-foreground">
        Personalize your mood emojis, labels, and colors.
      </p>

      <div className="grid gap-4 mt-4">
        {moods.map((mood) => (
          <div
            key={mood.score}
            className="p-4 rounded-xl border transition-all"
            style={{
              borderColor: mood.color_hex,
              backgroundColor: `${mood.color_hex}15`,
            }}
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  onClick={() => setEditingMood(editingMood === mood.score ? null : mood.score)}
                  className="text-4xl hover:scale-110 transition-transform cursor-pointer"
                  title="Click to change"
                >
                  {mood.icon}
                </button>
              </div>

              <div className="flex-1">
                <input
                  type="text"
                  name={`mood-label-${mood.score}`}
                  autoComplete="off"
                  value={mood.label}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setMoods(prev => prev.map(m =>
                    m.score === mood.score ? { ...m, label: e.target.value } : m
                  ))}
                  onBlur={(e: FocusEvent<HTMLInputElement>) => {
                    if (e.target.value !== moods.find(m => m.score === mood.score)?.label) {
                      handleSave(mood.score, { label: e.target.value });
                    }
                  }}
                  className="font-semibold text-lg bg-transparent border-b border-transparent hover:border-border focus:border-muted-foreground outline-none w-full"
                  style={{ color: mood.color_hex }}
                />
                <p className="text-sm text-muted-foreground">Mood score: {mood.score}/5</p>
              </div>

                <input
                  type="color"
                  name={`mood-color-${mood.score}`}
                  autoComplete="off"
                  value={mood.color_hex}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleSave(mood.score, { color_hex: e.target.value })}
                  className="w-10 h-10 rounded-lg cursor-pointer border-2 border-[color:var(--background)] shadow"
                  title="Change color"
                />

              {saving === mood.score && (
                <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
              )}
            </div>

            {editingMood === mood.score && (
              <div className="mt-4 p-3 bg-card rounded-lg shadow-lg border border-border">
                <p className="text-sm text-muted-foreground mb-2">Select an emoji:</p>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleSave(mood.score, { icon: emoji })}
                      className={`text-2xl p-2 rounded-lg hover:bg-muted transition-colors ${mood.icon === emoji ? 'bg-muted ring-2 ring-primary' : ''}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomizeMoods;
