import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
  getCountFromServer,
  getAggregateFromServer,
  count,
  sum,
} from "firebase/firestore";
import { useQuery } from "@tanstack/react-query";
import { db } from "../config/firebase";
import { batchFetchMembers } from "../services/memberService";
import { useAuth } from "./useAuth";
import type { Contribution } from "../types/contribution";
import type { Member } from "../types";

export interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  pendingMembers: number;
  totalContributions: number;
  approvedContributions: number;
  pendingContributions: number;
  rejectedContributions: number;
  monthlyContributions: number;
  totalPayouts: number;
  thisMonthContributions: number;
  lastMonthContributions: number;
  contributionGrowth: number;
  memberGrowth: number;
}

export interface ContributionsByType {
  name: string;
  value: number;
}

export interface MonthlyData {
  month: string;
  contributions: number;
  members: number;
}

export interface DashboardActivity {
  id: string;
  type: "contribution";
  title: string;
  description: string;
  timestamp: Date;
  status: Contribution["status"];
  amount: number;
  user?: string;
}

export interface DashboardEvent {
  id: string;
  title: string;
  description?: string;
  date: Date;
  type: "meeting" | "reminder";
  venue?: string;
  attendees?: number;
}

interface DashboardData {
  stats: DashboardStats;
  contributionsByType: ContributionsByType[];
  monthlyData: MonthlyData[];
  recentActivities: DashboardActivity[];
  upcomingEvents: DashboardEvent[];
}

const EMPTY_STATS: DashboardStats = {
  totalMembers: 0,
  activeMembers: 0,
  pendingMembers: 0,
  totalContributions: 0,
  approvedContributions: 0,
  pendingContributions: 0,
  rejectedContributions: 0,
  monthlyContributions: 0,
  totalPayouts: 0,
  thisMonthContributions: 0,
  lastMonthContributions: 0,
  contributionGrowth: 0,
  memberGrowth: 0,
};

const CONTRIBUTION_TYPES: Contribution["type"][] = [
  "monthly",
  "registration",
  "credit_payment",
  "infringement_penalty",
  "other",
];

// Month windows for the 6-month chart; the last two double as the
// this-month / last-month KPIs
const buildMonthWindows = (now: Date) =>
  Array.from({ length: 6 }, (_, idx) => {
    const offset = 5 - idx;
    return {
      start: new Date(now.getFullYear(), now.getMonth() - offset, 1),
      end: new Date(now.getFullYear(), now.getMonth() - offset + 1, 1),
    };
  });

// Mock upcoming events (you can replace with real data)
const buildMockEvents = (now: Date): DashboardEvent[] => [
  {
    id: "1",
    title: "Monthly Society Meeting",
    description: "Regular monthly meeting to discuss society matters",
    date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    type: "meeting",
    venue: "Community Hall",
    attendees: 25,
  },
  {
    id: "2",
    title: "Contribution Due Date",
    description: "Monthly contributions are due",
    date: new Date(now.getFullYear(), now.getMonth() + 1, 1), // Next month
    type: "reminder",
  },
];

const toActivity = (c: Contribution, userName?: string): DashboardActivity => ({
  id: c.id,
  type: "contribution",
  title: `Contribution ${c.status}`,
  description: `${c.type.replace("_", " ")} contribution of R${c.amount.toFixed(2)}`,
  timestamp: c.date.toDate(),
  status: c.status,
  amount: c.amount,
  user: userName,
});

const growth = (thisMonth: number, lastMonth: number) =>
  lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

/**
 * Admin view: server-side aggregations instead of downloading the whole
 * contributions and members collections.
 */
