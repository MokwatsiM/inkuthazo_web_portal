import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { db } from "../../config/firebase";
import { Users, CalendarCheck, TrendingUp, Award } from "lucide-react";
import StatCard from "../stats/StatCard";
import type { AttendanceRecord, AttendanceSession } from "../../types";

interface AttendanceStatsData {
  totalCheckIns: number;
  averageAttendance: number;
  topMeetings: Array<{
    title: string;
    count: number;
  }>;
  growthRate: number;
}

const AttendanceStats: React.FC = () => {
  const [stats, setStats] = useState<AttendanceStatsData>({
    totalCheckIns: 0,
    averageAttendance: 0,
    topMeetings: [],
    growthRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendanceStats();
  }, []);

  const fetchAttendanceStats = async () => {
    try {
      setLoading(true);

      // Get start and end of current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      // Get start and end of previous month for growth calculation
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

      // Fetch attendance records for this month
      const recordsRef = collection(db, "attendance_records");
      const thisMonthQuery = query(
        recordsRef,
        where("checked_in_at", ">=", Timestamp.fromDate(startOfMonth)),
        where("checked_in_at", "<=", Timestamp.fromDate(endOfMonth))
      );

      const thisMonthSnapshot = await getDocs(thisMonthQuery);
      const thisMonthRecords = thisMonthSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AttendanceRecord[];

      // Fetch attendance records for last month for growth calculation
      const lastMonthQuery = query(
        recordsRef,
        where("checked_in_at", ">=", Timestamp.fromDate(startOfLastMonth)),
        where("checked_in_at", "<=", Timestamp.fromDate(endOfLastMonth))
      );

      const lastMonthSnapshot = await getDocs(lastMonthQuery);
      const lastMonthCount = lastMonthSnapshot.size;

      // Calculate growth rate
      let growthRate = 0;
      if (lastMonthCount > 0) {
        growthRate = ((thisMonthRecords.length - lastMonthCount) / lastMonthCount) * 100;
      } else if (thisMonthRecords.length > 0) {
        growthRate = 100; // 100% growth if starting from 0
      }

      // Fetch all sessions for this month to calculate averages
      const sessionsRef = collection(db, "attendance_sessions");
      const sessionsQuery = query(
        sessionsRef,
        where("meeting_date", ">=", Timestamp.fromDate(startOfMonth)),
        where("meeting_date", "<=", Timestamp.fromDate(endOfMonth))
      );

      const sessionsSnapshot = await getDocs(sessionsQuery);
      const sessions = sessionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AttendanceSession[];

      // Group attendance by session
      const attendanceBySession = new Map<string, { title: string; count: number }>();

      for (const record of thisMonthRecords) {
        const session = sessions.find(s => s.id === record.session_id);
        if (session) {
          const existing = attendanceBySession.get(session.id);
          if (existing) {
            existing.count++;
          } else {
            attendanceBySession.set(session.id, {
              title: session.meeting_title,
              count: 1
            });
          }
        }
      }

      // Calculate average attendance
      const averageAttendance = sessions.length > 0
        ? Math.round(thisMonthRecords.length / sessions.length)
        : 0;

      // Get top 3 attended meetings
      const topMeetings = Array.from(attendanceBySession.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      setStats({
        totalCheckIns: thisMonthRecords.length,
        averageAttendance,
        topMeetings,
        growthRate: Math.round(growthRate * 10) / 10, // Round to 1 decimal
      });
    } catch (error) {
      console.error("Error fetching attendance stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-surface dark:bg-surface-dark p-6 rounded-xl shadow-sm animate-pulse">
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Check-ins This Month"
          value={stats.totalCheckIns}
          icon={CalendarCheck}
          color="indigo"
          trend={
            stats.growthRate !== 0
              ? {
                  value: Math.abs(stats.growthRate),
                  isPositive: stats.growthRate > 0,
                  label: "vs last month"
                }
              : undefined
          }
        />

        <StatCard
          title="Average Attendance"
          value={stats.averageAttendance}
          subtitle="per meeting"
          icon={Users}
          color="green"
        />

        <StatCard
          title="Attendance Rate"
          value={stats.averageAttendance > 0 ? "Active" : "No data"}
          subtitle={stats.topMeetings.length > 0 ? `${stats.topMeetings.length} meetings tracked` : "No meetings yet"}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Top Attended Meetings */}
      {stats.topMeetings.length > 0 && (
        <div className="bg-surface dark:bg-surface-dark p-6 rounded-xl shadow-sm border border-line dark:border-line-dark">
          <div className="flex items-center gap-2 mb-4">
            <Award className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <h3 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark">
              Top Attended Meetings This Month
            </h3>
          </div>
          <div className="space-y-3">
            {stats.topMeetings.map((meeting, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-surface-hover dark:bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`
                    flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm
                    ${index === 0 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' : ''}
                    ${index === 1 ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' : ''}
                    ${index === 2 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' : ''}
                  `}>
                    #{index + 1}
                  </div>
                  <span className="text-sm font-medium text-text-primary dark:text-text-primary-dark">
                    {meeting.title}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-text-tertiary dark:text-text-tertiary-dark" />
                  <span className="text-sm font-semibold text-text-secondary dark:text-text-secondary-dark">
                    {meeting.count} attendees
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceStats;
