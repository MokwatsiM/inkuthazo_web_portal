import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { ReportType, ReportPeriod, ReportData, Contribution, Payout } from '../types';

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

const generateContributionsReport = async (startDate: Date, endDate: Date): Promise<Contribution[]> => {
  const contributionsRef = collection(db, 'contributions');
  const q = query(
    contributionsRef,
    where('date', '>=', Timestamp.fromDate(startDate)),
    where('date', '<=', Timestamp.fromDate(endDate))
  );
  
  const querySnapshot = await getDocs(q);
  const contributions = await Promise.all(
    querySnapshot.docs.map(async doc => {
      const data = doc.data();
      const memberDoc = await getDocs(collection(db, 'members'));
      const member = memberDoc.docs.find(m => m.id === data.member_id);
      
      return {
        id: doc.id,
        ...data,
        members: {
          full_name: member?.data().full_name || 'Unknown Member'
        }
      } as Contribution;
    })
  );

  return contributions;
};

const generatePayoutsReport = async (startDate: Date, endDate: Date): Promise<Payout[]> => {
  const payoutsRef = collection(db, 'payouts');
  const q = query(
    payoutsRef,
    where('date', '>=', Timestamp.fromDate(startDate)),
    where('date', '<=', Timestamp.fromDate(endDate))
  );
  
  const querySnapshot = await getDocs(q);
  const payouts = await Promise.all(
    querySnapshot.docs.map(async doc => {
      const data = doc.data();
      const memberDoc = await getDocs(collection(db, 'members'));
      const member = memberDoc.docs.find(m => m.id === data.member_id);
      
      return {
        id: doc.id,
        ...data,
        members: {
          full_name: member?.data().full_name || 'Unknown Member'
        }
      } as Payout;
    })
  );

  return payouts;
};

const generateSummaryReport = async (startDate: Date, endDate: Date): Promise<ReportData> => {
  const [contributions, payouts] = await Promise.all([
    generateContributionsReport(startDate, endDate),
    generatePayoutsReport(startDate, endDate)
  ]);

  const totalContributions = contributions.reduce((sum, c) => sum + c.amount, 0);
  const totalPayouts = payouts.reduce((sum, p) => sum + p.amount, 0);

  return {
    period: {
      start: format(startDate, 'dd MMM yyyy'),
      end: format(endDate, 'dd MMM yyyy')
    },
    totalContributions,
    totalPayouts,
    balance: totalContributions - totalPayouts,
    contributionsCount: contributions.length,
    payoutsCount: payouts.length,
    contributions,
    payouts
  };
};

const generatePDF = (reportData: ReportData, type: ReportType): void => {
  const doc = new jsPDF();
  const title = `${type.charAt(0).toUpperCase() + type.slice(1)} Report`;
  
  doc.setFontSize(20);
  doc.text(title, 20, 20);
  
  doc.setFontSize(12);
  doc.text(`Period: ${reportData.period.start} - ${reportData.period.end}`, 20, 30);
  
  if (type === 'summary') {
    const summaryData = [
      ['Total Contributions', `R ${reportData.totalContributions.toFixed(2)}`],
      ['Total Payouts', `R ${reportData.totalPayouts.toFixed(2)}`],
      ['Balance', `R ${reportData.balance.toFixed(2)}`],
      ['Number of Contributions', reportData.contributionsCount.toString()],
      ['Number of Payouts', reportData.payoutsCount.toString()]
    ];

    autoTable(doc, {
      startY: 40,
      head: [['Metric', 'Value']],
      body: summaryData
    });
  } else {
    const data = type === 'contributions' ? reportData.contributions : reportData.payouts;
    const headers = type === 'contributions' 
      ? ['Date', 'Member', 'Type', 'Amount']
      : ['Date', 'Member', 'Reason', 'Status', 'Amount'];

    const tableData = data.map(item => {
      if ('type' in item) {
        return [
          format(item.date.toDate(), 'dd/MM/yyyy'),
          item.members?.full_name || '',
          item.type,
          `R ${item.amount.toFixed(2)}`
        ];
      } else {
        return [
          format(item.date.toDate(), 'dd/MM/yyyy'),
          item.members?.full_name || '',
          item.reason,
          item.status,
          `R ${item.amount.toFixed(2)}`
        ];
      }
    });

    autoTable(doc, {
      startY: 40,
      head: [headers],
      body: tableData
    });
  }

  doc.save(`${type}-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

export const generateReport = async (type: ReportType, period: ReportPeriod): Promise<void> => {
  const { startDate, endDate } = getPeriodDates(period);

  let reportData: ReportData;
  switch (type) {
    case 'contributions':
      const contributions = await generateContributionsReport(startDate, endDate);
      reportData = {
        period: {
          start: format(startDate, 'dd MMM yyyy'),
          end: format(endDate, 'dd MMM yyyy')
        },
        totalContributions: contributions.reduce((sum, c) => sum + c.amount, 0),
        totalPayouts: 0,
        balance: 0,
        contributionsCount: contributions.length,
        payoutsCount: 0,
        contributions,
        payouts: []
      };
      break;
    case 'payouts':
      const payouts = await generatePayoutsReport(startDate, endDate);
      reportData = {
        period: {
          start: format(startDate, 'dd MMM yyyy'),
          end: format(endDate, 'dd MMM yyyy')
        },
        totalContributions: 0,
        totalPayouts: payouts.reduce((sum, p) => sum + p.amount, 0),
        balance: 0,
        contributionsCount: 0,
        payoutsCount: payouts.length,
        contributions: [],
        payouts
      };
      break;
    case 'summary':
      reportData = await generateSummaryReport(startDate, endDate);
      break;
  }

  generatePDF(reportData, type);
};