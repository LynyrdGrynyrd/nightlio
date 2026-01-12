
import { useState, useEffect } from 'react';
import { Palette, Check, RefreshCw } from 'lucide-react';
import apiService from '../../services/api';
import { useMoodDefinitions } from '../../contexts/MoodDefinitionsContext';

// Common emojis for mood selection
const EMOJI_OPTIONS = ['😢', '😕', '😐', '🙂', '😄', '😊', '🥺', '😩', '😤', '😌', '🤗', '😎', '🥳', '💪', '😴'];

const CustomizeMoods = () => {
    const { definitions, loading, refreshDefinitions } = useMoodDefinitions();
    const [moods, setMoods] = useState([]);
    const [saving, setSaving] = useState(null);
    const [editingMood, setEditingMood] = useState(null);

    useEffect(() => {
        setMoods(definitions);
    }, [definitions]);

    const handleSave = async (score, updates) => {
        setSaving(score);
        try {
            const updated = await apiService.updateMoodDefinition(score, updates);
            // Optimistic update locally
            setMoods(prev => prev.map(m => m.score === score ? updated : m));
            // Refresh context to update global styles
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
            <div className="flex items-center gap-2 text-gray-500">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Loading mood settings...
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Custom Moods
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
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
                            {/* Emoji */}
                            <div className="relative">
                                <button
                                    onClick={() => setEditingMood(editingMood === mood.score ? null : mood.score)}
                                    className="text-4xl hover:scale-110 transition-transform cursor-pointer"
                                    title="Click to change"
                                >
                                    {mood.icon}
                                </button>
                            </div>

                            {/* Label and Score */}
                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={mood.label}
                                    onChange={(e) => setMoods(prev => prev.map(m =>
                                        m.score === mood.score ? { ...m, label: e.target.value } : m
                                    ))}
                                    onBlur={(e) => {
                                        if (e.target.value !== moods.find(m => m.score === mood.score)?.label) {
                                            handleSave(mood.score, { label: e.target.value });
                                        }
                                    }}
                                    className="font-semibold text-lg bg-transparent border-b border-transparent hover:border-gray-300 focus:border-gray-400 outline-none w-full"
                                    style={{ color: mood.color_hex }}
                                />
                                <p className="text-sm text-gray-500">Mood score: {mood.score}/5</p>
                            </div>

                            {/* Color picker */}
                            <input
                                type="color"
                                value={mood.color_hex}
                                onChange={(e) => handleSave(mood.score, { color_hex: e.target.value })}
                                className="w-10 h-10 rounded-lg cursor-pointer border-2 border-white shadow"
                                title="Change color"
                            />

                            {saving === mood.score && (
                                <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
                            )}
                        </div>

                        {/* Emoji picker dropdown */}
                        {editingMood === mood.score && (
                            <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border">
                                <p className="text-sm text-gray-500 mb-2">Select an emoji:</p>
                                <div className="flex flex-wrap gap-2">
                                    {EMOJI_OPTIONS.map((emoji) => (
                                        <button
                                            key={emoji}
                                            onClick={() => handleSave(mood.score, { icon: emoji })}
                                            className={`text-2xl p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${mood.icon === emoji ? 'bg-gray-200 dark:bg-gray-600 ring-2 ring-blue-500' : ''}`}
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
