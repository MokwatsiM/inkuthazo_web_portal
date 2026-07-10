/**
 * Shared PDF layout helpers (header, footer, sections, metrics)
 */
import jsPDF from 'jspdf';
import { format } from 'date-fns';

// ==================== PDF GENERATION HELPERS ====================

export const addPdfHeader = (doc: jsPDF, title: string, subtitle?: string) => {
  doc.setFontSize(20);
  doc.setTextColor(30, 58, 138); // Blue-900
  doc.text(title, 14, 20);

  if (subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128); // Gray-500
    doc.text(subtitle, 14, 27);
  }

  // Add horizontal line
  doc.setDrawColor(229, 231, 235); // Gray-200
  doc.setLineWidth(0.5);
  doc.line(14, 32, 196, 32);
};

export const addPdfFooter = (doc: jsPDF, pageNumber: number) => {
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175); // Gray-400
  doc.text(
    `Generated on ${format(new Date(), 'dd MMM yyyy HH:mm')}`,
    14,
    pageHeight - 10
  );
  doc.text(`Page ${pageNumber}`, 196, pageHeight - 10, { align: 'right' });
};

export const addPdfSection = (doc: jsPDF, title: string, yPos: number): number => {
  doc.setFontSize(14);
  doc.setTextColor(17, 24, 39); // Gray-900
  doc.text(title, 14, yPos);
  return yPos + 7;
};

export const addPdfMetric = (
  doc: jsPDF,
  label: string,
  value: string,
  xPos: number,
  yPos: number
): void => {
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128); // Gray-500
  doc.text(label, xPos, yPos);

  doc.setFontSize(12);
  doc.setTextColor(17, 24, 39); // Gray-900
  doc.text(value, xPos, yPos + 5);
};


// jspdf-autotable attaches its state to the document at runtime
type AutoTableDoc = jsPDF & { lastAutoTable: { finalY: number } };

/** Y position just below the most recently rendered autoTable */
export const lastTableY = (doc: jsPDF): number =>
  (doc as AutoTableDoc).lastAutoTable.finalY;
