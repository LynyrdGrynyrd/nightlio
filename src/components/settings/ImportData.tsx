import { useEffect, useRef, useState, ChangeEvent } from 'react';
import {
  Upload,
  Check,
  FileJson,
  Database,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import apiService, { DaylioImportJob } from '../../services/api';
import { useToast } from '../ui/ToastProvider';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Progress } from '../ui/progress';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';

interface ImportStats {
  entries: number;
  errors: number;
}

interface BackupData {
  entries?: unknown[];
  meta?: unknown;
}

const POLL_INTERVAL_MS = 1200;

const ImportData = () => {
  const jsonFileInputRef = useRef<HTMLInputElement>(null);
  const daylioFileInputRef = useRef<HTMLInputElement>(null);
  const [isImportingJson, setIsImportingJson] = useState(false);
  const [isStartingDaylioImport, setIsStartingDaylioImport] = useState(false);
  const [jsonStats, setJsonStats] = useState<ImportStats | null>(null);
  const [daylioJob, setDaylioJob] = useState<DaylioImportJob | null>(null);
  const [daylioJobId, setDaylioJobId] = useState<string | null>(null);
  const [daylioDryRun, setDaylioDryRun] = useState(true);
  const { show } = useToast();

  useEffect(() => {
    if (!daylioJobId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const poll = async () => {
      try {
        const job = await apiService.getDaylioImportJob(daylioJobId);
        if (cancelled) return;
        setDaylioJob(job);

        if (job.status === 'completed' || job.status === 'failed') {
          if (timer) clearInterval(timer);
          if (job.status === 'completed') {
            show(
              job.dry_run ? 'Daylio dry run completed.' : 'Daylio import completed.',
              'success'
            );
          } else {
            show('Daylio import failed. Check errors below.', 'error');
          }
        }
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        show('Failed to poll Daylio import status.', 'error');
        if (timer) clearInterval(timer);
      }
    };

    poll();
    timer = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [daylioJobId, show]);

  const handleTwilightioFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      show('Please select a valid JSON file.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (loadEvent) => {
      try {
        const json = JSON.parse(loadEvent.target?.result as string);
        await processTwilightioImport(json);
      } catch {
        show('Failed to parse JSON file.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const processTwilightioImport = async (data: BackupData) => {
    setIsImportingJson(true);
    try {
      if (!data.entries && !data.meta) {
        throw new Error('Invalid Twilightio backup file');
      }

      const result = await apiService.importData(data);
      const stats = (result.stats || {}) as Record<string, number>;
      setJsonStats({
        entries: Number(stats.entries || 0),
        errors: Number(stats.errors || 0),
      });
      show('Twilightio import completed.', 'success');

      if (jsonFileInputRef.current) jsonFileInputRef.current.value = '';
    } catch (err) {
      console.error(err);
      show((err as Error).message || 'Import failed', 'error');
    } finally {
      setIsImportingJson(false);
    }
  };

  const handleDaylioFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    const accepted =
      lowerName.endsWith('.daylio') ||
      lowerName.endsWith('.zip') ||
      lowerName.endsWith('.json');

    if (!accepted) {
      show('Select a .daylio, .zip, or Daylio .json backup file.', 'error');
      return;
    }

    setIsStartingDaylioImport(true);
    try {
      const { job_id } = await apiService.importDaylioBackup(file, daylioDryRun);
      setDaylioJobId(job_id);
      setDaylioJob(null);
      show('Daylio import queued. Processing in background...', 'info');
      if (daylioFileInputRef.current) daylioFileInputRef.current.value = '';
    } catch (err) {
      console.error(err);
      show((err as Error).message || 'Failed to start Daylio import.', 'error');
    } finally {
      setIsStartingDaylioImport(false);
    }
  };

  const daylioIsRunning =
    daylioJob?.status === 'queued' || daylioJob?.status === 'running';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" />
          <CardTitle>Import / Restore</CardTitle>
        </div>
        <CardDescription>
          Restore Twilightio backups or import from Daylio backup files.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-3 border rounded-xl p-4">
          <div>
            <h4 className="text-sm font-semibold text-foreground">Twilightio JSON Import</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Use this for existing Twilightio backup JSON files.
            </p>
          </div>

          <input
            type="file"
            ref={jsonFileInputRef}
            onChange={handleTwilightioFileSelect}
            accept=".json"
            className="hidden"
          />

          {!jsonStats ? (
            <Button
              variant="outline"
              onClick={() => jsonFileInputRef.current?.click()}
              disabled={isImportingJson}
              className="w-full"
            >
              {isImportingJson ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Select Twilightio JSON
                </>
              )}
            </Button>
          ) : (
            <div className="bg-[color:var(--success-soft)] border border-[color:var(--success)] rounded-lg p-3">
              <div className="flex items-center gap-2 text-[color:var(--success)] font-medium mb-1">
                <Check size={16} />
                Import Complete
              </div>
              <ul className="text-sm text-[color:var(--success)] space-y-1">
                <li>Entries Restored: {jsonStats.entries}</li>
                {jsonStats.errors > 0 && <li className="text-destructive">Errors: {jsonStats.errors}</li>}
              </ul>
              <Button
                variant="link"
                onClick={() => setJsonStats(null)}
                className="px-0 h-auto mt-2 text-xs"
              >
                Import another JSON file
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-3 border rounded-xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-foreground">Daylio Backup Import</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Upload Daylio `.daylio` or `.zip` backups. Includes duplicate detection and progress tracking.
              </p>
            </div>
            <Badge variant="outline" className="gap-2">
              <FileJson className="w-3 h-3" />
              Daylio
            </Badge>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
            <div>
              <div className="text-sm font-medium">Dry run</div>
              <div className="text-xs text-muted-foreground">
                Analyze import without writing to database.
              </div>
            </div>
            <Switch
              checked={daylioDryRun}
              onCheckedChange={setDaylioDryRun}
              disabled={daylioIsRunning}
              aria-label="Toggle Daylio dry run"
            />
          </div>

          <input
            type="file"
            ref={daylioFileInputRef}
            onChange={handleDaylioFileSelect}
            accept=".daylio,.zip,.json"
            className="hidden"
          />

          <Button
            variant="outline"
            onClick={() => daylioFileInputRef.current?.click()}
            disabled={isStartingDaylioImport || daylioIsRunning}
            className="w-full"
          >
            {isStartingDaylioImport ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Starting import...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Daylio Backup
              </>
            )}
          </Button>

          {daylioJob && (
            <div className="space-y-3 rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium truncate">{daylioJob.filename}</div>
                <Badge
                  variant={daylioJob.status === 'failed' ? 'destructive' : 'outline'}
                  className="uppercase text-[10px]"
                >
                  {daylioJob.status}
                </Badge>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span>{daylioJob.progress}%</span>
                </div>
                <Progress value={daylioJob.progress} className="h-2" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="rounded bg-muted/40 p-2">
                  <div className="text-muted-foreground">Total</div>
                  <div className="font-semibold">{daylioJob.stats.total_entries}</div>
                </div>
                <div className="rounded bg-muted/40 p-2">
                  <div className="text-muted-foreground">Imported</div>
                  <div className="font-semibold">{daylioJob.stats.imported_entries}</div>
                </div>
                <div className="rounded bg-muted/40 p-2">
                  <div className="text-muted-foreground">Duplicates</div>
                  <div className="font-semibold">{daylioJob.stats.skipped_duplicates}</div>
                </div>
                <div className="rounded bg-muted/40 p-2">
                  <div className="text-muted-foreground">Groups</div>
                  <div className="font-semibold">{daylioJob.stats.created_groups}</div>
                </div>
                <div className="rounded bg-muted/40 p-2">
                  <div className="text-muted-foreground">Options</div>
                  <div className="font-semibold">{daylioJob.stats.created_options}</div>
                </div>
                <div className="rounded bg-muted/40 p-2">
                  <div className="text-muted-foreground">Failed</div>
                  <div className="font-semibold">{daylioJob.stats.failed_entries}</div>
                </div>
              </div>

              {daylioJob.errors.length > 0 && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3">
                  <div className="flex items-center gap-2 text-destructive text-sm font-medium mb-2">
                    <AlertCircle className="w-4 h-4" />
                    Import Errors ({daylioJob.errors.length})
                  </div>
                  <ul className="space-y-1 text-xs text-foreground/90 max-h-36 overflow-auto">
                    {daylioJob.errors.slice(0, 10).map((error, idx) => (
                      <li key={`${error.index ?? 'na'}-${idx}`}>
                        Row {error.index ?? 'N/A'}: {error.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ImportData;
