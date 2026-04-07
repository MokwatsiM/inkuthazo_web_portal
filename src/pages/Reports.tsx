import React, { useState } from "react";
import { Download, FileText, AlertCircle, BarChart3, Users } from "lucide-react";
import Button from "../components/ui/Button";
import AttendanceReport from "../components/reports/AttendanceReport";
import { generateReport } from "../utils/reportGenerator";
import type { ReportType, ReportPeriod } from "../types/report";
import { useAuth } from "../hooks/useAuth";
import logger from "../utils/logger";

type ReportTab = "financial" | "attendance";

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>("financial");
  const [reportType, setReportType] = useState<ReportType>("contributions");
  const [period, setPeriod] = useState<ReportPeriod>("monthly");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{
    step: string;
    percentage: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { userDetails } = useAuth();

  const getReportSteps = (reportType: ReportType) => {
    const baseSteps = [
      { step: "Fetching data...", percentage: 25 },
      { step: "Processing report...", percentage: 50 },
      { step: "Generating document...", percentage: 75 },
      { step: "Download ready!", percentage: 100 },
    ];

    // Customize steps based on report type
    switch (reportType) {
      case "contributions":
        baseSteps[0].step = "Fetching contribution records...";
        break;
      case "payouts":
        baseSteps[0].step = "Fetching payout records...";
        break;
      case "summary":
        baseSteps[0].step = "Calculating financial summary...";
        baseSteps[1].percentage = 60;
        break;
      case "dependants":
        baseSteps[0].step = "Fetching member and dependant data...";
        break;
    }

    return baseSteps;
  };

  const handleGenerateReport = async () => {
    if (!userDetails?.id) {
      setError("User not authenticated");
      return;
    }

    setLoading(true);
    setError(null);
    const steps = getReportSteps(reportType);

    try {
      // Simulate progress through steps
      for (let i = 0; i < steps.length; i++) {
        setProgress(steps[i]);

        if (i === steps.length - 1) {
          // Final step - actually generate the report
          await generateReport(reportType, period);
        } else {
          // Add delay to show progress (remove this in production if not needed)
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Keep "Download ready!" visible for a moment
      await new Promise(resolve => setTimeout(resolve, 800));

    } catch (error) {
      logger.error("Error generating report:", error);
      const errorMessage = error instanceof Error
        ? error.message
        : `Failed to generate ${reportType} report. Please try again.`;
      setError(errorMessage);
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-text-primary dark:text-text-primary-dark">Reports</h2>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("financial")}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === "financial"
                ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Financial Reports
          </button>
          <button
            onClick={() => setActiveTab("attendance")}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === "attendance"
                ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            <Users className="h-4 w-4" />
            Attendance Report
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "financial" ? (
        <div className="bg-surface-2 dark:bg-surface-2-dark rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-2">
              Report Type
            </label>
            <select
              className="w-full rounded-input border border-line dark:border-line-dark shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark"
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
            >
              <option value="contributions">Contributions Report</option>
              <option value="payouts">Payouts Report</option>
              <option value="summary">Financial Summary</option>
              <option value="dependants">Dependants Report</option>
              {/* comment out members in arrears for now */}
              {/* <option value="arrears">Members in Arrears Report</option> */}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-2">
              Period
            </label>
            <select
              className="w-full rounded-input border border-line dark:border-line-dark shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark"
              value={period}
              onChange={(e) => setPeriod(e.target.value as ReportPeriod)}
              disabled={reportType === "dependants"} // Disable period selection for dependants report
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
              <option value="all-time">All Time</option>
            </select>
          </div>
        </div>
        <div className="space-y-4">
          <Button
            icon={loading ? FileText : Download}
            onClick={handleGenerateReport}
            disabled={loading}
            loading={loading}
            size="medium"
          >
            {loading ? "Generating Report..." : "Generate Report"}
          </Button>

          {/* Progress Indicator */}
          {progress && (
            <div className="w-full max-w-md">
              <div className="flex justify-between text-sm text-text-secondary dark:text-text-secondary-dark mb-1">
                <span>{progress.step}</span>
                <span>{progress.percentage}%</span>
              </div>
              <div className="w-full bg-surface-2 dark:bg-surface-2-dark rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>
      </div>
      ) : (
        <AttendanceReport />
      )}
    </div>
  );
};

export default Reports;
