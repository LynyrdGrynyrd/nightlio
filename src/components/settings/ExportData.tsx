import { Download, FileJson, FileText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useToast } from '../ui/ToastProvider';

const ExportData = () => {
  const { token } = useAuth();
  const { show } = useToast();

  const handleExport = async (format: string) => {
    try {
      const response = await fetch(`/api/export/${format}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `twilightio_export.${format}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename=(.+)/);
        if (filenameMatch && filenameMatch.length === 2) {
          filename = filenameMatch[1];
        }
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error("Export error:", error);
      show("Failed to export data. Please try again.", 'error');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          <CardTitle>Export Data</CardTitle>
        </div>
        <CardDescription>
          Download a copy of your data for backup or analysis.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 bg-muted rounded-lg space-y-4">
          <h4 className="text-sm font-medium">PDF Report Options</h4>
          <div className="flex gap-4 items-center flex-wrap">
            <div className="space-y-1">
              <Label htmlFor="startDate" className="text-xs">Start Date</Label>
              <Input
                type="date"
                id="startDate"
                name="startDate"
                autoComplete="off"
                className="w-auto"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="endDate" className="text-xs">End Date</Label>
              <Input
                type="date"
                id="endDate"
                name="endDate"
                autoComplete="off"
                className="w-auto"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => {
                const start = (document.getElementById('startDate') as HTMLInputElement).value;
                const end = (document.getElementById('endDate') as HTMLInputElement).value;
                let url = 'pdf';
                const params: string[] = [];
                if (start && end) {
                  params.push(`start_date=${start}`, `end_date=${end}`);
                }
                if (params.length > 0) url += `?${params.join('&')}`;
                handleExport(url);
              }}
            >
              <FileText className="w-4 h-4 text-destructive mr-2" />
              Standard PDF
            </Button>
            <Button
              variant="outline"
              className="border-[color:var(--accent-500)] hover:bg-[color:var(--accent-bg-soft)]"
              onClick={() => {
                const start = (document.getElementById('startDate') as HTMLInputElement).value;
                const end = (document.getElementById('endDate') as HTMLInputElement).value;
                let url = 'pdf?format=therapist';
                if (start && end) {
                  url += `&start_date=${start}&end_date=${end}`;
                }
                handleExport(url);
              }}
            >
              <FileText className="w-4 h-4 text-[color:var(--accent-600)] mr-2" />
              Therapist Report
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <Button
            variant="outline"
            onClick={() => handleExport('csv')}
          >
            <FileText className="w-4 h-4 text-[color:var(--success)] mr-2" />
            Export as CSV
          </Button>

          <Button
            variant="outline"
            onClick={() => handleExport('json')}
          >
            <FileJson className="w-4 h-4 text-[color:var(--warning)] mr-2" />
            Export as JSON
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExportData;
