import { jsPDF } from "jspdf";
import autoTable, { RowInput, UserOptions } from "jspdf-autotable";
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  // isSameMonth,
  // isAfter,
} from "date-fns";
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { formatDate } from "../dateUtils";
import { fetchMemberDetails } from "../../services/memberService";
import { calculateUnpaidMonths } from "../invoice/calculator";
import type { ReportType, ReportPeriod } from "../../types/report";
import type { Contribution } from "../../types/contribution";
import type { Member, Dependant } from "../../types";
import type { Claim } from "../../types/claim";
import { Payout } from "../../types/payout";
// import type { MonthlyFee } from "../../utils/invoice/types";

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
    const maxWidth = 40;
    const aspectRatio = img.width / img.height;
    const width = maxWidth;
    const height = width / aspectRatio;

    // Position logo in top right corner with 20mm margin
    const x = pageWidth - width - 20;
    const y = 15;

    // Add logo to document
    doc.addImage(img, "PNG", x, y, width, height);
  } catch (error) {
    console.error("Error adding logo to report:", error);
  }
};

const getPeriodDates = async (
  period: ReportPeriod
): Promise<{ startDate: Date; endDate: Date }> => {
  const now = new Date();
  let startDate: Date;
  const endDate = endOfMonth(now);

  if (period === "all-time") {
    // Find the earliest contribution
    const contributionsRef = collection(db, "contributions");
    const q = query(contributionsRef, orderBy("date", "asc"), limit(1));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      startDate = snapshot.docs[0].data().date.toDate();
    } else {
      // If no contributions found, default to current month
      startDate = startOfMonth(now);
    }
  } else {
    switch (period) {
      case "monthly":
        startDate = startOfMonth(now);
        break;
      case "quarterly":
        startDate = startOfMonth(subMonths(now, 3));
        break;
      case "yearly":
        startDate = startOfMonth(subMonths(now, 12));
        break;
      default:
        startDate = startOfMonth(now);
    }
  }

  return { startDate, endDate };
};

const addHeader = async (
  doc: jsPDF,
  type: ReportType,
  startDate?: Date,
  endDate?: Date
) => {
  // Add logo first
  await addLogo(doc);

  // Add report title
  doc.setFontSize(20);
  doc.text(`${type.charAt(0).toUpperCase() + type.slice(1)} Report`, 20, 20);

  if (startDate && endDate) {
    doc.setFontSize(12);
    doc.text(
      `Period: ${formatDate(startDate)} - ${formatDate(endDate)}`,
      20,
      30
    );
  }
};

const addFooter = (doc: jsPDF, pageNumber: number) => {
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(10);
  doc.text(
    `Generated on ${format(
      new Date(),
      "dd MMM yyyy HH:mm"
    )} - Page ${pageNumber}`,
    20,
    pageHeight - 10
  );
};

const generateDependantsReport = async (doc: jsPDF): Promise<void> => {
  let pageNumber = 1;

  try {
    // Fetch all members with their dependants
    const membersRef = collection(db, "members");
    const membersSnapshot = await getDocs(membersRef);
    const members = membersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Member[];

    // Fetch all claims
    const claimsRef = collection(db, "claims");
    const claimsSnapshot = await getDocs(claimsRef);
    const claims = claimsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Claim[];

    // Summary section
    const totalMembers = members.length;
    const membersWithDependants = members.filter(
      (m) => m.dependants && m.dependants.length > 0
    ).length;
    const totalDependants = members.reduce(
      (sum, m) => sum + (m.dependants?.length || 0),
      0
    );

    const summaryOptions: UserOptions = {
      startY: 40,
      head: [["Description", "Count"]],
      body: [
        ["Total Members", totalMembers.toString()],
        ["Members with Dependants", membersWithDependants.toString()],
        ["Total Dependants", totalDependants.toString()],
      ],
      theme: "striped",
      headStyles: { fillColor: [79, 70, 229] },
    };
    autoTable(doc, summaryOptions);

    // Detailed dependants table
    const lastY = (doc as any).lastAutoTable.finalY;
    doc.text("Detailed Dependants List", 20, lastY + 15);

    const dependantsData: any[] = [];
    members.forEach((member) => {
      if (member.dependants && member.dependants.length > 0) {
        member.dependants.forEach((dependant: Dependant) => {
          // Find claims for this dependant
          const dependantClaims = claims.filter(
            (claim) =>
              claim.claimant &&
              claim.claimant.id === dependant.id &&
              claim.claimant.type === "dependant"
          );

          const claimInfo =
            dependantClaims.length > 0
              ? dependantClaims.map((c) => `${c.type} (${c.status})`).join(", ")
              : "No claims";

          dependantsData.push([
            member.full_name,
            dependant.full_name,
            dependant.relationship === "other"
              ? `${dependant.relationship} - ${dependant.relationship_description}`
              : dependant.relationship,
            format(dependant.date_of_birth.toDate(), "dd MMM yyyy"),
            claimInfo,
          ]);
        });
      }
    });

    const detailsOptions: UserOptions = {
      startY: lastY + 20,
      head: [
        ["Member", "Dependant", "Relationship", "Date of Birth", "Claims"],
      ],
      body: dependantsData,
      theme: "striped",
      headStyles: { fillColor: [79, 70, 229] },
      didDrawPage: () => {
        addFooter(doc, pageNumber++);
      },
      styles: {
        overflow: "linebreak",
        cellWidth: "wrap",
      },
      columnStyles: {
        4: { cellWidth: "auto" }, // Claims column
      },
    };
    autoTable(doc, detailsOptions);

    // Add final footer
    addFooter(doc, pageNumber);
  } catch (error) {
    console.error("Error generating dependants report:", error);
    throw new Error("Failed to generate dependants report");
  }
};

