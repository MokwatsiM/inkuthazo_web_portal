import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import type { ContributionAnalytics, PayoutAnalytics, MemberAnalytics, FinancialMetrics } from '../types/analytics';
import type { Member, Contribution, Payout } from '../types';

export const getContributionAnalytics = async (startDate: Date, endDate: Date): Promise<ContributionAnalytics> => {
  const contributionsRef = collection(db, 'contributions');
  const q = query(
    contributionsRef,
    where('date', '>=', Timestamp.fromDate(startDate)),
    where('date', '<=', Timestamp.fromDate(endDate))
  );

  const snapshot = await getDocs(q);
  const contributions = snapshot.docs.map(doc => ({ 
    id: doc.id, 
    ...doc.data() 
  })) as Contribution[];

  const totalAmount = contributions.reduce((sum, c) => sum + c.amount, 0);
  const averageAmount = totalAmount / (contributions.length || 1);

  const contributionsByType = Object.values(
    contributions.reduce((acc, curr) => {
      if (!acc[curr.type]) {
        acc[curr.type] = { type: curr.type, amount: 0, count: 0 };
      }
      acc[curr.type].amount += curr.amount;
      acc[curr.type].count += 1;
      return acc;
    }, {} as Record<string, { type: string; amount: number; count: number }>)
  );

  const months = eachMonthOfInterval({ start: startDate, end: endDate });
  const monthlyTrends = months.map(month => {
    const monthContributions = contributions.filter(c => {
      const contributionDate = c.date.toDate();
      return (
        contributionDate >= startOfMonth(month) &&
        contributionDate <= endOfMonth(month)
      );
    });

    return {
      month: format(month, 'MMM yyyy'),
      amount: monthContributions.reduce((sum, c) => sum + c.amount, 0),
      count: monthContributions.length
    };
  });

  return {
    totalAmount,
    averageAmount,
    contributionsByType,
    monthlyTrends
  };
};

export const getPayoutAnalytics = async (startDate: Date, endDate: Date): Promise<PayoutAnalytics> => {
  const payoutsRef = collection(db, 'payouts');
  const q = query(
    payoutsRef,
    where('date', '>=', Timestamp.fromDate(startDate)),
    where('date', '<=', Timestamp.fromDate(endDate))
  );

  const snapshot = await getDocs(q);
  const payouts = snapshot.docs.map(doc => ({ 
    id: doc.id, 
    ...doc.data() 
  })) as Payout[];

  const totalAmount = payouts.reduce((sum, p) => sum + p.amount, 0);
  const averageAmount = totalAmount / (payouts.length || 1);

  const payoutsByStatus = Object.values(
    payouts.reduce((acc, curr) => {
      if (!acc[curr.status]) {
        acc[curr.status] = { status: curr.status, amount: 0, count: 0 };
      }
      acc[curr.status].amount += curr.amount;
      acc[curr.status].count += 1;
      return acc;
    }, {} as Record<string, { status: string; amount: number; count: number }>)
  );

  const months = eachMonthOfInterval({ start: startDate, end: endDate });
  const monthlyTrends = months.map(month => {
    const monthPayouts = payouts.filter(p => {
      const payoutDate = p.date.toDate();
      return (
        payoutDate >= startOfMonth(month) &&
        payoutDate <= endOfMonth(month)
      );
    });

    return {
      month: format(month, 'MMM yyyy'),
      amount: monthPayouts.reduce((sum, p) => sum + p.amount, 0),
      count: monthPayouts.length
    };
  });

  return {
    totalAmount,
    averageAmount,
    payoutsByStatus,
    monthlyTrends
  };
};

export const getMemberAnalytics = async (): Promise<MemberAnalytics> => {
  const membersRef = collection(db, 'members');
  const snapshot = await getDocs(membersRef);
  const members = snapshot.docs.map(doc => ({ 
    id: doc.id, 
    ...doc.data() 
  })) as Member[];

  const totalMembers = members.length;
  const activeMembers = members.filter(m => m.status === 'active').length;

  const membersByStatus = Object.values(
    members.reduce((acc, curr) => {
      if (!acc[curr.status]) {
        acc[curr.status] = { status: curr.status, count: 0 };
      }
      acc[curr.status].count += 1;
      return acc;
    }, {} as Record<string, { status: string; count: number }>)
  );

  const startDate = subMonths(new Date(), 12);
  const months = eachMonthOfInterval({ start: startDate, end: new Date() });
  const memberGrowth = months.map(month => {
    const newMembers = members.filter(m => {
      const joinDate = m.join_date.toDate();
      return (
        joinDate >= startOfMonth(month) &&
        joinDate <= endOfMonth(month)
      );
    }).length;

    const totalToDate = members.filter(m => 
      m.join_date.toDate() <= endOfMonth(month)
    ).length;

    return {
      month: format(month, 'MMM yyyy'),
      newMembers,
      totalMembers: totalToDate
    };
  });

  return {
    totalMembers,
    activeMembers,
    membersByStatus,
    memberGrowth
  };
};

export const getFinancialMetrics = async (startDate: Date, endDate: Date): Promise<FinancialMetrics> => {
  const [contributionAnalytics, payoutAnalytics] = await Promise.all([
    getContributionAnalytics(startDate, endDate),
    getPayoutAnalytics(startDate, endDate)
  ]);

  const months = eachMonthOfInterval({ start: startDate, end: endDate });
  const monthlyMetrics = months.map(month => {
    const monthStr = format(month, 'MMM yyyy');
    const contributions = contributionAnalytics.monthlyTrends.find(t => t.month === monthStr)?.amount || 0;
    const payouts = payoutAnalytics.monthlyTrends.find(t => t.month === monthStr)?.amount || 0;

    return {
      month: monthStr,
      contributions,
      payouts,
      balance: contributions - payouts
    };
  });

  return {
    totalContributions: contributionAnalytics.totalAmount,
    totalPayouts: payoutAnalytics.totalAmount,
    balance: contributionAnalytics.totalAmount - payoutAnalytics.totalAmount,
    monthlyMetrics
  };
};