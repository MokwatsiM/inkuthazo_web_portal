import React, { useState } from 'react';
import { Download } from 'lucide-react';
import Button from '../components/ui/Button';
import { generateReport } from '../utils/reportGenerator';
import type { ReportType, ReportPeriod } from '../types/report';

const Reports: React.FC = () => {
  const [reportType, setReportType] = useState<ReportType>('contributions');
  const [period, setPeriod] = useState<ReportPeriod>('monthly');
  const [loading, setLoading] = useState(false);

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      await generateReport(reportType, period);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Financial Reports</h2>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <select
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
            >
              <option value="contributions">Contributions Report</option>
              <option value="payouts">Payouts Report</option>
              <option value="summary">Financial Summary</option>
              <option value="dependants">Dependants Report</option>
              <option value="arrears">Members in Arrears Report</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Period
            </label>
            <select
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
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
        <Button
          icon={Download}
          onClick={handleGenerateReport}
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate Report"}
        </Button>
      </div>
    </div>
  );
};

export default Reports;