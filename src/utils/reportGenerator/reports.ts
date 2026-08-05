import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  orderBy,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { formatDate } from "../dateUtils";
import type { ReportType, ReportPeriod } from "../../types/report";

import type { Contribution } from "../../types/contribution";
import type { Payout } from "../../types/payout";
import type { Expense } from "../../types/expense";
import type { Member } from "../../types";
import logger from "../logger";

const addLogo = async (doc: jsPDF): Promise<void> => {
  try {
    const img = new Image();
    img.src = "/logo.png";

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    const pageWidth = doc.internal.pageSize.width;
    const maxWidth = 40;
    const aspectRatio = img.width / img.height;
    const width = maxWidth;
    const height = width / aspectRatio;
    const x = pageWidth - width - 20;
    const y = 3;

    doc.addImage(img, "PNG", x, y, width, height);
  } catch (error) {
    logger.error("Error adding logo to report:", error);
  }
};

const getPeriodDates = (
  period: ReportPeriod
): { startDate: Date; endDate: Date } => {
  const now = new Date();
  let startDate: Date;
  const endDate = endOfMonth(now);

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
    case "all-time":
      startDate = new Date(2023, 0, 1); // Start from January 2023
      break;
    default:
      startDate = startOfMonth(now);
  }

  return { startDate, endDate };
};

const getMemberName = async (memberId: string): Promise<string> => {
  try {
    const memberDoc = await getDoc(doc(db, "members", memberId));
    if (memberDoc.exists()) {
      const memberData = memberDoc.data() as Member;
      return memberData.full_name;
    }
    return "Unknown Member";
  } catch (error) {
    logger.error("Error fetching member name:", error);
    return "Unknown Member";
  }
};