const generateArrearsReport = async (
  doc: jsPDF,
  currentUserId: string
): Promise<void> => {
  let pageNumber = 1;
  const MONTHLY_FEE = 150;
  const LATE_PAYMENT_PENALTY = 50;

  try {
    // Fetch all active members except the current user
    const membersRef = collection(db, "members");
    const membersQuery = query(
      membersRef,
      where("status", "==", "active"),
      where("role", "==", "member") // Only include regular members
    );
    const membersSnapshot = await getDocs(membersQuery);
    const members = membersSnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((member) => member.id !== currentUserId) as Member[]; // Exclude current user

    // Fetch all contributions
    const contributionsRef = collection(db, "contributions");
    const contributionsSnapshot = await getDocs(contributionsRef);
    const allContributions = contributionsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Contribution[];

    // Calculate arrears for each member
    const membersInArrears = await Promise.all(
      members.map(async (member) => {
        const memberContributions = allContributions.filter(
          (c) => c.member_id === member.id && c.status === "approved"
        );

        const unpaidMonths = calculateUnpaidMonths(
          memberContributions,
          member.join_date.toDate()
        );

        const totalDue = unpaidMonths.reduce(
          (sum, month) => sum + month.amount,
          0
        );

        return {
          member,
          unpaidMonths,
          totalDue,
          monthsOverdue: unpaidMonths.length,
        };
      })
    );

    // Filter out members who are not in arrears and sort by total amount due
    const actualArrearsMembers = membersInArrears
      .filter(({ totalDue }) => totalDue > 0)
      .sort((a, b) => b.totalDue - a.totalDue);

    // Summary section
    const totalMembers = actualArrearsMembers.length;
    const totalAmount = actualArrearsMembers.reduce(
      (sum, { totalDue }) => sum + totalDue,
      0
    );
    const averageAmount = totalAmount / totalMembers || 0;
    const maxAmount = Math.max(...actualArrearsMembers.map((m) => m.totalDue));
    const maxMonthsOverdue = Math.max(
      ...actualArrearsMembers.map((m) => m.monthsOverdue)
    );

    const summaryOptions: UserOptions = {
      startY: 40,
      head: [["Description", "Value"]],
      body: [
        ["Total Members in Arrears", totalMembers.toString()],
        ["Total Amount Outstanding", `R ${totalAmount.toFixed(2)}`],
        ["Average Amount Due", `R ${averageAmount.toFixed(2)}`],
        ["Highest Amount Due", `R ${maxAmount.toFixed(2)}`],
        ["Maximum Months Overdue", maxMonthsOverdue.toString()],
      ],
      theme: "striped",
      headStyles: { fillColor: [79, 70, 229] },
    };
    autoTable(doc, summaryOptions);

    // Detailed arrears table
    const lastY = (doc as any).lastAutoTable.finalY;
    doc.text("Members in Arrears (Sorted by Amount Due)", 20, lastY + 15);

    const detailsData = actualArrearsMembers.map(
      ({ member, unpaidMonths, totalDue, monthsOverdue }) => {
        const monthsList = unpaidMonths
          .sort((a, b) => a.month.getTime() - b.month.getTime())
          .map((month) => ({
            month: format(month.month, "MMM yyyy"),
            amount: month.amount,
            isLate: month.isLate,
          }));

        const monthsDetail = monthsList
          .map(
            (m) =>
              `${m.month} (R${m.amount.toFixed(2)}${
                m.isLate ? " incl. late fee" : ""
              })`
          )
          .join("\n");

        return [
          member.full_name,
          member.email,
          member.phone,
          monthsOverdue.toString(),
          monthsDetail,
          `R ${totalDue.toFixed(2)}`,
        ];
      }
    );

    const detailsOptions: UserOptions = {
      startY: lastY + 20,
      head: [
        [
          "Member Name",
          "Email",
          "Phone",
          "Months Overdue",
          "Outstanding Months (Amount)",
          "Total Due",
        ],
      ],
      body: detailsData,
      theme: "striped",
      headStyles: { fillColor: [79, 70, 229] },
      didDrawPage: () => {
        addFooter(doc, pageNumber++);
      },
      styles: {
        overflow: "linebreak",
        cellWidth: "wrap",
        cellPadding: 4,
        fontSize: 10,
      },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { cellWidth: "auto" },
        2: { cellWidth: "auto" },
        3: { cellWidth: 30 },
        4: { cellWidth: "auto" },
        5: { cellWidth: 50 },
      },
    };
    autoTable(doc, detailsOptions);

    // Add notes section
    const notesY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(10);
    doc.text("Notes:", 20, notesY);
    doc.text(
      [
        "1. Monthly contribution amount: R" + MONTHLY_FEE,
        "2. Late payment penalty: R" + LATE_PAYMENT_PENALTY,
        "3. Late fees apply to payments made after the 7th of each month",
        "4. Current month is included if payment is overdue",
      ],
      20,
      notesY + 10
    );

    // Add final footer
    addFooter(doc, pageNumber);
  } catch (error) {
    console.error("Error generating arrears report:", error);
    throw new Error("Failed to generate arrears report");
  }
};