const fetchAdminDashboard = async (): Promise<DashboardData> => {
  const contributionsRef = collection(db, "contributions");
  const membersRef = collection(db, "members");
  const now = new Date();
  const monthWindows = buildMonthWindows(now);
  const approvedFilter = where("status", "==", "approved");

  const [
    approvedAgg,
    pendingAgg,
    rejectedAgg,
    totalMembersAgg,
    activeMembersAgg,
    pendingMembersAgg,
    typeAggs,
    monthAggs,
    recentSnapshot,
  ] = await Promise.all([
    getAggregateFromServer(query(contributionsRef, approvedFilter), {
      total: sum("amount"),
      count: count(),
    }),
    getCountFromServer(query(contributionsRef, where("status", "==", "pending"))),
    getCountFromServer(query(contributionsRef, where("status", "==", "rejected"))),
    getCountFromServer(membersRef),
    getCountFromServer(
      query(membersRef, where("status", "in", ["active", "approved"]))
    ),
    getCountFromServer(query(membersRef, where("status", "==", "pending"))),
    Promise.all(
      CONTRIBUTION_TYPES.map((type) =>
        getAggregateFromServer(
          query(contributionsRef, approvedFilter, where("type", "==", type)),
          { total: sum("amount") }
        )
      )
    ),
    Promise.all(
      monthWindows.map(({ start, end }) =>
        getAggregateFromServer(
          query(
            contributionsRef,
            approvedFilter,
            where("date", ">=", Timestamp.fromDate(start)),
            where("date", "<", Timestamp.fromDate(end))
          ),
          { total: sum("amount") }
        )
      )
    ),
    getDocs(query(contributionsRef, orderBy("date", "desc"), limit(10))),
  ]);

  const contributionsByType = CONTRIBUTION_TYPES.map((type, i) => {
    const name = type.replace("_", " ");
    return {
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: typeAggs[i].data().total || 0,
    };
  }).filter((entry) => entry.value > 0);

  const monthlyData = monthWindows.map(({ start }, i) => ({
    month: start.toLocaleDateString("en-US", { month: "short" }),
    contributions: monthAggs[i].data().total || 0,
    members: 0, // Could add member count tracking
  }));

  const thisMonthContributions = monthlyData[5].contributions;
  const lastMonthContributions = monthlyData[4].contributions;

  // Recent activity: only the 10 latest contributions and their members
  const recent = recentSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Contribution[];
  const membersMap = await batchFetchMembers([
    ...new Set(recent.map((c) => c.member_id)),
  ]);
  const recentActivities = recent.map((c) =>
    toActivity(c, membersMap.get(c.member_id)?.full_name || "Unknown Member")
  );

  return {
    stats: {
      totalMembers: totalMembersAgg.data().count,
      activeMembers: activeMembersAgg.data().count,
      pendingMembers: pendingMembersAgg.data().count,
      totalContributions: approvedAgg.data().total || 0,
      approvedContributions: approvedAgg.data().count,
      pendingContributions: pendingAgg.data().count,
      rejectedContributions: rejectedAgg.data().count,
      monthlyContributions: typeAggs[0].data().total || 0,
      totalPayouts: 0,
      thisMonthContributions,
      lastMonthContributions,
      contributionGrowth: growth(thisMonthContributions, lastMonthContributions),
      memberGrowth: 5.2, // Mock growth - you could implement real tracking
    },
    contributionsByType,
    monthlyData,
    recentActivities,
    upcomingEvents: buildMockEvents(now),
  };
};

/**
 * Member view: only their own contributions (bounded per member).
 */
const fetchMemberDashboard = async (member: Member): Promise<DashboardData> => {
  const contributionsRef = collection(db, "contributions");
  const now = new Date();
  const monthWindows = buildMonthWindows(now);

  const snapshot = await getDocs(
    query(contributionsRef, where("member_id", "==", member.id))
  );
  const contributions = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Contribution[];

  const approved = contributions.filter((c) => c.status === "approved");
  const pending = contributions.filter((c) => c.status === "pending");
  const rejected = contributions.filter((c) => c.status === "rejected");

  const inWindow = (c: Contribution, start: Date, end: Date) => {
    const date = c.date.toDate();
    return date >= start && date < end;
  };

  const monthlyData = monthWindows.map(({ start, end }) => ({
    month: start.toLocaleDateString("en-US", { month: "short" }),
    contributions: approved
      .filter((c) => inWindow(c, start, end))
      .reduce((total, c) => total + c.amount, 0),
    members: 0,
  }));

  const thisMonthContributions = monthlyData[5].contributions;
  const lastMonthContributions = monthlyData[4].contributions;

  const typeMap = new Map<string, number>();
  approved.forEach((contribution) => {
    const typeName = contribution.type.replace("_", " ");
    typeMap.set(typeName, (typeMap.get(typeName) || 0) + contribution.amount);
  });
  const contributionsByType = Array.from(typeMap.entries()).map(
    ([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    })
  );

  const recentActivities = contributions
    .sort((a, b) => b.date.toDate().getTime() - a.date.toDate().getTime())
    .slice(0, 10)
    .map((c) => toActivity(c, member.full_name || "Unknown Member"));

  return {
    stats: {
      ...EMPTY_STATS,
      totalContributions: approved.reduce((total, c) => total + c.amount, 0),
      approvedContributions: approved.length,
      pendingContributions: pending.length,
      rejectedContributions: rejected.length,
      monthlyContributions: approved
        .filter((c) => c.type === "monthly")
        .reduce((total, c) => total + c.amount, 0),
      thisMonthContributions,
      lastMonthContributions,
      contributionGrowth: growth(thisMonthContributions, lastMonthContributions),
    },
    contributionsByType,
    monthlyData,
    recentActivities,
    upcomingEvents: buildMockEvents(now),
  };
};

/**
 * Dashboard KPIs, charts, and activity feed. Cached per user via TanStack
 * Query; call refetch() after imports or other bulk changes.
 */
export const useDashboardData = () => {
  const { userDetails, isAdmin } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["dashboard", userDetails?.id, isAdmin],
    queryFn: () =>
      isAdmin
        ? fetchAdminDashboard()
        : fetchMemberDashboard(userDetails as Member),
    enabled: !!userDetails?.id,
  });

  return {
    stats: data?.stats ?? EMPTY_STATS,
    contributionsByType: data?.contributionsByType ?? [],
    monthlyData: data?.monthlyData ?? [],
    recentActivities: data?.recentActivities ?? [],
    upcomingEvents: data?.upcomingEvents ?? [],
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
};
