import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import type { MemberDetail } from "../types";
import { formatDate } from "./dateUtils";
const addLogo = async (doc: jsPDF): Promise<void> => {
  try {
    // Load logo image
    const img = new Image();
    img.src = "/logo.png";

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
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

export const generateMemberStatement = async (
  member: MemberDetail
): Promise<void> => {
  const doc = new jsPDF();
  await addLogo(doc);
  // Header
  doc.setFontSize(20);
  doc.text("Member Statement", 20, 20);

  // Member Details
  doc.setFontSize(12);
  doc.text(`Name: ${member.full_name}`, 20, 35);
  doc.text(`Email: ${member.email}`, 20, 45);
  doc.text(`Phone: ${member.phone}`, 20, 55);
  doc.text(`Join Date: ${formatDate(member.join_date)}`, 20, 65);
  doc.text(`Status: ${member.status}`, 20, 75);

  // Contributions Summary
  const approvedContributions = member.contributions.filter(
    (c) => c.status === "approved"
  );
  const totalApproved = approvedContributions.reduce(
    (sum, c) => sum + c.amount,
    0
  );
  const totalPending = member.contributions
    .filter((c) => c.status === "pending")
    .reduce((sum, c) => sum + c.amount, 0);
  const totalRejected = member.contributions
    .filter((c) => c.status === "rejected")
    .reduce((sum, c) => sum + c.amount, 0);
  const totalPayouts = member.payouts.reduce((sum, p) => sum + p.amount, 0);
  const balance = totalApproved - totalPayouts;

  doc.text("Financial Summary", 20, 90);
  const summaryData = [
    ["Total Approved Contributions", `R ${totalApproved.toFixed(2)}`],
    ["Pending Contributions", `R ${totalPending.toFixed(2)}`],
    ["Rejected Contributions", `R ${totalRejected.toFixed(2)}`],
    ["Total Payouts", `R ${totalPayouts.toFixed(2)}`],
    ["Current Balance", `R ${balance.toFixed(2)}`],
  ];

  autoTable(doc, {
    startY: 95,
    head: [["Description", "Amount"]],
    body: summaryData,
    theme: "striped",
    headStyles: { fillColor: [79, 70, 229] },
  });

  // Contributions History
  const contributionsY = (doc as any).lastAutoTable.finalY + 15;
  doc.text("Contributions History", 20, contributionsY);

  const contributionsData = member.contributions.map((contribution) => [
    formatDate(contribution.date),
    contribution.type,
    `R ${contribution.amount.toFixed(2)}`,
    contribution.status,
    contribution.review_notes || "-",
  ]);

  autoTable(doc, {
    startY: contributionsY + 5,
    head: [["Date", "Type", "Amount", "Status", "Notes"]],
    body: contributionsData,
    theme: "striped",
    headStyles: { fillColor: [79, 70, 229] },
  });

  // Payouts History
  const payoutsY = (doc as any).lastAutoTable.finalY + 15;
  doc.text("Payouts History", 20, payoutsY);

  const payoutsData = member.payouts.map((payout) => [
    formatDate(payout.date),
    payout.reason,
    payout.status,
    `R ${payout.amount.toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: payoutsY + 5,
    head: [["Date", "Reason", "Status", "Amount"]],
    body: payoutsData,
    theme: "striped",
    headStyles: { fillColor: [79, 70, 229] },
  });

  // Dependants Section
  if (member.dependants && member.dependants.length > 0) {
    const dependantsY = (doc as any).lastAutoTable.finalY + 15;
    doc.text("Registered Dependants", 20, dependantsY);

    const dependantsData = member.dependants.map((dependant) => [
      dependant.full_name,
      dependant.relationship,
      formatDate(dependant.date_of_birth),
      dependant.id_number,
    ]);

    autoTable(doc, {
      startY: dependantsY + 5,
      head: [["Name", "Relationship", "Date of Birth", "ID Number"]],
      body: dependantsData,
      theme: "striped",
      headStyles: { fillColor: [79, 70, 229] },
    });
  }

  // Footer
  doc.setFontSize(10);
  doc.text(
    `Generated on ${format(new Date(), "dd MMM yyyy HH:mm")}`,
    20,
    doc.internal.pageSize.height - 10
  );

  // Save the PDF
  doc.save(
    `${member.full_name.toLowerCase().replace(/\s+/g, "-")}-statement.pdf`
  );
};

export { generateReport } from "./reportGenerator/index";
