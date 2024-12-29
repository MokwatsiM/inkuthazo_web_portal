import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { formatDate } from '../dateUtils';
import { fetchMemberDetails } from '../../services/memberService';
import type { ReportType, ReportPeriod } from '../../types/report';
import type { Contribution } from '../../types/contribution';

const getPeriodDates = (period: ReportPeriod): { startDate: Date; endDate: Date } => {
  const now = new Date();
  let startDate: Date;
  const endDate = endOfMonth(now);

  switch (period) {
    case 'monthly':
      startDate = startOfMonth(now);
      break;
    case 'quarterly':
      startDate = startOfMonth(subMonths(now, 3));
      break;
    case 'yearly':
      startDate = startOfMonth(subMonths(now, 12));
      break;
    default:
      startDate = startOfMonth(now);
  }

  return { startDate, endDate };
};

export const generateReport = async (type: ReportType, period: ReportPeriod): Promise<void> => {
  const { startDate, endDate } = getPeriodDates(period);
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.text(`${type.charAt(0).toUpperCase() + type.slice(1)} Report`, 20, 20);

  // Period
  doc.setFontSize(12);
  doc.text(`Period: ${formatDate(startDate)} - ${formatDate(endDate)}`, 20, 30);

  // Get data based on report type
  const contributionsRef = collection(db, 'contributions');
  const contributionsQuery = query(
    contributionsRef,
    where('date', '>=', Timestamp.fromDate(startDate)),
    where('date', '<=', Timestamp.fromDate(endDate))
  );

  const contributionsSnapshot = await getDocs(contributionsQuery);
  const contributions = await Promise.all(
    contributionsSnapshot.docs.map(async doc => {
      const data = doc.data();
      const memberDetails = await fetchMemberDetails(data.member_id);
      
      return {
        id: doc.id,
        ...data,
        members: {
          full_name: memberDetails?.full_name || 'Unknown Member'
        }
      } as Contribution;
    })
  );

  // Generate report based on type
  switch (type) {
    case 'contributions':
      const contributionsData = contributions.map(contribution => [
        formatDate(contribution.date),
        contribution.members?.full_name || 'Unknown',
        contribution.type,
        contribution.status,
        `R ${contribution.amount.toFixed(2)}`
      ]);

      autoTable(doc, {
        startY: 40,
        head: [['Date', 'Member', 'Type', 'Status', 'Amount']],
        body: contributionsData,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] }
      });
      break;

    // Add other report types here
  }

  // Footer
  doc.setFontSize(10);
  doc.text(
    `Generated on ${format(new Date(), 'dd MMM yyyy HH:mm')}`,
    20,
    doc.internal.pageSize.height - 10
  );

  // Save the PDF
  doc.save(`${type}-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};