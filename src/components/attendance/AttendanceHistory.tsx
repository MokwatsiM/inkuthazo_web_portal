import React, { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import Input from "../ui/Input";
import EmptyState from "../ui/EmptyState";
import { getMemberAttendanceHistory, getAttendanceSession } from "../../services/attendanceService";
import { useAuth } from "../../hooks/useAuth";
import { useNotifications } from "../../hooks/useNotifications";
import type { AttendanceRecord, AttendanceSession } from "../../types";
import logger from "../../utils/logger";

interface AttendanceHistoryRecord extends AttendanceRecord {
    session?: AttendanceSession;
}

const AttendanceHistory: React.FC = () => {
    const { user } = useAuth();
    const { showError } = useNotifications();

    const [records, setRecords] = useState<AttendanceHistoryRecord[]>([]);
    const [filteredRecords, setFilteredRecords] = useState<AttendanceHistoryRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 10;

    useEffect(() => {
        if (user) {
            loadAttendanceHistory();
        }
    }, [user]);

    useEffect(() => {
        filterRecords();
    }, [searchQuery, records]);

    const loadAttendanceHistory = async () => {
        if (!user) return;

        setLoading(true);
        try {
            const attendanceRecords = await getMemberAttendanceHistory(user.uid);

            // Fetch session details for each record
            const recordsWithSessions = await Promise.all(
                attendanceRecords.map(async (record) => {
                    try {
                        const session = await getAttendanceSession(record.session_id);
                        return { ...record, session: session || undefined };
                    } catch {
                        return { ...record };
                    }
                })
            );

            setRecords(recordsWithSessions);
            setFilteredRecords(recordsWithSessions);
        } catch (error) {
            logger.error("Error loading attendance history:", error);
            showError("Failed to load attendance history");
        } finally {
            setLoading(false);
        }
    };

    const filterRecords = () => {
        if (!searchQuery.trim()) {
            setFilteredRecords(records);
            return;
        }

        const query = searchQuery.toLowerCase();
        const filtered = records.filter((record) => {
            const meetingTitle = record.session?.meeting_title?.toLowerCase() || "";
            const venue = record.session?.venue?.toLowerCase() || "";
            return meetingTitle.includes(query) || venue.includes(query);
        });

        setFilteredRecords(filtered);
        setCurrentPage(1);
    };

    // Pagination calculations
    const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    const currentRecords = filteredRecords.slice(startIndex, endIndex);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    My Attendance History
                </h3>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Search by meeting title or venue..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Records List */}
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {currentRecords.length === 0 ? (
                    <EmptyState
                        icon={Calendar}
                        title={records.length === 0 ? "No Attendance Records" : "No Matches Found"}
                        description={
                            records.length === 0
                                ? "You haven't checked in to any meetings yet. Scan a QR code at your next meeting to record your attendance."
                                : "Try adjusting your search query."
                        }
                    />
                ) : (
                    currentRecords.map((record) => (
                        <div key={record.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h4 className="font-medium text-gray-900 dark:text-white">
                                        {record.session?.meeting_title || "Unknown Meeting"}
                                    </h4>
                                    <div className="mt-1 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                        {record.session?.meeting_date && (
                                            <div className="flex items-center">
                                                <Calendar className="h-4 w-4 mr-2" />
                                                {format(record.session.meeting_date.toDate(), "EEEE, MMMM d, yyyy")}
                                            </div>
                                        )}
                                        <div className="flex items-center">
                                            <Clock className="h-4 w-4 mr-2" />
                                            Checked in at {format(record.checked_in_at.toDate(), "h:mm a")}
                                        </div>
                                        {record.session?.venue && (
                                            <div className="flex items-center">
                                                <MapPin className="h-4 w-4 mr-2" />
                                                {record.session.venue}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${record.check_in_method === "qr_scan"
                                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                                        }`}
                                >
                                    {record.check_in_method === "qr_scan" ? "QR Scan" : "Manual"}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        Showing {startIndex + 1}-{Math.min(endIndex, filteredRecords.length)} of{" "}
                        {filteredRecords.length} records
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceHistory;
