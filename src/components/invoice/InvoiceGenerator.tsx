import React, { useState } from "react";
import { Download, FileText } from "lucide-react";
import Button from "../ui/Button";
import { generateInvoiceDetails } from "../../utils/invoice/calculator";
import { generateInvoicePDF } from "../../utils/invoice/generator";
import type { Contribution } from "../../types/contribution";
import type { Member } from "../../types";
import logger from "../../utils/logger";

interface InvoiceGeneratorProps {
  member: Member;
  contributions: Contribution[];
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const InvoiceGenerator: React.FC<InvoiceGeneratorProps> = ({
  member,
  contributions,
  onSuccess,
  onError,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateInvoice = async () => {
    setIsGenerating(true);

    try {
      // Show loading state immediately
      logger.debug('Generating invoice for:', member.full_name);

      // Calculate invoice details
      const invoiceDetails = await generateInvoiceDetails(
        contributions,
        member.join_date
      );

      // Generate PDF (this might take some time for complex invoices)
      await generateInvoicePDF(member, invoiceDetails);

      // Success feedback
      if (onSuccess) {
        onSuccess();
      }

      logger.debug('Invoice generated successfully');

    } catch (error) {
      logger.error('Error generating invoice:', error);

      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to generate invoice. Please try again.';

      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleGenerateInvoice}
      icon={isGenerating ? undefined : Download}
      loading={isGenerating}
      disabled={isGenerating}
    >
      {isGenerating ? 'Generating Invoice...' : 'Generate Monthly Invoice'}
    </Button>
  );
};

// Enhanced version with more detailed feedback
export const InvoiceGeneratorWithProgress: React.FC<InvoiceGeneratorProps & {
  showProgress?: boolean;
}> = ({
  member,
  contributions,
  onSuccess,
  onError,
  showProgress = false,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<{
    step: string;
    percentage: number;
  } | null>(null);

  const handleGenerateInvoice = async () => {
    setIsGenerating(true);

    try {
      // Step 1: Calculate invoice details
      if (showProgress) {
        setProgress({ step: 'Calculating invoice details...', percentage: 25 });
      }

      const invoiceDetails = await generateInvoiceDetails(
        contributions,
        member.join_date
      );

      // Step 2: Generate PDF
      if (showProgress) {
        setProgress({ step: 'Generating PDF document...', percentage: 75 });
      }

      await generateInvoicePDF(member, invoiceDetails);

      // Step 3: Complete
      if (showProgress) {
        setProgress({ step: 'Download ready!', percentage: 100 });
      }

      if (onSuccess) {
        onSuccess();
      }

    } catch (error) {
      logger.error('Error generating invoice:', error);

      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to generate invoice. Please try again.';

      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsGenerating(false);
      setProgress(null);
    }
  };

  return (
    <div className="relative">
      <Button
        onClick={handleGenerateInvoice}
        icon={isGenerating ? FileText : Download}
        loading={isGenerating}
        disabled={isGenerating}
        size="medium"
        className="min-w-[180px]"
      >
        {isGenerating ? 'Generating...' : 'Generate Monthly Invoice'}
      </Button>

      {showProgress && progress && (
        <div className="absolute top-full left-0 right-0 mt-2 min-w-[180px]">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
            <span>{progress.step}</span>
            <span>{progress.percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceGenerator;