// Update the generateReport function to pass the current user ID
export const generateReport = async (
  type: ReportType,
  period: ReportPeriod,
  currentUserId: string
): Promise<void> => {
  const doc = new jsPDF();
  let pageNumber = 1;

  try {
    if (type === "dependants") {
      await addHeader(doc, type);
      await generateDependantsReport(doc);
      doc.save(`dependants-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
      return;
    }

    if (type === "arrears") {
      await addHeader(doc, type);
      await generateArrearsReport(doc, currentUserId);
      doc.save(`arrears-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
      return;
    }

    const { startDate, endDate } = await getPeriodDates(period);
    await addHeader(doc, type, startDate, endDate);

    // Get data based on report type
    const contributionsRef = collection(db, "contributions");
    const contributionsQuery = query(
      contributionsRef,
      where("date", ">=", Timestamp.fromDate(startDate)),
      where("date", "<=", Timestamp.fromDate(endDate)),
      orderBy("date", "desc")
    );

    const contributionsSnapshot = await getDocs(contributionsQuery);
    const contributions = await Promise.all(
      contributionsSnapshot.docs.map(async (doc) => {
        const data = doc.data();
        const memberDetails = await fetchMemberDetails(data.member_id);

        return {
          id: doc.id,
          ...data,
          members: {
            full_name: memberDetails?.full_name || "Unknown Member",
          },
        } as Contribution;
      })
    );

    // Calculate totals
    const totalAmount = contributions.reduce((sum, c) => sum + c.amount, 0);
    const approvedAmount = contributions
      .filter((c) => c.status === "approved")
      .reduce((sum, c) => sum + c.amount, 0);

    // Generate report based on type
    switch (type) {
      case "contributions": {
        // Summary section
        const summaryOptions: UserOptions = {
          startY: 40,
          head: [["Description", "Amount"]],
          body: [
            ["Total Contributions", `R ${totalAmount.toFixed(2)}`],
            ["Approved Contributions", `R ${approvedAmount.toFixed(2)}`],
            ["Number of Contributions", contributions.length.toString()],
          ],
          theme: "striped",
          headStyles: { fillColor: [79, 70, 229] },
        };
        autoTable(doc, summaryOptions);

        // Detailed contributions table
        const lastY = (doc as any).lastAutoTable.finalY;
        doc.text("Detailed Contributions", 20, lastY + 15);

        const detailsOptions: UserOptions = {
          startY: lastY + 20,
          head: [["Date", "Member", "Type", "Status", "Amount"]],
          body: contributions.map((contribution) => [
            formatDate(contribution.date),
            contribution.members?.full_name || "Unknown",
            contribution.type,
            contribution.status,
            `R ${contribution.amount.toFixed(2)}`,
          ]),
          theme: "striped",
          headStyles: { fillColor: [79, 70, 229] },
          didDrawPage: () => {
            addFooter(doc, pageNumber++);
          },
        };
        autoTable(doc, detailsOptions);
        break;
      }
      case "payouts": {
        const payoutsRef = collection(db, "payouts");
        const payoutsQuery = query(
          payoutsRef,
          where("date", ">=", Timestamp.fromDate(startDate)),
          where("date", "<=", Timestamp.fromDate(endDate))
        );

        const payoutsSnapshot = await getDocs(payoutsQuery);
        const payouts = await Promise.all(
          payoutsSnapshot.docs.map(async (doc) => {
            const data = doc.data();
            const memberDetails = await fetchMemberDetails(data.member_id);

            return {
              id: doc.id,
              ...data,
              members: {
                full_name: memberDetails?.full_name || "Unknown Member",
              },
            } as Payout;
          })
        );

        const totalAmount = payouts.reduce((sum, p) => sum + p.amount, 0);
        const paidAmount = payouts
          .filter((p) => p.status === "paid")
          .reduce((sum, p) => sum + p.amount, 0);

        // Summary section
        doc.setFontSize(14);
        doc.text("Summary", 20, 45);
        autoTable(doc, {
          startY: 50,
          head: [["Description", "Amount"]],
          body: [
            ["Total Payouts", `R ${totalAmount.toFixed(2)}`],
            ["Paid Payouts", `R ${paidAmount.toFixed(2)}`],
            ["Number of Payouts", payouts.length.toString()],
          ],
          theme: "striped",
          headStyles: { fillColor: [79, 70, 229] },
        });

        // Detailed payouts table
        doc.setFontSize(14);
        doc.text(
          "Detailed Payouts",
          20,
          (doc as any).lastAutoTable.finalY + 20
        );

        const payoutsData = payouts.map((payout) => [
          formatDate(payout.date),
          payout.members?.full_name,
          payout.reason,
          payout.status,
          `R ${payout.amount.toFixed(2)}`,
        ]);

        autoTable(doc, {
          startY: (doc as any).lastAutoTable.finalY + 25,
          head: [["Date", "Member", "Reason", "Status", "Amount"]],
          body: payoutsData as RowInput[],
          theme: "striped",
          headStyles: { fillColor: [79, 70, 229] },
          didDrawPage: () => {
            addFooter(doc, pageNumber++);
          },
        });
        break;
      }

      case "summary": {
        // Fetch both contributions and payouts
        const [contributionsSnapshot, payoutsSnapshot] = await Promise.all([
          getDocs(
            query(
              collection(db, "contributions"),
              where("date", ">=", Timestamp.fromDate(startDate)),
              where("date", "<=", Timestamp.fromDate(endDate))
            )
          ),
          getDocs(
            query(
              collection(db, "payouts"),
              where("date", ">=", Timestamp.fromDate(startDate)),
              where("date", "<=", Timestamp.fromDate(endDate))
            )
          ),
        ]);

        const contributions = contributionsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Contribution[];

        const payouts = payoutsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Payout[];

        const totalContributions = contributions.reduce(
          (sum, c) => sum + c.amount,
          0
        );
        const approvedContributions = contributions
          .filter((c) => c.status === "approved")
          .reduce((sum, c) => sum + c.amount, 0);
        const totalPayouts = payouts.reduce((sum, p) => sum + p.amount, 0);
        const paidPayouts = payouts
          .filter((p) => p.status === "paid")
          .reduce((sum, p) => sum + p.amount, 0);
        const balance = approvedContributions - paidPayouts;

        // Financial Summary
        doc.setFontSize(14);
        doc.text("Financial Summary", 20, 45);
        autoTable(doc, {
          startY: 50,
          head: [["Description", "Amount"]],
          body: [
            ["Total Contributions", `R ${totalContributions.toFixed(2)}`],
            ["Approved Contributions", `R ${approvedContributions.toFixed(2)}`],
            ["Total Payouts", `R ${totalPayouts.toFixed(2)}`],
            ["Paid Payouts", `R ${paidPayouts.toFixed(2)}`],
            ["Current Balance", `R ${balance.toFixed(2)}`],
          ],
          theme: "striped",
          headStyles: { fillColor: [79, 70, 229] },
        });

        // Status Summary
        doc.setFontSize(14);
        doc.text("Status Summary", 20, (doc as any).lastAutoTable.finalY + 20);
        autoTable(doc, {
          startY: (doc as any).lastAutoTable.finalY + 25,
          head: [["Category", "Count"]],
          body: [
            ["Total Contributions", contributions.length],
            [
              "Pending Contributions",
              contributions.filter((c) => c.status === "pending").length,
            ],
            [
              "Approved Contributions",
              contributions.filter((c) => c.status === "approved").length,
            ],
            [
              "Rejected Contributions",
              contributions.filter((c) => c.status === "rejected").length,
            ],
            ["Total Payouts", payouts.length],
            [
              "Pending Payouts",
              payouts.filter((p) => p.status === "pending").length,
            ],
            [
              "Approved Payouts",
              payouts.filter((p) => p.status === "approved").length,
            ],
            ["Paid Payouts", payouts.filter((p) => p.status === "paid").length],
          ],
          theme: "striped",
          headStyles: { fillColor: [79, 70, 229] },
          didDrawPage: () => {
            addFooter(doc, pageNumber++);
          },
        });
        break;
      }
    }

    // Add final footer
    addFooter(doc, pageNumber);

    // Save the PDF
    doc.save(`${type}-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  } catch (error) {
    console.error("Error generating report:", error);
    throw error;
  }
};