const addHeader = async (
  doc: jsPDF,
  type: ReportType,
  startDate: Date,
  endDate: Date
) => {
  await addLogo(doc);
  doc.setFontSize(20);
  doc.text(`${type.charAt(0).toUpperCase() + type.slice(1)} Report`, 20, 20);
  doc.setFontSize(12);
  doc.text(`Period: ${formatDate(startDate)} - ${formatDate(endDate)}`, 20, 30);
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

/**
 * Build the financial report PDF and return the jsPDF doc plus a suggested
 * filename. The caller decides whether to preview or download it.
 */
export const generateReport = async (
  type: ReportType,
  period: ReportPeriod
): Promise<{ doc: jsPDF; filename: string }> => {
  const doc = new jsPDF();
  let pageNumber = 1;

  try {
    const { startDate, endDate } = getPeriodDates(period);
    await addHeader(doc, type, startDate, endDate);

    // Fetch all data for the period
    const [contributions, payouts, expenses] = await Promise.all([
      // Fetch contributions
      getDocs(
        query(
          collection(db, "contributions"),
          where("date", ">=", Timestamp.fromDate(startDate)),
          where("date", "<=", Timestamp.fromDate(endDate)),
          orderBy("date", "desc")
        )
      ).then(async (snapshot) => {
        const contributionsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Contribution[];

        // Fetch member names for each contribution
        const enrichedContributions = await Promise.all(
          contributionsData.map(async (contribution) => {
            const memberName = await getMemberName(contribution.member_id);
            return {
              ...contribution,
              member_name: memberName,
            };
          })
        );

        return enrichedContributions;
      }),

      // Fetch payouts
      getDocs(
        query(
          collection(db, "payouts"),
          where("date", ">=", Timestamp.fromDate(startDate)),
          where("date", "<=", Timestamp.fromDate(endDate)),
          orderBy("date", "desc")
        )
      ).then(async (snapshot) => {
        const payoutsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Payout[];

        // Fetch member names for each payout
        const enrichedPayouts = await Promise.all(
          payoutsData.map(async (payout) => {
            const memberName = await getMemberName(payout.member_id);
            return {
              ...payout,
              member_name: memberName,
            };
          })
        );

        return enrichedPayouts;
      }),

      // Fetch expenses
      getDocs(
        query(
          collection(db, "expenses"),
          where("date", ">=", Timestamp.fromDate(startDate)),
          where("date", "<=", Timestamp.fromDate(endDate)),
          orderBy("date", "desc")
        )
      ).then(
        (snapshot) =>
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Expense[]
      ),
    ]);

    // Calculate totals
    const totalContributions = contributions.reduce(
      (sum, c) => sum + c.amount,
      0
    );
    const totalPayouts = payouts.reduce((sum, p) => sum + p.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const balance = totalContributions - totalPayouts - totalExpenses;

    // Generate summary section
    const summaryData = [
      ["Total Contributions", `R ${totalContributions.toFixed(2)}`],
      ["Total Payouts", `R ${totalPayouts.toFixed(2)}`],
      ["Total Expenses", `R ${totalExpenses.toFixed(2)}`],
      ["Balance", `R ${balance.toFixed(2)}`],
    ];

    autoTable(doc, {
      startY: 40,
      head: [["Description", "Amount"]],
      body: summaryData,
      theme: "striped",
      headStyles: { fillColor: [79, 70, 229] },
    });

    // Generate detailed section based on report type
    const lastY = (doc as any).lastAutoTable.finalY + 15;

    switch (type) {
      case "summary": {
        // Monthly breakdown
        doc.text("Monthly Breakdown", 20, lastY);

        const monthlyData = Array.from({ length: 12 }, (_, i) => {
          const month = subMonths(endDate, i);
          const monthStart = startOfMonth(month);
          const monthEnd = endOfMonth(month);

          const monthContributions = contributions
            .filter((c) => {
              const date = c.date.toDate();
              return date >= monthStart && date <= monthEnd;
            })
            .reduce((sum, c) => sum + c.amount, 0);

          const monthPayouts = payouts
            .filter((p) => {
              const date = p.date.toDate();
              return date >= monthStart && date <= monthEnd;
            })
            .reduce((sum, p) => sum + p.amount, 0);

          const monthExpenses = expenses
            .filter((e) => {
              const date = e.date.toDate();
              return date >= monthStart && date <= monthEnd;
            })
            .reduce((sum, e) => sum + e.amount, 0);

          const monthBalance =
            monthContributions - monthPayouts - monthExpenses;

          return [
            format(month, "MMMM yyyy"),
            `R ${monthContributions.toFixed(2)}`,
            `R ${monthPayouts.toFixed(2)}`,
            `R ${monthExpenses.toFixed(2)}`,
            `R ${monthBalance.toFixed(2)}`,
          ];
        });

        autoTable(doc, {
          startY: lastY + 10,
          head: [["Month", "Contributions", "Payouts", "Expenses", "Balance"]],
          body: monthlyData,
          theme: "striped",
          headStyles: { fillColor: [79, 70, 229] },
          didDrawPage: () => addFooter(doc, pageNumber++),
        });
        break;
      }

      case "expenses": {
        // Expenses breakdown
        doc.text("Expenses Breakdown", 20, lastY);

        const expensesData = expenses.map((expense) => [
          formatDate(expense.date),
          expense.title,
          expense.type,
          expense.status,
          `R ${expense.amount.toFixed(2)}`,
        ]);

        autoTable(doc, {
          startY: lastY + 10,
          head: [["Date", "Description", "Type", "Status", "Amount"]],
          body: expensesData,
          theme: "striped",
          headStyles: { fillColor: [79, 70, 229] },
          didDrawPage: () => addFooter(doc, pageNumber++),
        });

        // Add expense type summary
        const expensesByType = expenses.reduce((acc, expense) => {
          acc[expense.type] = (acc[expense.type] || 0) + expense.amount;
          return acc;
        }, {} as Record<string, number>);

        const expenseTypeSummary = Object.entries(expensesByType).map(
          ([type, amount]) => [
            type.charAt(0).toUpperCase() + type.slice(1),
            `R ${amount.toFixed(2)}`,
          ]
        );

        const typeY = (doc as any).lastAutoTable.finalY + 15;
        doc.text("Expenses by Type", 20, typeY);

        autoTable(doc, {
          startY: typeY + 10,
          head: [["Type", "Total Amount"]],
          body: expenseTypeSummary,
          theme: "striped",
          headStyles: { fillColor: [79, 70, 229] },
          didDrawPage: () => addFooter(doc, pageNumber++),
        });
        break;
      }

      case "contributions": {
        // Contributions breakdown
        doc.text("Contributions Breakdown", 20, lastY);

        const contributionsData = contributions.map((contribution) => [
          formatDate(contribution.date),
          contribution.member_name,
          contribution.type,
          contribution.status,
          `R ${contribution.amount.toFixed(2)}`,
        ]);

        autoTable(doc, {
          startY: lastY + 10,
          head: [["Date", "Member", "Type", "Status", "Amount"]],
          body: contributionsData,
          theme: "striped",
          headStyles: { fillColor: [79, 70, 229] },
          didDrawPage: () => addFooter(doc, pageNumber++),
        });

        // Add contribution status summary
        const contributionsByStatus = contributions.reduce(
          (acc, contribution) => {
            acc[contribution.status] =
              (acc[contribution.status] || 0) + contribution.amount;
            return acc;
          },
          {} as Record<string, number>
        );

        const statusSummary = Object.entries(contributionsByStatus).map(
          ([status, amount]) => [
            status.charAt(0).toUpperCase() + status.slice(1),
            `R ${amount.toFixed(2)}`,
          ]
        );

        const statusY = (doc as any).lastAutoTable.finalY + 15;
        doc.text("Contributions by Status", 20, statusY);

        autoTable(doc, {
          startY: statusY + 10,
          head: [["Status", "Total Amount"]],
          body: statusSummary,
          theme: "striped",
          headStyles: { fillColor: [79, 70, 229] },
          didDrawPage: () => addFooter(doc, pageNumber++),
        });
        break;
      }

      case "payouts": {
        // Payouts breakdown
        doc.text("Payouts Breakdown", 20, lastY);

        const payoutsData = payouts.map((payout) => [
          formatDate(payout.date),
          payout.member_name,
          payout.reason,
          payout.status,
          `R ${payout.amount.toFixed(2)}`,
        ]);

        autoTable(doc, {
          startY: lastY + 10,
          head: [["Date", "Member", "Type", "Status", "Amount"]],
          body: payoutsData,
          theme: "striped",
          headStyles: { fillColor: [79, 70, 229] },
          didDrawPage: () => addFooter(doc, pageNumber++),
        });

        // Add payout type summary
        const payoutsByType = payouts.reduce((acc, payout) => {
          acc[payout.reason] = (acc[payout.reason] || 0) + payout.amount;
          return acc;
        }, {} as Record<string, number>);

        const payoutTypeSummary = Object.entries(payoutsByType).map(
          ([type, amount]) => [
            type.charAt(0).toUpperCase() + type.slice(1),
            `R ${amount.toFixed(2)}`,
          ]
        );

        const typeY = (doc as any).lastAutoTable.finalY + 15;
        doc.text("Payouts by Type", 20, typeY);

        autoTable(doc, {
          startY: typeY + 10,
          head: [["Type", "Total Amount"]],
          body: payoutTypeSummary,
          theme: "striped",
          headStyles: { fillColor: [79, 70, 229] },
          didDrawPage: () => addFooter(doc, pageNumber++),
        });
        break;
      }
    }

    // Add final footer
    addFooter(doc, pageNumber);

    const filename = `${type}-report-${format(new Date(), "yyyy-MM-dd")}.pdf`;
    return { doc, filename };
  } catch (error) {
    logger.error("Error generating report:", error);
    throw error;
  }
};
