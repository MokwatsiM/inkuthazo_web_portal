import { jsPDF } from "jspdf";
import autoTable, { UserOptions } from "jspdf-autotable";
import { format } from "date-fns";
import type { Member } from "../../types";
import type { InvoiceDetails } from "./types";
import logger from "../logger";

// Cache the logo to avoid repeated loading
let logoCache: HTMLImageElement | null = null;
let logoLoadPromise: Promise<HTMLImageElement> | null = null;

const loadLogo = async (): Promise<HTMLImageElement> => {
  if (logoCache) {
    return logoCache;
  }

  if (logoLoadPromise) {
    return logoLoadPromise;
  }

  logoLoadPromise = new Promise((resolve, reject) => {
    const img = new Image();

    const timeout = setTimeout(() => {
      reject(new Error("Logo loading timeout"));
    }, 2000); // 2 second timeout

    img.onload = () => {
      clearTimeout(timeout);
      logoCache = img;
      resolve(img);
    };

    img.onerror = (e) => {
      clearTimeout(timeout);
      logger.error("Error loading logo:", e);
      reject(e);
    };

    img.src = "/logo.png";
  });

  return logoLoadPromise;
};

// Preload logo when module loads
const preloadLogo = () => {
  if (typeof window !== 'undefined') {
    // Only preload in browser environment
    loadLogo().catch(() => {
      // Ignore errors during preload
    });
  }
};

// Start preloading immediately
preloadLogo();

const addLogo = async (doc: jsPDF): Promise<void> => {
  try {
    const img = await loadLogo();

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
    logger.error("Error adding logo to invoice:", error);
    // Continue without logo if it fails to load
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
    ({ month, isLate, isPaid, latePenaltyPaid, monthlyFeeAmount, latePenaltyAmount }) => {
      let description, breakdown, total;

      if (isLate) {
        if (isPaid && !latePenaltyPaid) {
          // Monthly fee was paid but late penalty is still owed
          description = "Late Payment Penalty";
          breakdown = `R ${latePenaltyAmount.toFixed(2)} (Late Fee)`;
          total = `R ${latePenaltyAmount.toFixed(2)}`;
        } else if (!isPaid && !latePenaltyPaid) {
          // Both monthly fee and late penalty are owed
          description = "Monthly Contribution + Late Payment Penalty";
          breakdown = `R ${monthlyFeeAmount.toFixed(2)} + R ${latePenaltyAmount.toFixed(2)} (Late Fee)`;
          total = `R ${(monthlyFeeAmount + latePenaltyAmount).toFixed(2)}`;
        } else if (!isPaid && latePenaltyPaid) {
          // Only monthly fee is owed (rare case with excess payment covering penalty first)
          description = "Monthly Contribution";
          breakdown = `R ${monthlyFeeAmount.toFixed(2)}`;
          total = `R ${monthlyFeeAmount.toFixed(2)}`;
        } else {
          // This shouldn't appear in invoice as amount should be 0
          description = "Outstanding Balance";
          breakdown = `Fully paid`;
          total = `R 0.00`;
        }
      } else {
        // Regular monthly contribution (not late)
        description = "Monthly Contribution";
        breakdown = `R ${monthlyFeeAmount.toFixed(2)}`;
        total = `R ${monthlyFeeAmount.toFixed(2)}`;
      }

      return [
        format(month, "MMMM yyyy"),
        description,
        breakdown,
        total,
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
    "Bank: Standard Bank",
    "Account Name: Inkuthazo Social Club",
    "Account Type: Cheque",
    "Branch Code: 051001",
    "Account#: 1027428057",
    "Branch Code: 051001",
    "Account#: 1027428057",
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
  //     "Account Name: Inkuthazo Social Club",
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
