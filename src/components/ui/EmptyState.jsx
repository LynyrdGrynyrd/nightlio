import { PlusCircle, Sparkles, FolderOpen, List, Camera, Target, Calendar, Heart } from 'lucide-react';

// Celebratory messages by context
const EMPTY_STATE_VARIANTS = {
    default: {
        title: "Nothing here yet",
        message: "Time to start something new! ✨",
        icon: Sparkles
    },
    firstEntry: {
        title: "Your first entry!",
        message: "Let's make some history! This is where your journey begins. 🌟",
        icon: Sparkles
    },
    noEntriesThisWeek: {
        title: "A fresh week awaits",
        message: "What will you feel first? Every moment is a new beginning. 🌱",
        icon: Calendar
    },
    noPhotos: {
        title: "Gallery is empty",
        message: "Capture a moment today! Photos bring entries to life. 📸",
        icon: Camera
    },
    noGoals: {
        title: "No goals yet",
        message: "Set an intention for tomorrow! Small steps lead to big changes. 🎯",
        icon: Target
    },
    noHistory: {
        title: "Your story starts here",
        message: "Every great journey begins with a single step. Start logging! 📖",
        icon: Heart
    },
    noStats: {
        title: "Not enough data yet",
        message: "Keep journaling! Insights appear after a few entries. 📊",
        icon: List
    },
    emptyFolder: {
        title: "This folder is empty",
        message: "Add some items to get started!",
        icon: FolderOpen
    }
};

const EmptyState = ({
    title,
    message,
    actionLabel,
    onAction,
    icon = "sparkles",
    variant = "default"
}) => {
    // Get variant config or use custom props
    const variantConfig = EMPTY_STATE_VARIANTS[variant] || EMPTY_STATE_VARIANTS.default;
    const finalTitle = title || variantConfig.title;
    const finalMessage = message || variantConfig.message;

    // Map string names to icons if needed, or pass component directly
    const getIcon = () => {
        if (typeof icon !== 'string') return icon; // It's a component
        switch (icon) {
            case 'sparkles': return variantConfig.icon || Sparkles;
            case 'folder': return FolderOpen;
            case 'list': return List;
            case 'plus': return PlusCircle;
            case 'camera': return Camera;
            case 'target': return Target;
            case 'calendar': return Calendar;
            case 'heart': return Heart;
            default: return variantConfig.icon || Sparkles;
        }
    };

    const IconComponent = getIcon();

    return (
        <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-300 dark:border-gray-700 w-full min-h-[200px] animate-in fade-in duration-500">
            <div className="w-16 h-16 mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-500 dark:text-blue-400">
                <IconComponent size={32} />
            </div>

            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {finalTitle}
            </h3>

            <p className="text-gray-500 dark:text-gray-400 max-w-xs mb-6 mx-auto">
                {finalMessage}
            </p>

            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--accent-600)] text-white hover:opacity-90 transition-all transform hover:scale-105 shadow-md font-medium"
                >
                    <PlusCircle size={18} />
                    {actionLabel}
                </button>
            )}
        </div>
    );
};

export default EmptyState;
