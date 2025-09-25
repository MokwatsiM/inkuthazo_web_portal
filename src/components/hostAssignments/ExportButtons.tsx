import React, { useState } from "react";
import { Download, FileSpreadsheet, FileText, ChevronDown } from "lucide-react";
import Button from "../ui/Button";
import { exportHostScheduleToExcel, exportHostScheduleToPDF } from "../../services/hostAssignmentExportService";
import type { HostSchedule } from "../../types";

interface ExportButtonsProps {
  schedule: HostSchedule;
  variant?: "button" | "dropdown";
  className?: string;
}

const ExportButtons: React.FC<ExportButtonsProps> = ({
  schedule,
  variant = "dropdown",
  className = ""
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      await exportHostScheduleToExcel(schedule);
    } catch (error) {
      console.error('Export to Excel failed:', error);
      alert('Failed to export to Excel. Please try again.');
    } finally {
      setIsExporting(false);
      setShowDropdown(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      await exportHostScheduleToPDF(schedule);
    } catch (error) {
      console.error('Export to PDF failed:', error);
      alert('Failed to export to PDF. Please try again.');
    } finally {
      setIsExporting(false);
      setShowDropdown(false);
    }
  };

  if (variant === "button") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Button
          variant="ghost"
          icon={FileSpreadsheet}
          onClick={handleExportExcel}
          disabled={isExporting}
          size="small"
        >
          Export Excel
        </Button>
        <Button
          variant="ghost"
          icon={FileText}
          onClick={handleExportPDF}
          disabled={isExporting}
          size="small"
        >
          Export PDF
        </Button>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="ghost"
        icon={Download}
        size="small"
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={isExporting}
        className="flex items-center gap-2"
      >
        <ChevronDown className="w-4 h-4" />
      </Button>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />

          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-surface dark:bg-surface-dark rounded-md shadow-lg border border-line dark:border-line-dark z-20">
            <div className="py-1">
              <button
                onClick={handleExportExcel}
                disabled={isExporting}
                className="flex items-center w-full px-4 py-2 text-sm text-text-primary dark:text-text-primary-dark hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileSpreadsheet className="w-4 h-4 mr-3 text-green-600" />
                <div className="text-left">
                  <div className="font-medium">Export to Excel</div>
                  <div className="text-xs text-gray-500">Download as .xlsx file</div>
                </div>
              </button>

              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="flex items-center w-full px-4 py-2 text-sm text-text-primary dark:text-text-primary-dark hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText className="w-4 h-4 mr-3 text-red-600" />
                <div className="text-left">
                  <div className="font-medium">Export to PDF</div>
                  <div className="text-xs text-gray-500">Download as .pdf file</div>
                </div>
              </button>
            </div>

            <div className="border-t border-gray-100 px-4 py-2">
              <div className="text-xs text-gray-500">
                📄 Includes all assignments, dates, and status information
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ExportButtons;