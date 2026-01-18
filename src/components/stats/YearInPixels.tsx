import { useRef, useState, useMemo, CSSProperties, MouseEvent } from 'react';
import html2canvas from 'html2canvas';

interface Entry {
  date: string;
  mood: number;
}

interface YearInPixelsProps {
  entries: Entry[];
  onDayClick?: (date: string) => void;
}

interface YearDataPoint {
  mood: number;
  entry: Entry;
}

// Constants
const MONTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const FULL_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

const getMoodColor = (mood: number): string => {
  switch (Math.round(mood)) {
    case 1: return 'var(--mood-1)';
    case 2: return 'var(--mood-2)';
    case 3: return 'var(--mood-3)';
    case 4: return 'var(--mood-4)';
    case 5: return 'var(--mood-5)';
    default: return 'var(--bg-card-hover)';
  }
};

const YearInPixels = ({ entries, onDayClick }: YearInPixelsProps) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const gridRef = useRef<HTMLDivElement>(null);

  // Get available years from entries
  const availableYears = useMemo(() => {
    const years = new Set([currentYear]);
    entries.forEach(entry => {
      if (entry.date) {
        years.add(new Date(entry.date).getFullYear());
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [entries, currentYear]);

  // Process data for the grid
  const yearData = useMemo(() => {
    const data: Record<string, { moods: number[]; entry: Entry }> = {};

    entries.forEach(entry => {
      if (!entry.date || !entry.mood) return;
      const date = new Date(entry.date);
      if (date.getFullYear() !== selectedYear) return;

      const month = date.getMonth(); // 0-11
      const day = date.getDate(); // 1-31
      const key = `${month}-${day}`;

      if (!data[key]) {
        data[key] = { moods: [], entry: entry }; // Store latest entry reference
      }
      data[key].moods.push(Number(entry.mood));
    });

    // Calculate averages
    const processed: Record<string, YearDataPoint> = {};
    Object.keys(data).forEach(key => {
      const moods = data[key].moods;
      const avg = moods.reduce((a, b) => a + b, 0) / moods.length;
      processed[key] = {
        mood: avg,
        entry: data[key].entry
      };
    });

    return processed;
  }, [entries, selectedYear]);

  const handleExport = async () => {
    if (!gridRef.current) return;

    try {
      const canvas = await html2canvas(gridRef.current, {
        backgroundColor: window.getComputedStyle(document.body).getPropertyValue('--bg-app').trim(),
        scale: 2 // Retain high quality
      });

      const link = document.createElement('a');
      link.download = `year-in-pixels-${selectedYear}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to export Year in Pixels:', err);
    }
  };

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  };

  const selectStyle: CSSProperties = {
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 600
  };

  const gridContainerStyle: CSSProperties = {
    padding: '1rem',
    background: 'var(--bg-card)',
    borderRadius: '1rem'
  };

  const gridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'auto repeat(31, 1fr)',
    gap: '2px',
    fontSize: '0.75rem',
    overflowX: 'auto',
    maxWidth: '100%'
  };

  const headerCellStyle: CSSProperties = {
    width: '2rem'
  };

  const dayLabelStyle: CSSProperties = {
    textAlign: 'center',
    color: 'var(--text-muted)'
  };

  const monthLabelStyle: CSSProperties = {
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600
  };

  const legendStyle: CSSProperties = {
    display: 'flex',
    gap: '1rem',
    marginTop: '1.5rem',
    justifyContent: 'center',
    fontSize: '0.875rem'
  };

  const legendItemStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  };

  return (
    <div className="statistics-view__card statistics-view__section">
      <div className="statistics-view__section-header">
        <div style={headerStyle}>
          <h3 className="statistics-view__section-title">Year in Pixels</h3>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="statistics-view__range-button"
            style={selectStyle}
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <button type="button" className="statistics-view__ghost-button" onClick={handleExport}>
          Export PNG
        </button>
      </div>

      <div ref={gridRef} style={gridContainerStyle}>
        <div style={gridStyle}>
          {/* Header Row (Days) */}
          <div style={headerCellStyle}></div>
          {DAYS.map(day => (
            <div key={day} style={dayLabelStyle}>
              {day % 5 === 0 || day === 1 ? day : ''}
            </div>
          ))}

          {/* Months Rows */}
          {MONTHS.map((monthLabel, monthIndex) => (
            <>
              <div key={`label-${monthIndex}`} style={monthLabelStyle}>
                {monthLabel}
              </div>

              {DAYS.map(day => {
                const date = new Date(selectedYear, monthIndex, day);
                // Check if date is valid for this month (e.g. Feb 30 is invalid)
                const isValidDate = date.getMonth() === monthIndex;

                if (!isValidDate) {
                  return <div key={`${monthIndex}-${day}`} style={{ background: 'transparent' }} />;
                }

                const data = yearData[`${monthIndex}-${day}`];
                const mood = data ? data.mood : null;
                const color = mood ? getMoodColor(mood) : 'var(--bg-app)';
                const isClickable = !!onDayClick;

                const pixelStyle: CSSProperties = {
                  aspectRatio: '1',
                  backgroundColor: color,
                  borderRadius: '2px',
                  cursor: isClickable ? 'pointer' : 'default',
                  transition: 'transform 0.1s',
                };

                const handleMouseEnter = (e: MouseEvent<HTMLDivElement>) => {
                  (e.target as HTMLDivElement).style.transform = 'scale(1.2)';
                };

                const handleMouseLeave = (e: MouseEvent<HTMLDivElement>) => {
                  (e.target as HTMLDivElement).style.transform = 'scale(1)';
                };

                return (
                  <div
                    key={`${monthIndex}-${day}`}
                    onClick={() => isClickable && onDayClick(date.toISOString())}
                    title={data ? `${FULL_MONTHS[monthIndex]} ${day}: Mood ${mood!.toFixed(1)}` : `${FULL_MONTHS[monthIndex]} ${day}`}
                    style={pixelStyle}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  />
                );
              })}
            </>
          ))}
        </div>

        {/* Legend included in export area */}
        <div style={legendStyle}>
          {[1, 2, 3, 4, 5].map(score => (
            <div key={score} style={legendItemStyle}>
              <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: getMoodColor(score) }} />
              <span>Level {score}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default YearInPixels;
