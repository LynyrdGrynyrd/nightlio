import { useState, useRef, ChangeEvent } from 'react';
import { Upload, Check, FileJson } from 'lucide-react';
import apiService from '../../services/api';
import { useToast } from '../ui/ToastProvider';

// ========== Types ==========

interface ImportStats {
  entries: number;
  errors: number;
}

interface BackupData {
  entries?: unknown[];
  meta?: unknown;
}

// ========== Component ==========

const ImportData = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [stats, setStats] = useState<ImportStats | null>(null);
  const { show } = useToast();

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      show('Please select a valid JSON file', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        await processImport(json);
      } catch {
        show('Failed to parse JSON file', 'error');
      }
    };
    reader.readAsText(file);
  };

  const processImport = async (data: BackupData) => {
    setIsImporting(true);
    try {
      if (!data.entries && !data.meta) {
        throw new Error("Invalid Twilightio backup file");
      }

      const result = await apiService.importData(data);
      setStats(result.stats);
      show('Import successful!', 'success');

      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (err) {
      console.error(err);
      show((err as Error).message || 'Import failed', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 mt-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-lg text-[var(--text)] flex items-center gap-2">
            <FileJson size={20} className="text-[var(--accent-500)]" />
            Import / Restore
          </h3>
          <p className="text-[var(--text-muted)] text-sm mt-1 max-w-sm">
            Restore your history from a JSON backup file. This will add missing entries to your journal.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".json"
          className="hidden"
        />

        {!stats ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors border border-dashed border-[var(--border)] hover:border-[var(--accent-500)] text-[var(--text-muted)] hover:text-[var(--accent-500)] w-full justify-center ${isImporting ? 'opacity-50' : ''}`}
          >
            {isImporting ? (
              <span>Importing...</span>
            ) : (
              <>
                <Upload size={16} />
                <span>Select Backup File (JSON)</span>
              </>
            )}
          </button>
        ) : (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-medium mb-2">
              <Check size={16} />
              Import Complete
            </div>
            <ul className="text-sm text-green-600 dark:text-green-500 space-y-1">
              <li>Entries Restored: {stats.entries}</li>
              {stats.errors > 0 && <li className="text-red-500">Errors: {stats.errors}</li>}
            </ul>
            <button
              onClick={() => setStats(null)}
              className="mt-3 text-xs text-[var(--text-muted)] underline hover:text-[var(--text)]"
            >
              Import another file
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportData;
