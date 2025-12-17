import React, { useState, useEffect } from "react";
import { X, Download, UserCheck, Clock, Search } from "lucide-react";
import { format } from "date-fns";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { getSessionAttendees } from "../../services/attendanceService";
import type { AttendanceSession, AttendanceRecord } from "../../types";
import { useNotifications } from "../../hooks/useNotifications";

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
    const [searchQuery, setSearchQuery] = useState("");
    const { showError } = useNotifications();

    useEffect(() => {
        if (isOpen) {
            loadAttendees();
        }
    }, [isOpen, session.id]);

    useEffect(() => {
        if (searchQuery.trim()) {
            const filtered = attendees.filter((a) =>
                a.member_name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredAttendees(filtered);
        } else {
            setFilteredAttendees(attendees);
        }
    }, [searchQuery, attendees]);

    const loadAttendees = async () => {
        setLoading(true);
        try {
            const data = await getSessionAttendees(session.id);
            setAttendees(data);
            setFilteredAttendees(data);
        } catch (error) {
            console.error("Error loading attendees:", error);
            showError("Failed to load attendees");
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        const csvContent = [
            ["Name", "Check-in Time", "Method"].join(","),
            ...filteredAttendees.map((a) =>
                [
                    `"${a.member_name}"`,
                    format(a.checked_in_at.toDate(), "yyyy-MM-dd HH:mm:ss"),
                    a.check_in_method,
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

                        {/* Search and Export */}
                        <div className="flex flex-col sm:flex-row gap-3 mb-4">
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
                            <Button
                                variant="secondary"
                                onClick={handleExport}
                                disabled={attendees.length === 0}
                                className="flex items-center"
                            >
                                <Download className="h-4 w-4 mr-1" />
                                Export CSV
                            </Button>
                        </div>

                        {/* Attendee Count */}
                        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                            <UserCheck className="inline-block h-4 w-4 mr-1" />
                            {filteredAttendees.length} of {attendees.length} attendee
                            {attendees.length !== 1 ? "s" : ""} shown
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
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {filteredAttendees.map((attendee, index) => (
                                            <tr key={attendee.id}>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {index + 1}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                    {attendee.member_name}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    <Clock className="inline-block h-3 w-3 mr-1" />
                                                    {format(attendee.checked_in_at.toDate(), "h:mm a")}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${attendee.check_in_method === "qr_scan"
                                                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                                                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                                                            }`}
                                                    >
                                                        {attendee.check_in_method === "qr_scan" ? "QR Scan" : "Manual"}
                                                    </span>
                                                </td>
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
