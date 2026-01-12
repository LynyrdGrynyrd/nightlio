export const TIMEOUTS = {
    DEBOUNCE_SEARCH: 300,
    REDIRECT_DELAY_MS: 1500,
    TOAST_DURATION: 3000,
};

export const MOOD_CONFIG = [
    { value: 1, color: 'var(--mood-1)', label: 'Terrible' },
    { value: 2, color: 'var(--mood-2)', label: 'Bad' },
    { value: 3, color: 'var(--mood-3)', label: 'Okay' },
    { value: 4, color: 'var(--mood-4)', label: 'Good' },
    { value: 5, color: 'var(--mood-5)', label: 'Amazing' },
];

export const CHART_CONFIG = {
    STABILITY: {
        THRESHOLDS: {
            VERY_STABLE: 90,
            STABLE: 70,
            VARIABLE: 40,
        },
        COLORS: {
            VERY_STABLE: 'var(--success, #22c55e)',
            STABLE: 'var(--accent)',
            VARIABLE: 'var(--warning, #f59e0b)',
            VOLATILE: 'var(--destructive, #ef4444)',
        },
        LABELS: {
            VERY_STABLE: 'Very Stable',
            STABLE: 'Stable',
            VARIABLE: 'Variable',
            VOLATILE: 'Volatile',
        }
    }
};
