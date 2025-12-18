import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, Timestamp, orderBy } from "firebase/firestore";
import { db } from "../../config/firebase";
import { Download, FileText, Calendar, User, Filter, CheckCircle, XCircle } from "lucide-react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { format } from "date-fns";
import type { AttendanceRecord, AttendanceSession } from "../../types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface AttendanceReportData {
  memberAttendance: Array<{
    memberId: string;
    memberName: string;
    totalSessions: number;
    attendedSessions: number;
    lateArrivals: number;
    attendanceRate: number;
    sessions: Array<{
      sessionTitle: string;
      date: Date;
      attended: boolean;
    }>;
  }>;
  sessionAttendance: Array<{
    sessionId: string;
    sessionTitle: string;
    date: Date;
    totalAttendees: number;
    lateCount: number;
    attendees: string[];
  }>;
  summary: {
    totalSessions: number;
    totalAttendance: number;
    totalLateArrivals: number;
    averageAttendance: number;
    overallAttendanceRate: number;
    lateArrivalRate: number;
  };
}

const AttendanceReport: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<AttendanceReportData | null>(null);

  // Filters
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [memberFilter, setMemberFilter] = useState("");
  const [sessionFilter, setSessionFilter] = useState("");

  // Available members and sessions for filters
  const [members, setMembers] = useState<Array<{ id: string; name: string }>>([]);
  const [sessions, setSessions] = useState<Array<{ id: string; title: string }>>([]);

  useEffect(() => {
    fetchFiltersData();
  }, []);

  const fetchFiltersData = async () => {
    try {
      // Fetch members
      const membersSnapshot = await getDocs(collection(db, "members"));
      const membersData = membersSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().full_name || "Unknown"
      }));
      setMembers(membersData);

      // Fetch recent sessions
      const sessionsSnapshot = await getDocs(collection(db, "attendance_sessions"));
      const sessionsData = sessionsSnapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data().meeting_title || "Unknown"
      }));
      setSessions(sessionsData);
    } catch (error) {
      console.error("Error fetching filter data:", error);
    }
  };

  const generateReport = async () => {
    try {
      setLoading(true);

      const start = Timestamp.fromDate(new Date(startDate));
      const end = Timestamp.fromDate(new Date(endDate + "T23:59:59"));

      // Fetch sessions within date range
      let sessionsQuery = query(
        collection(db, "attendance_sessions"),
        where("meeting_date", ">=", start),
        where("meeting_date", "<=", end),
        orderBy("meeting_date", "desc")
      );

      const sessionsSnapshot = await getDocs(sessionsQuery);
      let sessionsData = sessionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AttendanceSession[];

      // Apply session filter if selected
      if (sessionFilter) {
        sessionsData = sessionsData.filter(s => s.id === sessionFilter);
      }

      // Fetch all attendance records for these sessions
      const recordsSnapshot = await getDocs(collection(db, "attendance_records"));
      let recordsData = recordsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AttendanceRecord[];

      // Filter records to only those in our sessions
      const sessionIds = new Set(sessionsData.map(s => s.id));
      recordsData = recordsData.filter(r => sessionIds.has(r.session_id));

      // Apply member filter if selected
      if (memberFilter) {
        recordsData = recordsData.filter(r => r.member_id === memberFilter);
      }

      // Build member attendance map
      const memberAttendanceMap = new Map<string, {
        memberName: string;
        attended: Set<string>;
        lateCount: number;
        sessions: Array<{ sessionTitle: string; date: Date; attended: boolean; }>;
      }>();

      // Get all unique members who attended any session
      const allMemberIds = new Set(recordsData.map(r => r.member_id));

      // Initialize member data
      for (const memberId of allMemberIds) {
        const record = recordsData.find(r => r.member_id === memberId);
        if (record) {
          memberAttendanceMap.set(memberId, {
            memberName: record.member_name,
            attended: new Set(),
            lateCount: 0,
            sessions: []
          });
        }
      }

      // Populate attendance data
      for (const record of recordsData) {
        const memberData = memberAttendanceMap.get(record.member_id);
        if (memberData) {
          memberData.attended.add(record.session_id);
          if (record.is_late) {
            memberData.lateCount++;
          }
        }
      }

      // Build member attendance array with session details
      const memberAttendance = Array.from(memberAttendanceMap.entries()).map(([memberId, data]) => {
        const sessions = sessionsData.map(session => ({
          sessionTitle: session.meeting_title,
          date: session.meeting_date.toDate(),
          attended: data.attended.has(session.id)
        }));

        return {
          memberId,
          memberName: data.memberName,
          totalSessions: sessionsData.length,
          attendedSessions: data.attended.size,
          lateArrivals: data.lateCount,
          attendanceRate: sessionsData.length > 0
            ? Math.round((data.attended.size / sessionsData.length) * 100)
            : 0,
          sessions
        };
      });

      // Sort by attendance rate descending
      memberAttendance.sort((a, b) => b.attendanceRate - a.attendanceRate);

      // Build session attendance array
      const sessionAttendance = sessionsData.map(session => {
        const sessionRecords = recordsData.filter(r => r.session_id === session.id);
        const attendees = sessionRecords.map(r => r.member_name);
        const lateCount = sessionRecords.filter(r => r.is_late).length;

        return {
          sessionId: session.id,
          sessionTitle: session.meeting_title,
          date: session.meeting_date.toDate(),
          totalAttendees: attendees.length,
          lateCount,
          attendees
        };
      });

      // Calculate summary
      const totalAttendance = recordsData.length;
      const totalLateArrivals = recordsData.filter(r => r.is_late).length;
      const totalSessions = sessionsData.length;
      const averageAttendance = totalSessions > 0 ? Math.round(totalAttendance / totalSessions) : 0;
      const lateArrivalRate = totalAttendance > 0
        ? Math.round((totalLateArrivals / totalAttendance) * 100)
        : 0;

      // Overall attendance rate: average of all member rates
      const overallAttendanceRate = memberAttendance.length > 0
        ? Math.round(memberAttendance.reduce((sum, m) => sum + m.attendanceRate, 0) / memberAttendance.length)
        : 0;

      setReportData({
        memberAttendance,
        sessionAttendance,
        summary: {
          totalSessions,
          totalAttendance,
          totalLateArrivals,
          averageAttendance,
          overallAttendanceRate,
          lateArrivalRate
        }
      });
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Failed to generate report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(18);
    doc.text("Attendance Report", pageWidth / 2, 15, { align: "center" });

    // Date range
    doc.setFontSize(10);
    doc.text(`Period: ${format(new Date(startDate), "MMM d, yyyy")} - ${format(new Date(endDate), "MMM d, yyyy")}`, pageWidth / 2, 22, { align: "center" });

    // Summary
    doc.setFontSize(12);
    doc.text("Summary", 14, 32);
    doc.setFontSize(10);
    doc.text(`Total Sessions: ${reportData.summary.totalSessions}`, 14, 38);
    doc.text(`Total Attendance: ${reportData.summary.totalAttendance}`, 14, 44);
    doc.text(`Total Late Arrivals: ${reportData.summary.totalLateArrivals} (${reportData.summary.lateArrivalRate}%)`, 14, 50);
    doc.text(`Average Attendance per Session: ${reportData.summary.averageAttendance}`, 14, 56);
    doc.text(`Overall Attendance Rate: ${reportData.summary.overallAttendanceRate}%`, 14, 62);

    // Member Attendance Table
    autoTable(doc, {
      startY: 71,
      head: [["Member Name", "Attended", "Late", "Total", "Rate"]],
      body: reportData.memberAttendance.map(m => [
        m.memberName,
        m.attendedSessions.toString(),
        m.lateArrivals.toString(),
        m.totalSessions.toString(),
        `${m.attendanceRate}%`
      ]),
      theme: "grid",
      headStyles: { fillColor: [79, 70, 229] }
    });

    // Save
    doc.save(`attendance-report-${startDate}-to-${endDate}.pdf`);
  };

  const exportToCSV = () => {
    if (!reportData) return;

    const csvRows = [];

    // Header
    csvRows.push("Attendance Report");
    csvRows.push(`Period: ${startDate} to ${endDate}`);
    csvRows.push("");

    // Summary
    csvRows.push("Summary");
    csvRows.push(`Total Sessions,${reportData.summary.totalSessions}`);
    csvRows.push(`Total Attendance,${reportData.summary.totalAttendance}`);
    csvRows.push(`Total Late Arrivals,${reportData.summary.totalLateArrivals}`);
    csvRows.push(`Late Arrival Rate,${reportData.summary.lateArrivalRate}%`);
    csvRows.push(`Average Attendance,${reportData.summary.averageAttendance}`);
    csvRows.push(`Overall Attendance Rate,${reportData.summary.overallAttendanceRate}%`);
    csvRows.push("");

    // Member Attendance
    csvRows.push("Member Attendance");
    csvRows.push("Member Name,Attended Sessions,Late Arrivals,Total Sessions,Attendance Rate");
    reportData.memberAttendance.forEach(m => {
      csvRows.push(`${m.memberName},${m.attendedSessions},${m.lateArrivals},${m.totalSessions},${m.attendanceRate}%`);
    });

    // Convert to CSV string
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-report-${startDate}-to-${endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-surface dark:bg-surface-dark p-6 rounded-xl shadow-sm border border-line dark:border-line-dark">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-text-secondary dark:text-text-secondary-dark" />
          <h3 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark">
            Report Filters
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">
              <Calendar className="inline-block h-4 w-4 mr-1" />
              Start Date
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">
              <Calendar className="inline-block h-4 w-4 mr-1" />
              End Date
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          {/* Member Filter */}
          <div>
            <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">
              <User className="inline-block h-4 w-4 mr-1" />
              Filter by Member
            </label>
            <select
              value={memberFilter}
              onChange={(e) => setMemberFilter(e.target.value)}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">All Members</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Session Filter */}
          <div>
            <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">
              <FileText className="inline-block h-4 w-4 mr-1" />
              Filter by Session
            </label>
            <select
              value={sessionFilter}
              onChange={(e) => setSessionFilter(e.target.value)}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">All Sessions</option>
              {sessions.map(s => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <Button
            onClick={generateReport}
            loading={loading}
            disabled={loading}
          >
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Report Results */}
      {reportData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-surface dark:bg-surface-dark p-4 rounded-lg border border-line dark:border-line-dark">
              <div className="text-sm text-text-secondary dark:text-text-secondary-dark">Total Sessions</div>
              <div className="text-2xl font-bold text-text-primary dark:text-text-primary-dark">
                {reportData.summary.totalSessions}
              </div>
            </div>
            <div className="bg-surface dark:bg-surface-dark p-4 rounded-lg border border-line dark:border-line-dark">
              <div className="text-sm text-text-secondary dark:text-text-secondary-dark">Total Attendance</div>
              <div className="text-2xl font-bold text-text-primary dark:text-text-primary-dark">
                {reportData.summary.totalAttendance}
              </div>
            </div>
            <div className="bg-surface dark:bg-surface-dark p-4 rounded-lg border border-line dark:border-line-dark">
              <div className="text-sm text-text-secondary dark:text-text-secondary-dark">Late Arrivals</div>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {reportData.summary.totalLateArrivals}
              </div>
              <div className="text-xs text-text-tertiary dark:text-text-tertiary-dark">
                {reportData.summary.lateArrivalRate}% of total
              </div>
            </div>
            <div className="bg-surface dark:bg-surface-dark p-4 rounded-lg border border-line dark:border-line-dark">
              <div className="text-sm text-text-secondary dark:text-text-secondary-dark">Avg per Session</div>
              <div className="text-2xl font-bold text-text-primary dark:text-text-primary-dark">
                {reportData.summary.averageAttendance}
              </div>
            </div>
            <div className="bg-surface dark:bg-surface-dark p-4 rounded-lg border border-line dark:border-line-dark">
              <div className="text-sm text-text-secondary dark:text-text-secondary-dark">Overall Rate</div>
              <div className="text-2xl font-bold text-text-primary dark:text-text-primary-dark">
                {reportData.summary.overallAttendanceRate}%
              </div>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex gap-3">
            <Button variant="secondary" onClick={exportToPDF}>
              <Download className="h-4 w-4 mr-2" />
              Export to PDF
            </Button>
            <Button variant="secondary" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export to CSV
            </Button>
          </div>

          {/* Member Attendance Table */}
          <div className="bg-surface dark:bg-surface-dark rounded-xl shadow-sm border border-line dark:border-line-dark overflow-hidden">
            <div className="p-4 border-b border-line dark:border-line-dark">
              <h3 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark">
                Member Attendance Summary
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-line dark:divide-line-dark">
                <thead className="bg-surface-hover dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-text-secondary-dark uppercase tracking-wider">
                      Member Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-text-secondary-dark uppercase tracking-wider">
                      Attended
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-text-secondary-dark uppercase tracking-wider">
                      Late
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-text-secondary-dark uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-text-secondary-dark uppercase tracking-wider">
                      Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-text-secondary-dark uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-surface dark:bg-surface-dark divide-y divide-line dark:divide-line-dark">
                  {reportData.memberAttendance.map((member) => (
                    <tr key={member.memberId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary dark:text-text-primary-dark">
                        {member.memberName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary dark:text-text-secondary-dark">
                        {member.attendedSessions}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={member.lateArrivals > 0 ? "text-yellow-600 dark:text-yellow-400 font-medium" : "text-text-secondary dark:text-text-secondary-dark"}>
                          {member.lateArrivals}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary dark:text-text-secondary-dark">
                        {member.totalSessions}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary dark:text-text-secondary-dark">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                            <div
                              className={`h-2 rounded-full ${
                                member.attendanceRate >= 80 ? 'bg-green-600' :
                                member.attendanceRate >= 50 ? 'bg-yellow-600' :
                                'bg-red-600'
                              }`}
                              style={{ width: `${member.attendanceRate}%` }}
                            />
                          </div>
                          <span>{member.attendanceRate}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {member.attendanceRate >= 80 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Excellent
                          </span>
                        ) : member.attendanceRate >= 50 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                            Average
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                            <XCircle className="h-3 w-3 mr-1" />
                            Low
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AttendanceReport;
