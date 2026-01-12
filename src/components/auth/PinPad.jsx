import { useState, useEffect } from 'react';
import { Delete } from 'lucide-react';

const PinPad = ({ onComplete, length = 4, error }) => {
    const [pin, setPin] = useState('');

    useEffect(() => {
        if (pin.length === length) {
            onComplete(pin);
            setPin(''); // Reset after submit attempt? Or let parent reset on error?
        }
    }, [pin, length, onComplete]);

    // Allow parent to reset pin by changing error? No, internal state.
    // We can expose a clear method or just clear on error prop change.
    useEffect(() => {
        if (error) {
            setPin('');
        }
    }, [error]);

    const handleDigit = (digit) => {
        if (pin.length < length) {
            setPin(prev => prev + digit);
        }
    };

    const handleBackspace = () => {
        setPin(prev => prev.slice(0, -1));
    };

    return (
        <div className="flex flex-col items-center gap-6">
            {/* Dots Display */}
            <div className="flex gap-4 mb-4">
                {[...Array(length)].map((_, i) => (
                    <div
                        key={i}
                        className={`w-4 h-4 rounded-full border border-[var(--text-muted)] transition-all duration-200 ${i < pin.length ? 'bg-[var(--accent-500)] border-[var(--accent-500)]' : 'bg-transparent'
                            } ${error ? 'border-red-500 animate-shake' : ''}`}
                    />
                ))}
            </div>

            {error && <p className="text-red-500 text-sm font-medium animate-pulse">{error}</p>}

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <button
                        key={num}
                        onClick={() => handleDigit(num)}
                        className="w-16 h-16 rounded-full text-2xl font-medium
                                 bg-[var(--surface-active)] text-[var(--text)]
                                 hover:bg-[var(--accent-bg-soft)] hover:border-[var(--accent-200)]
                                 border border-transparent transition-all
                                 flex items-center justify-center shadow-sm active:scale-95"
                    >
                        {num}
                    </button>
                ))}

                {/* Empty spacer for alignment */}
                <div />

                <button
                    onClick={() => handleDigit(0)}
                    className="w-16 h-16 rounded-full text-2xl font-medium
                             bg-[var(--surface-active)] text-[var(--text)]
                             hover:bg-[var(--accent-bg-soft)] hover:border-[var(--accent-200)]
                             border border-transparent transition-all
                             flex items-center justify-center shadow-sm active:scale-95"
                >
                    0
                </button>

                <button
                    onClick={handleBackspace}
                    className="w-16 h-16 rounded-full text-xl
                             text-[var(--text-muted)] hover:text-[var(--text)]
                             hover:bg-red-500/10 active:scale-95 transition-all
                             flex items-center justify-center"
                    aria-label="Backspace"
                >
                    <Delete size={24} />
                </button>
            </div>
        </div>
    );
};

export default PinPad;
