import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { Member } from '../../types';
import type { InvoiceDetails } from './types';

export const generateInvoicePDF = (member: Member, invoice: InvoiceDetails): void => {
  const doc = new jsPDF();
  const today = new Date();
  
  // Header
  doc.setFontSize(20);
  doc.text('Monthly Contribution Invoice', 20, 20);
  
  // Invoice Details
  doc.setFontSize(12);
  doc.text(`Invoice Date: ${format(today, 'dd MMM yyyy')}`, 20, 35);
  doc.text(`Invoice #: INV-${format(today, 'yyyyMMdd')}-${member.id.slice(0, 6)}`, 20, 45);
  
  // Member Details
  doc.text('Bill To:', 20, 60);
  doc.text(member.full_name, 20, 70);
  doc.text(member.email, 20, 80);
  doc.text(member.phone, 20, 90);
  
  // Unpaid Months Table
  const tableData = invoice.unpaidMonths.map(({ month, amount, isLate }) => [
    format(month, 'MMMM yyyy'),
    'Monthly Contribution',
    isLate ? `R ${invoice.monthlyFee.toFixed(2)} + R ${invoice.latePenalty.toFixed(2)} (Late Fee)` : `R ${amount.toFixed(2)}`,
    `R ${amount.toFixed(2)}`
  ]);

  autoTable(doc, {
    startY: 100,
    head: [['Month', 'Description', 'Breakdown', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229] }
  });

  // Total Amount
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.text(`Total Amount Due: R ${invoice.totalAmount.toFixed(2)}`, 20, finalY);
  
  // Payment Instructions
  doc.text('Payment Instructions:', 20, finalY + 20);
  doc.setFontSize(10);
  doc.text([
    'Please make payment within 7 days',
    'Bank: First National Bank',
    'Account Name: Inkuthazo Burial Club',
    'Account Type: Cheque',
    'Branch code: 250655',
    'Account: 63050597279',
    'Reference:'+ member.full_name,
    '',
    'Note: A late payment penalty of R50 is applied for payments after the 7th of each month.'
  ], 20, finalY + 30);
  
  // Footer
  doc.text(
    `Generated on ${format(today, 'dd MMM yyyy HH:mm')}`,
    20,
    doc.internal.pageSize.height - 10
  );

  // Save the PDF
  doc.save(`${member.full_name.toLowerCase().replace(/\s+/g, '-')}-invoice-${format(today, 'yyyy-MM-dd HH:mm')}.pdf`);
};