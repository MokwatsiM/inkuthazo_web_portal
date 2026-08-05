import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import Modal from '../ui/Modal';
import { useNotifications } from '../../hooks/useNotifications';
import { loadStatementData } from '../../services/memberStatementService';
import { generateMemberStatement } from '../../utils/reportGenerator/memberStatement';
import { createPdfPreview, type PdfPreview } from '../../utils/pdf/present';
import PdfPreviewModal from '../pdf/PdfPreviewModal';
import {
  StatementPeriod,
  getStatementYears,
  periodLabel,
} from '../../utils/reportGenerator/statementHelpers';
import type { Member } from '../../types';
import type { Contribution } from '../../types/contribution';
import type { Payout } from '../../types/payout';
import logger from '../../utils/logger';

interface StatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member;
  /** Data the calling page already has loaded (skips refetching) */
  preloaded?: { contributions?: Contribution[]; payouts?: Payout[] };
}

/**
 * Period picker + download for the member statement PDF (contributions,
 * payouts, credits). Used on the member profile page and My Contributions.
 */
const StatementModal: React.FC<StatementModalProps> = ({
  isOpen,
  onClose,
  member,
  preloaded,
}) => {
  const { showError } = useNotifications();
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [preview, setPreview] = useState<PdfPreview | null>(null);

  const years = getStatementYears(member.join_date);
  const period: StatementPeriod =
    selectedYear === 'all' ? 'all' : { year: Number(selectedYear) };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const data = await loadStatementData(member, preloaded);
      const { doc, filename } = await generateMemberStatement(data, period);
      // Open the preview; the user downloads from there.
      setPreview(createPdfPreview(doc, filename));
    } catch (error) {
      logger.error('Error generating member statement:', error);
      showError('Failed to generate statement. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const closePreview = () => {
    preview?.revoke();
    setPreview(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Download Statement"
      size="small"
      primaryAction={{
        label: isGenerating ? 'Generating…' : 'Preview PDF',
        onClick: handleGenerate,
        loading: isGenerating,
      }}
      secondaryAction={{ label: 'Cancel', onClick: onClose }}
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
          <FileText className="h-5 w-5 shrink-0 mt-0.5 text-indigo-500" />
          <p>
            The statement includes contributions, payouts and credits for the
            selected period, plus registered dependants.
          </p>
        </div>

        <div>
          <label
            htmlFor="statement-period"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Statement period
          </label>
          <select
            id="statement-period"
            value={selectedYear}
            onChange={(event) => setSelectedYear(event.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">{periodLabel('all')}</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {preview && (
        <PdfPreviewModal
          url={preview.url}
          filename={preview.filename}
          onClose={closePreview}
        />
      )}
    </Modal>
  );
};

export default StatementModal;
