import React, { useState, useEffect } from "react";
import { X, Download, UserCheck, Clock, Search, AlertCircle, UserX, Users as UsersIcon, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { getSessionAttendees, markAbsentMembers, updateAbsenceReason } from "../../services/attendanceService";
import type { AttendanceSession, AttendanceRecord } from "../../types";
import { useNotifications } from "../../hooks/useNotifications";
import { useAuth } from "../../hooks/useAuth";

interface AttendanceListModalProps {
    session: AttendanceSession;
    isOpen: boolean;
    onClose: () => void;
}

const AttendanceListModal: React.FC<AttendanceListModalProps> = ({
    session,
    isOpen,
    onClose,
}) => {
    const [attendees, setAttendees] = useState<AttendanceRecord[]>([]);
    const [filteredAttendees, setFilteredAttendees] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [markingAbsent, setMarkingAbsent] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | "present" | "absent">("all");
    const { showError, showSuccess } = useNotifications();
    const { isAdmin } = useAuth();

    useEffect(() => {
        if (isOpen) {
            loadAttendees();
        }
    }, [isOpen, session.id]);

    useEffect(() => {
        let filtered = attendees;

        // Filter by search query
        if (searchQuery.trim()) {
            filtered = filtered.filter((a) =>
                a.member_name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Filter by status
        if (filterStatus !== "all") {
            filtered = filtered.filter(a => a.status === filterStatus);
        }

        setFilteredAttendees(filtered);
    }, [searchQuery, filterStatus, attendees]);

    const loadAttendees = async () => {
        setLoading(true);
        try {
            const data = await getSessionAttendees(session.id);
            // Sort: present first, then absent
            const sorted = data.sort((a, b) => {
                if (a.status === "present" && b.status === "absent") return -1;
                if (a.status === "absent" && b.status === "present") return 1;
                return 0;
            });
            setAttendees(sorted);
            setFilteredAttendees(sorted);
        } catch (error) {
            console.error("Error loading attendees:", error);
            showError("Failed to load attendees");
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAbsent = async () => {
        try {
            setMarkingAbsent(true);
            const absentRecords = await markAbsentMembers(session.id);
            showSuccess(`Marked ${absentRecords.length} members as absent`);
            await loadAttendees(); // Reload to show new records
        } catch (error) {
            console.error("Error marking absent members:", error);
            showError("Failed to mark absent members");
        } finally {
            setMarkingAbsent(false);
        }
    };

    const handleUpdateAbsenceReason = async (recordId: string, reason: "apology" | "no_apology") => {
        try {
            await updateAbsenceReason(recordId, reason);
            showSuccess("Absence reason updated");
            await loadAttendees(); // Reload to show updated reason
        } catch (error) {
            console.error("Error updating absence reason:", error);
            showError("Failed to update absence reason");
        }
    };

    const handleExport = () => {
        const csvContent = [
            ["Name", "Status", "Check-in Time", "Method", "Attendance Status", "Absence Reason"].join(","),
            ...filteredAttendees.map((a) =>
                [
                    `"${a.member_name}"`,
                    a.status === "present" ? (a.is_late ? "Late" : "On Time") : "Absent",
                    format(a.checked_in_at.toDate(), "yyyy-MM-dd HH:mm:ss"),
                    a.check_in_method,
                    a.status,
                    a.absence_reason || "N/A",
                ].join(",")
            ),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `attendance-${session.meeting_title.replace(/\s+/g, "-")}-${format(
            session.meeting_date.toDate(),
            "yyyy-MM-dd"
        )}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 transition-opacity"
                    onClick={onClose}
                />

                {/* Modal panel */}
                <div className="inline-block transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:align-middle">
                    <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                    Attendance List
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {session.meeting_title} - {format(session.meeting_date.toDate(), "MMM d, yyyy")}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Search, Filter and Actions */}
                        <div className="space-y-3 mb-4">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        type="text"
                                        placeholder="Search attendees..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                                    className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                >
                                    <option value="all">All</option>
                                    <option value="present">Present</option>
                                    <option value="absent">Absent</option>
                                </select>
                            </div>
                            {isAdmin && (
                                <div className="flex gap-2">
                                    <Button
                                        variant="secondary"
                                        onClick={handleMarkAbsent}
                                        disabled={markingAbsent}
                                        loading={markingAbsent}
                                        size="small"
                                        className="flex items-center"
                                    >
                                        <UserX className="h-4 w-4 mr-1" />
                                        Mark Absent Members
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        onClick={handleExport}
                                        disabled={attendees.length === 0}
                                        size="small"
                                        className="flex items-center"
                                    >
                                        <Download className="h-4 w-4 mr-1" />
                                        Export CSV
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Attendee Stats */}
                        <div className="mb-4 flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div>
                                <UserCheck className="inline-block h-4 w-4 mr-1" />
                                {attendees.filter(a => a.status === "present").length} present
                            </div>
                            <div>
                                <UserX className="inline-block h-4 w-4 mr-1" />
                                {attendees.filter(a => a.status === "absent").length} absent
                            </div>
                            <div className="text-gray-500">
                                ({filteredAttendees.length} of {attendees.length} shown)
                            </div>
                        </div>

                        {/* Attendee List */}
                        <div className="max-h-96 overflow-y-auto">
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                </div>
                            ) : filteredAttendees.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    {attendees.length === 0
                                        ? "No attendees have checked in yet."
                                        : "No attendees match your search."}
                                </div>
                            ) : (
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                #
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Name
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Check-in Time
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Method
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Status
                                            </th>
                                            {isAdmin && (
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {filteredAttendees.map((attendee, index) => (
                                            <tr key={attendee.id} className={attendee.status === "absent" ? "bg-red-50 dark:bg-red-900/10" : ""}>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {index + 1}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                    {attendee.member_name}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {attendee.status === "present" ? (
                                                        <>
                                                            <Clock className="inline-block h-3 w-3 mr-1" />
                                                            {format(attendee.checked_in_at.toDate(), "h:mm a")}
                                                        </>
                                                    ) : (
                                                        <span className="text-gray-400">N/A</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {attendee.status === "present" ? (
                                                        <span
                                                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${attendee.check_in_method === "qr_scan"
                                                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                                                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                                                                }`}
                                                        >
                                                            {attendee.check_in_method === "qr_scan" ? "QR Scan" : "Manual"}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                                            <UserX className="h-3 w-3 mr-1" />
                                                            Absent
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {attendee.status === "present" ? (
                                                        attendee.is_late ? (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                                                                <AlertCircle className="h-3 w-3 mr-1" />
                                                                Late
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                                                On Time
                                                            </span>
                                                        )
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                                                            {attendee.absence_reason === "apology" ? "With Apology" : attendee.absence_reason === "no_apology" ? "No Apology" : "Not Set"}
                                                        </span>
                                                    )}
                                                </td>
                                                {isAdmin && (
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                        {attendee.status === "absent" && (
                                                            <div className="flex gap-1">
                                                                <button
                                                                    onClick={() => handleUpdateAbsenceReason(attendee.id, "apology")}
                                                                    className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300"
                                                                    title="Mark with apology"
                                                                >
                                                                    <MessageSquare className="h-3 w-3 inline mr-1" />
                                                                    Apology
                                                                </button>
                                                                <button
                                                                    onClick={() => handleUpdateAbsenceReason(attendee.id, "no_apology")}
                                                                    className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300"
                                                                    title="Mark without apology"
                                                                >
                                                                    No
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6">
                        <Button variant="secondary" onClick={onClose} className="w-full">
                            Close
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttendanceListModal;
