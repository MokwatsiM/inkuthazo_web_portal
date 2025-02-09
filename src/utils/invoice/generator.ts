import { jsPDF } from "jspdf";
import autoTable, { UserOptions } from "jspdf-autotable";
import { format } from "date-fns";
import type { Member } from "../../types";
import type { InvoiceDetails } from "./types";

const addLogo = async (doc: jsPDF): Promise<void> => {
  try {
    // Load logo image
    const img = new Image();
    img.src = "/logo.png"; // Updated path to use public directory

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = (e) => {
        console.error("Error loading logo:", e);
        reject(e);
      };
    });

    // Get page dimensions
    const pageWidth = doc.internal.pageSize.width;

    // Calculate logo dimensions (max width 40mm, maintain aspect ratio)
    const maxWidth = 32;
    const aspectRatio = img.width / img.height;
    const width = maxWidth;
    const height = width / aspectRatio;

    // Position logo in top right corner with 20mm margin
    const x = pageWidth - width - 10;
    const y = 7;

    // Add logo to document
    doc.addImage(img, "PNG", x, y, width, height);
  } catch (error) {
    console.error("Error adding logo to invoice:", error);
  }
};

export const generateInvoicePDF = async (
  member: Member,
  invoice: InvoiceDetails
): Promise<void> => {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.height;
  let currentY = 10;
  const today = new Date();
  let pageNumber = 1;

  // Add logo
  await addLogo(doc);

  const addHeader = () => {
    doc.setFontSize(20);
    doc.text("Monthly Contribution Invoice", 20, currentY);
    currentY += 15;

    // Invoice Details
    doc.setFontSize(12);
    doc.text(`Invoice Date: ${format(today, "dd MMM yyyy")}`, 20, currentY);
    currentY += 10;
    doc.text(
      `Invoice #: INV-${format(today, "yyyyMMdd")}-${member.id.slice(0, 6)}`,
      20,
      currentY
    );
    currentY += 15;
    // Member Details
    doc.text("Bill To:", 20, currentY);
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
      { align: "center" }
    );
    doc.text(
      `Generated on ${format(new Date(), "dd MMM yyyy HH:mm")}`,
      20,
      doc.internal.pageSize.height - 5
    );
  };

  // Header

  const addNewPage = () => {
    // addFooter();
    doc.addPage();
    pageNumber++;
    currentY = 20;
  };

  addHeader();

  // Unpaid Months Table
  const tableData = invoice.unpaidMonths.map(
    ({ month, amount, isLate, isPaid, latePenaltyPaid }) => {
      let description, breakdown;

      if (isLate) {
        if (isPaid && !latePenaltyPaid) {
          // Only late fee is due
          description = "Late Payment Penalty";
          breakdown = `R ${invoice.latePenalty.toFixed(2)} (Late Fee)`;
        } else if (!isPaid ) {
          // Both monthly fee and late fee are due
          description = "Monthly Contribution + Late Payment Penalty";
          breakdown = `R ${invoice.monthlyFee.toFixed(
            2
          )} + R ${invoice.latePenalty.toFixed(2)} (Late Fee)`;
        }
      } else {
        // Regular monthly contribution
        description = "Monthly Contribution";
        breakdown = `R ${invoice.monthlyFee.toFixed(2)}`;
      }

      return [
        format(month, "MMMM yyyy"),
        description,
        breakdown,
        `R ${amount.toFixed(2)}`,
      ];
    }
  );

  const tableOptions: UserOptions = {
    startY: 100,
    head: [["Month", "Description", "Breakdown", "Total"]] as string[][],
    body: tableData as string[][],
    theme: "striped",
    headStyles: { fillColor: [79, 70, 229] },
    didDrawPage: () => {
      // Add page number to footer
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(10);
      doc.text(`Page ${pageNumber}`, 20, pageHeight - 10);
      pageNumber++;
    },
    margin: { top: 100 }, // Ensure space for header on subsequent pages
  };

  autoTable(doc, tableOptions);
  currentY = (doc as any).lastAutoTable.finalY + 10;

  // Check if we need a new page for the summary
  if (currentY > pageHeight - 100) {
    addNewPage();
  }

  // Total Amount
  doc.text(
    `Total Amount Due: R ${invoice.totalAmount.toFixed(2)}`,
    20,
    currentY
  );
  currentY += 10;
  // Check if we need a new page for payment instructions
  if (currentY > pageHeight - 80) {
    addNewPage();
  }

  // Payment Instructions
  doc.text("Payment Instructions:", 20, currentY);
  currentY += 5;
  doc.setFontSize(10);
  const instructions = [
    "Please make payment within 7 days",
    "Bank: First National Bank",
    "Account Name: Inkuthazo Burial Club",
    "Account Type: Cheque",
    "Branch Code: 250655",
    "Account#: 63050597279",
    "Reference: " + member.full_name,
    "",
    "Note: Monthly contributions must be paid by the 7th of each month.",
    "A late payment penalty of R50 applies to payments made after the 7th.",
    "Payments made between the 1st and 7th of the month will not incur late fees.",
  ];
  instructions.forEach((line) => {
    if (currentY > pageHeight - 30) {
      addNewPage();
    }
    doc.text(line, 20, currentY);
    currentY += 5;
  });
  addFooter();
  // doc.text(
  //   [
  //     "Please make payment within 7 days",
  //     "Bank: First National Bank",
  //     "Account Name: Inkuthazo Burial Club",
  //     "Account Type: Cheque",
  //     "Branch Code: 250655",
  //     "Account Number: 63050597279",
  //     "Reference: "+ member.full_name,
  //     "",
  //     "Note: Monthly contributions must be paid by the 7th of each month.",
  //     "A late payment penalty of R50 applies to payments made after the 7th.",
  //     "Payments made between the 1st and 7th of the month will not incur late fees.",
  //   ],
  //   20,
  //   finalY + 30
  // );

  // // Footer
  // doc.text(
  //   `Generated on ${format(today, "dd MMM yyyy HH:mm")}`,
  //   20,
  //   doc.internal.pageSize.height - 10
  // );

  // Save the PDF
  doc.save(
    `${member.full_name.toLowerCase().replace(/\s+/g, "-")}-invoice-${format(
      today,
      "yyyy-MM"
    )}.pdf`
  );
};
