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
  const tableData = invoice.unpaidMonths.map(month => [
    format(month, 'MMMM yyyy'),
    'Monthly Contribution',
    `R ${invoice.monthlyFee.toFixed(2)}`
  ]);

  autoTable(doc, {
    startY: 100,
    head: [['Month', 'Description', 'Amount']],
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
    'Please make sure payment is not later than the 7th of every month',
    'Bank: First National Bank',
    'Account Type: Cheque',
    'Branch code: 250655',
    'Account: 63050597279',
    'Reference:'+ member.full_name
  ], 20, finalY + 30);
  
  // Footer
  doc.text(
    `Generated on ${format(today, 'dd MMM yyyy HH:mm')}`,
    20,
    doc.internal.pageSize.height - 10
  );

  // Save the PDF
  doc.save(`${member.full_name.toLowerCase().replace(/\s+/g, '-')}-invoice-${format(today, 'yyyy-MM')}.pdf`);
};