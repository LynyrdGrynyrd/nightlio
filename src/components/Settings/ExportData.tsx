import React from 'react';
import { Download, FileJson, FileText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// ========== Component ==========

const ExportData = () => {
  const { token } = useAuth();

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

      // Parse filename from Content-Disposition header or use default
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
      alert("Failed to export data. Please try again.");
    }
  };

  const handlePdfExport = (therapistReport = false) => {
    const startInput = document.getElementById('startDate') as HTMLInputElement;
    const endInput = document.getElementById('endDate') as HTMLInputElement;
    const start = startInput?.value;
    const end = endInput?.value;

    let url = 'pdf';
    const params: string[] = [];

    if (therapistReport) {
      params.push('format=therapist');
    }

    if (start && end) {
      params.push(`start_date=${start}`, `end_date=${end}`);
    }

    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    handleExport(url);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
        <Download className="w-5 h-5" />
        Export Data
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Download a copy of your data for backup or analysis.
      </p>

      <div className="flex flex-col gap-4 mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">PDF Report Options</h4>
        <div className="flex gap-4 items-center flex-wrap">
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Start Date</label>
            <input
              type="date"
              id="startDate"
              className="p-2 border rounded text-sm dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">End Date</label>
            <input
              type="date"
              id="endDate"
              className="p-2 border rounded text-sm dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handlePdfExport(false)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-750 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <FileText className="w-4 h-4 text-red-500" />
            Standard PDF
          </button>
          <button
            onClick={() => handlePdfExport(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-750 border border-blue-300 dark:border-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
          >
            <FileText className="w-4 h-4 text-blue-600" />
            Therapist Report
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mt-2">
        <button
          onClick={() => handleExport('csv')}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
        >
          <FileText className="w-4 h-4 text-green-600" />
          Export as CSV
        </button>

        <button
          onClick={() => handleExport('json')}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
        >
          <FileJson className="w-4 h-4 text-orange-500" />
          Export as JSON
        </button>
      </div>
    </div>
  );
};

export default ExportData;
