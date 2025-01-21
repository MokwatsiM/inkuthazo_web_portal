// src/utils/invoice/generator.ts
import { jsPDF } from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';
import { format } from 'date-fns';
import type { Member } from '../../types';
import type { InvoiceDetails } from './types';

export const generateInvoicePDF = (member: Member, invoice: InvoiceDetails): void => {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.height;
  let currentY = 10;
  let pageNumber = 1;
  
  const addHeader = () => {
    doc.setFontSize(20);
    doc.text('Monthly Contribution Invoice', 20, currentY);
    currentY += 15;
    
    // Invoice Details
    doc.setFontSize(12);
    doc.text(`Invoice Date: ${format(new Date(), 'dd MMM yyyy')}`, 20, currentY);
    currentY += 10;
    doc.text(`Invoice #: INV-${format(new Date(), 'yyyyMMdd')}-${member.id.slice(0, 6)}`, 20, currentY);
    currentY += 15;
    
    // Member Details
    doc.text('Bill To:', 20, currentY);
    currentY += 10;
    doc.text(member.full_name, 20, currentY);
    currentY += 10;
    doc.text(member.email, 20, currentY);
    currentY += 10;
    doc.text(member.phone, 20, currentY);
    currentY += 15;
  };

  const addFooter = () => {
    doc.setFontSize(10);
    doc.text(
      `Page ${pageNumber}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
    doc.text(
      `Generated on ${format(new Date(), 'dd MMM yyyy HH:mm')}`,
      20,
      doc.internal.pageSize.height - 10
    );
  };

  const addNewPage = () => {
    addFooter();
    doc.addPage();
    pageNumber++;
    currentY = 20;
    // addHeader();
  };

  // Initial header
  addHeader();

  // Unpaid Months Table
  const tableData = invoice.unpaidMonths.map(({ month, amount, isLate }) => [
    format(month, 'MMMM yyyy'),
    'Monthly Contribution',
    isLate ? `R ${invoice.monthlyFee.toFixed(2)} + R ${invoice.latePenalty.toFixed(2)} (Late Fee)` : `R ${amount.toFixed(2)}`,
    `R ${amount.toFixed(2)}`
  ]);

   const tableOptions: UserOptions = {
    startY: 100,
    head: [['Month', 'Description', 'Breakdown', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229] },
    didDrawPage: () => {
      // Add page number to footer
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(10);
      doc.text(`Page ${pageNumber}`, 20, pageHeight - 10);
      pageNumber++;
    },
    margin: { top: 100 } // Ensure space for header on subsequent pages
  };

  autoTable(doc, tableOptions);

  // Get the final Y position after the table
  currentY = (doc as any).lastAutoTable.finalY + 10;

  // Check if we need a new page for the summary
  if (currentY > pageHeight - 100) {
    addNewPage();
  }

  // Total Amount
  doc.text(`Total Amount Due: R ${invoice.totalAmount.toFixed(2)}`, 20, currentY);
  currentY += 20;

  // Check if we need a new page for payment instructions
  if (currentY > pageHeight - 80) {
    addNewPage();
  }

  // Payment Instructions
  doc.text('Payment Instructions:', 20, currentY);
  currentY += 10;
  doc.setFontSize(10);
  
  const instructions = [
   'Please make payment within 7 days',
    'Bank: First National Bank',
    'Account Name: Inkuthazo Burial Club',
    'Account Type: Cheque',
    'Branch code: 250655',
    'Account: 63050597279',
    'Reference:'+ member.full_name,
    'Note: A late payment penalty of R50 is applied for payments after the 7th of each month.'

  ];

  instructions.forEach(line => {
    if (currentY > pageHeight - 30) {
      addNewPage();
    }
    doc.text(line, 20, currentY);
    currentY += 10;
  });

  // Add final footer
  addFooter();

  // Save the PDF
  doc.save(`${member.full_name.toLowerCase().replace(/\s+/g, '-')}-invoice-${format(new Date(), 'yyyy-MM')}.pdf`);
};
